"use client"

import { Canvas } from "@react-three/fiber"
import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { DemoGalaxy } from "./DemoGalaxy"
import { BackgroundStars } from "./BackgroundStars"
import { AutoOrbitCamera } from "./AutoOrbitCamera"

interface GalaxySceneProps {
  isAuthenticated: boolean
}

/**
 * Syncs the server-side auth state (prop) into the client Zustand store.
 * This runs inside the R3F Canvas context as a regular React component.
 */
function ModeSync({ isAuthenticated }: { isAuthenticated: boolean }) {
  const setMode = useAppStore((s) => s.setMode)
  const mode = useAppStore((s) => s.mode)

  useEffect(() => {
    // Only sync on mount or when auth state changes -- don't override "transitioning"
    if (mode !== "transitioning") {
      setMode(isAuthenticated ? "authenticated" : "demo")
    }
  }, [isAuthenticated, setMode, mode])

  return null
}

export default function GalaxyScene({ isAuthenticated }: GalaxySceneProps) {
  const mode = useAppStore((s) => s.mode)

  return (
    <Canvas
      camera={{ position: [0, 50, 100], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#000005" }}
    >
      <ModeSync isAuthenticated={isAuthenticated} />
      <AutoOrbitCamera />
      <BackgroundStars />
      <ambientLight intensity={0.5} />
      {/* In Phase 1, demo galaxy always shows. Phase 2+ will swap based on mode */}
      {(mode === "demo" || !isAuthenticated) && <DemoGalaxy />}
    </Canvas>
  )
}
