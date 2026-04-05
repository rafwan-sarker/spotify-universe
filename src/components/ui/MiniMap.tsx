"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useAppStore } from "@/lib/store"
import { sharedCameraRef } from "@/lib/camera-ref"
import { computeGalaxyBounds, projectToMinimap } from "@/lib/galaxy-stats"
import type { GalaxyBounds } from "@/lib/galaxy-stats"

const MAP_CSS_SIZE = 150
const MAP_DEVICE_SIZE = MAP_CSS_SIZE * 2 // 2x for retina

// Temp vector for camera direction extraction (avoid per-frame allocation)
const _tempVec = new THREE.Vector3()

/**
 * Mini-map HUD overlay (D-16, D-17, D-18, D-19).
 *
 * Renders a 2D canvas showing genre cluster dots and camera position.
 * Uses its own requestAnimationFrame loop, isolated from R3F render.
 */
export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boundsRef = useRef<GalaxyBounds | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rafId: number

    function draw() {
      if (!ctx) return

      const genres = useAppStore.getState().genres
      const camera = sharedCameraRef.current

      // Recompute bounds when genres change (memoize)
      if (genres.length > 0 && !boundsRef.current) {
        boundsRef.current = computeGalaxyBounds(genres)
      }

      const size = MAP_DEVICE_SIZE

      // Clear
      ctx.clearRect(0, 0, size, size)

      // Background (D-18)
      ctx.fillStyle = "rgba(0, 0, 20, 0.85)"
      ctx.fillRect(0, 0, size, size)

      // Border
      ctx.strokeStyle = "rgba(0, 240, 255, 0.3)"
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, size - 2, size - 2)

      const bounds = boundsRef.current
      if (!bounds || genres.length === 0) {
        rafId = requestAnimationFrame(draw)
        return
      }

      // Draw genre dots
      for (const genre of genres) {
        const pos = projectToMinimap(genre.centroid, bounds, size)
        const [r, g, b] = genre.color

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2) // 4px CSS = 8px device
        ctx.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
        ctx.fill()
      }

      // Draw camera indicator
      if (camera) {
        const camPos: [number, number, number] = [
          camera.position.x,
          camera.position.y,
          camera.position.z,
        ]
        const mapped = projectToMinimap(camPos, bounds, size)

        // Get camera yaw from forward direction
        camera.getWorldDirection(_tempVec)
        const yaw = Math.atan2(-_tempVec.x, -_tempVec.z)

        // Draw white triangle pointing in camera direction
        ctx.save()
        ctx.translate(mapped.x, mapped.y)
        ctx.rotate(-yaw)
        ctx.beginPath()
        ctx.moveTo(0, -12) // tip (6px CSS = 12px device)
        ctx.lineTo(-8, 8) // bottom-left
        ctx.lineTo(8, 8) // bottom-right
        ctx.closePath()
        ctx.fillStyle = "#ffffff"
        ctx.fill()
        ctx.restore()
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      className="fixed top-20 right-4 z-10"
      style={{
        width: MAP_CSS_SIZE,
        height: MAP_CSS_SIZE,
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid rgba(0, 240, 255, 0.2)",
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAP_DEVICE_SIZE}
        height={MAP_DEVICE_SIZE}
        style={{
          width: MAP_CSS_SIZE,
          height: MAP_CSS_SIZE,
          display: "block",
        }}
      />
    </div>
  )
}
