import { describe, it, expect } from "vitest"
import {
  createStarBuffers,
  updateStarBuffers,
  MAX_STARS,
  type StarBuffers,
} from "@/lib/galaxy-buffers"
import { GENRE_COLORS, type StarData } from "@/lib/spotify/types"

function makeStar(overrides: Partial<StarData> = {}): StarData {
  return {
    id: overrides.id ?? "test-001",
    name: overrides.name ?? "Test Song",
    artist: overrides.artist ?? "Test Artist",
    genre: overrides.genre ?? "pop",
    position: overrides.position ?? [1, 2, 3],
    size: overrides.size ?? 1.0,
    brightness: overrides.brightness ?? 0.5,
  }
}

describe("galaxy-buffers", () => {
  describe("MAX_STARS", () => {
    it("is 12000", () => {
      expect(MAX_STARS).toBe(12000)
    })
  })

  describe("createStarBuffers", () => {
    it("returns Float32Arrays of correct sizes for given capacity", () => {
      const buffers = createStarBuffers(12000)

      expect(buffers.colors).toBeInstanceOf(Float32Array)
      expect(buffers.colors.length).toBe(12000 * 3)

      expect(buffers.sizes).toBeInstanceOf(Float32Array)
      expect(buffers.sizes.length).toBe(12000)

      expect(buffers.brightnesses).toBeInstanceOf(Float32Array)
      expect(buffers.brightnesses.length).toBe(12000)

      expect(buffers.birthTimes).toBeInstanceOf(Float32Array)
      expect(buffers.birthTimes.length).toBe(12000)

      expect(buffers.phaseOffsets).toBeInstanceOf(Float32Array)
      expect(buffers.phaseOffsets.length).toBe(12000)

      expect(buffers.isTopTracks).toBeInstanceOf(Float32Array)
      expect(buffers.isTopTracks.length).toBe(12000)
    })

    it("initializes all buffer arrays to zero", () => {
      const buffers = createStarBuffers(100)

      for (let i = 0; i < 100 * 3; i++) {
        expect(buffers.colors[i]).toBe(0)
      }
      for (let i = 0; i < 100; i++) {
        expect(buffers.sizes[i]).toBe(0)
        expect(buffers.brightnesses[i]).toBe(0)
        expect(buffers.birthTimes[i]).toBe(0)
        expect(buffers.phaseOffsets[i]).toBe(0)
        expect(buffers.isTopTracks[i]).toBe(0)
      }
    })
  })

  describe("updateStarBuffers", () => {
    it("sets correct color values from GENRE_COLORS for each star genre", () => {
      const buffers = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "s1", genre: "pop" }),
        makeStar({ id: "s2", genre: "rock" }),
        makeStar({ id: "s3", genre: "electronic" }),
        makeStar({ id: "s4", genre: "hip-hop" }),
        makeStar({ id: "s5", genre: "rnb" }),
      ]

      updateStarBuffers(buffers, stars, 0, 10.0)

      for (let i = 0; i < stars.length; i++) {
        const [r, g, b] = GENRE_COLORS[stars[i].genre]
        expect(buffers.colors[i * 3 + 0]).toBeCloseTo(r, 5)
        expect(buffers.colors[i * 3 + 1]).toBeCloseTo(g, 5)
        expect(buffers.colors[i * 3 + 2]).toBeCloseTo(b, 5)
      }
    })

    it("sets correct size values from StarData.size", () => {
      const buffers = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "s1", size: 0.5 }),
        makeStar({ id: "s2", size: 1.2 }),
        makeStar({ id: "s3", size: 2.0 }),
        makeStar({ id: "s4", size: 0.3 }),
        makeStar({ id: "s5", size: 1.8 }),
      ]

      updateStarBuffers(buffers, stars, 0, 10.0)

      expect(buffers.sizes[0]).toBeCloseTo(0.5, 5)
      expect(buffers.sizes[1]).toBeCloseTo(1.2, 5)
      expect(buffers.sizes[2]).toBeCloseTo(2.0, 5)
      expect(buffers.sizes[3]).toBeCloseTo(0.3, 5)
      expect(buffers.sizes[4]).toBeCloseTo(1.8, 5)
    })

    it("marks stars with brightness > 0.6 as isTopTrack=1.0, others as 0.0", () => {
      const buffers = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "s1", brightness: 0.3 }),
        makeStar({ id: "s2", brightness: 0.6 }),
        makeStar({ id: "s3", brightness: 0.61 }),
        makeStar({ id: "s4", brightness: 0.9 }),
        makeStar({ id: "s5", brightness: 1.0 }),
      ]

      updateStarBuffers(buffers, stars, 0, 10.0)

      expect(buffers.isTopTracks[0]).toBe(0.0) // 0.3 <= 0.6
      expect(buffers.isTopTracks[1]).toBe(0.0) // 0.6 <= 0.6 (not > 0.6)
      expect(buffers.isTopTracks[2]).toBe(1.0) // 0.61 > 0.6
      expect(buffers.isTopTracks[3]).toBe(1.0) // 0.9 > 0.6
      expect(buffers.isTopTracks[4]).toBe(1.0) // 1.0 > 0.6
    })

    it("staggers birth times evenly across spreadDuration", () => {
      const buffers = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "s1" }),
        makeStar({ id: "s2" }),
        makeStar({ id: "s3" }),
        makeStar({ id: "s4" }),
        makeStar({ id: "s5" }),
      ]
      const currentTime = 10.0
      const spreadDuration = 0.8

      updateStarBuffers(buffers, stars, 0, currentTime, spreadDuration)

      // 5 stars over 0.8s: births at offsets 0/5*0.8, 1/5*0.8, 2/5*0.8, 3/5*0.8, 4/5*0.8
      // = 0, 0.16, 0.32, 0.48, 0.64 offset from currentTime
      expect(buffers.birthTimes[0]).toBeCloseTo(10.0, 5)
      expect(buffers.birthTimes[1]).toBeCloseTo(10.16, 5)
      expect(buffers.birthTimes[2]).toBeCloseTo(10.32, 5)
      expect(buffers.birthTimes[3]).toBeCloseTo(10.48, 5)
      expect(buffers.birthTimes[4]).toBeCloseTo(10.64, 5)
    })

    it("only writes indices from startIndex onward, leaving earlier indices untouched", () => {
      const buffers = createStarBuffers(100)

      // First write: 3 stars at index 0
      const firstBatch: StarData[] = [
        makeStar({ id: "a1", genre: "pop", size: 0.5 }),
        makeStar({ id: "a2", genre: "rock", size: 0.8 }),
        makeStar({ id: "a3", genre: "jazz", size: 1.2 }),
      ]
      updateStarBuffers(buffers, firstBatch, 0, 5.0)

      // Save values at indices 0-2
      const savedColors = new Float32Array(buffers.colors.slice(0, 9))
      const savedSizes = new Float32Array(buffers.sizes.slice(0, 3))
      const savedBirthTimes = new Float32Array(buffers.birthTimes.slice(0, 3))

      // Second write: 2 stars starting at index 3 (startIndex=3)
      const secondBatch: StarData[] = [
        makeStar({ id: "b1", genre: "electronic", size: 1.5 }),
        makeStar({ id: "b2", genre: "indie", size: 1.9 }),
      ]
      updateStarBuffers(buffers, secondBatch, 3, 8.0)

      // Indices 0-2 should be untouched
      for (let i = 0; i < 9; i++) {
        expect(buffers.colors[i]).toBe(savedColors[i])
      }
      for (let i = 0; i < 3; i++) {
        expect(buffers.sizes[i]).toBe(savedSizes[i])
        expect(buffers.birthTimes[i]).toBe(savedBirthTimes[i])
      }

      // Index 3 should have electronic color
      const [er, eg, eb] = GENRE_COLORS["electronic"]
      expect(buffers.colors[3 * 3 + 0]).toBeCloseTo(er, 5)
      expect(buffers.colors[3 * 3 + 1]).toBeCloseTo(eg, 5)
      expect(buffers.colors[3 * 3 + 2]).toBeCloseTo(eb, 5)
      expect(buffers.sizes[3]).toBeCloseTo(1.5, 5)

      // Index 4 should have indie color
      const [ir, ig, ib] = GENRE_COLORS["indie"]
      expect(buffers.colors[4 * 3 + 0]).toBeCloseTo(ir, 5)
      expect(buffers.colors[4 * 3 + 1]).toBeCloseTo(ig, 5)
      expect(buffers.colors[4 * 3 + 2]).toBeCloseTo(ib, 5)
      expect(buffers.sizes[4]).toBeCloseTo(1.9, 5)
    })

    it("falls back to mystery color for unknown genres", () => {
      const buffers = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "s1", genre: "unknown-genre" }),
        makeStar({ id: "s2", genre: "kpop" }),
      ]

      updateStarBuffers(buffers, stars, 0, 10.0)

      const [mr, mg, mb] = GENRE_COLORS["mystery"]
      // Both unknown genres should get mystery color
      expect(buffers.colors[0]).toBeCloseTo(mr, 5)
      expect(buffers.colors[1]).toBeCloseTo(mg, 5)
      expect(buffers.colors[2]).toBeCloseTo(mb, 5)

      expect(buffers.colors[3]).toBeCloseTo(mr, 5)
      expect(buffers.colors[4]).toBeCloseTo(mg, 5)
      expect(buffers.colors[5]).toBeCloseTo(mb, 5)
    })

    it("generates phaseOffsets in range [0, 2*PI] for each star", () => {
      const buffers = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "alpha" }),
        makeStar({ id: "beta" }),
        makeStar({ id: "gamma" }),
        makeStar({ id: "delta" }),
        makeStar({ id: "epsilon" }),
      ]

      updateStarBuffers(buffers, stars, 0, 10.0)

      for (let i = 0; i < stars.length; i++) {
        expect(buffers.phaseOffsets[i]).toBeGreaterThanOrEqual(0)
        expect(buffers.phaseOffsets[i]).toBeLessThanOrEqual(Math.PI * 2)
      }
    })

    it("generates deterministic phaseOffsets based on star ID", () => {
      const buffers1 = createStarBuffers(100)
      const buffers2 = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "track-abc" }),
        makeStar({ id: "track-xyz" }),
      ]

      updateStarBuffers(buffers1, stars, 0, 10.0)
      updateStarBuffers(buffers2, stars, 0, 20.0) // different time, same stars

      // Same star IDs should produce same phase offsets
      expect(buffers1.phaseOffsets[0]).toBe(buffers2.phaseOffsets[0])
      expect(buffers1.phaseOffsets[1]).toBe(buffers2.phaseOffsets[1])

      // Different IDs should produce different offsets (with high probability)
      expect(buffers1.phaseOffsets[0]).not.toBe(buffers1.phaseOffsets[1])
    })

    it("writes brightness values from StarData.brightness", () => {
      const buffers = createStarBuffers(100)
      const stars: StarData[] = [
        makeStar({ id: "s1", brightness: 0.1 }),
        makeStar({ id: "s2", brightness: 0.5 }),
        makeStar({ id: "s3", brightness: 0.9 }),
      ]

      updateStarBuffers(buffers, stars, 0, 10.0)

      expect(buffers.brightnesses[0]).toBeCloseTo(0.1, 5)
      expect(buffers.brightnesses[1]).toBeCloseTo(0.5, 5)
      expect(buffers.brightnesses[2]).toBeCloseTo(0.9, 5)
    })
  })
})
