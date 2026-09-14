import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyDevice() {
  const { user, verifyingEmail, confirmDeviceCode, resendDeviceCode, signOut } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await confirmDeviceCode(code.trim())
    setSubmitting(false)
    if (error) {
      setError('That code didn\'t work. Double-check it and try again.')
      return
    }
    navigate('/')
  }

  async function handleResend() {
    setError('')
    setResent(false)
    const { error } = await resendDeviceCode()
    if (error) {
      setError('Could not resend the code. Try again in a moment.')
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
            We sent a 6-digit code to <strong>{verifyingEmail || user?.email}</strong>.
            Enter it below to continue on this device.
          </p>
        </div>

        {error && <div className="form-error">{error}</div>}
        {resent && <div className="form-success">A new code was sent.</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button className="btn btn-accent" type="submit" disabled={submitting || !code.trim()} style={{ width: '100%' }}>
            {submitting ? 'Verifying...' : 'Verify and continue'}
          </button>
        </form>

        <p className="auth-switch">
          Didn't get it? <button type="button" className="link-btn" onClick={handleResend}>Resend code</button>
        </p>
        <p className="auth-switch">
          Wrong account? <button type="button" className="link-btn" onClick={handleUseDifferentAccount}>Sign out</button>
        </p>
      </div>
    </div>
  )
}