"use client"

import { useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Billboard, Text } from "@react-three/drei"
import { useAppStore } from "@/lib/store"

// Module-scope temp vector to avoid allocations in useFrame (Pitfall 3)
const _tempVec3 = new THREE.Vector3()

/**
 * GenreLabels -- floating billboard text at each genre cluster centroid.
 *
 * Labels always face the camera (Billboard) and fade based on distance:
 * - d < 30: fully visible (opacity 1.0)
 * - 30 < d < 80: linear fade
 * - d > 80: hidden (opacity 0.0)
 *
 * Uses toneMapped={false} so labels glow through bloom.
 */
export function GenreLabels() {
  const genres = useAppStore((s) => s.genres)
  const refsArray = useRef<(THREE.Mesh | null)[]>([])
  const { camera } = useThree()

  // Update opacity per frame based on distance from camera
  useFrame(() => {
    for (let i = 0; i < genres.length; i++) {
      const mesh = refsArray.current[i]
      if (!mesh) continue

      const genre = genres[i]
      _tempVec3.set(genre.centroid[0], genre.centroid[1], genre.centroid[2])
      const d = camera.position.distanceTo(_tempVec3)

      // Distance-based opacity curve
      const opacity = d < 30 ? 1.0 : d < 80 ? 1.0 - (d - 30) / 50 : 0.0
      const mat = mesh.material as THREE.MeshBasicMaterial
      if (mat && "opacity" in mat) {
        mat.opacity = opacity
      }
    }
  })

  if (genres.length === 0) return null

  return (
    <group>
      {genres.map((genre, i) => (
        <Billboard
          key={genre.id}
          position={[genre.centroid[0], genre.centroid[1], genre.centroid[2]]}
        >
          <Text
            ref={(el) => {
              refsArray.current[i] = el as unknown as THREE.Mesh | null
            }}
            fontSize={2}
            color={new THREE.Color(genre.color[0], genre.color[1], genre.color[2])}
            anchorX="center"
            anchorY="middle"
            material-transparent={true}
            material-toneMapped={false}
            material-depthWrite={false}
          >
            {genre.name}
          </Text>
        </Billboard>
      ))}
    </group>
  )
}
