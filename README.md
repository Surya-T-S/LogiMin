# LogiMin

A high-performance, modern website to simplify Boolean expressions and Karnaugh maps with interactive visualization and step-by-step explanations.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Framer Motion
- (Planned) D3/SVG-based K‑map visualization
- (Planned) Rust via WebAssembly for heavy computations (initially TypeScript algorithms)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Features Roadmap

- Boolean expression parser supporting `+`, `·`/implicit AND, `'/~` NOT, parentheses.
- Quine–McCluskey minimizer with don't cares. SOP/POS/Minimal output.
- K‑Map (2–6 variables) with don't cares, grouping visualization.
- Step-by-step derivations with animations and explanations.
- Export to PNG/PDF.
- Learning mode (quizzes, hints, progress tracking).
