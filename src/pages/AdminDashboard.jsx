import { useEffect, useState, useCallback, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../supabaseClient'
import ReportCard from '../components/ReportCard'

const CATEGORY_LABELS = {
  lost_item: 'Lost item',
  found_item: 'Found item',
  facility_issue: 'Facility issue',
}

function toCsv(rows) {
  const headers = ['title', 'category', 'priority', 'status', 'location', 'description', 'created_at']
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ]
  return lines.join('\n')
}

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')

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

  async function handleUpdateStatus(reportId, { status, admin_notes }) {
    await supabase.from('reports').update({ status, admin_notes }).eq('id', reportId)
    await loadReports()
  }

  async function handleDelete(reportId) {
    await supabase.from('reports').delete().eq('id', reportId)
    await loadReports()
  }

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

  const filtered = reports.filter((r) => {
    const matchesStatus = filter === 'all' || r.status === filter
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q)
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch
  })

  function handleExportCsv() {
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `campuswatch-reports-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>Track and resolve student-reported concerns across campus.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleExportCsv}>
          Export CSV
        </button>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <span className="num">{stats.total}</span>
          <span className="label">Total reports</span>
        </div>
        <div className="stat-box">
          <span className="num">{stats.pending}</span>
          <span className="label">Pending</span>
        </div>
        <div className="stat-box">
          <span className="num">{stats.in_progress}</span>
          <span className="label">In progress</span>
        </div>
        <div className="stat-box">
          <span className="num">{stats.resolved}</span>
          <span className="label">Resolved</span>
        </div>
      </div>

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

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          type="text"
          placeholder="Search all reports..."
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
            {f === 'all' ? 'All statuses' : f.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        {['all', 'lost_item', 'found_item', 'facility_issue'].map((c) => (
          <button
            key={c}
            className={`filter-btn ${categoryFilter === c ? 'active' : ''}`}
            onClick={() => setCategoryFilter(c)}
          >
            {c === 'all' ? 'All categories' : c.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        {['all', 'urgent', 'normal'].map((p) => (
          <button
            key={p}
            className={`filter-btn ${priorityFilter === p ? 'active' : ''}`}
            onClick={() => setPriorityFilter(p)}
          >
            {p === 'all' ? 'All priorities' : p}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No reports match this filter.</div>
      ) : (
        filtered.map((r) => (
          <ReportCard
            key={r.id}
            report={r}
            isAdmin
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  )
}
