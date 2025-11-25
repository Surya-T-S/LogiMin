"use client"

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ExpressionSolver from '@/components/ExpressionSolver'
import KMapSolver from '@/components/KMapSolver'
import ThemeToggle from '@/components/ThemeToggle'
import Image from 'next/image'
import SocialLinks from '@/components/SocialLinks'
import SplashLoader from '@/components/SplashLoader'

export default function HomePage() {
  const [tab, setTab] = useState<'expr' | 'kmap'>('expr')

  return (
    <main className="container-px mx-auto max-w-7xl py-8">
      <SplashLoader />
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
            <nav className="relative flex w-full max-w-xs items-center rounded-full border border-white/20 bg-white/10 p-1 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/20">
              <motion.div
                layout
                className="absolute rounded-full bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:bg-slate-700/80 dark:ring-white/10"
                style={{ width: 'calc(50% - 4px)', top: 4, bottom: 4 }}
                animate={{ left: tab === 'expr' ? 4 : 'calc(50%)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              <button
                onClick={() => setTab('expr')}
                className={`relative z-10 w-1/2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${tab === 'expr' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'}`}
              >
                Expression
              </button>
              <button
                onClick={() => setTab('kmap')}
                className={`relative z-10 w-1/2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${tab === 'kmap' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'}`}
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
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0.2, 1] }}
          >
            <ExpressionSolver />
          </motion.div>
        ) : (
          <motion.div
            key="kmap"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0.2, 1] }}
          >
            <KMapSolver />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social links and visitor counter */}
      <div className="mt-10 text-center">
        <SocialLinks
          githubUrl="https://github.com/Surya-T-S"
          linkedinUrl="https://www.linkedin.com/in/surya-t-s-9bb93432a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
          instagramUrl="https://www.instagram.com/_surya.ts_?igsh=MTd1YTFmNXF1Y2w1bg=="
        />
      </div>
    </main>
  )
}
