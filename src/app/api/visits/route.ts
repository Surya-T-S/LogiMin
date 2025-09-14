import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Proxy to Abacus (https://abacus.jasoncameron.dev) for a resilient, free counter.
// It increments when called with ?inc=1, otherwise returns the current value.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const inc = searchParams.get('inc') === '1'

  // Counter identity
  const NS = process.env.VISITOR_NAMESPACE || process.env.ABACUS_NAMESPACE || process.env.COUNTAPI_NAMESPACE || 'logimin'
  const KEY = process.env.VISITOR_KEY || process.env.ABACUS_KEY || process.env.COUNTAPI_KEY || 'site-visits'

  // 1) Preferred: Upstash Redis REST (reliable, free tier)
  const UP_URL = process.env.UPSTASH_REDIS_REST_URL
  const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
  const UP_KEY = `${NS}:${KEY}`

  // 2) Fallback: Abacus
  const BASE = process.env.ABACUS_BASE || 'https://abacus.jasoncameron.dev'

  const hitUrl = `${BASE}/hit/${encodeURIComponent(NS)}/${encodeURIComponent(KEY)}`
  const getUrl = `${BASE}/get/${encodeURIComponent(NS)}/${encodeURIComponent(KEY)}`
  const createUrl = `${BASE}/create/${encodeURIComponent(NS)}/${encodeURIComponent(KEY)}?initializer=0`

  async function getValue() {
    const r = await fetch(getUrl, { cache: 'no-store' })
    if (r.ok) return r
    // If key doesn't exist, create with 0, then fetch again
    await fetch(createUrl, { cache: 'no-store' }).catch(() => {})
    return fetch(getUrl, { cache: 'no-store' })
  }

  // Try Upstash first if configured
  if (UP_URL && UP_TOKEN) {
    try {
      if (inc) {
        const r = await fetch(`${UP_URL}/incr/${encodeURIComponent(UP_KEY)}`, {
          headers: { Authorization: `Bearer ${UP_TOKEN}` },
          cache: 'no-store',
        })
        const data = await r.json().catch(() => ({}))
        const value = typeof data?.result === 'number' ? data.result : parseInt(data?.result ?? 'NaN', 10)
        if (!Number.isFinite(value)) throw new Error('bad upstash result')
        return Response.json({ value })
      } else {
        const r = await fetch(`${UP_URL}/get/${encodeURIComponent(UP_KEY)}`, {
          headers: { Authorization: `Bearer ${UP_TOKEN}` },
          cache: 'no-store',
        })
        const data = await r.json().catch(() => ({}))
        let value: number | null = null
        if (data?.result == null) {
          // initialize to 0 so future gets are numeric
          await fetch(`${UP_URL}/set/${encodeURIComponent(UP_KEY)}/0`, {
            headers: { Authorization: `Bearer ${UP_TOKEN}` },
            cache: 'no-store',
          }).catch(() => {})
          value = 0
        } else {
          const n = typeof data.result === 'number' ? data.result : parseInt(String(data.result), 10)
          value = Number.isFinite(n) ? n : null
        }
        return Response.json({ value })
      }
    } catch (e) {
      // fall through to Abacus
    }
  }

  // Fallback to Abacus
  try {
    if (inc) {
      const res = await fetch(hitUrl, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      return Response.json({ value: typeof data?.value === 'number' ? data.value : null })
    } else {
      const r = await getValue()
      const data = await r.json().catch(() => ({}))
      return Response.json({ value: typeof data?.value === 'number' ? data.value : null })
    }
  } catch {
    return new Response(JSON.stringify({ value: null }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
}
