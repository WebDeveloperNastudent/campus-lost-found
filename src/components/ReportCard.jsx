import { useState } from 'react'
import StatusBadge from './StatusBadge'

const CATEGORY_LABELS = {
  lost_item: 'Lost item',
  found_item: 'Found item',
  facility_issue: 'Facility issue',
}

export default function ReportCard({ report, isAdmin, onUpdateStatus }) {
  const [savingStatus, setSavingStatus] = useState(false)
  const [notes, setNotes] = useState(report.admin_notes || '')

  async function handleStatusChange(newStatus) {
    setSavingStatus(true)
    await onUpdateStatus(report.id, { status: newStatus, admin_notes: notes })
    setSavingStatus(false)
  }

  async function handleSaveNotes() {
    setSavingStatus(true)
    await onUpdateStatus(report.id, { status: report.status, admin_notes: notes })
    setSavingStatus(false)
  }

  return (
    <div className="ticket" data-status={report.status}>
      <div className="ticket-top">
        <div>
          <span className="category-tag">{CATEGORY_LABELS[report.category]}</span>
          <h3 style={{ margin: '4px 0 0' }}>{report.title}</h3>
        </div>
        <StatusBadge status={report.status} />
      </div>

      <p className="ticket-desc">{report.description}</p>

      <div className="ticket-meta">
        {report.location && <span>📍 {report.location}</span>}
        <span>{new Date(report.created_at).toLocaleDateString()}</span>
        {isAdmin && report.reporter_email && <span>👤 {report.reporter_email}</span>}
      </div>

      {report.image_url && (
        <img className="ticket-image" src={report.image_url} alt={report.title} />
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
          </div>
        </div>
      )}
    </div>
  )
}
