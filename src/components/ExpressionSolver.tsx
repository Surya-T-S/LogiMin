"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { solveExpression, type SolveStep } from '@/lib/boolean/engine'
import { exportElementAsPDF, exportElementAsPNG } from '@/lib/export'
import TruthTable from '@/components/TruthTable'
import GateDiagram from '@/components/GateDiagram'

export default function ExpressionSolver() {
  const [input, setInput] = useState("A'B + AB' + AB")
  const [debounced, setDebounced] = useState(input)
  const [error, setError] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), 350)
    return () => clearTimeout(id)
  }, [input])

  const result = useMemo(() => {
    try {
      setError(null)
      return solveExpression(debounced)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to parse expression')
      return null
    }
  }, [debounced])

  async function copyText(text: string, key: string) {
    if (!text) return
    const fallbackCopy = (t: string) => {
      const ta = document.createElement('textarea')
      // iOS Safari requires the element to be visible and selectable
      ta.value = t
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.top = '0'
      ta.style.left = '0'
      ta.style.opacity = '0.001'
      ta.style.pointerEvents = 'none'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand('copy')
      } catch {}
      document.body.removeChild(ta)
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        fallbackCopy(text)
      }
      setCopied(key)
      window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 1200)
    } catch {
      // final fallback to ensure some attempt was made
      try { fallbackCopy(text) } catch {}
      setCopied(key)
      window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 1200)
    }
  }

  return (
    <section ref={sectionRef} className="card p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-600">Boolean Expression</label>
          <input
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="e.g. (X+Y)(X+Z) or A'B + AB' + AB"
            className="input-lg w-full"
          />
          <p className="mt-2 text-xs text-slate-500">Operators: + for OR, · or implicit for AND, &#39; or ~ for NOT. Parentheses supported.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Download PNG"
            title="Download PNG"
            onClick={() => sectionRef.current && exportElementAsPNG(sectionRef.current, 'logimin-expression.png')}
            className="group flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-sky-800 dark:hover:bg-sky-900/30 dark:hover:text-sky-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div layout className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Results</h3>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : result ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="badge mr-2">Variables</span>
                <span className="font-mono">{result.vars.join(', ') || '—'}</span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="badge mr-2">SOP</span>
                <span className="font-mono">{result.sop}</span>
                <button aria-label="Copy SOP" title="Copy SOP" onClick={() => copyText(result.sop, 'sop')} className="icon-btn ml-1 h-7 w-7">
                  {copied === 'sop' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600"><path fill="currentColor" d="m9.9 16.6-3.5-3.5 1.4-1.4 2.1 2.1 5.2-5.2 1.4 1.4z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-slate-700"><path fill="currentColor" d="M8 7h11v11H8z" opacity=".3"/><path fill="currentColor" d="M16 1H3v16h2V3h11z"/><path fill="currentColor" d="M21 6H8v16h13zM10 8h9v12h-9z"/></svg>
                  )}
                </button>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="badge mr-2">POS</span>
                <span className="font-mono">{result.pos}</span>
                <button aria-label="Copy POS" title="Copy POS" onClick={() => copyText(result.pos, 'pos')} className="icon-btn ml-1 h-7 w-7">
                  {copied === 'pos' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600"><path fill="currentColor" d="m9.9 16.6-3.5-3.5 1.4-1.4 2.1 2.1 5.2-5.2 1.4 1.4z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-slate-700"><path fill="currentColor" d="M8 7h11v11H8z" opacity=".3"/><path fill="currentColor" d="M16 1H3v16h2V3h11z"/><path fill="currentColor" d="M21 6H8v16h13zM10 8h9v12h-9z"/></svg>
                  )}
                </button>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="badge mr-2">Canonical</span>
                <span className="font-mono">{result.canonical.sumOfMinterms} · {result.canonical.productOfMaxterms}</span>
                <button aria-label="Copy canonical" title="Copy canonical" onClick={() => copyText(`${result.canonical.sumOfMinterms} ${result.canonical.productOfMaxterms}`, 'can')} className="icon-btn ml-1 h-7 w-7">
                  {copied === 'can' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600"><path fill="currentColor" d="m9.9 16.6-3.5-3.5 1.4-1.4 2.1 2.1 5.2-5.2 1.4 1.4z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-slate-700"><path fill="currentColor" d="M8 7h11v11H8z" opacity=".3"/><path fill="currentColor" d="M16 1H3v16h2V3h11z"/><path fill="currentColor" d="M21 6H8v16h13zM10 8h9v12h-9z"/></svg>
                  )}
                </button>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="badge mr-2">Minimal</span>
                <span className="min-pill font-mono">{result.minimal}</span>
                <button aria-label="Copy minimal" title="Copy minimal" onClick={() => copyText(result.minimal, 'min')} className="icon-btn ml-1 h-7 w-7">
                  {copied === 'min' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600"><path fill="currentColor" d="m9.9 16.6-3.5-3.5 1.4-1.4 2.1 2.1 5.2-5.2 1.4 1.4z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-slate-700"><path fill="currentColor" d="M8 7h11v11H8z" opacity=".3"/><path fill="currentColor" d="M16 1H3v16h2V3h11z"/><path fill="currentColor" d="M21 6H8v16h13zM10 8h9v12h-9z"/></svg>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Type to see results…</div>
          )}
        </motion.div>
        <motion.div layout className="section-panel">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Steps</h3>
          {error ? (
            <div className="text-sm text-red-700">Fix the error to view steps.</div>
          ) : result ? (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {result.steps.map((s: SolveStep, i: number) => (
                <li key={i}>
                  <span className="font-medium">{s.title}</span>
                  {s.detail ? <span className="text-slate-500"> — {s.detail}</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-sm text-slate-500">Steps will appear here.</div>
          )}
        </motion.div>
      </div>

      {/* Visualization: Logic Gate Diagram + Truth Table */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <GateDiagram original={input} minimal={result?.minimal} />
        <TruthTable result={result} />
      </div>
    </section>
  )
}
