"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useAppStore } from "@/lib/store"
import { computeGalaxyStats } from "@/lib/galaxy-stats"

/**
 * Galaxy stats card overlay (D-09, D-10, D-11, D-12).
 *
 * Fades in at bottom-left after galaxy finishes building.
 * Shows star count, genre count, dominant genre %, and personality label.
 * Auto-hides after 5 seconds. Toggle with 'i' key.
 */
export function GalaxyStats() {
  const [visible, setVisible] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const galaxyStats = useAppStore((s) => s.galaxyStats)

  // Compute stats when galaxy completes building
  useEffect(() => {
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.isComplete && !prev.isComplete && !state.galaxyStats) {
        const stats = computeGalaxyStats(state.stars, state.genres)
        state.setGalaxyStats(stats)
      }
    })
    return unsub
  }, [])

  // Show card once stats are computed, with auto-dismiss
  useEffect(() => {
    if (galaxyStats && !hasShown) {
      setVisible(true)
      setHasShown(true)
      timerRef.current = setTimeout(() => setVisible(false), 5000)
    }
  }, [galaxyStats, hasShown])

  // Toggle with 'i' key (D-09)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if search is open (typing 'i' in search)
      if (useAppStore.getState().searchOpen) return
      if (e.key.toLowerCase() === "i") {
        setVisible((prev) => {
          const next = !prev
          // Clear auto-hide timer if user manually toggles
          if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
          }
          return next
        })
      }
    },
    []
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [handleKeyDown])

  if (!galaxyStats) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="fixed bottom-8 left-8 z-10"
          style={{
            background: "rgba(0, 0, 20, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            borderRadius: "12px",
            padding: "16px",
            maxWidth: "320px",
          }}
        >
          {/* Title */}
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.4)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            YOUR GALAXY
          </p>

          {/* Stats line */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.9)",
              marginBottom: "12px",
            }}
          >
            <span>
              <strong>{galaxyStats.totalStars.toLocaleString()}</strong> stars
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>|</span>
            <span>
              <strong>{galaxyStats.genreCount}</strong> genres
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>|</span>
            <span>
              <strong>{galaxyStats.dominantPercent}%</strong>{" "}
              <span style={{ color: "#00f0ff" }}>{galaxyStats.dominantGenre}</span>
            </span>
          </div>

          {/* Separator */}
          <div
            style={{
              height: "1px",
              background: "rgba(255, 255, 255, 0.08)",
              marginBottom: "12px",
            }}
          />

          {/* Personality label */}
          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#ffffff",
              textShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
              margin: 0,
            }}
          >
            &ldquo;{galaxyStats.personality}&rdquo;
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
