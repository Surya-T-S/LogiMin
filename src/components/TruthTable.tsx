"use client"

import React, { useMemo } from 'react'
import type { SolveResult } from '@/lib/boolean/engine'

type Props = {
  result?: SolveResult | null
  vars?: string[]
  minterms?: number[]
}

function toBits(i: number, n: number): number[] {
  const arr = new Array(n).fill(0)
  for (let b = 0; b < n; b++) {
    arr[b] = (i >> (n - 1 - b)) & 1
  }
  return arr
}

export default function TruthTable({ result, vars, minterms }: Props) {
  const [rows, headerVars] = useMemo(() => {
    if (result) {
      const n = result.vars.length
      const mts = new Set(result.intermediate?.minterms ?? [])
      const r: { bits: number[]; f: 0 | 1 }[] = []
      for (let i = 0; i < (1 << n); i++) {
        r.push({ bits: toBits(i, n), f: (mts.has(i) ? 1 : 0) as 0 | 1 })
      }
      return [r, result.vars] as const
    }
    if (vars && minterms) {
      const n = vars.length
      const mts = new Set(minterms)
      const r: { bits: number[]; f: 0 | 1 }[] = []
      for (let i = 0; i < (1 << n); i++) {
        r.push({ bits: toBits(i, n), f: (mts.has(i) ? 1 : 0) as 0 | 1 })
      }
      return [r, vars] as const
    }
    return [null, null] as const
  }, [result, vars, minterms])

  if (!rows || !headerVars) return null

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Truth Table</h3>
        <div className="text-xs text-slate-500">Variables order: <span className="font-mono">{headerVars.join(', ')}</span></div>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full border-t border-slate-200 text-sm">
          <thead className="tt-head sticky top-0">
            <tr>
              {headerVars.map((v) => (
                <th key={v} className="border-b border-slate-200 px-2 py-1 text-left font-medium">{v}</th>
              ))}
              <th className="border-b border-slate-200 px-2 py-1 text-left font-semibold">F</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 ? 'tt-row-alt' : ''}>
                {row.bits.map((b, j) => (
                  <td key={j} className="px-2 py-1">{b}</td>
                ))}
                <td className="px-2 py-1 font-semibold">{row.f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
