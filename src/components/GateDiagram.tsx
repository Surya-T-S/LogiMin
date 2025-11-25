"use client"

import React, { useMemo, useState } from 'react'
import { parse, type Node, type AndNode, type OrNode } from '@/lib/boolean/parser'

// Simple SVG circuit renderer for expressions with gates: AND, OR, NOT
// It recursively lays out the AST left-to-right and draws gates and wires.

type Props = {
  original: string
  minimal?: string
}

// Buffer symbol intentionally removed per request; NOT is explicitly drawn when needed

// NOTE: NOT is always rendered as a triangle with output bubble; no input-bubble shortcut.

type Layout = {
  width: number
  height: number
  outputX: number
  outputY: number
  elems: React.ReactNode[]
  ports: { name: string; x: number; y: number }[]
}

const CFG = {
  hGap: 40,
  vGap: 22,
  inputLabelGap: 10,
  inputWire: 28,
  nodeH: 28,
}

function textWidthEstimate(label: string): number { return Math.max(12, 8 * label.length) }

// All layout functions operate in LOCAL coordinates starting at (0,0)
function renderVar(name: string): Layout {
  // Leaf port: expects a wire from left rail; draws a small input stub
  const h = CFG.nodeH
  const cy = h / 2
  const stub = 14
  const outX = stub
  const outY = cy
  const elems = [
    <g key={`var-${name}`}>
      {/* label to the left of the stub (separate input labeling) */}
      <text x={-8} y={cy + 4} fontSize={12} className="font-mono" textAnchor="end" fill="currentColor">{name}</text>
      <line x1={0} y1={cy} x2={outX} y2={cy} stroke="currentColor" strokeWidth={2} />
    </g>
  ]
  const ports = [{ name, x: 0, y: cy }]
  return { width: outX, height: h, outputX: outX, outputY: outY, elems, ports }
}

function renderNot(child: Layout): Layout {
  const h = Math.max(CFG.nodeH, child.height)
  const wGate = 32
  const w = child.width + CFG.hGap + wGate
  const cy = h / 2
  const triX = child.width + CFG.hGap
  const triY = cy
  const bubbleR = 3.5
  const outX = triX + wGate
  const outY = triY
  const elems: React.ReactNode[] = [
    // child at (0, center)
    <g key="child" transform={`translate(0,${(h - child.height) / 2})`}>{child.elems}</g>,
    // wire from child to triangle
    <line key="wire" x1={child.outputX} y1={outY} x2={triX - 4} y2={triY} stroke="currentColor" strokeWidth={2} />,
    // triangle
    <path key="tri" d={`M ${triX - 4},${triY - 10} L ${triX - 4},${triY + 10} L ${triX + 12},${triY} Z`} fill="none" stroke="currentColor" strokeWidth={2} />,
    // bubble + short line to output
    <circle key="bub" cx={triX + 14} cy={triY} r={bubbleR} fill="var(--circuit-bg)" stroke="currentColor" strokeWidth={2} />,
    <line key="out" x1={triX + 14 + bubbleR} y1={triY} x2={outX} y2={triY} stroke="currentColor" strokeWidth={2} />
  ]
  // translate ports from child
  const dy = (h - child.height) / 2
  const ports = child.ports.map(p => ({ name: p.name, x: p.x, y: p.y + dy }))
  return { width: w, height: h, outputX: outX, outputY: outY, elems, ports }
}

function gateOutlinePath(kind: 'and' | 'or', x: number, y: number, w: number, h: number): string {
  // Simple approximations
  if (kind === 'and') {
    // Flat left, semicircle right
    const flat = w * 0.52
    const r = h / 2
    return `M ${x},${y} L ${x + flat},${y} A ${r},${r} 0 0 1 ${x + flat},${y + h} L ${x},${y + h} Z`
  }
  // OR: ANSI-like using cubic Beziers for precise teardrop and concave left boundary (inward curve on the left)
  const left = x
  const right = x + w
  const top = y
  const bot = y + h
  const mid = y + h / 2
  // Start along the inner left boundary
  const sx = left + w * 0.20
  return [
    // Outer upper arc to nose
    `M ${sx},${top}`,
    `C ${left + w * 0.60},${top} ${left + w * 0.98},${mid - h * 0.18} ${right},${mid}`,
    // Outer lower arc back to left
    `C ${left + w * 0.98},${mid + h * 0.18} ${left + w * 0.60},${bot} ${sx},${bot}`,
    // Concave left boundary back to start (controls placed to the right of sx for inward concavity)
    `C ${left + w * 0.32},${bot} ${left + w * 0.32},${top} ${sx},${top} Z`
  ].join(' ')
}

function renderBinary(kind: 'and' | 'or', left: Layout, right: Layout): Layout {
  const childStackH = left.height + CFG.vGap + right.height
  const maxW = Math.max(left.width, right.width)
  const gateW = 46
  const gateH = Math.max(40, CFG.nodeH) // fixed nice height
  const totalH = Math.max(childStackH, gateH)
  const gateX = maxW + CFG.hGap
  const gateY = (totalH - gateH) / 2
  const outX = gateX + gateW + 16
  const outY = gateY + gateH / 2

  const elems: React.ReactNode[] = []
  // place left on top, right below
  const leftX = maxW - left.width
  const rightX = maxW - right.width
  // center children stack vertically inside totalH
  const stackTop = (totalH - childStackH) / 2
  const leftY = Math.max(0, stackTop)
  const rightY = leftY + left.height + CFG.vGap
  elems.push(<g key={`l`} transform={`translate(${leftX},${leftY})`}>{left.elems}</g>)
  elems.push(<g key={`r`} transform={`translate(${rightX},${rightY})`}>{right.elems}</g>)

  // Neat input positions on gate body
  const yTop = gateY + gateH * 0.33
  const yBot = gateY + gateH * 0.67
  // Stagger join points to avoid vertical overlap
  const joinXT = gateX - 14
  const joinXB = gateX - 10
  // For OR, inputs should meet the concave left boundary
  const leftBoundaryX = gateX + gateW * 0.20
  // Top wire with elbow
  const lx = leftX + left.outputX
  const ly = leftY + left.outputY
  elems.push(<line key="t-h1" x1={lx} y1={ly} x2={joinXT} y2={ly} stroke="currentColor" strokeWidth={2} />)
  elems.push(<line key="t-v" x1={joinXT} y1={ly} x2={joinXT} y2={yTop} stroke="currentColor" strokeWidth={2} />)
  elems.push(<line key="t-h2" x1={joinXT} y1={yTop} x2={(kind === 'or') ? leftBoundaryX : gateX} y2={yTop} stroke="currentColor" strokeWidth={2} />)
  // Bottom wire with elbow
  const rx = rightX + right.outputX
  const ry = rightY + right.outputY
  elems.push(<line key="b-h1" x1={rx} y1={ry} x2={joinXB} y2={ry} stroke="currentColor" strokeWidth={2} />)
  elems.push(<line key="b-v" x1={joinXB} y1={ry} x2={joinXB} y2={yBot} stroke="currentColor" strokeWidth={2} />)
  elems.push(<line key="b-h2" x1={joinXB} y1={yBot} x2={(kind === 'or') ? leftBoundaryX : gateX} y2={yBot} stroke="currentColor" strokeWidth={2} />)

  // gate body
  const path = gateOutlinePath(kind, gateX, gateY, gateW, gateH)
  elems.push(<path key={`gate-${kind}`} d={path} fill="none" stroke="currentColor" strokeWidth={2} />)

  // output
  elems.push(<line key={`out`} x1={gateX + gateW} y1={outY} x2={outX} y2={outY} stroke="currentColor" strokeWidth={2} />)

  // aggregate ports
  const ports: { name: string; x: number; y: number }[] = []
  ports.push(...left.ports.map(p => ({ name: p.name, x: p.x + leftX, y: p.y + leftY })))
  ports.push(...right.ports.map(p => ({ name: p.name, x: p.x + rightX, y: p.y + rightY })))

  return { width: outX, height: totalH, outputX: outX, outputY: outY, elems, ports }
}

function layout(node: Node): Layout {
  switch (node.type) {
    case 'var': {
      return renderVar(node.name)
    }
    case 'not': {
      // Always render NOT explicitly as a triangle stage after its child
      const c = layout(node.child)
      return renderNot(c)
    }
    case 'and': {
      return layoutAndOr('and', (node as AndNode).children)
    }
    case 'or': {
      return layoutAndOr('or', (node as OrNode).children)
    }
    // no XOR rendering
  }
}

// --- Normalization and layout (strict 2-input gates, no duplication for single input) ---
function flattenChildren(kind: 'and' | 'or', kids: Node[]): Node[] {
  const out: Node[] = []
  for (const k of kids) {
    if (k.type === kind) out.push(...flattenChildren(kind, (k as AndNode | OrNode).children))
    else out.push(k)
  }
  return out
}

function layoutAndOr(kind: 'and' | 'or', kids: Node[]): Layout {
  const list = flattenChildren(kind, kids)
  if (list.length === 0) {
    // Should not happen for valid parse; render a tiny stub
    return renderVar('')
  }
  if (list.length === 1) {
    // No gate needed; just layout the single child
    return layout(list[0])
  }
  if (list.length === 2) {
    const left = layout(list[0])
    const right = layout(list[1])
    return renderBinary(kind, left, right)
  }
  // More than 2: split and compose recursively into a balanced tree
  const mid = Math.floor(list.length / 2)
  const leftL = layoutAndOr(kind, list.slice(0, mid))
  const rightL = layoutAndOr(kind, list.slice(mid))
  return renderBinary(kind, leftL, rightL)
}

export default function GateDiagram({ original, minimal }: Props) {
  const [mode, setMode] = useState<'original' | 'minimal'>('original')

  const ast = useMemo(() => {
    try {
      return parse(mode === 'minimal' && minimal ? minimal : original)
    } catch {
      return null
    }
  }, [original, minimal, mode])

  const layoutRes = useMemo(() => {
    if (!ast) return null
    const l = layout(ast)
    // Separate inputs mode: no shared rails; labels are rendered at leaves
    const padLeft = 36
    const padTop = 12
    const ledX = padLeft + l.outputX + 22
    const ledY = padTop + l.outputY
    const elems: React.ReactNode[] = []
    // root circuit
    elems.push(<g key="root" transform={`translate(${padLeft},${padTop})`} className="circuit">{l.elems}</g>)
    // LED: circle and short lead
    elems.push(
      <g key="led-wrap" className="circuit">
        <line x1={padLeft + l.outputX} y1={ledY} x2={ledX - 12} y2={ledY} stroke="currentColor" strokeWidth={2} />
        <circle cx={ledX} cy={ledY} r={6.5} fill="none" stroke="currentColor" strokeWidth={2} />
      </g>
    )
    const width = ledX + 24
    const height = padTop * 2 + Math.max(l.height, 32)
    return { width, height, elems }
  }, [ast])

  return (
    <div className="section-panel">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="mb-0 text-sm font-semibold uppercase tracking-wide text-slate-600">Logic Gate</h3>
        <div className="flex items-center gap-2">
          {minimal ? (
            <button
              onClick={() => setMode(mode === 'original' ? 'minimal' : 'original')}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-sky-500"
            >
              {mode === 'original' ? 'View Minimalized' : 'View Original'}
            </button>
          ) : null}
        </div>
      </div>
      <div className="overflow-auto px-4 pb-4">
        {layoutRes ? (
          <svg width={Math.min(layoutRes.width, 900)} viewBox={`0 0 ${layoutRes.width} ${layoutRes.height}`} className="max-w-full circuit">
            <g>{layoutRes.elems}</g>
          </svg>
        ) : (
          <div className="px-2 pb-3 text-sm text-slate-500">Enter a valid expression to view the circuit.</div>
        )}
      </div>
    </div>
  )
}
