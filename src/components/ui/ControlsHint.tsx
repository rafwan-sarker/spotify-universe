"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

export function ControlsHint() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000)

    // Dismiss on first user input
    const dismiss = () => setVisible(false)
    window.addEventListener("keydown", dismiss, { once: true })
    window.addEventListener("mousedown", dismiss, { once: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener("keydown", dismiss)
      window.removeEventListener("mousedown", dismiss)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10"
          style={{
            background: "rgba(0, 0, 20, 0.6)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "8px 16px",
          }}
        >
          <p
            className="whitespace-nowrap"
            style={{
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.5)",
              fontWeight: 400,
            }}
          >
            WASD to fly
            <span className="mx-2" style={{ color: "rgba(255, 255, 255, 0.2)" }}>|</span>
            Right-drag to look
            <span className="mx-2" style={{ color: "rgba(255, 255, 255, 0.2)" }}>|</span>
            Scroll to boost
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
