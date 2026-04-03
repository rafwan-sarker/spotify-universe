import type { NormalizedTrack, StarData, GenreCluster } from "@/lib/spotify/types"

export interface WorkerInput {
  tracks: NormalizedTrack[]
  artistGenres: Record<string, string[]> // artistId -> genres array (plain object, not Map -- Comlink can't transfer Maps)
  genreClusterRadius: number // default 15
  galaxyRadius: number // default 50
}

export interface WorkerOutput {
  stars: StarData[]
  genres: GenreCluster[]
}
