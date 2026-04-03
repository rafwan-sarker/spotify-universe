"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useAppStore } from "@/lib/store"
import { deriveWarpVisuals } from "@/lib/warp-visuals"
import { warpStreakVertex, warpStreakFragment } from "@/shaders/warp-streaks"

const STREAK_COUNT = 800

/**
 * 3D warp streak particle system for hyperspace star-streak effect.
 *
 * Renders 800 thin instanced planes arranged in a cylinder around the camera.
 * Only visible during cameraMode === 'warping'. Shader uniforms are driven
 * by deriveWarpVisuals() for three-phase animation (acceleration, hyperspace,
 * deceleration).
 *
 * Uses additive blending for bright neon glow against the dark space background.
 */
export function WarpStreaks() {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  // Pre-compute random per-instance attributes (once)
  const { geometry } = useMemo(() => {
    const angles = new Float32Array(STREAK_COUNT)
    const radii = new Float32Array(STREAK_COUNT)
    const speeds = new Float32Array(STREAK_COUNT)

    for (let i = 0; i < STREAK_COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2
      radii[i] = 0.5 + Math.random() * 2.5
      speeds[i] = 0.8 + Math.random() * 0.4
    }

    // Base geometry: thin tall plane (width 0.02, height 1) for each streak
    const baseGeo = new THREE.PlaneGeometry(0.02, 1, 1, 1)
    const instancedGeo = new THREE.InstancedBufferGeometry()

    // Copy base geometry attributes
    instancedGeo.index = baseGeo.index
    instancedGeo.setAttribute("position", baseGeo.getAttribute("position"))
    instancedGeo.setAttribute("uv", baseGeo.getAttribute("uv"))

    // Add per-instance attributes
    instancedGeo.setAttribute(
      "aAngle",
      new THREE.InstancedBufferAttribute(angles, 1)
    )
    instancedGeo.setAttribute(
      "aRadius",
      new THREE.InstancedBufferAttribute(radii, 1)
    )
    instancedGeo.setAttribute(
      "aSpeed",
      new THREE.InstancedBufferAttribute(speeds, 1)
    )

    // Set instance count
    instancedGeo.instanceCount = STREAK_COUNT

    return { geometry: instancedGeo }
  }, [])

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uStreakStretch: { value: 0 },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  )

  useFrame(({ camera, clock }) => {
    const { cameraMode, warpProgress } = useAppStore.getState()
    const group = groupRef.current
    const material = materialRef.current

    if (!group || !material) return

    if (cameraMode !== "warping") {
      // Hide when not warping
      group.visible = false
      return
    }

    // Show and update during warp
    group.visible = true

    const visuals = deriveWarpVisuals(warpProgress)
    material.uniforms.uStreakStretch.value = visuals.streakStretch
    material.uniforms.uOpacity.value = visuals.streakOpacity
    material.uniforms.uTime.value = clock.elapsedTime

    // Position streaks at camera and orient along camera forward
    group.position.copy(camera.position)
    group.quaternion.copy(camera.quaternion)
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={warpStreakVertex}
          fragmentShader={warpStreakFragment}
          uniforms={uniforms}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
