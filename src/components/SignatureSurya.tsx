"use client"

import { useEffect, useRef, useState } from 'react'

export default function SignatureSurya({ inline = false }: { inline?: boolean }) {
  const pathRef = useRef<SVGPathElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [started, setStarted] = useState(false)
  const [showText, setShowText] = useState(false)

  // Prepare dash properties on mount
  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const length = path.getTotalLength()
    path.style.strokeDasharray = String(length)
    path.style.strokeDashoffset = String(length)
  }, [])

  // Start animation only when visible:
  // - inline: when wrapper enters viewport via IntersectionObserver
  // - fixed: when user reaches near the bottom of the page
  useEffect(() => {
    if (inline) {
      const el = wrapRef.current
      if (!el) return
      const obs = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setStarted(true)
            obs.disconnect()
            break
          }
        }
      }, { threshold: 0.6 })
      obs.observe(el)
      return () => obs.disconnect()
    }

    function checkBottom() {
      const doc = document.documentElement
      const isBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 24
      setStarted(isBottom)
    }
    checkBottom()
    window.addEventListener('scroll', checkBottom, { passive: true })
    window.addEventListener('resize', checkBottom)
    return () => {
      window.removeEventListener('scroll', checkBottom)
      window.removeEventListener('resize', checkBottom)
    }
  }, [inline])

  // Run the handwriting animation when started
  useEffect(() => {
    if (!started) return
    const path = pathRef.current
    if (!path) return
    requestAnimationFrame(() => {
      path.style.transition = 'stroke-dashoffset 3.2s ease 0.4s'
      path.style.strokeDashoffset = '0'
    })
    const t = setTimeout(() => setShowText(true), 3600)
    return () => clearTimeout(t)
  }, [started])

  return (
    <div
      ref={wrapRef}
      className={inline ? 'pointer-events-none mx-auto mt-6 opacity-80' : 'pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 opacity-80 z-50'}
      aria-hidden
      style={{ opacity: started ? 0.85 : 0, transition: 'opacity 500ms ease 150ms' }}
    >
      <svg width={inline ? 180 : 200} height={inline ? 48 : 56} viewBox="0 0 200 56" fill="none">
        <path
          ref={pathRef}
          d="
            M10 36
            C 18 22, 38 22, 30 36
            C 26 42, 36 46, 44 36
            C 48 30, 58 30, 60 36
            C 62 44, 54 44, 56 36
            C 58 28, 70 28, 72 36
            C 74 44, 66 44, 68 36
            C 70 28, 84 28, 88 32
            C 92 36, 102 34, 102 30
            C 102 26, 96 26, 94 30
            C 92 34, 98 40, 108 36
            C 114 34, 118 30, 120 26
            C 121 24, 124 24, 124 26
            C 124 30, 120 34, 118 36
            M126 36
            C 130 28, 140 28, 140 34
            C 140 38, 134 38, 134 34
            M147 36
            C 144 28, 156 28, 154 36
            C 152 42, 146 42, 146 36
            M162 28
            C 168 30, 170 36, 164 36
            C 160 36, 160 30, 164 30
            M174 36
            C 180 28, 192 28, 190 36
            C 188 44, 180 44, 182 36
          "
          stroke="url(#g)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text
          x="12"
          y="40"
          fill="url(#g)"
          fontSize="28"
          fontWeight="600"
          style={{
            fontFamily: 'SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif',
            opacity: showText ? 1 : 0,
            transition: 'opacity 700ms ease'
          }}
          filter="url(#ds)"
        >
          Surya
        </text>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0ea5e9"/>
            <stop offset="1" stopColor="#38bdf8"/>
          </linearGradient>
          <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.0" floodColor="#0b1220" floodOpacity="0.35"/>
          </filter>
        </defs>
      </svg>
    </div>
  )
}
