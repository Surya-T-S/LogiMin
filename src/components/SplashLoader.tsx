"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashLoader() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = 'hidden'
    
    const timer = setTimeout(() => {
      setIsVisible(false)
      document.body.style.overflow = ''
    }, 2500)
    
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Minimal Blur Reveal */}
            <motion.h1
              className="text-sm font-medium tracking-[0.8em] text-white/90"
              initial={{ filter: "blur(12px)", opacity: 0, scale: 0.9 }}
              animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} // Custom ease for premium feel
            >
              LOGIMIN
            </motion.h1>
            
            {/* Subtle Loading Line */}
            <motion.div 
              className="mt-6 h-[1px] w-12 bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
               <motion.div 
                  className="h-full bg-white/80"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.6, duration: 1.4, ease: "easeInOut" }}
               />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
