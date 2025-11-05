// Quine–McCluskey minimization with don't cares and Petrick's method
// Works for SOP on 1-minterms and POS on 0-maxterms (by reusing minimizer on zeros)

export interface Implicant {
  bits: number // assigned 0/1 bits
  mask: number // 1 where bit is don't-care within implicant
}

export interface MinimizeStep {
  title: string
  detail?: string
}

export interface MinimizeResult {
  primeImplicants: Implicant[]
  essential: number[] // indices into primeImplicants
  selected: number[]   // indices into primeImplicants (includes essential + petrick selection)
  steps: MinimizeStep[]
}

function getLayoutBits(numVars: number): { rowBits: number; colBits: number } {
  const presets: Record<number, { rowBits: number; colBits: number }> = {
    2: { rowBits: 1, colBits: 1 },
    3: { rowBits: 1, colBits: 2 },
    4: { rowBits: 2, colBits: 2 },
    5: { rowBits: 2, colBits: 3 },
    6: { rowBits: 3, colBits: 3 },
  }
  if (presets[numVars]) return presets[numVars]
  const rowBits = Math.floor(numVars / 2)
  const colBits = numVars - rowBits
  return { rowBits, colBits }
}

const popcount32 = (x: number) => {
  x = x - ((x >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24
}

const differsByOneBit = (a: Implicant, b: Implicant): number | null => {
  if (a.mask !== b.mask) return null
  const diff = a.bits ^ b.bits
  if (diff === 0) return null
  if ((diff & (diff - 1)) === 0) return diff // power of two
  return null
}

const combine = (a: Implicant, b: Implicant): Implicant | null => {
  const diff = differsByOneBit(a, b)
  if (diff == null) return null
  return { bits: a.bits & ~diff, mask: a.mask | diff }
}

const covers = (imp: Implicant, m: number) => ((m & ~imp.mask) === (imp.bits & ~imp.mask))

export function minimizeSOP(minterms: number[], dontCares: number[], numVars: number): MinimizeResult {
  const steps: MinimizeStep[] = []
  const all = Array.from(new Set([...minterms, ...dontCares])).sort((a,b)=>a-b)
  steps.push({ title: 'Initialize implicants', detail: `${all.length} terms (${minterms.length} minterms + ${dontCares.length} don\'t cares)` })

  // Initial implicants
  let current: { imp: Implicant, used: boolean }[] = all.map(v => ({ imp: { bits: v, mask: 0 }, used: false }))
  const primes: Implicant[] = []

  while (true) {
    // Group by number of ones in bits (ignoring mask)
    const groups: Map<number, { imp: Implicant, used: boolean }[]> = new Map()
    for (const c of current) {
      const ones = popcount32(c.imp.bits & ~c.imp.mask)
      if (!groups.has(ones)) groups.set(ones, [])
      groups.get(ones)!.push({ ...c, used: false })
    }

    let combinedAny = false
    const nextMap = new Map<string, { imp: Implicant, used: boolean }>()

    const keys = Array.from(groups.keys()).sort((a,b)=>a-b)
    for (let i = 0; i < keys.length - 1; i++) {
      const g1 = groups.get(keys[i])!
      const g2 = groups.get(keys[i+1])!
      for (const a of g1) {
        for (const b of g2) {
          const merged = combine(a.imp, b.imp)
          if (merged) {
            combinedAny = true
            a.used = true; b.used = true
            const key = `${merged.bits}|${merged.mask}`
            if (!nextMap.has(key)) nextMap.set(key, { imp: merged, used: false })
          }
        }
      }
    }

    // Anything not used becomes prime implicant
    for (const g of groups.values()) {
      for (const x of g) {
        if (!x.used) {
          const key = `${x.imp.bits}|${x.imp.mask}`
          // avoid duplicates
          if (!primes.some(p => p.bits === x.imp.bits && p.mask === x.imp.mask)) {
            primes.push(x.imp)
          }
        }
      }
    }

    if (!combinedAny) break
    current = Array.from(nextMap.values())
  }

  steps.push({ title: 'Prime implicants', detail: `${primes.length} found` })

  // Cover chart
  const mt = minterms.slice().sort((a,b)=>a-b)
  const cover: number[][] = mt.map(() => [])
  for (let pi = 0; pi < primes.length; pi++) {
    for (let i = 0; i < mt.length; i++) {
      if (covers(primes[pi], mt[i])) cover[i].push(pi)
    }
  }

  // Essential prime implicants
  const essential: Set<number> = new Set()
  const covered: Set<number> = new Set()
  for (let i = 0; i < mt.length; i++) {
    const arr = cover[i]
    if (arr.length === 1) {
      essential.add(arr[0])
    }
  }

  if (essential.size > 0) steps.push({ title: 'Essential implicants', detail: `${essential.size} essential selected` })

  // Mark minterms covered by essential implicants
  for (let i = 0; i < mt.length; i++) {
    if (cover[i].some(pi => essential.has(pi))) covered.add(i)
  }

  // Remaining uncovereds -> Petrick
  const remaining = mt.map((_, i) => i).filter(i => !covered.has(i))
  let selected: Set<number> = new Set(essential)

  if (remaining.length > 0) {
    const solutions = petrick(remaining.map(i => cover[i]))
    // Evaluate cost
    const { rowBits, colBits } = getLayoutBits(numVars)
    const rowMask = ((1 << rowBits) - 1) << colBits
    const colMask = (1 << colBits) - 1
    let best: { set: Set<number>, impCount: number, litCount: number, area: number, spanScore: number } | null = null
    for (const s of solutions) {
      const impCount = s.size
      let litCount = 0
      let area = 0
      let spanScore = 0
      for (const idx of s) {
        const m = primes[idx].mask
        const lit = numVars - popcount32(m)
        litCount += lit
        area += 1 << popcount32(m)
        const rowSpan = 1 << popcount32(m & rowMask)
        const colSpan = 1 << popcount32(m & colMask)
        spanScore += rowSpan + colSpan
      }
      const prefer = () => {
        if (!best) return true
        if (impCount < best.impCount) return true
        if (impCount > best.impCount) return false
        if (litCount < best.litCount) return true
        if (litCount > best.litCount) return false
        if (area > best.area) return true
        if (area < best.area) return false
        if (spanScore > best.spanScore) return true
        if (spanScore < best.spanScore) return false
        return false
      }
      if (prefer()) {
        best = { set: s, impCount, litCount, area, spanScore }
      }
    }
    if (best) {
      for (const v of best.set) selected.add(v)
      steps.push({ title: 'Petrick\'s method', detail: `selected ${best.impCount} implicants with ${best.litCount} literals` })
    }
  }

  return { primeImplicants: primes, essential: Array.from(essential), selected: Array.from(selected), steps }
}

// Petrick's method: each row is list of covering PI indices for one minterm
function petrick(clauses: number[][]): Set<number>[] {
  if (clauses.length === 0) return [new Set()]
  // Start with first clause as sets
  let products: Set<number>[] = clauses[0].map(i => new Set([i]))
  const LIMIT = 512

  for (let c = 1; c < clauses.length; c++) {
    const next: Set<number>[] = []
    for (const p of products) {
      for (const i of clauses[c]) {
        const s = new Set<number>(p)
        s.add(i)
        next.push(s)
      }
    }

    // Reduce: remove supersets and prune
    products = reduceProducts(next)

    // Soft cap
    if (products.length > LIMIT) {
      products.sort((a,b) => a.size - b.size)
      products = products.slice(0, LIMIT)
    }
  }

  return reduceProducts(products)
}

function reduceProducts(arr: Set<number>[]): Set<number>[] {
  // Remove duplicates and supersets
  const unique: Set<string> = new Set()
  const lists = arr.map(s => Array.from(s).sort((a,b)=>a-b))
  const filtered: number[][] = []
  for (const l of lists) {
    const key = l.join(',')
    if (!unique.has(key)) { unique.add(key); filtered.push(l) }
  }
  // Remove supersets
  filtered.sort((a,b) => a.length - b.length)
  const kept: number[][] = []
  for (let i = 0; i < filtered.length; i++) {
    let isSuperset = false
    for (let j = 0; j < kept.length; j++) {
      if (isSupersetOf(filtered[i], kept[j])) { isSuperset = true; break }
    }
    if (!isSuperset) kept.push(filtered[i])
  }
  return kept.map(l => new Set(l))
}

function isSupersetOf(a: number[], b: number[]): boolean {
  // is a superset of b? (a contains all of b)
  let i = 0, j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (a[i] < b[j]) { i++; continue }
    return false
  }
  return j === b.length
}
