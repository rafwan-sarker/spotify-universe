import * as Comlink from "comlink"
import { classifyArtistGenres } from "@/lib/spotify/genre-map"
import {
  computeStarSize,
  computeStarBrightness,
  computeStarPosition,
  fibonacciSphere,
} from "@/lib/spotify/star-data"
import { GENRE_COLORS, GENRE_CONFIG } from "@/lib/spotify/types"
import type { NormalizedTrack, StarData, GenreCluster } from "@/lib/spotify/types"
import type { WorkerInput, WorkerOutput } from "./galaxy-layout.types"

/**
 * Process a batch of normalized tracks into positioned star data.
 *
 * Steps:
 * 1. Classify each track's genre using artist genre data
 * 2. Group tracks by genre cluster
 * 3. Compute cluster centroids via Fibonacci sphere
 * 4. Compute star size, brightness, and position for each track
 */
function processBatch(input: WorkerInput): WorkerOutput {
  const { tracks, artistGenres, genreClusterRadius, galaxyRadius } = input

  // Step 1: Classify each track's genre from its artist's genres
  const tracksWithGenre: NormalizedTrack[] = tracks.map((track) => {
    const genres = artistGenres[track.artistId] ?? []
    const genre = classifyArtistGenres(genres)
    return { ...track, genre }
  })

  // Step 2: Group tracks by genre
  const tracksByGenre = new Map<string, NormalizedTrack[]>()
  for (const track of tracksWithGenre) {
    const existing = tracksByGenre.get(track.genre) ?? []
    existing.push(track)
    tracksByGenre.set(track.genre, existing)
  }

  // Step 3: Compute cluster centroids using Fibonacci sphere
  // Only create clusters for genres that have tracks
  const activeGenreIds = Array.from(tracksByGenre.keys())
  const centroids = fibonacciSphere(activeGenreIds.length, galaxyRadius)

  // Build GenreCluster array
  const genres: GenreCluster[] = activeGenreIds.map((genreId, i) => {
    const config = GENRE_CONFIG.find((g) => g.id === genreId)
    return {
      id: genreId,
      name: config?.name ?? genreId,
      color: GENRE_COLORS[genreId] ?? GENRE_COLORS["mystery"],
      centroid: centroids[i],
    }
  })

  // Build a centroid lookup for star positioning
  const centroidMap = new Map<string, [number, number, number]>()
  for (const genre of genres) {
    centroidMap.set(genre.id, genre.centroid)
  }

  // Step 4: Compute star data for each track
  const stars: StarData[] = []

  for (const genreId of activeGenreIds) {
    const genreTracks = tracksByGenre.get(genreId) ?? []
    const centroid = centroidMap.get(genreId)!

    for (let i = 0; i < genreTracks.length; i++) {
      const track = genreTracks[i]
      const size = computeStarSize(track.topRanking)
      const brightness = computeStarBrightness(track.topRanking, track.source)
      const position = computeStarPosition(
        centroid,
        track.topRanking,
        genreClusterRadius,
        i,
        genreTracks.length
      )

      stars.push({
        id: track.id,
        name: track.name,
        artist: track.artistName,
        genre: genreId,
        position,
        size,
        brightness,
        albumArt: track.albumArt,
        addedAt: track.addedAt,
      })
    }
  }

  return { stars, genres }
}

Comlink.expose({ processBatch })
