"use client"

import { useRef, useMemo, useEffect } from "react"
import * as THREE from "three"
import demoData from "@/data/demo-galaxy.json"

// Module-scope temp objects to avoid allocations inside useFrame/useEffect
// (Pitfall 3: never allocate THREE objects inside render or useFrame)
const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

export function DemoGalaxy() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = demoData.stars.length

  // Pre-compute genre color lookup and vertex colors array
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const genreColorMap = Object.fromEntries(
      demoData.genres.map((g) => [g.id, g.color])
    )
    demoData.stars.forEach((star, i) => {
      const [r, g, b] = genreColorMap[star.genre] ?? [1, 1, 1]
      tempColor.setRGB(r, g, b)
      tempColor.toArray(arr, i * 3)
    })
    return arr
  }, [count])

  // Set instance positions and scales after mesh ref is available
  // useEffect (not useMemo) because meshRef.current must be set first
  useEffect(() => {
    if (!meshRef.current) return
    demoData.stars.forEach((star, i) => {
      tempObject.position.set(
        star.position[0],
        star.position[1],
        star.position[2]
      )
      tempObject.scale.setScalar(star.size)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial toneMapped={false} vertexColors />
      <instancedBufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
    </instancedMesh>
  )
}
