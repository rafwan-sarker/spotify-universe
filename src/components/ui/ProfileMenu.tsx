"use client"

import { signOut } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { useState, useRef, useEffect } from "react"

interface ProfileMenuProps {
  user: { name?: string | null; image?: string | null }
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const setMode = useAppStore((s) => s.setMode)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleLogout() {
    setOpen(false)
    setMode("transitioning")
    // Wait for the warp transition to play (fade in + hold)
    await new Promise((resolve) => setTimeout(resolve, 800))
    signOut({ callbackUrl: "/" })
  }

  const initial = user.name?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <div ref={menuRef} className="fixed top-4 right-4 z-10">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all hover:scale-110"
        style={{
          borderColor: "var(--neon-cyan)",
          boxShadow: "0 0 10px rgba(0, 240, 255, 0.3)",
        }}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? "Profile"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-bold"
            style={{
              background: "var(--bg-surface)",
              color: "var(--neon-cyan)",
            }}
          >
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg py-2 px-1"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid rgba(0, 240, 255, 0.2)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
          }}
        >
          <p
            className="px-3 py-2 text-sm truncate"
            style={{ color: "var(--neon-cyan)" }}
          >
            {user.name ?? "Spotify User"}
          </p>
          <hr className="border-white/10 my-1" />
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
