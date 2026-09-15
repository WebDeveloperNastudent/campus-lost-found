import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyDevice() {
  const { user, verifyingEmail, resendDeviceCode, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleResend() {
    setError('')
    setResent(false)
    setResending(true)
    const { error } = await resendDeviceCode()
    setResending(false)
    if (error) {
      setError('Could not resend the link. Try again in a moment.')
      return
    }
    setResent(true)
  }

  async function handleUseDifferentAccount() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="auth-shell">
      <div className="form-card">
        <div className="auth-header">
          <span className="brand-crest" style={{ margin: '0 auto 10px', width: 34, height: 34 }}>CW</span>
          <h1>Verify this device</h1>
          <p>
            We sent a sign-in link to <strong>{verifyingEmail || user?.email}</strong>.
            Open the link on this device — you'll be signed in automatically
            once you do.
          </p>
        </div>

        {error && <div className="form-error">{error}</div>}
        {resent && <div className="form-success">A new link was sent.</div>}

        <button
          className="btn btn-accent"
          type="button"
          onClick={handleResend}
          disabled={resending}
          style={{ width: '100%' }}
        >
          {resending ? 'Sending...' : 'Resend link'}
        </button>

        <p className="auth-switch">
          Wrong account? <button type="button" className="link-btn" onClick={handleUseDifferentAccount}>Sign out</button>
        </p>
      </div>
    </div>
  )
}