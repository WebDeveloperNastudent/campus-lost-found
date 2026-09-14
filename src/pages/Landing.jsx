import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

function ContourArt() {
  // Concentric, hand-drawn-feeling contour lines — a wayfinding motif:
  // finding your way back to what you lost.
  const base =
    'M120,10 C170,8 210,35 225,75 C240,115 230,160 195,185 ' +
    'C160,210 110,215 75,190 C40,165 20,120 30,80 C40,40 75,12 120,10 Z'

  const rings = [
    { scale: 1, opacity: 0.9, width: 2 },
    { scale: 0.86, opacity: 0.75, width: 1.6 },
    { scale: 0.72, opacity: 0.6, width: 1.6 },
    { scale: 0.58, opacity: 0.5, width: 1.4 },
    { scale: 0.46, opacity: 0.42, width: 1.2 },
    { scale: 0.35, opacity: 0.34, width: 1.2 },
    { scale: 0.25, opacity: 0.28, width: 1 },
  ]

  return (
    <svg viewBox="0 0 260 230" className="contour-art" aria-hidden="true">
      <g transform="translate(130,115)">
        {rings.map((r, i) => (
          <g key={i} transform={`translate(-130,-115) scale(${r.scale})`} style={{ transformOrigin: '130px 115px' }}>
            <path
              d={base}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={r.width}
              opacity={r.opacity}
            />
          </g>
        ))}
      </g>
      <circle cx="128" cy="112" r="4" fill="var(--accent)" />
    </svg>
  )
}

// Reveals an element with a fade + rise the first time it scrolls into view.
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, visible]
}

function FeatureCard({ index, title, children, delay }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`feature-card reveal${visible ? ' revealed' : ''}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      <span className="feature-index">{index}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

export default function Landing() {
  const [heroIn, setHeroIn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroIn(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="brand">
            <span className="brand-crest">CW</span>
            Campus<span className="brand-mark">Watch</span>
          </Link>
          <nav className="landing-nav-links">
            <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
            <Link to="/signup" className="btn btn-accent btn-sm">Sign up</Link>
          </nav>
        </div>
      </header>

      <section className="hero hero-split">
        <div className="hero-split-inner">
          <div className={`hero-copy${heroIn ? ' hero-in' : ''}`}>
            <span className="eyebrow">Office of Student Affairs &middot; Campus Services</span>
            <h1>Every lost item has a way back.</h1>
            <p className="hero-sub">
              CampusWatch is the official channel for reporting lost items, found
              belongings, and facility issues &mdash; tracked from the moment it's
              filed to the moment it's resolved.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-accent">Report a concern</Link>
              <Link to="/login" className="btn btn-outline">Staff / Admin log in</Link>
            </div>
          </div>
          <div className={`hero-visual${heroIn ? ' hero-in' : ''}`}>
            <div className="glass-panel">
              <ContourArt />
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-inner">
          <FeatureCard index="01" title="Lost & found registry" delay={0}>
            Submit a lost or found item with a description, location, and photo, and get notified as it moves toward resolution.
          </FeatureCard>
          <FeatureCard index="02" title="Facility issue reporting" delay={120}>
            Report broken furniture, leaks, and other maintenance concerns directly to the office responsible for campus upkeep.
          </FeatureCard>
          <FeatureCard index="03" title="Transparent tracking" delay={240}>
            Every report is logged with a status &mdash; pending, in progress, or resolved &mdash; so nothing falls through the cracks.
          </FeatureCard>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p>CampusWatch &middot; Lost &amp; Found / Complaint Reporting System</p>
        </div>
      </footer>
    </div>
  )
}