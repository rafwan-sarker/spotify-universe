"use client"

import { Stars } from "@react-three/drei"

export function BackgroundStars() {
  return (
    <Stars
      radius={300}
      depth={100}
      count={3000}
      factor={4}
      saturation={0}
      fade
      speed={0.5}
    />
  )
}
