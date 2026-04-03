"use client"

import { Canvas } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useAppStore } from "@/lib/store"
import { DemoGalaxy } from "./DemoGalaxy"
import { RealGalaxy } from "./RealGalaxy"
import { BackgroundStars } from "./BackgroundStars"
import { FlightController } from "./FlightController"
import { WarpStreaks } from "./WarpStreaks"
import { StarClickHandler } from "./StarClickHandler"
import { StarInfoCard } from "./StarInfoCard"

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

/**
 * Manages the demo-to-real galaxy transition.
 *
 * When real stars begin appearing in the store, the demo galaxy remains
 * visible for a ~1 second overlap period. During this time both galaxies
 * coexist (additive blending makes them layer naturally). After the overlap
 * the demo galaxy is hidden.
 *
 * Uses imperative store subscription to avoid re-renders during the transition.
 */
function DemoGalaxyFader() {
  const [demoVisible, setDemoVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      const hasRealStars = state.stars.length > 0
      const isAuthenticated = state.mode === "authenticated"

      if (hasRealStars && isAuthenticated && demoVisible) {
        // Real stars are arriving -- begin transition.
        // Keep demo visible for 1 second overlap, then hide.
        if (!hideTimerRef.current) {
          hideTimerRef.current = setTimeout(() => {
            setDemoVisible(false)
          }, 1000)
        }
      }
    })

    return () => {
      unsub()
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
    // demoVisible is intentionally excluded -- we only want to start the
    // timer once, not re-subscribe when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!demoVisible) return null
  return <DemoGalaxy />
}

export default function GalaxyScene({ isAuthenticated }: GalaxySceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 50, 100], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#000005" }}
    >
      <ModeSync isAuthenticated={isAuthenticated} />
      <FlightController />
      <WarpStreaks />
      <StarClickHandler />
      <BackgroundStars />
      <ambientLight intensity={0.5} />
      {/* RealGalaxy always mounted -- self-manages visibility via mesh.count */}
      <RealGalaxy />
      {/* DemoGalaxy shown initially, fades out when real stars appear */}
      {!isAuthenticated ? <DemoGalaxy /> : <DemoGalaxyFader />}
      <StarInfoCard />
    </Canvas>
  )
}
