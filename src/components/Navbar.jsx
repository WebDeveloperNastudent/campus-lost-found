import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          Campus<span className="brand-mark">Watch</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <Link to={isAdmin ? '/admin' : '/dashboard'}>
                {isAdmin ? 'Admin dashboard' : 'My reports'}
              </Link>
              {isAdmin && <span className="nav-role">Admin</span>}
              {profile?.full_name && !isAdmin && (
                <span style={{ color: '#8B96A3', fontSize: '0.85rem' }}>
                  {profile.full_name}
                </span>
              )}
              <button onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
