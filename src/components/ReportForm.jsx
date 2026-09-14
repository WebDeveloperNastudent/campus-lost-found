import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const CATEGORIES = [
  { value: 'lost_item', label: 'Lost item' },
  { value: 'found_item', label: 'Found item' },
  { value: 'facility_issue', label: 'Facility issue' },
]

const LOCATIONS = [
  'Library',
  'Main Building',
  'Cafeteria / Canteen',
  'Gymnasium',
  'Student Center',
  'Science Building',
  'Engineering Building',
  'Parking Area',
  'Dormitory',
  'Sports Field / Grounds',
  'Other',
]

function normalizeWords(str) {
  return new Set(
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
  )
}

// Rough "is this probably the same item" check: how much of the shorter
// title's words show up in the other title, used only to warn, never block.
function titlesLookSimilar(a, b) {
  const wordsA = normalizeWords(a)
  const wordsB = normalizeWords(b)
  if (wordsA.size === 0 || wordsB.size === 0) return false
  let overlap = 0
  wordsA.forEach((w) => {
    if (wordsB.has(w)) overlap += 1
  })
  return overlap / Math.min(wordsA.size, wordsB.size) >= 0.5
}

export default function ReportForm({ onCreated }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [category, setCategory] = useState('lost_item')
  const [priority, setPriority] = useState('normal')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationChoice, setLocationChoice] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const finalLocation = (locationChoice === 'Other' ? customLocation : locationChoice).trim()

  async function checkForDuplicates() {
    const { data: existing } = await supabase
      .from('reports')
      .select('id, title, location, status')
      .eq('category', category)
      .neq('status', 'resolved')

    const dupes = (existing || []).filter((r) => {
      if (!titlesLookSimilar(r.title, title)) return false
      if (finalLocation && r.location) {
        return r.location.toLowerCase() === finalLocation.toLowerCase()
      }
      return true
    })

    if (dupes.length === 0) return true

    const sample = dupes[0]
    return window.confirm(
      `Heads up: there's already a similar report ("${sample.title}"${
        sample.location ? ` at ${sample.location}` : ''
      }) that isn't resolved yet. It might be the same item. Submit this one anyway?`
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFieldError('')

    if (!title.trim() || !description.trim()) {
      setFieldError('Please fill in the title and description.')
      return
    }
    if (locationChoice === 'Other' && !customLocation.trim()) {
      setFieldError('Please specify the location.')
      return
    }

    setSubmitting(true)
    try {
      const okToContinue = await checkForDuplicates()
      if (!okToContinue) {
        setSubmitting(false)
        return
      }

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
        location: finalLocation || null,
        image_url: imageUrl,
      })

      if (insertError) throw insertError

      addToast('Report submitted successfully', 'success')
      setTitle('')
      setDescription('')
      setLocationChoice('')
      setCustomLocation('')
      setPriority('normal')
      setImageFile(null)
      e.target.reset()
      onCreated?.()
    } catch (err) {
      addToast(err.message || 'Something went wrong. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-card wide" onSubmit={handleSubmit}>
      <h3>Report something</h3>
      {fieldError && <div className="form-error">{fieldError}</div>}

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
        <select
          id="location"
          value={locationChoice}
          onChange={(e) => setLocationChoice(e.target.value)}
        >
          <option value="">Select a location...</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {locationChoice === 'Other' && (
        <div className="field">
          <label htmlFor="customLocation">Specify location</label>
          <input
            id="customLocation"
            type="text"
            placeholder="e.g. Behind the covered court"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
          />
        </div>
      )}

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