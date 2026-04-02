"use client"

import { Canvas } from "@react-three/fiber"
import { DemoGalaxy } from "./DemoGalaxy"
import { BackgroundStars } from "./BackgroundStars"
import { AutoOrbitCamera } from "./AutoOrbitCamera"

interface GalaxySceneProps {
  isAuthenticated: boolean
}

export default function GalaxyScene({ isAuthenticated }: GalaxySceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 50, 100], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#000005" }}
    >
      <AutoOrbitCamera />
      <BackgroundStars />
      <ambientLight intensity={0.5} />
      {!isAuthenticated && <DemoGalaxy />}
    </Canvas>
  )
}
