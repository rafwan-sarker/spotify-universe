import { describe, it, expect } from "vitest"
import { deriveWarpVisuals, WARP_DURATION } from "@/lib/warp-visuals"

describe("warp-visuals", () => {
  describe("WARP_DURATION", () => {
    it("equals 1.2 (total seconds)", () => {
      expect(WARP_DURATION).toBe(1.2)
    })
  })

  describe("deriveWarpVisuals", () => {
    it("at progress=0 returns zero stretch, zero fovOffset, zero opacity (start)", () => {
      const v = deriveWarpVisuals(0)
      expect(v.streakStretch).toBe(0)
      expect(v.fovOffset).toBe(0)
      expect(v.streakOpacity).toBe(0)
    })

    it("at progress=0.25 returns stretch=3, fovOffset=20, opacity=0.8 (end of acceleration)", () => {
      const v = deriveWarpVisuals(0.25)
      expect(v.streakStretch).toBeCloseTo(3, 1)
      expect(v.fovOffset).toBeCloseTo(20, 1)
      expect(v.streakOpacity).toBeCloseTo(0.8, 1)
    })

    it("at progress=0.5 returns stretch between 3-5, fovOffset=20, opacity=0.8 (mid-hyperspace)", () => {
      const v = deriveWarpVisuals(0.5)
      expect(v.streakStretch).toBeGreaterThanOrEqual(3)
      expect(v.streakStretch).toBeLessThanOrEqual(5)
      expect(v.fovOffset).toBeCloseTo(20, 1)
      expect(v.streakOpacity).toBeCloseTo(0.8, 1)
    })

    it("at progress=0.67 returns stretch=5, fovOffset=20, opacity=0.8 (end of hyperspace)", () => {
      const v = deriveWarpVisuals(0.67)
      expect(v.streakStretch).toBeCloseTo(5, 0)
      expect(v.fovOffset).toBeCloseTo(20, 1)
      expect(v.streakOpacity).toBeCloseTo(0.8, 1)
    })

    it("at progress=1.0 returns zero stretch, zero fovOffset, zero opacity (arrival)", () => {
      const v = deriveWarpVisuals(1.0)
      expect(v.streakStretch).toBeCloseTo(0, 1)
      expect(v.fovOffset).toBeCloseTo(0, 1)
      expect(v.streakOpacity).toBeCloseTo(0, 1)
    })

    it("clamps progress below 0 to 0", () => {
      const v = deriveWarpVisuals(-0.5)
      expect(v.streakStretch).toBe(0)
      expect(v.fovOffset).toBe(0)
      expect(v.streakOpacity).toBe(0)
    })

    it("clamps progress above 1 to 1", () => {
      const v = deriveWarpVisuals(1.5)
      expect(v.streakStretch).toBeCloseTo(0, 1)
      expect(v.fovOffset).toBeCloseTo(0, 1)
      expect(v.streakOpacity).toBeCloseTo(0, 1)
    })
  })
})
