import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchReports() {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setReports(data || [])
      setLoading(false)
    }
    fetchReports()
  }, [user])

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <h1>My reports</h1>
      <Link to="/report/new" className="btn btn-accent">+ New report</Link>

      {loading && <p>Loading...</p>}
      {!loading && reports.length === 0 && <p>You haven't filed any reports yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
        {reports.map((r) => (
          <li key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <strong>{r.title}</strong>
            <div>{r.report_type} · {r.location} · Status: {r.status}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}