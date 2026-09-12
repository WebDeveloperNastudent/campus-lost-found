import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import ReportCard from '../components/ReportCard'

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

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

  const stats = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((r) => r.status === 'pending').length,
      in_progress: reports.filter((r) => r.status === 'in_progress').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
    }),
    [reports]
  )

  const filtered = reports.filter(
    (r) =>
      (filter === 'all' || r.status === filter) &&
      (categoryFilter === 'all' || r.category === categoryFilter)
  )

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>Track and resolve student-reported concerns across campus.</p>
        </div>
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

      {loading ? (
        <p>Loading reports...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No reports match this filter.</div>
      ) : (
        filtered.map((r) => (
          <ReportCard key={r.id} report={r} isAdmin onUpdateStatus={handleUpdateStatus} />
        ))
      )}
    </div>
  )
}
