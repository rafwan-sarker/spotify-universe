/**
 * Pure functions for flight controller math.
 * Zero React/Three.js imports -- testable in isolation.
 */

export const FLIGHT_CONSTANTS = {
  cruiseSpeed: 30, // units/second base speed
  dampingFactor: 3.0, // damping lambda for exponential decay
  idleTimeout: 5.0, // seconds before auto-drift
  maxSpeedMultiplier: 3.0, // scroll wheel max boost
  minSpeedMultiplier: 0.3, // scroll wheel min speed
  driftRotationSpeed: 0.05, // radians/second for idle drift
  pitchClamp: 85 * (Math.PI / 180), // max pitch in radians (~85 degrees)
  mouseSensitivity: 0.002, // radians per pixel of mouse movement
} as const

export type CameraMode = "idle" | "cruising" | "warping" | "inspecting"

/**
 * Apply exponential velocity damping: v * exp(-dampingFactor * delta).
 * Components below 0.001 absolute are snapped to zero to prevent drift.
 */
export function applyVelocityDamping(
  velocity: { x: number; y: number; z: number },
  dampingFactor: number,
  delta: number
): { x: number; y: number; z: number } {
  const decay = Math.exp(-dampingFactor * delta)
  let x = velocity.x * decay
  let y = velocity.y * decay
  let z = velocity.z * decay

  if (Math.abs(x) < 0.001) x = 0
  if (Math.abs(y) < 0.001) y = 0
  if (Math.abs(z) < 0.001) z = 0

  return { x, y, z }
}

/**
 * Compute cruise velocity direction from pressed keys.
 * W/ArrowUp = forward +1, S/ArrowDown = forward -1
 * A/ArrowLeft = strafe -1, D/ArrowRight = strafe +1
 * Returns normalized direction multiplied by speed.
 */
export function computeCruiseVelocity(
  keysPressed: Set<string>,
  speed: number
): { forward: number; strafe: number; vertical: number } {
  let forward = 0
  let strafe = 0
  let vertical = 0

  if (keysPressed.has("w") || keysPressed.has("arrowup")) forward += 1
  if (keysPressed.has("s") || keysPressed.has("arrowdown")) forward -= 1
  if (keysPressed.has("a") || keysPressed.has("arrowleft")) strafe -= 1
  if (keysPressed.has("d") || keysPressed.has("arrowright")) strafe += 1
  if (keysPressed.has(" ")) vertical += 1
  if (keysPressed.has("shift")) vertical -= 1

  // No movement
  if (forward === 0 && strafe === 0 && vertical === 0) {
    return { forward: 0, strafe: 0, vertical: 0 }
  }

  // Normalize diagonal movement so it doesn't exceed speed
  const magnitude = Math.sqrt(forward * forward + strafe * strafe + vertical * vertical)
  return {
    forward: (forward / magnitude) * speed,
    strafe: (strafe / magnitude) * speed,
    vertical: (vertical / magnitude) * speed,
  }
}

/**
 * Returns true when the user has been idle long enough to trigger auto-drift.
 */
export function shouldTransitionToIdle(timeSinceLastInput: number): boolean {
  return timeSinceLastInput > FLIGHT_CONSTANTS.idleTimeout
}
