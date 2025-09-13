"use client"

import React from 'react'

type Props = {
  githubUrl?: string
  linkedinUrl?: string
}

export default function SocialLinks({ githubUrl, linkedinUrl }: Props) {
  const gh = githubUrl ?? process.env.NEXT_PUBLIC_GITHUB_URL ?? '#'
  const li = linkedinUrl ?? process.env.NEXT_PUBLIC_LINKEDIN_URL ?? '#'
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <a
        href={gh}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        title="GitHub"
        className="icon-btn h-9 w-9"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path fillRule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.23.68-.5 0-.25-.01-.92-.01-1.81-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.1-1.49-1.1-1.49-.9-.63.07-.62.07-.62 1 .07 1.52 1.05 1.52 1.05.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05.8-.23 1.66-.35 2.51-.35s1.71.12 2.51.35c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.61.69.5A10.27 10.27 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" clipRule="evenodd"/>
        </svg>
      </a>
      <a
        href={li}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        title="LinkedIn"
        className="icon-btn h-9 w-9"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V23h-4zM8.5 8.5h3.83v1.97h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.09V23h-4v-6.5c0-1.55-.03-3.54-2.16-3.54-2.16 0-2.49 1.68-2.49 3.43V23h-4V8.5z" />
        </svg>
      </a>
    </div>
  )
}
