import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <div className="auth-shell">
      <div className="form-card">
        <div className="auth-header">
          <h1>
            Campus<span className="brand-mark">Watch</span>
          </h1>
          <p>Report lost items, found items, and facility concerns.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

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
