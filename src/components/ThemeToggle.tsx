"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type ThemeMode = 'light' | 'dark'

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const v = window.localStorage.getItem('theme') as ThemeMode | null
  return v === 'dark' ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const m = getStoredTheme()
    setMode(m)
    document.documentElement.setAttribute('data-theme', m)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', mode)
    try { window.localStorage.setItem('theme', mode) } catch {}
  }, [mode, mounted])

  const isDark = mode === 'dark'

  function toggle() {
    const next: ThemeMode = isDark ? 'light' : 'dark'
    const doc: any = document
    if (doc && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        setMode(next)
      })
    } else {
      setMode(next)
    }
  }

  if (!mounted) {
    return <div className="h-9 w-16" /> // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={toggle}
      className={`relative flex h-9 w-16 cursor-pointer items-center rounded-full p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-95 hover:scale-105 ${
        isDark ? 'bg-slate-800' : 'bg-sky-100'
      }`}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      <motion.div
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md"
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        style={{
          marginLeft: isDark ? 'auto' : '0',
          marginRight: isDark ? '0' : 'auto'
        }}
      >
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-700">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-amber-200">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M6.34 17.66l-1.41 1.41" />
              <path d="M19.07 4.93l-1.41 1.41" />
            </svg>
          )}
        </motion.div>
      </motion.div>
    </button>
  )
}
