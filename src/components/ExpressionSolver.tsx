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

  function copyText(text: string, key: string) {
    if (!text) return
    try {
      navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 1200)
    } catch {}
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
          <p className="mt-2 text-xs text-slate-500">Operators: + for OR, · or implicit for AND, ' or ~ for NOT. Parentheses supported.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Download PNG"
            title="Download PNG"
            onClick={() => sectionRef.current && exportElementAsPNG(sectionRef.current, 'logimin-expression.png')}
            className="icon-btn h-9 w-9"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
              <defs>
                <linearGradient id="g-dl-png" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#06b6d4"/>
                  <stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
              <g stroke="url(#g-dl-png)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="6" width="16" height="12" rx="2"/>
                <path d="M6.5 15l3.2-3.6 2.6 2.6 3.5-5 3.2 6"/>
                <circle cx="9.5" cy="9.5" r="1.2"/>
              </g>
            </svg>
          </button>
          <button
            aria-label="Download PDF"
            title="Download PDF"
            onClick={() => sectionRef.current && exportElementAsPDF(sectionRef.current, 'logimin-expression.pdf')}
            className="icon-btn h-9 w-9"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
              <defs>
                <linearGradient id="g-dl-pdf" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ef4444"/>
                  <stop offset="1" stopColor="#f43f5e"/>
                </linearGradient>
              </defs>
              <g stroke="url(#g-dl-pdf)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4h9l3 3v13H6z"/>
                <path d="M15 4v3h3"/>
                <path d="M9 11h2.5c1.2 0 1.9.6 1.9 1.7s-.7 1.7-1.9 1.7H9v-3.4z"/> 
                <path d="M9 14.4h2.6"/>
              </g>
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
        <motion.div layout className="rounded-lg border border-slate-200 p-4">
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
