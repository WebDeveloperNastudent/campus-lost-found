import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ReportComments({ reportId }) {
  const { user, isAdmin } = useAuth()
  const [comments, setComments] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadComments = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('report_comments')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }, [reportId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  async function handleSend(e) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    const { error } = await supabase.from('report_comments').insert({
      report_id: reportId,
      author_id: user.id,
      author_role: isAdmin ? 'admin' : 'student',
      message: message.trim(),
    })
    if (!error) {
      setMessage('')
      await loadComments()
    }
    setSending(false)
  }

  return (
    <div className="comment-thread">
      {loading ? (
        <p className="field-hint">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="field-hint">No messages yet.</p>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <div key={c.id} className={`comment-bubble comment-${c.author_role}`}>
              <span className="comment-author">{c.author_role === 'admin' ? 'Admin' : 'Student'}</span>
              <p>{c.message}</p>
              <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="comment-form">
        <input
          type="text"
          placeholder="Write a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="btn btn-sm" type="submit" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  )
}
