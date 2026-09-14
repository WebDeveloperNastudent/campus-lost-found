import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ReportCard from '../components/ReportCard'
import { SkeletonTicket } from '../components/Skeleton'

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

export default function LostItemsBoard() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadItems = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('is_public', true)
      .eq('category', 'lost_item')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    const channel = supabase
      .channel('lost-items-board-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: 'is_public=eq.true' },
        () => loadItems()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadItems])

  const filtered = items.filter((r) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Lost items board</h1>
          <p>
            Items reported lost around campus.
            {!isAdmin && ' If one looks like yours, open Messages on it to coordinate with the office.'}
          </p>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          type="text"
          placeholder="Search the board..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <>
          <SkeletonTicket />
          <SkeletonTicket />
        </>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No lost items posted to the board right now.</div>
      ) : (
        filtered.map((r, i) => (
          <RevealItem key={r.id} delay={Math.min(i * 50, 250)}>
            <ReportCard report={r} isAdmin={false} isPublicBoard />
          </RevealItem>
        ))
      )}
    </div>
  )
}