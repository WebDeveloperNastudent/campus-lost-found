const LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`status-chip status-${status}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
