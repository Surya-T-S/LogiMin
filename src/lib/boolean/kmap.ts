import { formatSOP, implicantToProduct, solveExpression } from './engine'
import { MinimizeResult, minimizeSOP } from './qmc'

export type CellValue = 0 | 1 | 'X'

export interface KMapShape {
  n: number
  rows: number
  cols: number
  rowBits: number
  colBits: number
  rowOrder: number[] // gray sequence by position -> binary value
  colOrder: number[] // gray sequence by position -> binary value
  rowInv: number[]   // binary value -> position
  colInv: number[]   // binary value -> position
}

export function getKMapShape(n: number): KMapShape {
  if (n < 2 || n > 6) throw new Error('K-Map supports 2 to 6 variables')
  const presets: Record<number, { rowBits: number; colBits: number }> = {
    2: { rowBits: 1, colBits: 1 },
    3: { rowBits: 1, colBits: 2 },
    4: { rowBits: 2, colBits: 2 },
    5: { rowBits: 2, colBits: 3 },
    6: { rowBits: 3, colBits: 3 },
  }
  const { rowBits, colBits } = presets[n]
  const rows = 1 << rowBits
  const cols = 1 << colBits
  const rowOrder = Array.from({ length: rows }, (_, i) => i ^ (i >> 1))
  const colOrder = Array.from({ length: cols }, (_, i) => i ^ (i >> 1))
  const rowInv = invertOrder(rowOrder)
  const colInv = invertOrder(colOrder)
  return { n, rows, cols, rowBits, colBits, rowOrder, colOrder, rowInv, colInv }
}

function invertOrder(order: number[]): number[] {
  const inv = Array(order.length).fill(0)
  for (let i = 0; i < order.length; i++) inv[order[i]] = i
  return inv
}

export function indexToRC(index: number, shape: KMapShape): { r: number; c: number } {
  const { colBits, rowInv } = shape
  const rowNum = index >> colBits
  const colNum = index & ((1 << colBits) - 1)
  return { r: rowInv[rowNum], c: shape.colInv[colNum] }
}

export function rcToIndex(r: number, c: number, shape: KMapShape): number {
  const { rowOrder, colOrder, colBits } = shape
  const rowNum = rowOrder[r]
  const colNum = colOrder[c]
  return (rowNum << colBits) | colNum
}

export function buildGrid(values: CellValue[], n: number): CellValue[][] {
  const shape = getKMapShape(n)
  const grid: CellValue[][] = Array.from({ length: shape.rows }, () => Array(shape.cols).fill(0))
  for (let m = 0; m < (1 << n); m++) {
    const { r, c } = indexToRC(m, shape)
    grid[r][c] = values[m] as CellValue
  }
  return grid
}

export interface Group {
  implicantIndex: number
  cells: Array<{ r: number; c: number; m: number }>
  product: string
}

export interface KMapSolveResult {
  sop: string
  groups: Group[]
  steps: { title: string; detail?: string }[]
}

export function solveKMap(values: CellValue[], n: number, varNames?: string[]): KMapSolveResult {
  const shape = getKMapShape(n)
  const minterms: number[] = []
  const dontCares: number[] = []
  for (let m = 0; m < (1 << n); m++) {
    const v = values[m]
    if (v === 1) minterms.push(m)
    else if (v === 'X') dontCares.push(m)
  }
  const res: MinimizeResult = minimizeSOP(minterms, dontCares, n)
  const vars = varNames ?? defaultVarNames(n)
  const groups: Group[] = []
  for (const idx of res.selected) {
    const imp = res.primeImplicants[idx]
    const cells: Array<{ r: number; c: number; m: number }> = []
    // Enumerate all minterms covered by implicant
    const mask = imp.mask
    const nComb = 1 << popcount(mask)
    const freePositions = bitPositions(mask, n)
    for (let k = 0; k < nComb; k++) {
      let m = imp.bits
      for (let j = 0; j < freePositions.length; j++) {
        const bitPos = freePositions[j]
        const bit = (k >> j) & 1
        if (bit) m |= (1 << bitPos)
        else m &= ~(1 << bitPos)
      }
      const { r, c } = indexToRC(m, shape)
      cells.push({ r, c, m })
    }
    groups.push({ implicantIndex: idx, cells, product: implicantToProduct(imp, vars) })
  }
  const sop = formatSOP(res, vars)
  return { sop, groups, steps: res.steps }
}

export function defaultVarNames(n: number): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const arr: string[] = []
  for (let i = 0; i < n; i++) arr.push(letters[i]!)
  return arr
}

function popcount(x: number): number {
  let c = 0
  while (x) { x &= x - 1; c++ }
  return c
}

function bitPositions(mask: number, n: number): number[] {
  const pos: number[] = []
  for (let i = 0; i < n; i++) {
    const bitPos = n - 1 - i
    if ((mask >> bitPos) & 1) pos.push(bitPos)
  }
  return pos
}
