/**
 * Derive all warp visual parameters from a single progress value (0-1).
 * Single source of truth prevents desync between streak stretch, FOV, and opacity.
 */

export const WARP_DURATION = 1.2 // total seconds for warp animation

export interface WarpVisuals {
  streakStretch: number // 0 to 5
  fovOffset: number // 0 to 20 (added to base FOV of 60)
  streakOpacity: number // 0 to 0.8
}

/**
 * Derive warp visual parameters from progress (0-1).
 *
 * Phase 1 (0 to 0.25): Acceleration - stars elongate, FOV widens, streaks fade in
 * Phase 2 (0.25 to 0.67): Full hyperspace - max streaks, camera traveling
 * Phase 3 (0.67 to 1.0): Deceleration - streaks shorten, FOV returns, fade out
 */
export function deriveWarpVisuals(progress: number): WarpVisuals {
  // Clamp to [0, 1]
  const p = Math.max(0, Math.min(1, progress))

  if (p <= 0.25) {
    // Phase 1: Acceleration (0 -> 0.25)
    const t = p / 0.25 // 0 to 1 within this phase
    return {
      streakStretch: t * 3, // 0 -> 3
      fovOffset: t * 20, // 0 -> 20
      streakOpacity: t * 0.8, // 0 -> 0.8
    }
  }

  if (p <= 0.67) {
    // Phase 2: Full hyperspace (0.25 -> 0.67)
    const t = (p - 0.25) / (0.67 - 0.25) // 0 to 1 within this phase
    return {
      streakStretch: 3 + t * 2, // 3 -> 5
      fovOffset: 20, // constant
      streakOpacity: 0.8, // constant
    }
  }

  // Phase 3: Deceleration (0.67 -> 1.0)
  const t = (p - 0.67) / (1.0 - 0.67) // 0 to 1 within this phase
  return {
    streakStretch: 5 * (1 - t), // 5 -> 0
    fovOffset: 20 * (1 - t), // 20 -> 0
    streakOpacity: 0.8 * (1 - t), // 0.8 -> 0
  }
}
