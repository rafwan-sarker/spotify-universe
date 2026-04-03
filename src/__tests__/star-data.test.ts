import { describe, it, expect } from "vitest"
import {
  computeStarSize,
  computeStarBrightness,
  fibonacciSphere,
  computeStarPosition,
} from "@/lib/spotify/star-data"
import type { TopTrackRanking } from "@/lib/spotify/types"

describe("computeStarSize", () => {
  it("returns value in 1.5-2.0 range for top 5 short_term ranking", () => {
    const ranking: TopTrackRanking = { position: 4, timeRange: "short_term" }
    const size = computeStarSize(ranking)
    expect(size).toBeGreaterThanOrEqual(1.5)
    expect(size).toBeLessThanOrEqual(2.0)
  })

  it("returns value in 1.5-2.0 range for position 0 (top 1)", () => {
    const ranking: TopTrackRanking = { position: 0, timeRange: "short_term" }
    const size = computeStarSize(ranking)
    expect(size).toBeGreaterThanOrEqual(1.5)
    expect(size).toBeLessThanOrEqual(2.0)
  })

  it("returns value in 1.5-2.0 range for position 9 (top 10)", () => {
    const ranking: TopTrackRanking = { position: 9, timeRange: "medium_term" }
    const size = computeStarSize(ranking)
    expect(size).toBeGreaterThanOrEqual(1.5)
    expect(size).toBeLessThanOrEqual(2.0)
  })

  it("returns value in 0.8-1.5 range for top 30 medium_term ranking", () => {
    const ranking: TopTrackRanking = { position: 29, timeRange: "medium_term" }
    const size = computeStarSize(ranking)
    expect(size).toBeGreaterThanOrEqual(0.8)
    expect(size).toBeLessThanOrEqual(1.5)
  })

  it("returns value in 0.8-1.5 range for position 15", () => {
    const ranking: TopTrackRanking = { position: 15, timeRange: "long_term" }
    const size = computeStarSize(ranking)
    expect(size).toBeGreaterThanOrEqual(0.8)
    expect(size).toBeLessThanOrEqual(1.5)
  })

  it("returns value in 0.3-0.7 range for no ranking", () => {
    const size = computeStarSize(null)
    expect(size).toBeGreaterThanOrEqual(0.3)
    expect(size).toBeLessThanOrEqual(0.7)
  })

  it("returns larger size for position 0 than position 9", () => {
    const top1: TopTrackRanking = { position: 0, timeRange: "short_term" }
    const top10: TopTrackRanking = { position: 9, timeRange: "short_term" }
    expect(computeStarSize(top1)).toBeGreaterThan(computeStarSize(top10))
  })

  it("returns larger size for short_term than long_term at same position", () => {
    const short: TopTrackRanking = { position: 5, timeRange: "short_term" }
    const long: TopTrackRanking = { position: 5, timeRange: "long_term" }
    expect(computeStarSize(short)).toBeGreaterThanOrEqual(computeStarSize(long))
  })
})

describe("computeStarBrightness", () => {
  it("returns 0.8-1.0 for short_term top track", () => {
    const ranking: TopTrackRanking = { position: 3, timeRange: "short_term" }
    const brightness = computeStarBrightness(ranking, "top")
    expect(brightness).toBeGreaterThanOrEqual(0.8)
    expect(brightness).toBeLessThanOrEqual(1.0)
  })

  it("returns 0.6-0.8 for medium_term top track", () => {
    const ranking: TopTrackRanking = { position: 10, timeRange: "medium_term" }
    const brightness = computeStarBrightness(ranking, "top")
    expect(brightness).toBeGreaterThanOrEqual(0.6)
    expect(brightness).toBeLessThanOrEqual(0.8)
  })

  it("returns 0.4-0.6 for long_term top track", () => {
    const ranking: TopTrackRanking = { position: 20, timeRange: "long_term" }
    const brightness = computeStarBrightness(ranking, "top")
    expect(brightness).toBeGreaterThanOrEqual(0.4)
    expect(brightness).toBeLessThanOrEqual(0.6)
  })

  it("returns 0.5-0.7 for recent source (no ranking)", () => {
    const brightness = computeStarBrightness(null, "recent")
    expect(brightness).toBeGreaterThanOrEqual(0.5)
    expect(brightness).toBeLessThanOrEqual(0.7)
  })

  it("returns 0.2-0.4 for saved-only track (no ranking)", () => {
    const brightness = computeStarBrightness(null, "saved")
    expect(brightness).toBeGreaterThanOrEqual(0.2)
    expect(brightness).toBeLessThanOrEqual(0.4)
  })

  it("returns 0.1-0.3 for playlist-only track", () => {
    const brightness = computeStarBrightness(null, "playlist")
    expect(brightness).toBeGreaterThanOrEqual(0.1)
    expect(brightness).toBeLessThanOrEqual(0.3)
  })

  it("ranking takes priority over source for brightness", () => {
    const ranking: TopTrackRanking = { position: 0, timeRange: "short_term" }
    const brightness = computeStarBrightness(ranking, "saved")
    // Even though source is "saved", ranking should give higher brightness
    expect(brightness).toBeGreaterThanOrEqual(0.8)
  })
})

describe("fibonacciSphere", () => {
  it("returns the correct number of points", () => {
    const points = fibonacciSphere(12, 50)
    expect(points).toHaveLength(12)
  })

  it("all points are at approximately the given radius from origin", () => {
    const radius = 50
    const points = fibonacciSphere(12, radius)
    for (const [x, y, z] of points) {
      const distance = Math.sqrt(x * x + y * y + z * z)
      expect(distance).toBeCloseTo(radius, 0)
    }
  })

  it("points are roughly evenly distributed (no two closer than 20 units for 12 points at radius 50)", () => {
    const points = fibonacciSphere(12, 50)
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i][0] - points[j][0]
        const dy = points[i][1] - points[j][1]
        const dz = points[i][2] - points[j][2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        expect(dist).toBeGreaterThan(20)
      }
    }
  })

  it("returns empty array for count 0", () => {
    expect(fibonacciSphere(0, 50)).toHaveLength(0)
  })

  it("returns single point for count 1", () => {
    const points = fibonacciSphere(1, 50)
    expect(points).toHaveLength(1)
  })
})

describe("computeStarPosition", () => {
  const centroid: [number, number, number] = [30, 0, 10]
  const clusterRadius = 15

  it("places a top-ranked track closer to centroid than an unranked track", () => {
    const ranked: TopTrackRanking = { position: 2, timeRange: "short_term" }

    const rankedPos = computeStarPosition(centroid, ranked, clusterRadius, 0, 100)
    const unrankedPos = computeStarPosition(centroid, null, clusterRadius, 50, 100)

    const rankedDist = Math.sqrt(
      (rankedPos[0] - centroid[0]) ** 2 +
        (rankedPos[1] - centroid[1]) ** 2 +
        (rankedPos[2] - centroid[2]) ** 2
    )
    const unrankedDist = Math.sqrt(
      (unrankedPos[0] - centroid[0]) ** 2 +
        (unrankedPos[1] - centroid[1]) ** 2 +
        (unrankedPos[2] - centroid[2]) ** 2
    )

    expect(rankedDist).toBeLessThan(unrankedDist)
  })

  it("returns position within cluster radius of centroid", () => {
    // Test multiple positions to account for jitter
    for (let i = 0; i < 20; i++) {
      const pos = computeStarPosition(centroid, null, clusterRadius, i, 100)
      const dist = Math.sqrt(
        (pos[0] - centroid[0]) ** 2 +
          (pos[1] - centroid[1]) ** 2 +
          (pos[2] - centroid[2]) ** 2
      )
      // Allow small tolerance beyond cluster radius for jitter
      expect(dist).toBeLessThanOrEqual(clusterRadius * 1.15)
    }
  })

  it("returns a 3-element tuple", () => {
    const pos = computeStarPosition(centroid, null, clusterRadius, 0, 50)
    expect(pos).toHaveLength(3)
    expect(typeof pos[0]).toBe("number")
    expect(typeof pos[1]).toBe("number")
    expect(typeof pos[2]).toBe("number")
  })

  it("produces different positions for different indices", () => {
    const pos1 = computeStarPosition(centroid, null, clusterRadius, 0, 50)
    const pos2 = computeStarPosition(centroid, null, clusterRadius, 1, 50)
    // They should not be identical
    const same = pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2]
    expect(same).toBe(false)
  })
})
