import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ReportForm from '../components/ReportForm'
import ReportCard from '../components/ReportCard'

export default function StudentDashboard() {
  const { user, isAdmin } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

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
        <ReportForm onCreated={loadReports} />

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
            <p>Loading your reports...</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No reports match here.</div>
          ) : (
            filtered.map((r) => (
              <ReportCard key={r.id} report={r} isAdmin={false} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
