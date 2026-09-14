import { useState } from 'react'
import { MapPin, CalendarDays, User, MessageSquare, Trash2, Maximize2, Megaphone, UserCog, X } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ReportComments from './ReportComments'
import { useToast } from '../context/ToastContext'

const CATEGORY_LABELS = {
  lost_item: 'Lost item',
  found_item: 'Found item',
  facility_issue: 'Facility issue',
}

export default function ReportCard({
  report,
  isAdmin,
  onUpdateStatus,
  onDelete,
  isPublicBoard = false,
  selectable = false,
  selected = false,
  onToggleSelect,
  onTogglePublic,
  admins = [],
  onAssign,
}) {
  const { addToast } = useToast()
  const [savingStatus, setSavingStatus] = useState(false)
  const [notes, setNotes] = useState(report.admin_notes || '')
  const [showComments, setShowComments] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingPublic, setTogglingPublic] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  async function handleStatusChange(newStatus) {
    setSavingStatus(true)
    await onUpdateStatus(report.id, { status: newStatus, admin_notes: notes })
    setSavingStatus(false)
    addToast('Status updated', 'success')
  }

  async function handleSaveNotes() {
    setSavingStatus(true)
    await onUpdateStatus(report.id, { status: report.status, admin_notes: notes })
    setSavingStatus(false)
    addToast('Note saved', 'success')
  }

  async function handleDelete() {
    if (!window.confirm('Delete this report? This cannot be undone.')) return
    setDeleting(true)
    await onDelete(report.id)
    setDeleting(false)
    addToast('Report deleted', 'success')
  }

  async function handleTogglePublic() {
    setTogglingPublic(true)
    await onTogglePublic(report.id, !report.is_public)
    setTogglingPublic(false)
    addToast(report.is_public ? 'Removed from student board' : 'Posted to student board', 'success')
  }

  const canDelete = !isAdmin && onDelete && report.status === 'pending' && !report.is_public && !isPublicBoard
  const isBoardEligible = report.category === 'found_item' || report.category === 'lost_item'

  return (
    <div className="ticket" data-status={report.status}>
      <div className="ticket-top">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect?.(report.id)}
              style={{ marginTop: 6 }}
              aria-label="Select report"
            />
          )}
          <div>
            <span className="category-tag">{CATEGORY_LABELS[report.category]}</span>
            <h3 style={{ margin: '4px 0 0' }}>{report.title}</h3>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {report.is_public && <span className="board-chip">On student board</span>}
          {report.priority === 'urgent' && <span className="priority-chip">Urgent</span>}
          <StatusBadge status={report.status} />
        </div>
      </div>

      <p className="ticket-desc">{report.description}</p>

      <div className="ticket-meta">
        {report.location && (
          <span><MapPin size={13} style={{ verticalAlign: -2 }} /> {report.location}</span>
        )}
        <span><CalendarDays size={13} style={{ verticalAlign: -2 }} /> {new Date(report.created_at).toLocaleDateString()}</span>
        {isAdmin && report.reporter_email && (
          <span><User size={13} style={{ verticalAlign: -2 }} /> {report.reporter_email}</span>
        )}
      </div>

      {report.image_url && (
        <button type="button" className="ticket-image-btn" onClick={() => setLightboxOpen(true)}>
          <img className="ticket-image" src={report.image_url} alt={report.title} />
          <span className="ticket-image-zoom"><Maximize2 size={14} /></span>
        </button>
      )}

      {report.admin_notes && !isAdmin && (
        <p className="ticket-desc">
          <strong>Admin note:</strong> {report.admin_notes}
        </p>
      )}

      {isAdmin && (
        <div className="ticket-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Admin note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about actions taken..."
            />
          </div>

          {admins.length > 0 && onAssign && (
            <div className="field" style={{ marginBottom: 8, maxWidth: 260 }}>
              <label><UserCog size={13} style={{ verticalAlign: -2 }} /> Assigned to</label>
              <select
                value={report.assigned_to || ''}
                onChange={(e) => onAssign(report.id, e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name || a.id}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={savingStatus}
              onClick={() => handleStatusChange('pending')}
            >
              Mark pending
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={savingStatus}
              onClick={() => handleStatusChange('in_progress')}
            >
              Mark in progress
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={savingStatus}
              onClick={() => handleStatusChange('resolved')}
            >
              Mark resolved
            </button>
            <button className="btn btn-sm" disabled={savingStatus} onClick={handleSaveNotes}>
              Save note
            </button>
            {isBoardEligible && onTogglePublic && (
              <button className="btn btn-outline btn-sm" disabled={togglingPublic} onClick={handleTogglePublic}>
                <Megaphone size={14} />
                {report.is_public
                  ? 'Remove from board'
                  : report.category === 'lost_item'
                  ? 'Post to Lost items board'
                  : 'Post to Found items board'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="ticket-actions">
        {!isPublicBoard && (
          <button className="btn btn-outline btn-sm" onClick={() => setShowComments((v) => !v)}>
            <MessageSquare size={14} /> {showComments ? 'Hide messages' : 'Messages'}
          </button>
        )}
        {canDelete && (
          <button className="btn btn-outline btn-sm" disabled={deleting} onClick={handleDelete}>
            <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete report'}
          </button>
        )}
      </div>

      {showComments && !isPublicBoard && <ReportComments reportId={report.id} />}

      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close">
            <X size={22} />
          </button>
          <img
            src={report.image_url}
            alt={report.title}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}