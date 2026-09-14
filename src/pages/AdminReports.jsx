import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import ReportCard from '../components/ReportCard'
import { SkeletonTicket } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'

function toCsv(rows) {
  const headers = ['title', 'category', 'priority', 'status', 'location', 'description', 'created_at']
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ]
  return lines.join('\n')
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

const PRIORITY_WEIGHT = { urgent: 0, normal: 1 }

export default function AdminReports() {
  const { addToast } = useToast()
  const [reports, setReports] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkStatus, setBulkStatus] = useState('in_progress')
  const [bulkBusy, setBulkBusy] = useState(false)

  const loadReports = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }, [])

  const loadAdmins = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'admin')
    setAdmins(data || [])
  }, [])

  useEffect(() => {
    loadReports()
    loadAdmins()
  }, [loadReports, loadAdmins])

  // Live updates: any insert/update/delete on reports (by anyone) refreshes
  // this list automatically, no manual refresh needed.
  useEffect(() => {
    const channel = supabase
      .channel('admin-reports-page-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => loadReports()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadReports])

 async function handleUpdateStatus(reportId, { status, admin_notes }) {
  const payload = {
    status,
    admin_notes,
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
  }
  await supabase.from('reports').update(payload).eq('id', reportId)
  await loadReports()
}

  async function handleDelete(reportId) {
    await supabase.from('reports').delete().eq('id', reportId)
    await loadReports()
    addToast('Report deleted', 'success')
  }

  async function handleTogglePublic(reportId, nextValue) {
    await supabase.from('reports').update({ is_public: nextValue }).eq('id', reportId)
    await loadReports()
  }

  async function handleAssign(reportId, adminId) {
    await supabase.from('reports').update({ assigned_to: adminId }).eq('id', reportId)
    await loadReports()
    addToast(adminId ? 'Report assigned' : 'Report unassigned', 'success')
  }

  function toggleSelect(reportId) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(reportId)) next.delete(reportId)
      else next.add(reportId)
      return next
    })
  }

  function toggleSelectAll(idsOnScreen) {
    setSelectedIds((prev) => {
      const allSelected = idsOnScreen.every((id) => prev.has(id))
      if (allSelected) return new Set()
      return new Set(idsOnScreen)
    })
  }

  async function handleBulkStatusApply() {
    if (selectedIds.size === 0) return
    setBulkBusy(true)
    const { error } = await supabase
      .from('reports')
      .update({ status: bulkStatus })
      .in('id', Array.from(selectedIds))
    setBulkBusy(false)
    if (error) {
      addToast(`Could not update selected reports: ${error.message}`, 'error')
      return
    }
    setSelectedIds(new Set())
    await loadReports()
    addToast(`Updated ${selectedIds.size} report(s) to ${bulkStatus.replace('_', ' ')}`, 'success')
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} selected report(s)? This cannot be undone.`)) return
    setBulkBusy(true)
    const { error } = await supabase.from('reports').delete().in('id', Array.from(selectedIds))
    setBulkBusy(false)
    if (error) {
      addToast(`Could not delete selected reports: ${error.message}`, 'error')
      return
    }
    setSelectedIds(new Set())
    await loadReports()
    addToast('Selected reports deleted', 'success')
  }

  const filtered = reports
    .filter((r) => {
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
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'priority') {
        const diff = (PRIORITY_WEIGHT[a.priority] ?? 2) - (PRIORITY_WEIGHT[b.priority] ?? 2)
        return diff !== 0 ? diff : new Date(b.created_at) - new Date(a.created_at)
      }
      return new Date(b.created_at) - new Date(a.created_at)
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
    addToast(`Exported ${filtered.length} reports to CSV`, 'success')
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Search, filter, and manage every report that's been filed.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleExportCsv}>
          Export CSV
        </button>
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

      <div className="field" style={{ maxWidth: 220, marginBottom: 20 }}>
        <label htmlFor="sortBy">Sort by</label>
        <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="priority">Priority (urgent first)</option>
        </select>
      </div>

      {loading ? (
        <>
          <SkeletonTicket />
          <SkeletonTicket />
          <SkeletonTicket />
        </>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No reports match this filter.</div>
      ) : (
        <>
          <div className="bulk-bar">
            <label className="bulk-select-all">
              <input
                type="checkbox"
                checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id))}
                onChange={() => toggleSelectAll(filtered.map((r) => r.id))}
              />
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </label>

            {selectedIds.size > 0 && (
              <div className="bulk-actions">
                <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                  <option value="pending">Set to pending</option>
                  <option value="in_progress">Set to in progress</option>
                  <option value="resolved">Set to resolved</option>
                </select>
                <button className="btn btn-sm" disabled={bulkBusy} onClick={handleBulkStatusApply}>
                  Apply
                </button>
                <button className="btn btn-outline btn-sm" disabled={bulkBusy} onClick={handleBulkDelete}>
                  Delete selected
                </button>
              </div>
            )}
          </div>

          {filtered.map((r, i) => (
            <RevealItem key={r.id} delay={Math.min(i * 50, 250)}>
              <ReportCard
                report={r}
                isAdmin
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                selectable
                selected={selectedIds.has(r.id)}
                onToggleSelect={toggleSelect}
                onTogglePublic={handleTogglePublic}
                admins={admins}
                onAssign={handleAssign}
              />
            </RevealItem>
          ))}
        </>
      )}
    </div>
  )
}