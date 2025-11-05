"use client"

import React, { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { buildGrid, defaultVarNames, getKMapShape, rcToIndex, indexToRC, solveKMap, type CellValue } from '@/lib/boolean/kmap'
import TruthTable from '@/components/TruthTable'
import GateDiagram from '@/components/GateDiagram'
import { exportElementAsPDF, exportElementAsPNG } from '@/lib/export'
import { solveExpression, formatPOS, implicantToSum } from '@/lib/boolean/engine'
import { minimizeSOP } from '@/lib/boolean/qmc'

const GROUP_COLORS = ['#f97316', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308', '#14b8a6', '#f43f5e']
const HEADER_SIZE = 'min(3rem, 12vw)'
const CELL_SIZE_VALUE = 'min(3rem, 12vw)'
const LOOP_INSET_PX = 4
const LOOP_RADIUS_PX = 12
const LOOP_STROKE_PX = 2.4

type Segment = { start: number; span: number }
type OverlayRect = { rowStart: number; rowSpan: number; colStart: number; colSpan: number; color: string }

function colorWithAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor
  const base = hex.length === 8 ? hex.slice(0, 6) : hex
  if (base.length !== 6) return hexColor
  const r = parseInt(base.slice(0, 2), 16)
  const g = parseInt(base.slice(2, 4), 16)
  const b = parseInt(base.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hexColor
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function buildCyclicSegments(indices: Set<number>, total: number): Segment[] {
  if (indices.size === 0) return []
  const sorted = Array.from(indices).sort((a, b) => a - b)
  const span = sorted.length
  const set = new Set(indices)

  for (const candidate of sorted) {
    let ok = true
    for (let offset = 0; offset < span; offset++) {
      const idx = (candidate + offset) % total
      if (!set.has(idx)) { ok = false; break }
    }
    if (!ok) continue
    if (candidate + span <= total) return [{ start: candidate, span }]
    const firstSpan = total - candidate
    const wrapSpan = span - firstSpan
    const segments: Segment[] = []
    if (firstSpan > 0) segments.push({ start: candidate, span: firstSpan })
    if (wrapSpan > 0) segments.push({ start: 0, span: wrapSpan })
    return segments
  }

  // Fallback: treat as individual cells to avoid blank overlays
  return sorted.map((value) => ({ start: value, span: 1 }))
}

type CellProps = { value: 0 | 1 | 'X'; onClick: () => void; highlight?: string | null; size: string; zebraClass?: string }
const Cell: React.FC<CellProps> = ({ value, onClick, highlight, size, zebraClass }) => {
  const display = value === 'X' ? 'X' : String(value)

  let className = zebraClass ?? 'bg-white text-slate-800'
  if (value === 'X') className = 'bg-slate-100 text-slate-500'

  const cellStyle: React.CSSProperties = {
    width: size,
    height: size,
    ...(highlight
      ? {
          boxShadow: `inset 0 0 0 1px ${colorWithAlpha(highlight, 0.35)}`,
          backgroundColor: colorWithAlpha(highlight, 0.015)
        }
      : {}),
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center text-sm font-medium transition-colors ${className}`}
      style={cellStyle}
    >
      {display}
    </button>
  )
}

function formatHeaderCombo(value: number, varsList: string[], bits: number): string {
  if (bits === 0) return ''
  const binary = value.toString(2).padStart(bits, '0')
  if (varsList.length === 0) return binary
  let label = ''
  for (let i = 0; i < bits; i++) {
    const name = varsList[i] ?? `V${i + 1}`
    label += binary[i] === '1' ? name : `${name}'`
  }
  return label
}

export default function KMapSolver() {
  const [vars, setVars] = useState(4)
  const [cells, setCells] = useState<Array<0 | 1 | 'X'>>(() => Array.from({ length: 1 << 4 }, () => 0))
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const [mtInput, setMtInput] = useState('')
  const [dcInput, setDcInput] = useState('')
  const [exprInput, setExprInput] = useState('')
  const [swapRC, setSwapRC] = useState(false)
  const [groupMode, setGroupMode] = useState<'sop' | 'pos'>('sop')
  const [varNames, setVarNames] = useState<string[]>(() => defaultVarNames(4))

  // Ensure cells length matches vars
  const size = 1 << vars
  useEffect(() => {
    setCells((prev) => {
      if (prev.length === size) return prev
      return Array.from({ length: size }, (_, i) => (i < prev.length ? prev[i]! : 0))
    })
  }, [size])

  useEffect(() => {
    setVarNames((prev) => {
      if (prev.length === vars) return prev
      const base = defaultVarNames(vars)
      const limit = Math.min(prev.length, vars)
      for (let i = 0; i < limit; i++) base[i] = prev[i]!
      return base
    })
  }, [vars])

  const shape = useMemo(() => getKMapShape(vars), [vars])
  const grid = useMemo(() => buildGrid(cells, vars), [cells, vars])
  const mtFromCells = useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i < cells.length; i++) if (cells[i] === 1) arr.push(i)
    return arr
  }, [cells])

  const names = useMemo(() => {
    if (varNames.length === vars) return varNames
    const base = defaultVarNames(vars)
    const limit = Math.min(varNames.length, vars)
    for (let i = 0; i < limit; i++) base[i] = varNames[i]!
    return base
  }, [varNames, vars])

  const solution = useMemo(() => solveKMap(cells, vars, names), [cells, vars, names])
  const posString = useMemo(() => {
    const namesArr = names
    const maxterms: number[] = []
    const dontCares: number[] = []
    for (let i = 0; i < (1 << vars); i++) {
      const v = cells[i]
      if (v === 0) maxterms.push(i)
      else if (v === 'X') dontCares.push(i)
    }
    const res = minimizeSOP(maxterms, dontCares, vars)
    return formatPOS(res, namesArr)
  }, [cells, vars, names])
  const groupsSOP = useMemo(() => solution.groups.map(g => ({ cells: g.cells, label: g.product })), [solution.groups])
  // Enumerate POS groups over 0-cells for grouping visualization
  const groupsPOS = useMemo(() => {
    const namesArr = names
    const maxterms: number[] = []
    const dontCares: number[] = []
    for (let i = 0; i < (1 << vars); i++) {
      const v = cells[i]
      if (v === 0) maxterms.push(i)
      else if (v === 'X') dontCares.push(i)
    }
    const res = minimizeSOP(maxterms, dontCares, vars)
    // Build cells covered by each implicant
    const list: Array<{ cells: Array<{ r: number; c: number; m: number }>; label: string }> = []
    const shape = getKMapShape(vars)
    const popcount = (x: number) => { let c = 0; while (x) { x &= x - 1; c++ } return c }
    const bitPositions = (mask: number, n: number) => {
      const pos: number[] = []
      for (let i = 0; i < n; i++) { const bitPos = n - 1 - i; if ((mask >> bitPos) & 1) pos.push(bitPos) }
      return pos
    }
    for (const idx of res.selected) {
      const imp = res.primeImplicants[idx]
      const mask = imp.mask
      const nComb = 1 << popcount(mask)
      const freePositions = bitPositions(mask, vars)
      const cellsArr: Array<{ r: number; c: number; m: number }> = []
      for (let k = 0; k < nComb; k++) {
        let m = imp.bits
        for (let j = 0; j < freePositions.length; j++) {
          const bitPos = freePositions[j]
          const bit = (k >> j) & 1
          if (bit) m |= (1 << bitPos)
          else m &= ~(1 << bitPos)
        }
        const { r, c } = indexToRC(m, shape)
        cellsArr.push({ r, c, m })
      }
      list.push({ cells: cellsArr, label: implicantToSum(imp, namesArr) })
    }
    return list
  }, [cells, vars, names])
  const rowVarsBase = useMemo(() => names.slice(0, shape.rowBits), [names, shape.rowBits])
  const colVarsBase = useMemo(() => names.slice(shape.rowBits, shape.rowBits + shape.colBits), [names, shape.rowBits, shape.colBits])
  const rowVars = swapRC ? colVarsBase : rowVarsBase
  const colVars = swapRC ? rowVarsBase : colVarsBase

  const rowLabels = useMemo(() => {
    const order = swapRC ? shape.colOrder : shape.rowOrder
    const bits = swapRC ? shape.colBits : shape.rowBits
    const axisVars = swapRC ? colVarsBase : rowVarsBase
    return order.map((value) => formatHeaderCombo(value, axisVars, bits))
  }, [swapRC, shape, rowVarsBase, colVarsBase])

  const colLabels = useMemo(() => {
    const order = swapRC ? shape.rowOrder : shape.colOrder
    const bits = swapRC ? shape.rowBits : shape.colBits
    const axisVars = swapRC ? rowVarsBase : colVarsBase
    return order.map((value) => formatHeaderCombo(value, axisVars, bits))
  }, [swapRC, shape, rowVarsBase, colVarsBase])

  // Map minterm index -> group color (first group wins for simplicity)
  const groupsActive = groupMode === 'sop' ? groupsSOP : groupsPOS
  const mToColor: Record<number, string> = useMemo(() => {
    const map: Record<number, string> = {}
    groupsActive.forEach((g, idx) => {
      const color = GROUP_COLORS[idx % GROUP_COLORS.length]
      g.cells.forEach(({ m }) => { if (!(m in map)) map[m] = color })
    })
    return map
  }, [groupsActive])

  const loopOverlays = useMemo(() => {
    const totalRows = swapRC ? shape.cols : shape.rows
    const totalCols = swapRC ? shape.rows : shape.cols
    const rects: OverlayRect[] = []

    groupsActive.forEach((group, idx) => {
      if (group.cells.length === 0) return
      const color = GROUP_COLORS[idx % GROUP_COLORS.length]
      const rowSet = new Set<number>()
      const colSet = new Set<number>()

      group.cells.forEach(({ m }) => {
        const { r, c } = indexToRC(m, shape)
        const displayR = swapRC ? c : r
        const displayC = swapRC ? r : c
        rowSet.add(displayR)
        colSet.add(displayC)
      })

      const rowSegments = buildCyclicSegments(rowSet, totalRows)
      const colSegments = buildCyclicSegments(colSet, totalCols)

      rowSegments.forEach((rs) => {
        colSegments.forEach((cs) => {
          rects.push({ rowStart: rs.start, rowSpan: rs.span, colStart: cs.start, colSpan: cs.span, color })
        })
      })
    })

    return rects
  }, [groupsActive, shape, swapRC])

  // Helpers for headers and sizing used in render
  const cellSize = 'var(--kmap-cell)'

  function parseIndexList(text: string, size: number): number[] {
    if (!text.trim()) return []
    return text
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((t) => Number(t))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < size)
  }

  // Build canonical SOP from current minterms and variable labels
  const canonicalSOP = useMemo(() => {
    const varsList = names
    const n = varsList.length
    const terms: string[] = []
    for (let i = 0; i < (1 << n); i++) {
      if (cells[i] !== 1) continue
      const lits: string[] = []
      for (let b = 0; b < n; b++) {
        const bit = (i >> (n - 1 - b)) & 1
        lits.push(bit ? varsList[b]! : `${varsList[b]}'`)
      }
      terms.push(lits.join(''))
    }
    return terms.length ? terms.join(' + ') : '0'
  }, [cells, names])

  function applyMinterms() {
    const mt = parseIndexList(mtInput, size)
    const dc = parseIndexList(dcInput, size)
    const next: Array<0 | 1 | 'X'> = Array.from({ length: size }, () => 0)
    for (const i of dc) next[i] = 'X'
    for (const i of mt) if (next[i] !== 'X') next[i] = 1
    setCells(next)
  }

  function applyExpression() {
    try {
      const res = solveExpression(exprInput)
      const n = res.vars.length
      if (n < 2 || n > 6) return
      const s = 1 << n
      const next: Array<0 | 1 | 'X'> = Array.from({ length: s }, () => 0)
      const mt = res.intermediate?.minterms ?? []
      for (const i of mt) next[i] = 1
      setVars(n)
      setCells(next)
      setVarNames(res.vars.length === n ? res.vars : defaultVarNames(n))
    } catch (e) {
      // ignore; invalid expression
    }
  }

  return (
    <section className="card p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="mr-2 text-sm text-slate-600">Variables</label>
          <select
            value={vars}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const v = Number(e.target.value)
              setVars(v)
              setCells(Array.from({ length: 1 << v }, () => 0))
            }}
            className="input-lg px-3 py-2 text-sm"
          >
            {[2, 3, 4, 5, 6].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-500">Click cells to toggle 0 → 1 → X</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCells(Array.from({ length: 1 << vars }, () => 0))}
            className="rounded-full border border-white/60 bg-white/8 px-2 py-1 text-xs shadow hover:bg-white/90 backdrop-blur"
          >
            Clear
          </button>
          <button
            onClick={() => setCells(Array.from({ length: 1 << vars }, () => 1))}
            className="rounded-full border border-white/60 bg-white/8 px-2 py-1 text-xs shadow hover:bg-white/90 backdrop-blur"
          >
            Fill 1s
          </button>
          <button
            aria-label="Download PNG"
            title="Download PNG"
            onClick={() => sectionRef.current && exportElementAsPNG(sectionRef.current, 'logimin-kmap.png')}
            className="icon-btn h-8 w-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
              <defs>
                <linearGradient id="g-dl-kmap-png" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#06b6d4"/>
                  <stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
              <g stroke="url(#g-dl-kmap-png)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v9"/>
                <path d="M8 10l4 4 4-4"/>
                <rect x="4" y="17" width="16" height="3" rx="1.5"/>
                <path d="M7 16l3-2 2 2 3-3 2 3"/>
              </g>
            </svg>
          </button>
          <button
            aria-label="Download PDF"
            title="Download PDF"
            onClick={() => sectionRef.current && exportElementAsPDF(sectionRef.current, 'logimin-kmap.pdf')}
            className="icon-btn h-8 w-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
              <defs>
                <linearGradient id="g-dl-kmap-pdf" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ef4444"/>
                  <stop offset="1" stopColor="#f43f5e"/>
                </linearGradient>
              </defs>
              <g stroke="url(#g-dl-kmap-pdf)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v9"/>
                <path d="M8 10l4 4 4-4"/>
                <rect x="4" y="17" width="16" height="3" rx="1.5"/>
                <rect x="10" y="4" width="7" height="6" rx="1"/>
                <path d="M17 4h3v3"/>
              </g>
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">Minterms</label>
          <input
            value={mtInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMtInput(e.target.value)}
            placeholder="e.g. 0,1,2,5"
            className="input-lg w-full px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">Don’t Cares</label>
          <input
            value={dcInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDcInput(e.target.value)}
            placeholder="e.g. 6,7"
            className="input-lg w-full px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyMinterms()}
            className="rounded-full border border-white/60 bg-white/8 px-3 py-1.5 text-sm shadow hover:bg-white/90 backdrop-blur"
          >
            Apply
          </button>
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">From Expression</label>
          <input
            value={exprInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setExprInput(e.target.value)}
            placeholder="e.g. (X+Y)(X+Z)"
            className="input-lg w-full px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyExpression()}
            className="rounded-full border border-white/60 bg-white/8 px-3 py-1.5 text-sm shadow hover:bg-white/90 backdrop-blur"
          >
            Load
          </button>
        </div>
      </div>

      <div ref={sectionRef} className="overflow-auto">
        {/* Controls: grouping and layout */}
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Group by</span>
            <div className="segmented relative inline-flex h-8 w-[120px] items-center">
              <motion.div
                layout
                className="indicator pointer-events-none"
                style={{ position: 'absolute', width: 'calc(50% - 6px)', left: 3, top: 3, bottom: 3 }}
                animate={{ left: groupMode === 'sop' ? 3 : 'calc(50% + 3px)' }}
                transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.18 }}
              />
              <button onClick={() => setGroupMode('sop')} className={`relative z-10 w-1/2 rounded-full px-2 py-1 ${groupMode === 'sop' ? 'text-slate-900' : 'text-slate-600'}`}>SOP</button>
              <button onClick={() => setGroupMode('pos')} className={`relative z-10 w-1/2 rounded-full px-2 py-1 ${groupMode === 'pos' ? 'text-slate-900' : 'text-slate-600'}`}>POS</button>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-slate-600"><input type="checkbox" checked={swapRC} onChange={(e) => setSwapRC(e.target.checked)} /><span>Swap Rows/Cols</span></label>
        </div>
        {/* K-Map grid with Gray-code headers */}
        <div
          className="relative inline-block pt-7"
          style={{ '--kmap-cell': CELL_SIZE_VALUE, '--kmap-header': HEADER_SIZE } as React.CSSProperties}
        >
          {/* Axis labels */}
          <div className="absolute top-0 left-0 text-[11px] font-medium text-slate-500">Order: <span className="font-mono text-slate-600">Rows={rowVars.join(' ')} · Cols={colVars.join(' ')}</span></div>
          <div
            className="absolute top-1/2 -translate-y-1/2 -rotate-90 text-[11px] text-slate-500"
            style={{ left: 'calc(-1 * var(--kmap-header))' }}
          >
            Rows: <span className="font-mono">{rowVars.join(' ')}</span>
          </div>
          <div className="relative inline-block overflow-hidden rounded-xl border border-slate-300 bg-white/95 shadow-sm">
            {/* Grid including header row/col */}
            <div
              className="grid select-none"
              style={{ gridTemplateColumns: `minmax(var(--kmap-header), auto) repeat(${swapRC ? shape.rows : shape.cols}, var(--kmap-cell))` }}
            >
              {/* Top-left blank header cell */}
              <div style={{ width: 'var(--kmap-header)', height: cellSize }} className="flex items-center justify-center text-[11px] text-slate-400">{/* corner */}</div>
              {/* Column headers (Gray code) */}
              {Array.from({ length: swapRC ? shape.rows : shape.cols }, (_, c) => (
                <div key={`ch-${c}`} style={{ width: cellSize, height: cellSize }} className="flex items-center justify-center border border-slate-200 bg-slate-100 font-mono text-xs font-medium text-slate-700">
                  {colLabels[c]}
                </div>
              ))}

              {/* Rows: header + cells */}
              {Array.from({ length: swapRC ? shape.cols : shape.rows }, (_, r) => (
                <React.Fragment key={`r-${r}`}>
                  {/* Row header */}
                  <div style={{ width: 'var(--kmap-header)', height: cellSize }} className="flex items-center justify-center border border-slate-200 bg-slate-100 font-mono text-xs font-medium text-slate-700">
                    {rowLabels[r]}
                  </div>
                  {Array.from({ length: swapRC ? shape.rows : shape.cols }, (_, c) => {
                    const r0 = swapRC ? c : r
                    const c0 = swapRC ? r : c
                    const v: CellValue = (grid[r0]?.[c0] ?? 0) as CellValue
                    const m = rcToIndex(r0, c0, shape)
                    const color = mToColor[m] ?? null
                    const zebra = (r + c) % 2 === 0 ? 'bg-white text-slate-800' : 'bg-slate-50 text-slate-800'
                    return (
                      <Cell
                        key={`${r}-${c}`}
                        value={v}
                        highlight={color}
                        size={cellSize}
                        zebraClass={zebra}
                        onClick={() => {
                          setCells((prev: Array<0 | 1 | 'X'>) => {
                            const next = [...prev]
                            const cur = next[m]
                            next[m] = (cur === 0 ? 1 : cur === 1 ? 'X' : 0) as 0 | 1 | 'X'
                            return next
                          })
                        }}
                      />
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
              {loopOverlays.map((rect, idx) => {
                const top = `calc(var(--kmap-header) + ${rect.rowStart} * var(--kmap-cell) + ${LOOP_INSET_PX}px)`
                const left = `calc(var(--kmap-header) + ${rect.colStart} * var(--kmap-cell) + ${LOOP_INSET_PX}px)`
                const width = `calc(${rect.colSpan} * var(--kmap-cell) - ${LOOP_INSET_PX * 2}px)`
                const height = `calc(${rect.rowSpan} * var(--kmap-cell) - ${LOOP_INSET_PX * 2}px)`
                return (
                  <div
                    key={`loop-${idx}`}
                    className="absolute"
                    style={{
                      top,
                      left,
                      width,
                      height,
                      border: `${LOOP_STROKE_PX}px solid ${colorWithAlpha(rect.color, 0.65)}`,
                      borderRadius: `${LOOP_RADIUS_PX}px`,
                      boxSizing: 'border-box',
                      backgroundColor: colorWithAlpha(rect.color, 0.01)
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">SOP / POS Results</h3>
          <div className="font-mono text-sm">SOP: {solution.sop}</div>
          <div className="mt-1 font-mono text-sm">POS: {posString}</div>
          {groupsActive.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-slate-500">Groups ({groupMode.toUpperCase()})</div>
              <ul className="space-y-1 text-sm">
                {groupsActive.map((g, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                    <span className="font-mono">{g.label}</span>
                    <span className="text-xs text-slate-500">({g.cells.length} cells)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Steps</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {solution.steps.map((s, idx) => (
              <li key={idx}>
                <span className="font-medium">{s.title}</span>
                {s.detail ? <span className="text-slate-500"> — {s.detail}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Truth table for current K-Map assignment */}
      <div className="mt-4">
        <TruthTable vars={names} minterms={mtFromCells} />
      </div>

      {/* Logic gate diagram from K-Map (original canonical vs minimal SOP) */}
      <div className="mt-4">
        <GateDiagram original={canonicalSOP} minimal={solution.sop} />
      </div>
    </section>
  )
}
