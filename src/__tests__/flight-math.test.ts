import { describe, it, expect } from "vitest"
import {
  applyVelocityDamping,
  computeCruiseVelocity,
  shouldTransitionToIdle,
  FLIGHT_CONSTANTS,
} from "@/lib/flight-math"

describe("flight-math", () => {
  describe("FLIGHT_CONSTANTS", () => {
    it("has cruiseSpeed, dampingFactor, idleTimeout, maxSpeedMultiplier, minSpeedMultiplier", () => {
      expect(FLIGHT_CONSTANTS).toHaveProperty("cruiseSpeed")
      expect(FLIGHT_CONSTANTS).toHaveProperty("dampingFactor")
      expect(FLIGHT_CONSTANTS).toHaveProperty("idleTimeout")
      expect(FLIGHT_CONSTANTS).toHaveProperty("maxSpeedMultiplier")
      expect(FLIGHT_CONSTANTS).toHaveProperty("minSpeedMultiplier")
    })
  })

  describe("applyVelocityDamping", () => {
    it("reduces velocity toward zero over multiple frames", () => {
      let velocity = { x: 10, y: 5, z: -8 }
      const dampingFactor = 3.0
      const delta = 0.016 // ~60fps frame

      // Apply multiple frames of damping
      for (let i = 0; i < 10; i++) {
        velocity = applyVelocityDamping(velocity, dampingFactor, delta)
      }

      // After 10 frames, velocity should be significantly reduced
      expect(Math.abs(velocity.x)).toBeLessThan(10)
      expect(Math.abs(velocity.y)).toBeLessThan(5)
      expect(Math.abs(velocity.z)).toBeLessThan(8)
    })

    it("with delta=0 returns same velocity (no change)", () => {
      const velocity = { x: 10, y: 5, z: -8 }
      const result = applyVelocityDamping(velocity, 3.0, 0)

      expect(result.x).toBe(10)
      expect(result.y).toBe(5)
      expect(result.z).toBe(-8)
    })

    it("snaps near-zero components to exactly zero", () => {
      const velocity = { x: 0.0005, y: -0.0003, z: 0.0009 }
      const result = applyVelocityDamping(velocity, 3.0, 0.016)

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
      expect(result.z).toBe(0)
    })
  })

  describe("computeCruiseVelocity", () => {
    it("with WASD keys pressed returns correct direction vectors", () => {
      const forward = computeCruiseVelocity(new Set(["w"]), 30)
      expect(forward.forward).toBeGreaterThan(0)
      expect(forward.strafe).toBe(0)

      const backward = computeCruiseVelocity(new Set(["s"]), 30)
      expect(backward.forward).toBeLessThan(0)
      expect(backward.strafe).toBe(0)

      const left = computeCruiseVelocity(new Set(["a"]), 30)
      expect(left.forward).toBe(0)
      expect(left.strafe).toBeLessThan(0)

      const right = computeCruiseVelocity(new Set(["d"]), 30)
      expect(right.forward).toBe(0)
      expect(right.strafe).toBeGreaterThan(0)
    })

    it("with arrow keys returns correct direction vectors", () => {
      const forward = computeCruiseVelocity(new Set(["arrowup"]), 30)
      expect(forward.forward).toBeGreaterThan(0)

      const backward = computeCruiseVelocity(new Set(["arrowdown"]), 30)
      expect(backward.forward).toBeLessThan(0)

      const left = computeCruiseVelocity(new Set(["arrowleft"]), 30)
      expect(left.strafe).toBeLessThan(0)

      const right = computeCruiseVelocity(new Set(["arrowright"]), 30)
      expect(right.strafe).toBeGreaterThan(0)
    })

    it("with Space/Shift returns vertical movement", () => {
      const up = computeCruiseVelocity(new Set([" "]), 30)
      expect(up.vertical).toBeGreaterThan(0)
      expect(up.forward).toBe(0)

      const down = computeCruiseVelocity(new Set(["shift"]), 30)
      expect(down.vertical).toBeLessThan(0)
      expect(down.forward).toBe(0)
    })

    it("with no keys returns zero vector", () => {
      const result = computeCruiseVelocity(new Set(), 30)
      expect(result.forward).toBe(0)
      expect(result.strafe).toBe(0)
      expect(result.vertical).toBe(0)
    })

    it("normalizes diagonal movement", () => {
      const diagonal = computeCruiseVelocity(new Set(["w", "d"]), 30)
      // Magnitude of (forward, strafe) should be approximately speed
      const magnitude = Math.sqrt(diagonal.forward ** 2 + diagonal.strafe ** 2)
      expect(magnitude).toBeCloseTo(30, 0)
    })
  })

  describe("shouldTransitionToIdle", () => {
    it("returns true when timeSinceLastInput > 5.0", () => {
      expect(shouldTransitionToIdle(5.1)).toBe(true)
      expect(shouldTransitionToIdle(10.0)).toBe(true)
    })

    it("returns false when timeSinceLastInput < 5.0", () => {
      expect(shouldTransitionToIdle(0)).toBe(false)
      expect(shouldTransitionToIdle(4.9)).toBe(false)
    })

    it("returns false when timeSinceLastInput equals exactly 5.0", () => {
      expect(shouldTransitionToIdle(5.0)).toBe(false)
    })
  })
})
