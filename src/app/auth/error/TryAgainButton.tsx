"use client"

import { signIn } from "next-auth/react"

export function TryAgainButton() {
  return (
    <button
      onClick={() => signIn("spotify")}
      className="px-6 py-3 rounded-full font-semibold text-sm tracking-wide cursor-pointer transition-all hover:scale-105"
      style={{
        border: "1px solid var(--neon-pink)",
        color: "var(--neon-pink)",
        background: "transparent",
        boxShadow: "0 0 15px rgba(255, 45, 149, 0.3)",
      }}
    >
      Try Again
    </button>
  )
}
