import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

const ALLOWED_EMAIL_DOMAIN = '@neu.edu.ph'

function isAllowedEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const rejected = await rejectIfNotSchoolEmail(session)
      if (!rejected) {
        setSession(session)
        if (session?.user) await loadProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const rejected = await rejectIfNotSchoolEmail(session)
      if (rejected) return

      setSession(session)
      if (session?.user) {
        loadProfile(session.user.id)
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
        queryParams: { hd: 'neu.edu.ph' },
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function clearAuthError() {
    setAuthError('')
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