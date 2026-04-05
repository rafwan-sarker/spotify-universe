"use client"

import { Canvas } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useAppStore } from "@/lib/store"
import demoData from "@/data/demo-galaxy.json"
import type { StarData } from "@/lib/spotify/types"
import { DemoGalaxy } from "./DemoGalaxy"
import { RealGalaxy } from "./RealGalaxy"
import { BackgroundStars } from "./BackgroundStars"
import { FlightController } from "./FlightController"
import { WarpStreaks } from "./WarpStreaks"
import { StarClickHandler } from "./StarClickHandler"
import { StarInfoCard } from "./StarInfoCard"
import { GenreLabels } from "./GenreLabels"
import { ConstellationLines } from "./ConstellationLines"
import { PostProcessing } from "./PostProcessing"

interface GalaxySceneProps {
  isAuthenticated: boolean
}

/**
 * Syncs the server-side auth state (prop) into the client Zustand store.
 * Also loads demo stars into the store so star picking works in demo mode.
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

  // Load demo stars and genres into store so star picking, search, and minimap work in demo mode
  useEffect(() => {
    const state = useAppStore.getState()
    if (!isAuthenticated && state.stars.length === 0) {
      const demoStars: StarData[] = demoData.stars.map((s) => ({
        id: s.id,
        name: s.name,
        artist: s.artist,
        genre: s.genre,
        position: s.position as [number, number, number],
        size: s.size,
        brightness: s.brightness,
      }))
      state.addStarBatch(demoStars)
      state.setGenres(
        demoData.genres.map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color as [number, number, number],
          centroid: g.centroid as [number, number, number],
        }))
      )
    }
  }, [isAuthenticated])

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
      {/* RealGalaxy renders both demo and real stars from the store */}
      <RealGalaxy />
      {/* DemoGalaxy removed — RealGalaxy handles both demo and real stars from store */}
      <StarInfoCard />
      <GenreLabels />
      <ConstellationLines />
      {/* PostProcessing MUST be last -- EffectComposer wraps entire scene render */}
      <PostProcessing />
    </Canvas>
  )
}
