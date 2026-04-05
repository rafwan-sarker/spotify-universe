import type { StarData, GenreCluster } from "@/lib/spotify/types"

export interface GalaxyStats {
  totalStars: number
  genreCount: number
  dominantGenre: string // Display name (e.g., "Hip-Hop")
  dominantGenreId: string // Lowercase ID (e.g., "hip-hop")
  dominantPercent: number // 0-100 integer
  personality: string // One of 5 personality types
}

export interface GalaxyBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/**
 * Compute summary statistics for the galaxy.
 * Pure function -- no side effects, no store access.
 */
export function computeGalaxyStats(
  stars: StarData[],
  genres: GenreCluster[]
): GalaxyStats {
  const total = stars.length

  if (total === 0) {
    return {
      totalStars: 0,
      genreCount: 0,
      dominantGenre: "",
      dominantGenreId: "",
      dominantPercent: 0,
      personality: "Deep Diver",
    }
  }

  // Count stars per genre
  const genreCounts = new Map<string, number>()
  for (const star of stars) {
    genreCounts.set(star.genre, (genreCounts.get(star.genre) ?? 0) + 1)
  }

  const genreCount = genreCounts.size

  // Find dominant genre
  let dominantGenreId = ""
  let maxCount = 0
  for (const [genreId, count] of genreCounts) {
    if (count > maxCount) {
      maxCount = count
      dominantGenreId = genreId
    }
  }

  // Look up display name from genres array
  const genreCluster = genres.find((g) => g.id === dominantGenreId)
  const dominantGenre = genreCluster?.name ?? dominantGenreId

  const dominantPercent = Math.round((maxCount / total) * 100)

  const personality = computePersonality(stars)

  return {
    totalStars: total,
    genreCount,
    dominantGenre,
    dominantGenreId,
    dominantPercent,
    personality,
  }
}

/**
 * Classify listening personality based on star data (D-12).
 *
 * Priority order:
 * 1. Time Traveler -- addedAt dates span 3+ decades (needs >=10 stars with dates)
 * 2. Genre Loyalist -- >50% one genre
 * 3. Eclectic Explorer -- no genre >30% AND >=6 active genres
 * 4. Mainstream Voyager -- >60% high-brightness stars
 * 5. Deep Diver -- <30% high-brightness stars
 * 6. Fallback: Deep Diver
 */
export function computePersonality(stars: StarData[]): string {
  const total = stars.length
  if (total === 0) return "Deep Diver"

  // Build genre distribution
  const genreCounts = new Map<string, number>()
  for (const star of stars) {
    genreCounts.set(star.genre, (genreCounts.get(star.genre) ?? 0) + 1)
  }

  let maxGenreCount = 0
  for (const count of genreCounts.values()) {
    if (count > maxGenreCount) maxGenreCount = count
  }
  const dominantPct = maxGenreCount / total

  // Check Time Traveler FIRST (D-12: spans many decades via addedAt dates)
  const datesWithValues = stars
    .map((s) => s.addedAt)
    .filter((d): d is string => d != null && d !== "")

  if (datesWithValues.length >= 10) {
    const decades = new Set<number>()
    for (const dateStr of datesWithValues) {
      const year = new Date(dateStr).getFullYear()
      decades.add(Math.floor(year / 10) * 10)
    }
    if (decades.size >= 3) return "Time Traveler"
  }

  // Genre Loyalist: >50% one genre
  if (dominantPct > 0.5) return "Genre Loyalist"

  // Eclectic Explorer: no genre >30% AND >=6 active genres
  const activeGenres = genreCounts.size
  if (dominantPct < 0.3 && activeGenres >= 6) return "Eclectic Explorer"

  // Brightness-based classification
  let highBrightnessCount = 0
  for (const star of stars) {
    if (star.brightness > 0.6) highBrightnessCount++
  }
  const highBrightnessPct = highBrightnessCount / total

  // Mainstream Voyager: >60% high-brightness
  if (highBrightnessPct > 0.6) return "Mainstream Voyager"

  // Deep Diver: <30% high-brightness
  if (highBrightnessPct < 0.3) return "Deep Diver"

  // Default fallback
  return "Deep Diver"
}

/**
 * Compute X/Z bounds from genre cluster centroids with padding.
 * Used by MiniMap to establish the 2D projection range.
 */
export function computeGalaxyBounds(genres: GenreCluster[]): GalaxyBounds {
  if (genres.length === 0) {
    return { minX: -20, maxX: 20, minZ: -20, maxZ: 20 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity

  for (const genre of genres) {
    const [x, , z] = genre.centroid
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }

  // Add 20-unit padding on each side
  return {
    minX: minX - 20,
    maxX: maxX + 20,
    minZ: minZ - 20,
    maxZ: maxZ + 20,
  }
}

/**
 * Project a 3D world position to 2D minimap coordinates.
 * Flattens Y axis, maps X to minimap x and Z to minimap y.
 */
export function projectToMinimap(
  worldPos: [number, number, number],
  bounds: GalaxyBounds,
  mapSize: number
): { x: number; y: number } {
  const rangeX = bounds.maxX - bounds.minX
  const rangeZ = bounds.maxZ - bounds.minZ

  const x = rangeX === 0 ? mapSize / 2 : ((worldPos[0] - bounds.minX) / rangeX) * mapSize
  const y = rangeZ === 0 ? mapSize / 2 : ((worldPos[2] - bounds.minZ) / rangeZ) * mapSize

  return { x, y }
}
