import type { TopTrackRanking, NormalizedTrack } from "./types"

/**
 * Compute star size based on top-track ranking position.
 *
 * Size tiers (per RESEARCH.md):
 *   Top 10 (any time range):    1.5 - 2.0 (supergiant)
 *   Top 11-50 (any time range): 0.8 - 1.5 (large)
 *   Not in top tracks:          0.3 - 0.7 (standard)
 *
 * Time range priority: short_term gets a slight boost.
 */
export function computeStarSize(ranking: TopTrackRanking | null): number {
  if (!ranking) {
    // No ranking: return a value in the 0.3-0.7 range
    // Use a deterministic middle value since we lack a track ID here
    return 0.3 + Math.random() * 0.4
  }

  // Time range weight: short_term is "hotter" (shifts toward top of range)
  const timeWeight =
    ranking.timeRange === "short_term"
      ? 1.0
      : ranking.timeRange === "medium_term"
        ? 0.5
        : 0

  if (ranking.position < 10) {
    // Top 10: lerp from 2.0 (position 0) to 1.5 (position 9)
    // Time weight shifts the floor up slightly
    const t = ranking.position / 9
    const base = 2.0 - t * 0.5
    const boost = timeWeight * 0.03 * (1 - t) // more boost at top positions
    return Math.min(2.0, base + boost)
  }

  // Top 11-50: lerp from 1.5 (position 10) to 0.8 (position 49)
  const t = (ranking.position - 10) / 39
  const base = 1.5 - t * 0.7
  const boost = timeWeight * 0.02 * (1 - t)
  return Math.min(1.5, base + boost)
}

/**
 * Compute star brightness based on ranking and source type.
 *
 * Brightness rules (per RESEARCH.md):
 *   short_term top:    0.8 - 1.0
 *   medium_term top:   0.6 - 0.8
 *   long_term top:     0.4 - 0.6
 *   recent source:     0.5 - 0.7
 *   saved (no rank):   0.2 - 0.4
 *   playlist only:     0.1 - 0.3
 *
 * Ranking takes priority over source.
 */
export function computeStarBrightness(
  ranking: TopTrackRanking | null,
  source: NormalizedTrack["source"]
): number {
  // If ranked, brightness is driven by time range
  if (ranking) {
    // Higher position = brighter (position 0 = brightest)
    const positionFactor = 1 - ranking.position / 49

    switch (ranking.timeRange) {
      case "short_term":
        return 0.8 + positionFactor * 0.2
      case "medium_term":
        return 0.6 + positionFactor * 0.2
      case "long_term":
        return 0.4 + positionFactor * 0.2
    }
  }

  // No ranking: brightness based on source
  switch (source) {
    case "top":
      // Should not happen (top tracks have rankings), but handle gracefully
      return 0.6
    case "recent":
      return 0.5 + Math.random() * 0.2
    case "saved":
      return 0.2 + Math.random() * 0.2
    case "playlist":
      return 0.1 + Math.random() * 0.2
  }
}

/**
 * Generate evenly distributed points on a sphere using golden-ratio
 * (Fibonacci) distribution.
 *
 * Used for placing genre cluster centroids so no cluster is "more central."
 */
export function fibonacciSphere(
  count: number,
  radius: number
): [number, number, number][] {
  if (count === 0) return []

  const points: [number, number, number][] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ~2.3999 radians

  for (let i = 0; i < count; i++) {
    // For a single point, place it at the north pole
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2 // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    points.push([x * radius, y * radius, z * radius])
  }

  return points
}

/**
 * Compute a star's 3D position within its genre cluster.
 *
 * Placement rules (per D-09):
 *   Top 10 ranked:  inner 20% of cluster radius (near center)
 *   Top 11-50:      inner 50% of cluster radius
 *   Unranked:       between 30%-100% of cluster radius (edges)
 *
 * Uses golden-angle distribution within the shell to avoid clumping.
 * Adds small random jitter for organic feel.
 */
export function computeStarPosition(
  centroid: [number, number, number],
  ranking: TopTrackRanking | null,
  clusterRadius: number,
  index: number,
  totalInCluster: number
): [number, number, number] {
  // Determine distance shell based on ranking
  let minRadius: number
  let maxRadius: number

  if (ranking && ranking.position < 10) {
    // Top 10: inner 20%
    minRadius = 0
    maxRadius = clusterRadius * 0.2
  } else if (ranking && ranking.position < 50) {
    // Top 11-50: inner 50%
    minRadius = clusterRadius * 0.1
    maxRadius = clusterRadius * 0.5
  } else {
    // Unranked: 30%-100%
    minRadius = clusterRadius * 0.3
    maxRadius = clusterRadius * 1.0
  }

  // Golden-angle distribution for even spacing within the shell
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const theta = goldenAngle * index

  // Use index to determine vertical placement (spread across the sphere)
  const t = totalInCluster > 1 ? index / (totalInCluster - 1) : 0.5
  const y = 1 - t * 2 // -1 to 1
  const radiusAtY = Math.sqrt(1 - y * y)

  // Distance from centroid within the shell
  const shellT = totalInCluster > 1 ? (index % 7) / 6 : 0.5
  const distance = minRadius + shellT * (maxRadius - minRadius)

  // Convert to 3D offset from centroid
  const x = Math.cos(theta) * radiusAtY * distance
  const yOffset = y * distance
  const z = Math.sin(theta) * radiusAtY * distance

  // Small random jitter for organic feel (deterministic-ish from index)
  const jitterScale = clusterRadius * 0.03
  const jx = Math.sin(index * 127.1) * jitterScale
  const jy = Math.sin(index * 269.5) * jitterScale
  const jz = Math.sin(index * 419.2) * jitterScale

  return [
    centroid[0] + x + jx,
    centroid[1] + yOffset + jy,
    centroid[2] + z + jz,
  ]
}
