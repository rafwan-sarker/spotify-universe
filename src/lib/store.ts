import { create } from "zustand"
import type { StarData, GenreCluster } from "@/lib/spotify/types"

type AppMode = "demo" | "authenticated" | "transitioning"

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
}))
