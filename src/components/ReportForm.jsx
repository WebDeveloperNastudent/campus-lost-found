import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: 'lost_item', label: 'Lost item' },
  { value: 'found_item', label: 'Found item' },
  { value: 'facility_issue', label: 'Facility issue' },
]

export default function ReportForm({ onCreated }) {
  const { user } = useAuth()
  const [category, setCategory] = useState('lost_item')
  const [priority, setPriority] = useState('normal')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !description.trim()) {
      setError('Please fill in the title and description.')
      return
    }

    setSubmitting(true)
    try {
      let imageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error(
            'Image upload failed (is the "report-images" storage bucket set up?): ' +
              uploadError.message
          )
        }

        const { data: publicUrlData } = supabase.storage
          .from('report-images')
          .getPublicUrl(filePath)
        imageUrl = publicUrlData.publicUrl
      }

      const { error: insertError } = await supabase.from('reports').insert({
        reporter_id: user.id,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        image_url: imageUrl,
      })

      if (insertError) throw insertError

      setSuccess('Report submitted. You can track its status below.')
      setTitle('')
      setDescription('')
      setLocation('')
      setPriority('normal')
      setImageFile(null)
      e.target.reset()
      onCreated?.()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-card wide" onSubmit={handleSubmit}>
      <h3>Report something</h3>
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="priority">Priority</label>
        <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>
        <span className="field-hint">Mark as urgent for safety hazards or time-sensitive issues.</span>
      </div>

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          placeholder="e.g. Black umbrella left in Room 204"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Describe the item or issue in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="location">Location</label>
        <input
          id="location"
          type="text"
          placeholder="e.g. Library, 2nd floor"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="image">Photo (optional)</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
        <span className="field-hint">Helps admin staff identify the item or issue faster.</span>
      </div>

      <button className="btn btn-accent" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit report'}
      </button>
    </form>
  )
}
