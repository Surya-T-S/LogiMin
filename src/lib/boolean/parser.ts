// Boolean expression parser and evaluator
// Supports: + for OR, . or · or implicit adjacency for AND, ' (postfix) or ~ (prefix) for NOT, parentheses
// Variables are single characters (e.g., A, B, C). Adjacency implies AND: AB == A.B
// Example: A'B + AB' + AB, (X+Y)(X+Z), ~A(B + C')

export type AST = OrNode

export type Node = VarNode | NotNode | AndNode | OrNode

export interface VarNode {
  type: 'var'
  name: string
}
export interface NotNode {
  type: 'not'
  child: Node
}
export interface AndNode {
  type: 'and'
  children: Node[]
}
export interface OrNode {
  type: 'or'
  children: Node[]
}

// Tokenizer
export type Token =
  | { type: 'ident'; value: string }
  | { type: 'plus' }
  | { type: 'dot' }
  | { type: 'not_prefix' }
  | { type: 'not_postfix' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'eof' }

export function tokenize(inputRaw: string): Token[] {
  const input = inputRaw
    .replace(/\u2019|\u2032|\u02BC/g, "'") // curly quotes or primes to '
    .replace(/\u00B7/g, '.') // middle dot to '.'

  const tokens: Token[] = []
  let i = 0
  const isIdentStart = (c: string) => /[A-Za-z]/.test(c)

  while (i < input.length) {
    const c = input[i]
    if (c === ' ' || c === '\n' || c === '\t' || c === '\r') { i++; continue }
    if (c === '+') { tokens.push({ type: 'plus' }); i++; continue }
    if (c === '.') { tokens.push({ type: 'dot' }); i++; continue }
    // XOR removed
    if (c === '~') { tokens.push({ type: 'not_prefix' }); i++; continue }
    if (c === "'") { tokens.push({ type: 'not_postfix' }); i++; continue }
    if (c === '(') { tokens.push({ type: 'lparen' }); i++; continue }
    if (c === ')') { tokens.push({ type: 'rparen' }); i++; continue }

    if (isIdentStart(c)) {
      // Enforce single-character variables
      tokens.push({ type: 'ident', value: c })
      i = i + 1
      continue
    }

    throw new Error(`Unexpected character: '${c}' at position ${i}`)
  }
  tokens.push({ type: 'eof' })
  return tokens
}

// Parser (precedence: NOT > AND > OR). Implicit AND allowed.
export function parse(input: string): AST {
  const tokens = tokenize(input)
  let pos = 0

  const peek = () => tokens[pos]
  const consume = () => tokens[pos++]
  const expect = (t: Token['type']) => {
    const tok = consume()
    if (tok.type !== t) throw new Error(`Expected token ${t} but got ${tok.type}`)
    return tok
  }

  function parsePrimary(): Node {
    const tok = peek()
    if (tok.type === 'ident') {
      consume()
      let node: Node = { type: 'var', name: tok.value }
      while (peek().type === 'not_postfix') { consume(); node = { type: 'not', child: node } }
      return node
    }
    if (tok.type === 'lparen') {
      consume()
      let node: Node = parseOr()
      expect('rparen')
      while (peek().type === 'not_postfix') { consume(); node = { type: 'not', child: node } }
      return node
    }
    throw new Error(`Unexpected token ${tok.type} in primary`)
  }

  function parseNot(): Node {
    let notCount = 0
    while (peek().type === 'not_prefix') { consume(); notCount++ }
    let node = parsePrimary()
    if (notCount % 2 === 1) node = { type: 'not', child: node }
    return node
  }

  function parseAnd(): Node {
    const factors: Node[] = []
    let first = parseNot()
    factors.push(first)

    while (true) {
      const t = peek().type
      // Explicit AND via dot OR implicit adjacency:
      if (t === 'dot') {
        consume()
        factors.push(parseNot())
        continue
      }
      // Implicit AND if next token starts a factor: ident, lparen, not_prefix
      if (t === 'ident' || t === 'lparen' || t === 'not_prefix') {
        factors.push(parseNot())
        continue
      }
      break
    }
    if (factors.length === 1) return factors[0]
    return { type: 'and', children: factors }
  }

  function parseOr(): OrNode {
    const terms: Node[] = []
    terms.push(parseAnd())
    while (peek().type === 'plus') {
      consume()
      terms.push(parseAnd())
    }
    // Normalize to OrNode shape
    const flat: Node[] = []
    for (const t of terms) {
      if (t.type === 'or') flat.push(...t.children)
      else flat.push(t)
    }
    return { type: 'or', children: flat }
  }

  const root = parseOr()
  if (peek().type !== 'eof') throw new Error('Unexpected input after end of expression')
  return root
}

// Collect variables in AST (unique, sorted alphabetically by default)
export function collectVars(ast: Node): string[] {
  const set = new Set<string>()
  const visit = (n: Node) => {
    switch (n.type) {
      case 'var': set.add(n.name); break
      case 'not': visit(n.child); break
      case 'and': n.children.forEach(visit); break
      case 'or': n.children.forEach(visit); break
    }
  }
  visit(ast)
  return Array.from(set).sort()
}

export function evalAST(ast: Node, env: Record<string, 0 | 1 | boolean>): 0 | 1 {
  const to01 = (b: any) => (b ? 1 : 0)
  function ev(n: Node): 0 | 1 {
    switch (n.type) {
      case 'var': return to01(env[n.name]) as 0 | 1
      case 'not': return (ev(n.child) ? 0 : 1)
      case 'and': {
        for (const c of n.children) if (!ev(c)) return 0
        return 1
      }
      case 'or': {
        for (const c of n.children) if (ev(c)) return 1
        return 0
      }
    }
  }
  return ev(ast)
}
