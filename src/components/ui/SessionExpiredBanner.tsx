"use client"

import { useSession, signIn } from "next-auth/react"
import { useState } from "react"

export function SessionExpiredBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)

  if (!session || session.error !== "RefreshTokenError" || dismissed) {
    return null
  }

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-full text-sm"
      style={{
        background: "rgba(10, 10, 20, 0.9)",
        border: "1px solid var(--neon-pink)",
        boxShadow: "0 0 15px rgba(255, 45, 149, 0.3)",
      }}
    >
      <span style={{ color: "var(--neon-pink)" }}>Session expired</span>
      <button
        onClick={() => signIn("spotify")}
        className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105"
        style={{
          background: "var(--neon-pink)",
          color: "white",
        }}
      >
        Reconnect
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/40 hover:text-white/70 cursor-pointer transition-colors ml-1"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  )
}
