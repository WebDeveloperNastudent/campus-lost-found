import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../supabaseClient'
import { SkeletonStat } from '../components/Skeleton'

const CATEGORY_LABELS = {
  lost_item: 'Lost item',
  found_item: 'Found item',
  facility_issue: 'Facility issue',
}

// Reveals an element with a fade + rise the first time it scrolls into view.
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, visible]
}

function StatBox({ value, label, delay }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`stat-box reveal${visible ? ' revealed' : ''}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      <span className="num">{value}</span>
      <span className="label">{label}</span>
    </div>
  )
}

function RevealItem({ children, delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' revealed' : ''}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

function buildTrendData(reports, days = 14) {
  const buckets = new Map()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, { date: `${d.getMonth() + 1}/${d.getDate()}`, key, count: 0 })
  }

  reports.forEach((r) => {
    const key = new Date(r.created_at).toISOString().slice(0, 10)
    if (buckets.has(key)) buckets.get(key).count += 1
  })

  return Array.from(buckets.values())
}

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const loadReports = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Live updates: stats/charts refresh automatically whenever any report
  // changes, anywhere in the app.
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => loadReports()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadReports])

  const stats = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((r) => r.status === 'pending').length,
      in_progress: reports.filter((r) => r.status === 'in_progress').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
    }),
    [reports]
  )

  const chartData = useMemo(() => {
    const categories = ['lost_item', 'found_item', 'facility_issue']
    return categories.map((cat) => ({
      name: CATEGORY_LABELS[cat],
      Pending: reports.filter((r) => r.category === cat && r.status === 'pending').length,
      'In progress': reports.filter((r) => r.category === cat && r.status === 'in_progress').length,
      Resolved: reports.filter((r) => r.category === cat && r.status === 'resolved').length,
    }))
  }, [reports])

  const trendData = useMemo(() => buildTrendData(reports, 14), [reports])

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>An overview of student-reported concerns across campus.</p>
        </div>
      </div>

      <div className="stat-row">
        {loading ? (
          <>
            <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
          </>
        ) : (
          <>
            <StatBox value={stats.total} label="Total reports" delay={0} />
            <StatBox value={stats.pending} label="Pending" delay={70} />
            <StatBox value={stats.in_progress} label="In progress" delay={140} />
            <StatBox value={stats.resolved} label="Resolved" delay={210} />
          </>
        )}
      </div>

      <RevealItem>
        <div className="chart-box">
          <h3 style={{ marginBottom: 12 }}>Reports by category &amp; status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D7DAD2" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Pending" stackId="a" fill="#C98A1F" />
              <Bar dataKey="In progress" stackId="a" fill="#3568A8" />
              <Bar dataKey="Resolved" stackId="a" fill="#2F8F72" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </RevealItem>

      <RevealItem delay={80}>
        <div className="chart-box">
          <h3 style={{ marginBottom: 12 }}>Reports over the last 14 days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D7DAD2" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Reports filed" stroke="#3568A8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </RevealItem>
    </div>
  )
}