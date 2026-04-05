import { create } from "zustand"
import type { StarData, GenreCluster } from "@/lib/spotify/types"
import type { GalaxyStats } from "@/lib/galaxy-stats"

type AppMode = "demo" | "authenticated" | "transitioning"

export type CameraMode = 'idle' | 'cruising' | 'warping' | 'inspecting'

type FetchPhase =
  | "idle"
  | "tracks"
  | "top-tracks"
  | "playlists"
  | "recently-played"
  | "artists"
  | "computing"
  | "complete"

interface FetchProgress {
  phase: FetchPhase
  loaded: number
  total: number
}

interface AppStore {
  // Auth/mode state (existing)
  mode: AppMode
  setMode: (mode: AppMode) => void
  user: { name: string; image: string | null } | null
  setUser: (user: AppStore["user"]) => void

  // Galaxy data
  stars: StarData[]
  genres: GenreCluster[]
  fetchProgress: FetchProgress
  isComplete: boolean

  // Galaxy actions
  addStarBatch: (batch: StarData[]) => void
  setGenres: (genres: GenreCluster[]) => void
  setFetchProgress: (progress: Partial<FetchProgress>) => void
  resetGalaxy: () => void

  // Navigation state
  cameraMode: CameraMode
  setCameraMode: (mode: CameraMode) => void
  warpTarget: { position: [number, number, number]; starId?: string } | null
  warpProgress: number
  startWarp: (target: { position: [number, number, number]; starId?: string }) => void
  clearWarp: () => void
  selectedStar: StarData | null
  setSelectedStar: (star: StarData | null) => void
  searchOpen: boolean
  searchQuery: string
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void

  // Galaxy stats (computed after galaxy finishes building)
  galaxyStats: GalaxyStats | null
  setGalaxyStats: (stats: GalaxyStats) => void
}

const initialGalaxyState = {
  stars: [] as StarData[],
  genres: [] as GenreCluster[],
  fetchProgress: { phase: "idle" as FetchPhase, loaded: 0, total: 0 },
  isComplete: false,
}

export const useAppStore = create<AppStore>((set) => ({
  // Existing auth/mode state
  mode: "demo",
  setMode: (mode) => set({ mode }),
  user: null,
  setUser: (user) => set({ user }),

  // Galaxy data (initial)
  ...initialGalaxyState,

  // Galaxy actions
  addStarBatch: (batch) =>
    set((state) => ({ stars: [...state.stars, ...batch] })),

  setGenres: (genres) => set({ genres }),

  setFetchProgress: (progress) =>
    set((state) => ({
      fetchProgress: { ...state.fetchProgress, ...progress },
    })),

  resetGalaxy: () => set(initialGalaxyState),

  // Navigation state (initial values)
  cameraMode: 'idle' as CameraMode,
  setCameraMode: (cameraMode) => set({ cameraMode }),
  warpTarget: null,
  warpProgress: 0,
  startWarp: (target) => set({ warpTarget: target, warpProgress: 0, cameraMode: 'warping' as CameraMode }),
  clearWarp: () => set({ warpTarget: null, warpProgress: 0 }),
  selectedStar: null,
  setSelectedStar: (selectedStar) => set({ selectedStar }),
  searchOpen: false,
  searchQuery: '',
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Galaxy stats
  galaxyStats: null,
  setGalaxyStats: (galaxyStats) => set({ galaxyStats }),
}))
