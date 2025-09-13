"use client"

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ExpressionSolver from '@/components/ExpressionSolver'
import KMapSolver from '@/components/KMapSolver'
import ThemeToggle from '@/components/ThemeToggle'
import Image from 'next/image'
import SocialLinks from '@/components/SocialLinks'

export default function HomePage() {
  const [tab, setTab] = useState<'expr' | 'kmap'>('expr')

  return (
    <main className="container-px mx-auto max-w-7xl py-8">
      <header className="glass-nav card mb-8 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-md">
              <Image src="/logo.svg" alt="LogiMin" width={40} height={40} priority />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">LogiMin</h1>
              <p className="text-sm text-slate-500">Boolean & K‑Map Simplifier</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            <nav className="segmented relative flex w-full max-w-xs items-center">
              <motion.div
                layout
                className="indicator pointer-events-none"
                style={{ position: 'absolute', width: 'calc(50% - 8px)', left: 4, top: 4, bottom: 4 }}
                animate={{ left: tab === 'expr' ? 4 : 'calc(50% + 4px)' }}
                transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.18 }}
              />
              <button
                onClick={() => setTab('expr')}
                className={`relative z-10 w-1/2 rounded-full px-3 py-1.5 ${tab === 'expr' ? 'text-slate-900' : 'text-slate-600'}`}
              >
                Expression
              </button>
              <button
                onClick={() => setTab('kmap')}
                className={`relative z-10 w-1/2 rounded-full px-3 py-1.5 ${tab === 'kmap' ? 'text-slate-900' : 'text-slate-600'}`}
              >
                K‑Map
              </button>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {tab === 'expr' ? (
          <motion.div
            key="expr"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ExpressionSolver />
          </motion.div>
        ) : (
          <motion.div
            key="kmap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <KMapSolver />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social links only */}
      <div className="mt-8 text-center">
        <SocialLinks />
      </div>
    </main>
  )
}
