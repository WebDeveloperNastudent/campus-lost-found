import { useEffect, useState, useCallback, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ReportForm from '../components/ReportForm'
import ReportCard from '../components/ReportCard'
import { SkeletonTicket } from '../components/Skeleton'

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

export default function StudentDashboard() {
  const { user, isAdmin } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    function handleJumpToForm() {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener('campuswatch:new-report', handleJumpToForm)
    return () => window.removeEventListener('campuswatch:new-report', handleJumpToForm)
  }, [])

  const loadReports = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Live updates: when an admin changes the status/notes on one of this
  // student's reports, the list refreshes automatically, no manual refresh.
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`student-reports-changes-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `reporter_id=eq.${user.id}` },
        () => loadReports()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, loadReports])

  async function handleDelete(reportId) {
    await supabase.from('reports').delete().eq('id', reportId)
    await loadReports()
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const filtered = reports.filter((r) => {
    const matchesStatus = filter === 'all' || r.status === filter
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>My reports</h1>
          <p>Submit a lost item, found item, or facility issue, and track its status here.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 36 }}>
        <div ref={formRef}>
          <ReportForm onCreated={loadReports} />
        </div>

        <div>
          <div className="field" style={{ maxWidth: 320 }}>
            <input
              type="text"
              placeholder="Search your reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-bar">
            {['all', 'pending', 'in_progress', 'resolved'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <>
              <SkeletonTicket />
              <SkeletonTicket />
            </>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No reports match here.</div>
          ) : (
            filtered.map((r, i) => (
              <RevealItem key={r.id} delay={Math.min(i * 50, 250)}>
                <ReportCard report={r} isAdmin={false} onDelete={handleDelete} />
              </RevealItem>
            ))
          )}
        </div>
      </div>
    </div>
  )
}