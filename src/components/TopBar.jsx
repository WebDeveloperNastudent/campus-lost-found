import { Menu, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import ProfileMenu from './ProfileMenu'

export default function TopBar({ onMenuClick }) {
  const { isAdmin } = useAuth()

  function handleNewReport() {
    window.dispatchEvent(new Event('campuswatch:new-report'))
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <span className="brand topbar-brand" style={{ fontSize: '1rem' }}>
          Campus<span className="brand-mark">Watch</span>
        </span>
      </div>

      <div className="topbar-right">
        {!isAdmin && (
          <button className="btn btn-accent btn-sm topbar-new-report" onClick={handleNewReport}>
            <Plus size={15} />
            New report
          </button>
        )}
        <NotificationBell />
        <ProfileMenu />
      </div>
    </div>
  )
}