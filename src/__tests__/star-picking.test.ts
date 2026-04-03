import { describe, it, expect } from "vitest"
import { findNearestStar } from "@/lib/star-picking"
import type { StarData } from "@/lib/spotify/types"

function makeStar(overrides: Partial<StarData> = {}): StarData {
  return {
    id: overrides.id ?? "test-001",
    name: overrides.name ?? "Test Song",
    artist: overrides.artist ?? "Test Artist",
    genre: overrides.genre ?? "pop",
    position: overrides.position ?? [0, 0, 0],
    size: overrides.size ?? 1.0,
    brightness: overrides.brightness ?? 0.5,
  }
}

describe("star-picking", () => {
  describe("findNearestStar", () => {
    it("returns null when no stars are provided", () => {
      const projectFn = () => ({ x: 0, y: 0, z: 0.5 })
      const result = findNearestStar(0, 0, [], projectFn)
      expect(result).toBeNull()
    })

    it("returns nearest star within threshold distance", () => {
      const stars = [
        makeStar({ id: "far", position: [10, 10, 10] }),
        makeStar({ id: "near", position: [1, 1, 1] }),
        makeStar({ id: "medium", position: [5, 5, 5] }),
      ]

      // Mock project: "near" star projects to (0.01, 0.01), "far" to (0.5, 0.5), "medium" to (0.3, 0.3)
      const projectFn = (pos: [number, number, number]) => {
        if (pos[0] === 1) return { x: 0.01, y: 0.01, z: 0.5 }
        if (pos[0] === 5) return { x: 0.3, y: 0.3, z: 0.5 }
        return { x: 0.5, y: 0.5, z: 0.5 }
      }

      const result = findNearestStar(0, 0, stars, projectFn, 0.05)
      expect(result).not.toBeNull()
      expect(result!.id).toBe("near")
    })

    it("returns null when nearest star is beyond maxScreenDistance threshold", () => {
      const stars = [
        makeStar({ id: "far", position: [10, 10, 10] }),
      ]

      // Star projects far from click point
      const projectFn = () => ({ x: 0.5, y: 0.5, z: 0.5 })
      const result = findNearestStar(0, 0, stars, projectFn, 0.05)
      expect(result).toBeNull()
    })

    it("ignores stars behind the camera (z > 1 in NDC)", () => {
      const stars = [
        makeStar({ id: "behind", position: [0, 0, -10] }),
        makeStar({ id: "infront", position: [1, 1, 1] }),
      ]

      const projectFn = (pos: [number, number, number]) => {
        if (pos[0] === 0) return { x: 0.0, y: 0.0, z: 1.5 } // Behind camera
        return { x: 0.02, y: 0.02, z: 0.5 } // In front
      }

      const result = findNearestStar(0, 0, stars, projectFn, 0.05)
      expect(result).not.toBeNull()
      expect(result!.id).toBe("infront")
    })

    it("handles stars at the same screen position (returns first found)", () => {
      const stars = [
        makeStar({ id: "first", position: [1, 1, 1] }),
        makeStar({ id: "second", position: [2, 2, 2] }),
      ]

      // Both project to the same position
      const projectFn = () => ({ x: 0.01, y: 0.01, z: 0.5 })

      const result = findNearestStar(0, 0, stars, projectFn, 0.05)
      expect(result).not.toBeNull()
      expect(result!.id).toBe("first")
    })

    it("ignores stars with z < -1 in NDC (invalid)", () => {
      const stars = [
        makeStar({ id: "invalid", position: [0, 0, 100] }),
      ]

      const projectFn = () => ({ x: 0.0, y: 0.0, z: -1.5 })
      const result = findNearestStar(0, 0, stars, projectFn, 0.05)
      expect(result).toBeNull()
    })
  })
})
