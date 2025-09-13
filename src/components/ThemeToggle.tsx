"use client"

import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark'

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const v = window.localStorage.getItem('theme') as ThemeMode | null
  return v === 'dark' ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const m = getStoredTheme()
    setMode(m)
    document.documentElement.setAttribute('data-theme', m)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    try { window.localStorage.setItem('theme', mode) } catch {}
  }, [mode])

  const isDark = mode === 'dark'

  function toggle() {
    const next: ThemeMode = isDark ? 'light' : 'dark'
    const doc: any = document
    if (doc && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        document.documentElement.setAttribute('data-theme', next)
        try { window.localStorage.setItem('theme', next) } catch {}
        setMode(next)
      })
    } else {
      setMode(next)
    }
  }

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      title={isDark ? 'Dark' : 'Light'}
      onClick={toggle}
      className={`group relative inline-flex h-9 w-16 items-center overflow-hidden rounded-full border px-1 transition-colors ${isDark ? 'border-slate-700 bg-slate-800/80' : 'border-slate-300 bg-white'}`}
      style={{ boxShadow: isDark ? 'inset 0 0 0 1px rgba(0,0,0,0.2)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
    >
      {/* labels */}
      <span className={`pointer-events-none absolute left-2 text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-amber-500'}`}>☀︎</span>
      <span className={`pointer-events-none absolute right-2 text-[10px] font-medium ${isDark ? 'text-sky-300' : 'text-slate-400'}`}>☾</span>
      {/* knob */}
      <span
        className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-gradient-to-b shadow transition-all duration-200 ${
          isDark ? 'from-slate-600 to-slate-800 shadow-black/40' : 'from-white to-slate-100 shadow-black/10'
        }`}
        style={{
          left: isDark ? 'auto' : '4px',
          right: isDark ? '4px' : 'auto',
          border: isDark ? '1px solid rgba(0,0,0,0.4)' : '1px solid rgba(0,0,0,0.08)'
        }}
      />
    </button>
  )
}
