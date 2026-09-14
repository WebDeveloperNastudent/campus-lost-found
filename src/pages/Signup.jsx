import { useState } from 'react'
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

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { data, error } = await signUp({ email, password, fullName, studentId })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data?.session) {
      navigate('/')
    } else {
      setSuccess('Account created. Check your email to confirm, then log in.')
    }
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
          <p>Create a student account.</p>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="studentId">Student ID</label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-accent" type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}