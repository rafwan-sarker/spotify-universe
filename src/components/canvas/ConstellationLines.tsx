"use client"

import { useMemo } from "react"
import { Line } from "@react-three/drei"
import { useAppStore } from "@/lib/store"
import { buildConstellationPoints } from "@/lib/constellation"

/**
 * ConstellationLines -- glowing cyan lines connecting all stars by the
 * same artist when a star is selected in inspecting mode.
 *
 * Only renders when cameraMode === 'inspecting' (after warp completes,
 * not during the warp animation) to avoid visual clutter.
 *
 * Uses drei Line with segments prop for paired point rendering.
 */
export function ConstellationLines() {
  const selectedStar = useAppStore((s) => s.selectedStar)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const stars = useAppStore((s) => s.stars)

  const points = useMemo(() => {
    if (!selectedStar || cameraMode !== "inspecting") return []
    const artistStars = stars.filter((s) => s.artist === selectedStar.artist)
    return buildConstellationPoints(artistStars)
  }, [selectedStar, cameraMode, stars])

  // Need at least 2 pairs (4 points) to draw anything meaningful
  if (points.length < 4) return null

  return (
    <Line
      points={points}
      segments
      color="#00f0ff"
      lineWidth={1.5}
      transparent
      opacity={0.6}
      toneMapped={false}
      depthWrite={false}
    />
  )
}
