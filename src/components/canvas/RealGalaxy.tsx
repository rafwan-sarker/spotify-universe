"use client"

import { useRef, useMemo, useEffect } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import {
  createStarBuffers,
  updateStarBuffers,
  MAX_STARS,
} from "@/lib/galaxy-buffers"
import { useAppStore } from "@/lib/store"
import {
  starVertexShader as vertexShader,
  starFragmentShader as fragmentShader,
} from "@/shaders/star-shaders"

// Module-scope temp objects to avoid allocations in render/useFrame (Pitfall 3)
const tempObject = new THREE.Object3D()

/**
 * RealGalaxy -- renders the user's actual music library as a galaxy of glowing stars.
 *
 * Uses a single InstancedMesh with a custom ShaderMaterial for all stars.
 * All animations (fade-in, twinkle, top-track pulse) run in the GPU shaders.
 * Star data comes from the Zustand store via imperative subscription (no re-renders).
 *
 * Performance: single draw call, zero per-instance CPU animation cost (only uTime update).
 */
export function RealGalaxy() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const starCountRef = useRef(0)
  const birthTimeMapRef = useRef(new Map<string, number>())

  // Store refs to instanced buffer attributes for needsUpdate flagging
  const attrsRef = useRef<{
    color: THREE.InstancedBufferAttribute
    size: THREE.InstancedBufferAttribute
    brightness: THREE.InstancedBufferAttribute
    birthTime: THREE.InstancedBufferAttribute
    phaseOffset: THREE.InstancedBufferAttribute
    isTopTrack: THREE.InstancedBufferAttribute
  } | null>(null)

  // Pre-allocate all buffers at MAX_STARS capacity (Pitfall 1)
  const buffers = useMemo(() => createStarBuffers(MAX_STARS), [])

  // Attach InstancedBufferAttributes to the geometry after mount
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const geometry = mesh.geometry

    const colorAttr = new THREE.InstancedBufferAttribute(buffers.colors, 3)
    const sizeAttr = new THREE.InstancedBufferAttribute(buffers.sizes, 1)
    const brightnessAttr = new THREE.InstancedBufferAttribute(
      buffers.brightnesses,
      1
    )
    const birthTimeAttr = new THREE.InstancedBufferAttribute(
      buffers.birthTimes,
      1
    )
    const phaseOffsetAttr = new THREE.InstancedBufferAttribute(
      buffers.phaseOffsets,
      1
    )
    const isTopTrackAttr = new THREE.InstancedBufferAttribute(
      buffers.isTopTracks,
      1
    )

    geometry.setAttribute("instanceColor", colorAttr)
    geometry.setAttribute("instanceSize", sizeAttr)
    geometry.setAttribute("instanceBrightness", brightnessAttr)
    geometry.setAttribute("instanceBirthTime", birthTimeAttr)
    geometry.setAttribute("instancePhaseOffset", phaseOffsetAttr)
    geometry.setAttribute("instanceIsTopTrack", isTopTrackAttr)

    attrsRef.current = {
      color: colorAttr,
      size: sizeAttr,
      brightness: brightnessAttr,
      birthTime: birthTimeAttr,
      phaseOffset: phaseOffsetAttr,
      isTopTrack: isTopTrackAttr,
    }

    // Start with zero visible instances
    mesh.count = 0
  }, [buffers])

  // Subscribe to store changes imperatively -- no React re-renders (Pitfall 4)
  // Zustand v5 subscribe takes a single (state) => void listener.
  // We track previous star count ourselves to detect changes.
  useEffect(() => {
    let prevLength = 0

    const unsub = useAppStore.subscribe((state) => {
      const newLength = state.stars.length
      if (newLength === prevLength) return

      const mesh = meshRef.current
      const attrs = attrsRef.current
      if (!mesh || !attrs) return

      const currentTime = materialRef.current?.uniforms.uTime.value ?? 0

      // Galaxy was reset -- clear everything
      if (newLength === 0) {
        mesh.count = 0
        starCountRef.current = 0
        birthTimeMapRef.current.clear()
        prevLength = 0
        return
      }

      const stars = state.stars

      // Write all star data into buffers (colors, sizes, brightnesses,
      // phaseOffsets, isTopTracks, and fresh birthTimes)
      updateStarBuffers(buffers, stars, 0, currentTime)

      // Override birth times using the persistent map (Pitfall 5):
      // Existing stars keep their original birth time, only new stars get
      // a staggered birth time so the reset+add pattern doesn't cause
      // all stars to re-animate.
      const birthMap = birthTimeMapRef.current
      const starsToStagger: number[] = []

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        const existingBirthTime = birthMap.get(star.id)
        if (existingBirthTime !== undefined) {
          // Star already existed -- keep its original birth time
          buffers.birthTimes[i] = existingBirthTime
        } else {
          // New star -- will be staggered below
          starsToStagger.push(i)
        }
      }

      // Stagger new stars over 0.8 seconds for smooth stream (D-06)
      const spreadDuration = 0.8
      for (let j = 0; j < starsToStagger.length; j++) {
        const idx = starsToStagger[j]
        const staggeredTime =
          currentTime +
          (j / Math.max(starsToStagger.length, 1)) * spreadDuration
        buffers.birthTimes[idx] = staggeredTime
        birthMap.set(stars[idx].id, staggeredTime)
      }

      // Set instance matrices (position + unit scale; size handled in shader)
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        tempObject.position.set(
          star.position[0],
          star.position[1],
          star.position[2]
        )
        tempObject.scale.setScalar(1)
        tempObject.updateMatrix()
        mesh.setMatrixAt(i, tempObject.matrix)
      }

      // Update visible count and flag all buffers for GPU upload (Pitfall 6)
      mesh.count = stars.length
      starCountRef.current = stars.length
      prevLength = stars.length
      mesh.instanceMatrix.needsUpdate = true
      attrs.color.needsUpdate = true
      attrs.size.needsUpdate = true
      attrs.brightness.needsUpdate = true
      attrs.birthTime.needsUpdate = true
      attrs.phaseOffset.needsUpdate = true
      attrs.isTopTrack.needsUpdate = true
    })

    return unsub
  }, [buffers])

  // Animation loop: only update uTime uniform -- all animation runs in shaders
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_STARS]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
