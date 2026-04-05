"use client"

import { useEffect } from "react"
import { useGalaxyPipeline } from "@/hooks/use-galaxy-pipeline"
import { useAppStore } from "@/lib/store"

/**
 * Invisible component that starts the Spotify data pipeline
 * when the user is authenticated. Renders nothing.
 */
export function PipelineTrigger() {
  const { startPipeline, isRunning } = useGalaxyPipeline()
  const mode = useAppStore((s) => s.mode)

  useEffect(() => {
    if (mode === "authenticated" && !isRunning) {
      startPipeline()
    }
  }, [mode, isRunning, startPipeline])

  return null
}
