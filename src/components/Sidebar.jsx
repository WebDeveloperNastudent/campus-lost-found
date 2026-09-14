import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, FileText, PackageSearch, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ open, onClose }) {
  const { isAdmin, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const homePath = isAdmin ? '/admin' : '/dashboard'

  function isActive(path) {
    return location.pathname === path ? ' active' : ''
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="brand">
            <span className="brand-crest">CW</span>
            Campus<span className="brand-mark">Watch</span>
          </Link>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link to={homePath} className={`sidebar-link${isActive(homePath)}`}>
            {isAdmin ? <LayoutDashboard size={17} /> : <ClipboardList size={17} />}
            {isAdmin ? 'Admin dashboard' : 'My reports'}
          </Link>

          {isAdmin && (
            <Link to="/admin/reports" className={`sidebar-link${isActive('/admin/reports')}`}>
              <FileText size={17} />
              Reports
            </Link>
          )}

          <Link to="/board" className={`sidebar-link${isActive('/board')}`}>
            <PackageSearch size={17} />
            Found items board
          </Link>
        </nav>

        <div className="sidebar-footer">
          {isAdmin && <span className="nav-role">Admin</span>}
          {profile?.full_name && <p className="sidebar-user">{profile.full_name}</p>}
          <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={handleSignOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}