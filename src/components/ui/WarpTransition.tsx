"use client"

import { useAppStore } from "@/lib/store"
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState } from "react"

export function WarpTransition() {
  const mode = useAppStore((s) => s.mode)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (mode === "transitioning") {
      setVisible(true)
      // Auto-hide after the transition completes (~1000ms total)
      const timer = setTimeout(() => {
        setVisible(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [mode])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="warp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black pointer-events-none"
        />
      )}
    </AnimatePresence>
  )
}
