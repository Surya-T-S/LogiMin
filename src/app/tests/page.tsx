"use client"

import { useEffect, useState } from 'react'
import { collectVars, evalAST, parse } from '@/lib/boolean/parser'
import { solveExpression } from '@/lib/boolean/engine'
import { solveKMap } from '@/lib/boolean/kmap'

function literalCount(expr: string): number {
  const m = expr.match(/[A-Za-z]('?)/g)
  return m ? m.length : 0
}

function envsFor(vars: string[]): Array<Record<string, 0 | 1>> {
  const n = vars.length
  const out: Array<Record<string, 0 | 1>> = []
  for (let i = 0; i < (1 << n); i++) {
    const env: Record<string, 0 | 1> = {}
    for (let b = 0; b < n; b++) env[vars[b]!] = ((i >> (n - 1 - b)) & 1) as 0 | 1
    out.push(env)
  }
  return out
}

function equivalent(exprA: string, exprB: string): boolean {
  const astA = parse(exprA)
  const astB = parse(exprB)
  const vars = Array.from(new Set([...collectVars(astA), ...collectVars(astB)])).sort()
  for (const env of envsFor(vars)) {
    const a = evalAST(astA, env)
    const b = evalAST(astB, env)
    if (a !== b) return false
  }
  return true
}

export default function TestsPage() {
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    const lines: string[] = []

    function log(msg: string) { lines.push(msg) }

    // Expression tests
    const exprs = [
      "(X+Y)(X+Z)",
      "A'B + AB' + AB",
      "A'B' + AB + A'B",
      "~A + A~B",
      "(A + B')(A' + C) + AC'",
    ]

    for (const e of exprs) {
      const res = solveExpression(e)
      const okSOP = equivalent(e, res.sop)
      const okPOS = equivalent(e, res.pos)
      const okMin = equivalent(e, res.minimal)
      log(`Expr ${e} -> SOP OK=${okSOP} POS OK=${okPOS} MIN OK=${okMin} [lit: sop=${literalCount(res.sop)}, pos=${literalCount(res.pos)}]`)
    }

    // K-map tests
    // 2 vars: A+B => minterms 1,2,3
    {
      const n = 2
      const size = 1 << n
      const vals = Array.from({ length: size }, (_, i) => (i === 0 ? 0 : 1)) as (0|1|'X')[]
      const km = solveKMap(vals, n, ['A','B'])
      const ok = equivalent('A + B', km.sop)
      log(`KMap A+B (n=2) => ${km.sop} OK=${ok}`)
    }
    // 2 vars: A·B => minterms 3
    {
      const n = 2
      const size = 1 << n
      const vals = Array.from({ length: size }, (_, i) => (i === 3 ? 1 : 0)) as (0|1|'X')[]
      const km = solveKMap(vals, n, ['A','B'])
      const ok = equivalent("AB", km.sop)
      log(`KMap AB (n=2) => ${km.sop} OK=${ok}`)
    }
    // Don’t cares: mt 1,3 with X 0,2 => should reduce to B
    {
      const n = 2
      const size = 1 << n
      const vals = [ 'X', 1, 'X', 1 ] as (0|1|'X')[]
      const km = solveKMap(vals, n, ['A','B'])
      const ok = equivalent("B", km.sop)
      log(`KMap mt=1,3 dc=0,2 (n=2) => ${km.sop} OK=${ok}`)
    }

    setResults(lines)
  }, [])

  return (
    <main className="container-px mx-auto max-w-4xl py-8">
      <h1 className="mb-4 text-lg font-semibold">Logic Engine & K-Map Tests</h1>
      <div className="card p-4">
        <ul className="space-y-1 font-mono text-sm">
          {results.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>
    </main>
  )
}
