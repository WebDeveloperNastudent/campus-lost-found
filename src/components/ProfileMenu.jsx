import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function initials(name, email) {
  const source = (name || '').trim() || (email || '')
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export default function ProfileMenu() {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [studentId, setStudentId] = useState(profile?.student_id || '')
  const [saving, setSaving] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setStudentId(profile?.student_id || '')
  }, [profile])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, student_id: studentId })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      addToast('Could not update profile', 'error')
      return
    }
    await refreshProfile()
    addToast('Profile updated', 'success')
    setEditing(false)
    setOpen(false)
  }

  const displayName = profile?.full_name || user?.email

  return (
    <div className="profile-menu" ref={wrapRef}>
      <button className="profile-trigger" onClick={() => setOpen((o) => !o)} aria-label="Account menu">
        <span className="profile-avatar">{initials(profile?.full_name, user?.email)}</span>
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <span className="profile-avatar profile-avatar-lg">
              {initials(profile?.full_name, user?.email)}
            </span>
            <div>
              <p className="profile-name">{displayName}</p>
              <p className="profile-email">{user?.email}</p>
              {isAdmin && <span className="nav-role" style={{ marginTop: 4, display: 'inline-block' }}>Admin</span>}
            </div>
          </div>

          {!editing ? (
            <div className="profile-dropdown-actions">
              <button className="profile-action" onClick={() => setEditing(true)}>Edit profile</button>
              <button className="profile-action profile-action-danger" onClick={handleSignOut}>Sign out</button>
            </div>
          ) : (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              <div className="field">
                <label htmlFor="pm-fullname">Full name</label>
                <input
                  id="pm-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              {!isAdmin && (
                <div className="field">
                  <label htmlFor="pm-studentid">Student ID</label>
                  <input
                    id="pm-studentid"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
              )}
              <div className="profile-edit-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}