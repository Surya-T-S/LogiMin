"use client"

import React, { useEffect, useMemo, useState } from "react"

// Small 7‑segment digit rendered with inline SVG. Color derives from currentColor.
function SevenSegDigit({ ch }: { ch: string }) {
  const on = useMemo(() => {
    // Map digits to active segments a,b,c,d,e,f,g
    const map: Record<string, string[]> = {
      "0": ["a","b","c","d","e","f"],
      "1": ["b","c"],
      "2": ["a","b","g","e","d"],
      "3": ["a","b","g","c","d"],
      "4": ["f","g","b","c"],
      "5": ["a","f","g","c","d"],
      "6": ["a","f","g","c","d","e"],
      "7": ["a","b","c"],
      "8": ["a","b","c","d","e","f","g"],
      "9": ["a","b","c","d","f","g"],
    }
    return new Set(map[ch] ?? [])
  }, [ch])

  // Geometry
  const W = 12, H = 20, T = 2, G = 1 // width, height, thickness, gap
  const active = (id: string) => (on.has(id) ? "currentColor" : "rgba(148,163,184,0.2)") // slate-400 alpha when off

  return (
    <svg className="sevenseg-digit" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      {/* a */}
      <rect x={T} y={0} width={W - 2*T} height={T} rx={T/2} fill={active("a")} />
      {/* b */}
      <rect x={W - T} y={T} width={T} height={H/2 - G - T/2} rx={T/2} fill={active("b")} />
      {/* c */}
      <rect x={W - T} y={H/2 + G} width={T} height={H/2 - T - G} rx={T/2} fill={active("c")} />
      {/* d */}
      <rect x={T} y={H - T} width={W - 2*T} height={T} rx={T/2} fill={active("d")} />
      {/* e */}
      <rect x={0} y={H/2 + G} width={T} height={H/2 - T - G} rx={T/2} fill={active("e")} />
      {/* f */}
      <rect x={0} y={T} width={T} height={H/2 - G - T/2} rx={T/2} fill={active("f")} />
      {/* g */}
      <rect x={T} y={H/2 - T/2} width={W - 2*T} height={T} rx={T/2} fill={active("g")} />
    </svg>
  )
}

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const already = typeof window !== "undefined" && localStorage.getItem("logimin-visit-counted") === "1"
        const url = already ? "/api/visits" : "/api/visits?inc=1"
        const res = await fetch(url, { cache: "no-store" })
        const data = await res.json()
        if (!cancelled) setCount(typeof data?.value === "number" ? data.value : null)
        if (!already) localStorage.setItem("logimin-visit-counted", "1")
      } catch (e) {
        if (!cancelled) setCount(null)
      }
    }
    run()

    return () => { cancelled = true }
  }, [])

  const text = count == null ? "--" : String(count)

  return (
    <div className="sevenseg" title={count == null ? "Visitor counter unavailable" : `Total visitors: ${count}`} aria-label="Visitor counter">
      {text.split("").map((c, i) => (
        /\d/.test(c) ? <SevenSegDigit key={i} ch={c} /> : <span key={i} className="sevenseg-sep">{c}</span>
      ))}
    </div>
  )
}
