import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ReportForm from '../components/ReportForm'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setReports(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return (
    <div>
      <h1>My reports</h1>

      <ReportForm onCreated={fetchReports} />

      <h2 style={{ marginTop: 32 }}>Submitted reports</h2>

      {loading && <p>Loading...</p>}
      {!loading && reports.length === 0 && <p>You haven't filed any reports yet.</p>}

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {reports.map((r) => (
          <div key={r.id} className="form-card wide">
            <strong>{r.title}</strong>
            <div>
              {r.category.replace('_', ' ')}
              {r.location ? ` · ${r.location}` : ''}
              {` · Status: ${r.status}`}
              {r.priority === 'urgent' ? ' · URGENT' : ''}
            </div>
            <p>{r.description}</p>
            {r.image_url && (
              <img src={r.image_url} alt={r.title} style={{ maxWidth: 200, borderRadius: 8 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}