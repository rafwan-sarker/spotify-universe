import { GENRE_COLORS, type StarData } from "@/lib/spotify/types"

/** Maximum pre-allocated star capacity for InstancedMesh buffers */
export const MAX_STARS = 12000

/** Per-instance buffer arrays for the galaxy InstancedMesh */
export interface StarBuffers {
  /** RGB color per star (3 floats per star) */
  colors: Float32Array
  /** Star size (1 float per star, range 0.3-2.0) */
  sizes: Float32Array
  /** Base brightness (1 float per star, range 0.0-1.0) */
  brightnesses: Float32Array
  /** Time when star was added, for fade-in animation (1 float per star) */
  birthTimes: Float32Array
  /** Random phase offset for twinkle desync (1 float per star, range 0-2PI) */
  phaseOffsets: Float32Array
  /** 1.0 for top tracks (pulse animation), 0.0 otherwise */
  isTopTracks: Float32Array
}

/**
 * Create pre-allocated buffer arrays for star instance data.
 * All arrays are initialized to zero.
 */
export function createStarBuffers(maxStars: number): StarBuffers {
  return {
    colors: new Float32Array(maxStars * 3),
    sizes: new Float32Array(maxStars),
    brightnesses: new Float32Array(maxStars),
    birthTimes: new Float32Array(maxStars),
    phaseOffsets: new Float32Array(maxStars),
    isTopTracks: new Float32Array(maxStars),
  }
}

/**
 * Simple deterministic hash of a string to a number in [0, 2*PI].
 * Uses sum of char codes modulo 2*PI for testability (no Math.random).
 */
function hashToPhaseOffset(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash += id.charCodeAt(i)
  }
  return hash % (2 * Math.PI)
}

/**
 * Write per-instance star data into pre-allocated buffers.
 *
 * This is a pure "write these stars into these buffer indices" function.
 * It writes `stars.length` stars starting at `startIndex` in the buffers.
 *
 * Birth times are staggered across `spreadDuration` seconds so stars
 * appear as a smooth continuous stream rather than in discrete bursts.
 *
 * @param buffers - Pre-allocated buffer arrays from createStarBuffers
 * @param stars - Star data to write
 * @param startIndex - Buffer index to start writing at
 * @param currentTime - Current elapsed time (for birth time base)
 * @param spreadDuration - Duration to spread birth times across (default 0.8s)
 */
export function updateStarBuffers(
  buffers: StarBuffers,
  stars: StarData[],
  startIndex: number,
  currentTime: number,
  spreadDuration: number = 0.8
): void {
  const batchSize = stars.length

  for (let i = 0; i < batchSize; i++) {
    const star = stars[i]
    const bufferIndex = startIndex + i

    // Color: look up genre in GENRE_COLORS, fall back to mystery
    const [r, g, b] = GENRE_COLORS[star.genre] ?? GENRE_COLORS["mystery"]
    buffers.colors[bufferIndex * 3 + 0] = r
    buffers.colors[bufferIndex * 3 + 1] = g
    buffers.colors[bufferIndex * 3 + 2] = b

    // Size: directly from star data
    buffers.sizes[bufferIndex] = star.size

    // Brightness: directly from star data
    buffers.brightnesses[bufferIndex] = star.brightness

    // Birth time: staggered across spread duration for smooth appearance
    buffers.birthTimes[bufferIndex] =
      currentTime + (i / batchSize) * spreadDuration

    // Phase offset: deterministic from star ID hash
    buffers.phaseOffsets[bufferIndex] = hashToPhaseOffset(star.id)

    // Top track: brightness > 0.6 threshold
    buffers.isTopTracks[bufferIndex] = star.brightness > 0.6 ? 1.0 : 0.0
  }
}
