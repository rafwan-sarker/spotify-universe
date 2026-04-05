"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import * as Comlink from "comlink"
import { useAppStore } from "@/lib/store"
import { SpotifyFetchOrchestrator } from "@/lib/spotify/fetch-orchestrator"
import type { WorkerOutput } from "@/workers/galaxy-layout.types"
import type { NormalizedTrack } from "@/lib/spotify/types"

interface WorkerApi {
  processBatch: (input: {
    tracks: NormalizedTrack[]
    artistGenres: Record<string, string[]>
    genreClusterRadius: number
    galaxyRadius: number
  }) => WorkerOutput
}

/**
 * Hook that wires the full data pipeline:
 * SpotifyFetchOrchestrator -> Web Worker (via Comlink) -> Zustand store.
 *
 * Returns { startPipeline, isRunning, progress }.
 * Trigger startPipeline() when mode transitions to "authenticated" after OAuth.
 */
export function useGalaxyPipeline() {
  const [isRunning, setIsRunning] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const orchestratorRef = useRef<SpotifyFetchOrchestrator | null>(null)

  // Use selector for minimal re-renders
  const progress = useAppStore((state) => state.fetchProgress)

  const startPipeline = useCallback(async () => {
    if (isRunning) return
    setIsRunning(true)

    // Reset any previous galaxy data
    useAppStore.getState().resetGalaxy()

    // Create Web Worker
    const worker = new Worker(
      new URL("@/workers/galaxy-layout.worker.ts", import.meta.url),
      { type: "module" }
    )
    workerRef.current = worker

    const workerApi = Comlink.wrap<WorkerApi>(worker)

    // Create fetch orchestrator with callbacks
    const orchestrator = new SpotifyFetchOrchestrator({
      onProgress: (phase, loaded, total) => {
        useAppStore.getState().setFetchProgress({
          phase: phase as ReturnType<typeof useAppStore.getState>["fetchProgress"]["phase"],
          loaded,
          total,
        })
      },

      onTrackBatch: async (tracks, artistGenres) => {
        try {
          const result: WorkerOutput = await workerApi.processBatch({
            tracks,
            artistGenres,
            genreClusterRadius: 15,
            galaxyRadius: 50,
          })

          const store = useAppStore.getState()
          // Replace stars entirely on each batch since the orchestrator sends
          // the full accumulated track set (not incremental deltas)
          store.resetGalaxy()
          store.addStarBatch(result.stars)
          store.setGenres(result.genres)
        } catch (error) {
          console.error("Worker processBatch failed:", error)
        }
      },

      onComplete: () => {
        useAppStore.setState({ isComplete: true })
        useAppStore.getState().setFetchProgress({ phase: "complete" })
        setIsRunning(false)
      },

      onError: (error) => {
        console.error("Pipeline error:", error)
        useAppStore.getState().setFetchProgress({ phase: "idle" })
        setIsRunning(false)
      },
    })

    orchestratorRef.current = orchestrator
    await orchestrator.start()
  }, [isRunning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      orchestratorRef.current?.abort()
      workerRef.current?.terminate()
      workerRef.current = null
      orchestratorRef.current = null
    }
  }, [])

  return { startPipeline, isRunning, progress }
}
