import type { StarData } from "@/lib/spotify/types"

/**
 * Find the nearest star to a screen-space click position using NDC coordinates.
 * Bypasses raycaster entirely -- necessary because billboard vertex shader
 * moves geometry on GPU where CPU raycaster cannot follow.
 *
 * Performance: O(n) scan, <1ms for 10K stars. Only runs on click, not per-frame.
 *
 * @param ndcX - Click X in normalized device coordinates (-1 to 1)
 * @param ndcY - Click Y in normalized device coordinates (-1 to 1)
 * @param stars - Array of all star data
 * @param projectFn - Projects a world position to NDC {x, y, z}
 * @param maxNdcDistance - Maximum NDC distance to consider a hit (default 0.05)
 * @returns Nearest star within threshold, or null
 */
export function findNearestStar(
  ndcX: number,
  ndcY: number,
  stars: StarData[],
  projectFn: (
    position: [number, number, number]
  ) => { x: number; y: number; z: number },
  maxNdcDistance: number = 0.05
): StarData | null {
  if (stars.length === 0) return null

  let nearest: StarData | null = null
  let nearestDist = Infinity

  for (const star of stars) {
    const projected = projectFn(star.position)

    // Skip stars outside valid NDC z range (behind camera or invalid)
    if (projected.z < -1 || projected.z > 1) continue

    const dx = projected.x - ndcX
    const dy = projected.y - ndcY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < maxNdcDistance && dist < nearestDist) {
      nearestDist = dist
      nearest = star
    }
  }

  return nearest
}
