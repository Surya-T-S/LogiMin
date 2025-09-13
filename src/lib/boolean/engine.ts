import { AST, collectVars, evalAST, parse } from './parser'
import { Implicant, MinimizeResult, minimizeSOP } from './qmc'

export interface SolveStep { title: string; detail?: string }
export interface SolveResult {
  vars: string[]
  sop: string
  pos: string
  minimal: string
  steps: SolveStep[]
  intermediate?: {
    minterms: number[]
    maxterms: number[]
    sopImplicants: Implicant[]
    sopSelected: number[]
    posImplicants: Implicant[]
    posSelected: number[]
  }
  canonical: {
    sumOfMinterms: string
    productOfMaxterms: string
  }
}

export function solveExpression(input: string): SolveResult {
  const steps: SolveStep[] = []
  steps.push({ title: 'Parse input' })
  const ast = parse(input)
  const vars = collectVars(ast)
  steps.push({ title: 'Detect variables', detail: vars.join(', ') || '(none)' })

  const { minterms, maxterms } = computeMintermsMaxterms(ast, vars)
  steps.push({ title: 'Truth table', detail: `${minterms.length} minterms, ${maxterms.length} maxterms` })

  // SOP via QMC on 1s
  const sopRes = minimizeSOP(minterms, [], vars.length)
  const sopStr = formatSOP(sopRes, vars)

  // POS via QMC on 0s (i.e., SOP of complement)
  const posRes = minimizeSOP(maxterms, [], vars.length)
  const posStr = formatPOS(posRes, vars)

  steps.push(...sopRes.steps.map(s => ({ title: `SOP: ${s.title}`, detail: s.detail })))
  steps.push(...posRes.steps.map(s => ({ title: `POS: ${s.title}`, detail: s.detail })))

  const minimal = chooseMinimal(sopStr, posStr)
  const canonical = {
    sumOfMinterms: formatSigma(minterms),
    productOfMaxterms: formatPi(maxterms),
  }

  return {
    vars,
    sop: sopStr,
    pos: posStr,
    minimal,
    steps,
    intermediate: {
      minterms,
      maxterms,
      sopImplicants: sopRes.primeImplicants,
      sopSelected: sopRes.selected,
      posImplicants: posRes.primeImplicants,
      posSelected: posRes.selected,
    },
    canonical,
  }
}

export function computeMintermsMaxterms(ast: AST, vars: string[]): { minterms: number[]; maxterms: number[] } {
  const n = vars.length
  const minterms: number[] = []
  const maxterms: number[] = []
  for (let i = 0; i < (1 << n); i++) {
    const env: Record<string, 0 | 1> = {}
    for (let b = 0; b < n; b++) {
      env[vars[b]] = ((i >> (n - 1 - b)) & 1) as 0 | 1
    }
    const val = evalAST(ast, env)
    if (val === 1) minterms.push(i)
    else maxterms.push(i)
  }
  return { minterms, maxterms }
}

function chooseMinimal(s1: string, s2: string): string {
  const c1 = literalCount(s1)
  const c2 = literalCount(s2)
  if (c1 !== c2) return c1 < c2 ? s1 : s2
  return s1.length <= s2.length ? s1 : s2
}

function literalCount(expr: string): number {
  // Approximate: count variables and their negations in tokens
  const m = expr.match(/[A-Za-z]('?)/g)
  return m ? m.length : 0
}

export function formatSOP(res: MinimizeResult, vars: string[]): string {
  if (res.selected.length === 0) return '0'
  const terms = res.selected.map(idx => implicantToProduct(res.primeImplicants[idx], vars))
  if (terms.length === 0) return '0'
  // Constant 1 detection: any implicant with mask covering all bits
  if (terms.some(t => t === '1')) return '1'
  return terms.join(' + ')
}

export function formatPOS(res: MinimizeResult, vars: string[]): string {
  if (res.selected.length === 0) return '1' // No zeros => function is 1
  const clauses = res.selected.map(idx => implicantToSum(res.primeImplicants[idx], vars))
  if (clauses.length === 0) return '1'
  if (clauses.some(c => c === '(0)')) return '0'
  return clauses.join(' ')
}

export function implicantToProduct(imp: Implicant, vars: string[]): string {
  // For SOP, include literals for non-masked bits; 1 -> var, 0 -> var'
  const n = vars.length
  if (imp.mask === ((1 << n) - 1)) return '1'
  const lits: string[] = []
  for (let i = 0; i < n; i++) {
    const bitPos = n - 1 - i
    const maskBit = (imp.mask >> bitPos) & 1
    if (maskBit) continue
    const isOne = ((imp.bits >> bitPos) & 1) === 1
    lits.push(isOne ? vars[i] : `${vars[i]}'`)
  }
  if (lits.length === 0) return '1'
  return lits.join('')
}

export function implicantToSum(imp: Implicant, vars: string[]): string {
  // For POS from zero-implicants: 0 -> var, 1 -> var'
  const n = vars.length
  if (imp.mask === ((1 << n) - 1)) return '(0)'
  const lits: string[] = []
  for (let i = 0; i < n; i++) {
    const bitPos = n - 1 - i
    const maskBit = (imp.mask >> bitPos) & 1
    if (maskBit) continue
    const isOne = ((imp.bits >> bitPos) & 1) === 1
    lits.push(isOne ? `${vars[i]}'` : vars[i])
  }
  return `(${lits.join(' + ')})`
}

export function formatSigma(minterms: number[]): string {
  if (minterms.length === 0) return 'Σm() = 0'
  return `Σm(${minterms.join(',')})`
}

export function formatPi(maxterms: number[]): string {
  if (maxterms.length === 0) return 'ΠM() = 1'
  return `ΠM(${maxterms.join(',')})`
}
