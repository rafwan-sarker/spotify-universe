"use client"

import { OrbitControls } from "@react-three/drei"

export function AutoOrbitCamera() {
  return (
    <OrbitControls
      autoRotate
      autoRotateSpeed={0.3}
      enableZoom
      enablePan={false}
      minDistance={30}
      maxDistance={200}
      dampingFactor={0.05}
      enableDamping
    />
  )
}
