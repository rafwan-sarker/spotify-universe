"use client"

import dynamic from "next/dynamic"

const GalaxyScene = dynamic(
  () => import("@/components/canvas/GalaxyScene"),
  { ssr: false }
)

interface GalaxySceneLoaderProps {
  isAuthenticated: boolean
}

export function GalaxySceneLoader({ isAuthenticated }: GalaxySceneLoaderProps) {
  return <GalaxyScene isAuthenticated={isAuthenticated} />
}
