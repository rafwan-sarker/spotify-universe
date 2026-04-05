import type { StarData } from "@/lib/spotify/types"

/**
 * Build constellation line segment points for an artist's stars.
 *
 * Returns a flat array of [x,y,z] pairs suitable for drei `Line` with
 * `segments` prop (LineSegments2 interprets pairs of points as individual
 * line segments).
 *
 * Algorithm:
 * - 0-1 stars: empty array (no lines to draw)
 * - 2-5 stars: complete graph (all unique pairs) for a true constellation look
 * - 6+ stars: hub-spoke from centroid, capped at 15 closest stars
 */
export function buildConstellationPoints(
  artistStars: StarData[]
): [number, number, number][] {
  if (artistStars.length < 2) return []

  // Complete graph for small collections (2-5 stars)
  if (artistStars.length <= 5) {
    const points: [number, number, number][] = []
    for (let i = 0; i < artistStars.length; i++) {
      for (let j = i + 1; j < artistStars.length; j++) {
        points.push(artistStars[i].position, artistStars[j].position)
      }
    }
    return points
  }

  // Hub-spoke for large collections (6+ stars)
  // Compute centroid as average of all positions
  const centroid: [number, number, number] = [0, 0, 0]
  for (const star of artistStars) {
    centroid[0] += star.position[0]
    centroid[1] += star.position[1]
    centroid[2] += star.position[2]
  }
  centroid[0] /= artistStars.length
  centroid[1] /= artistStars.length
  centroid[2] /= artistStars.length

  // Sort by distance to centroid, cap at 15 closest
  const withDist = artistStars.map((star) => {
    const dx = star.position[0] - centroid[0]
    const dy = star.position[1] - centroid[1]
    const dz = star.position[2] - centroid[2]
    return { star, dist: dx * dx + dy * dy + dz * dz }
  })
  withDist.sort((a, b) => a.dist - b.dist)
  const capped = withDist.slice(0, 15)

  // Build hub-spoke segments: centroid -> each star
  const points: [number, number, number][] = []
  for (const { star } of capped) {
    points.push(centroid, star.position)
  }

  return points
}
