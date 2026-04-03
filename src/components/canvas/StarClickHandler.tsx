"use client"

import { useCallback, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useAppStore } from "@/lib/store"
import { findNearestStar } from "@/lib/star-picking"

const _tempVec3 = new THREE.Vector3()

export function StarClickHandler() {
  const { camera, gl, size } = useThree()

  const projectFn = useCallback(
    (position: [number, number, number]) => {
      _tempVec3.set(position[0], position[1], position[2])
      _tempVec3.project(camera as THREE.PerspectiveCamera)
      return { x: _tempVec3.x, y: _tempVec3.y, z: _tempVec3.z }
    },
    [camera]
  )

  useEffect(() => {
    const canvas = gl.domElement

    const handleClick = (e: MouseEvent) => {
      // Only handle left click
      if (e.button !== 0) return

      const state = useAppStore.getState()

      // Don't pick stars during warp or search
      if (state.cameraMode === "warping" || state.searchOpen) return

      // Convert mouse position to NDC
      const rect = canvas.getBoundingClientRect()
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1

      const star = findNearestStar(ndcX, ndcY, state.stars, projectFn)

      if (star) {
        // Step 1 of two-step navigation (per D-06): warp to individual star
        state.startWarp({ position: star.position, starId: star.id })
      } else if (state.selectedStar) {
        // Clicked empty space while card is open: dismiss (per UI-SPEC)
        state.setSelectedStar(null)
        state.setCameraMode("cruising")
      }
    }

    canvas.addEventListener("click", handleClick)
    return () => canvas.removeEventListener("click", handleClick)
  }, [gl, size, projectFn])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        const state = useAppStore.getState()
        if (state.searchOpen) {
          state.setSearchOpen(false)
          return
        }
        if (state.selectedStar) {
          state.setSelectedStar(null)
          state.setCameraMode("cruising")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return null
}
