"use client"

import React from 'react'
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'

const VisitorCounter = dynamic(() => import('./VisitorCounter'), { ssr: false })

const coffeeLabel = Inter({ subsets: ['latin'], weight: ['600'], display: 'swap' })

type Props = {
  githubUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
}

export default function SocialLinks({ githubUrl, linkedinUrl, instagramUrl }: Props) {
  const gh = githubUrl ?? process.env.NEXT_PUBLIC_GITHUB_URL ?? '#'
  const li = linkedinUrl ?? process.env.NEXT_PUBLIC_LINKEDIN_URL ?? '#'
  const ig = instagramUrl ?? process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '#'
  return (
    <div className="relative mt-3 w-full grid grid-cols-[1fr_auto_1fr] items-start py-1 sm:py-2 min-h-[52px] sm:min-h-[68px]">
      {/* Aligned icon group: perfectly centered across all screens */}
      <div className="col-start-2 col-end-3 justify-self-center self-end flex items-center gap-3 sm:gap-4">
        <a
          href={gh}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
          className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:shadow-xl hover:shadow-white/20"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor">
            <path fillRule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.23.68-.5 0-.25-.01-.92-.01-1.81-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.1-1.49-1.1-1.49-.9-.63.07-.62.07-.62 1 .07 1.52 1.05 1.52 1.05.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05.8-.23 1.66-.35 2.51-.35s1.71.12 2.51.35c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.61.69.5A10.27 10.27 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" clipRule="evenodd"/>
          </svg>
        </a>
        <a
          href={li}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          title="LinkedIn"
          className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:shadow-xl hover:shadow-white/20"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor">
            <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V23h-4zM8.5 8.5h3.83v1.97h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.09V23h-4v-6.5c0-1.55-.03-3.54-2.16-3.54-2.16 0-2.49 1.68-2.49 3.43V23h-4V8.5z" />
          </svg>
        </a>
        <a
          href={ig}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          title="Instagram"
          className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:shadow-xl hover:shadow-white/20"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="relative h-5 w-5" fill="currentColor">
            <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm5-2.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
          </svg>
        </a>
      </div>
      {/* Counter: glass rounded rectangle at the far right with label + coffee icon + number */}
      <div className="col-start-3 col-end-4 justify-self-end self-start -translate-y-7 sm:-translate-y-8">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border px-2.5 sm:px-3.5 py-1 sm:py-1.5 backdrop-blur-md shadow-[0_8px_22px_rgba(0,0,0,0.18)] bg-white/20 dark:bg-white/10 border-white/40 dark:border-slate-300/30 ring-1 ring-white/15">
          <span
            className={`${coffeeLabel.className} text-[11px] sm:text-sm text-white/95 leading-none whitespace-nowrap font-semibold tracking-[0.015em]`}
          >
            Coffee count
          </span>
          {/* Coffee cup icon with animated steam */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z"/>
            <path d="M16 9h2a2 2 0 0 1 0 4h-2"/>
            <path className="coffee-steam s1" d="M6 8V6"/>
            <path className="coffee-steam s2" d="M10 8V6"/>
            <path className="coffee-steam s3" d="M14 8V6"/>
          </svg>
          <div className="text-white h-4 sm:h-5 flex items-center leading-none [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.35))] scale-110 sm:scale-125">
            <VisitorCounter />
          </div>
        </div>
      </div>
    </div>
  )
}
