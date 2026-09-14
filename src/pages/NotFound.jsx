import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="notfound-shell">
      <Compass size={44} strokeWidth={1.3} />
      <h1>404</h1>
      <p>This page doesn&rsquo;t exist, or you don&rsquo;t have access to it.</p>
      <Link to="/" className="btn btn-accent">Back to CampusWatch</Link>
    </div>
  )
}
