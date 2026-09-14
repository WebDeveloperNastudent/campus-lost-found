import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

const ALLOWED_EMAIL_DOMAIN = '@neu.edu.ph'
const DEVICE_TRUST_PREFIX = 'cw_trusted_device_'

function isAllowedEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)
}

function isDeviceTrusted(userId) {
  return localStorage.getItem(DEVICE_TRUST_PREFIX + userId) === 'true'
}

function trustDevice(userId) {
  localStorage.setItem(DEVICE_TRUST_PREFIX + userId, 'true')
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [deviceVerified, setDeviceVerified] = useState(true)
  const [verifyingEmail, setVerifyingEmail] = useState('')
  const otpSentForRef = useRef(null)

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
  }

  // Rejects any session whose email isn't on the allowed school domain —
  // used both on initial load and whenever auth state changes (including
  // right after a Google OAuth redirect).
  async function rejectIfNotSchoolEmail(nextSession) {
    if (!nextSession?.user) return false
    if (isAllowedEmail(nextSession.user.email)) return false

    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setAuthError(`Please sign in with your school email (${ALLOWED_EMAIL_DOMAIN}).`)
    return true
  }

  // If this browser hasn't been marked trusted for this user before, sends
  // a one-time email code and flips deviceVerified to false so
  // ProtectedRoute can redirect to /verify-device until it's confirmed.
  function checkDeviceTrust(nextSession) {
    if (!nextSession?.user) {
      setDeviceVerified(true)
      return
    }
    if (isDeviceTrusted(nextSession.user.id)) {
      setDeviceVerified(true)
      return
    }
    setDeviceVerified(false)
    setVerifyingEmail(nextSession.user.email)
    if (otpSentForRef.current !== nextSession.user.id) {
      otpSentForRef.current = nextSession.user.id
      supabase.auth.signInWithOtp({
        email: nextSession.user.email,
        options: { shouldCreateUser: false },
      })
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const rejected = await rejectIfNotSchoolEmail(session)
      if (!rejected) {
        setSession(session)
        if (session?.user) {
          await loadProfile(session.user.id)
          checkDeviceTrust(session)
        }
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const rejected = await rejectIfNotSchoolEmail(session)
      if (rejected) return

      setSession(session)
      if (session?.user) {
        loadProfile(session.user.id)
        checkDeviceTrust(session)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp({ email, password, fullName, studentId }) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, student_id: studentId } },
    })
  }

  async function signIn({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signInWithGoogle() {
    setAuthError('')
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // Hints Google to show neu.edu.ph accounts first. This is only
        // enforced by Google itself for Workspace-managed domains — our own
        // rejectIfNotSchoolEmail() check above is what actually blocks
        // non-school emails regardless of that.
        // select_account forces Google to always show the account picker,
        // instead of silently reusing whichever Google account is already
        // signed into the browser.
        queryParams: { hd: 'neu.edu.ph', prompt: 'select_account' },
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    otpSentForRef.current = null
    setDeviceVerified(true)
  }

  function clearAuthError() {
    setAuthError('')
  }

  async function resendDeviceCode() {
    if (!verifyingEmail) return { error: new Error('No email to verify') }
    return supabase.auth.signInWithOtp({
      email: verifyingEmail,
      options: { shouldCreateUser: false },
    })
  }

  async function confirmDeviceCode(code) {
    const { error } = await supabase.auth.verifyOtp({
      email: verifyingEmail,
      token: code,
      type: 'email',
    })
    if (!error && session?.user) {
      trustDevice(session.user.id)
      setDeviceVerified(true)
    }
    return { error }
  }

  // Lets other components (e.g. the profile-edit dropdown) tell the context
  // to re-fetch the profile row after they've updated it directly.
  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    authError,
    clearAuthError,
    deviceVerified,
    verifyingEmail,
    resendDeviceCode,
    confirmDeviceCode,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}