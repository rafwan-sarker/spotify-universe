"use client"

import { motion } from "motion/react"
import { ConnectSpotifyButton } from "./ConnectSpotifyButton"

export function DemoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 py-4 px-6 bg-black/60 backdrop-blur-md"
    >
      <p className="text-sm text-white/70">
        Connect Spotify to see{" "}
        <span style={{ color: "var(--neon-cyan)", fontWeight: 600 }}>
          YOUR
        </span>{" "}
        universe
      </p>
      <ConnectSpotifyButton />
    </motion.div>
  )
}
