import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ContourBackdrop() {
  const base =
    'M120,10 C170,8 210,35 225,75 C240,115 230,160 195,185 ' +
    'C160,210 110,215 75,190 C40,165 20,120 30,80 C40,40 75,12 120,10 Z'
  const rings = [1, 0.86, 0.72, 0.58, 0.46, 0.35, 0.25]

  return (
    <svg viewBox="0 0 260 230" className="auth-contour" aria-hidden="true">
      {rings.map((scale, i) => (
        <g key={i} transform={`translate(130,115) scale(${scale}) translate(-130,-115)`}>
          <path d={base} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
        </g>
      ))}
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.6 18.9 12 24 12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.3 0 10.2-2 13.8-5.4l-6.4-5.4C29.3 36 26.8 37 24 37c-5.3 0-9.6-3.4-11.2-8.1l-6.6 5.1C9.5 40.6 16.2 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C40.5 36.9 45 31 45 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  )
}

export default function Login() {
  const { signIn, signInWithGoogle, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    return () => clearAuthError()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/')
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setGoogleLoading(false)
      setError(error.message)
    }
    // On success, the browser redirects to Google, so no further code runs here.
  }

  return (
    <div className="auth-shell">
      <ContourBackdrop />
      <div className="form-card">
        <div className="auth-header">
          <Link to="/" className="auth-crest-row">
            <span className="brand-crest">CW</span>
          </Link>
          <h1>
            Campus<span className="brand-mark">Watch</span>
          </h1>
          <p>Report lost items, found items, and facility concerns.</p>
        </div>

        {(error || authError) && <div className="form-error">{error || authError}</div>}

        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-accent" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          No account yet? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}