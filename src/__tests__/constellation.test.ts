import { describe, it, expect } from "vitest"
import { buildConstellationPoints } from "@/lib/constellation"
import type { StarData } from "@/lib/spotify/types"

function makeStar(
  id: string,
  position: [number, number, number]
): StarData {
  return {
    id,
    name: `Star ${id}`,
    artist: "Test Artist",
    genre: "pop",
    position,
    size: 1.0,
    brightness: 0.5,
  }
}

describe("buildConstellationPoints", () => {
  it("returns empty array for 0 stars", () => {
    expect(buildConstellationPoints([])).toEqual([])
  })

  it("returns empty array for 1 star", () => {
    const stars = [makeStar("a", [0, 0, 0])]
    expect(buildConstellationPoints(stars)).toEqual([])
  })

  it("returns complete graph pairs for 2 stars (1 pair = 2 points)", () => {
    const stars = [makeStar("a", [0, 0, 0]), makeStar("b", [10, 0, 0])]
    const points = buildConstellationPoints(stars)
    // 1 pair (C(2,1) = 1), 2 points
    expect(points).toHaveLength(2)
    expect(points[0]).toEqual([0, 0, 0])
    expect(points[1]).toEqual([10, 0, 0])
  })

  it("returns complete graph for 3 stars (3 pairs = 6 points)", () => {
    const stars = [
      makeStar("a", [0, 0, 0]),
      makeStar("b", [10, 0, 0]),
      makeStar("c", [5, 10, 0]),
    ]
    const points = buildConstellationPoints(stars)
    // C(3,2) = 3 pairs, 6 points
    expect(points).toHaveLength(6)
  })

  it("returns complete graph for 5 stars (10 pairs = 20 points)", () => {
    const stars = [
      makeStar("a", [0, 0, 0]),
      makeStar("b", [10, 0, 0]),
      makeStar("c", [5, 10, 0]),
      makeStar("d", [3, 7, 2]),
      makeStar("e", [8, 3, 5]),
    ]
    const points = buildConstellationPoints(stars)
    // C(5,2) = 10 pairs, 20 points
    expect(points).toHaveLength(20)
  })

  it("returns hub-spoke from centroid for 6+ stars", () => {
    const stars = [
      makeStar("a", [0, 0, 0]),
      makeStar("b", [10, 0, 0]),
      makeStar("c", [5, 10, 0]),
      makeStar("d", [3, 7, 2]),
      makeStar("e", [8, 3, 5]),
      makeStar("f", [6, 6, 6]),
    ]
    const points = buildConstellationPoints(stars)
    // 6 spokes, 2 points each = 12 points
    expect(points).toHaveLength(12)
  })

  it("computes correct centroid for hub-spoke (average of all positions)", () => {
    const stars = [
      makeStar("a", [0, 0, 0]),
      makeStar("b", [10, 0, 0]),
      makeStar("c", [0, 10, 0]),
      makeStar("d", [10, 10, 0]),
      makeStar("e", [5, 5, 10]),
      makeStar("f", [5, 5, -10]),
    ]
    const points = buildConstellationPoints(stars)
    // Centroid = (30/6, 30/6, 0/6) = (5, 5, 0)
    // Each spoke starts from centroid
    expect(points[0]).toEqual([5, 5, 0])
    expect(points[2]).toEqual([5, 5, 0])
    expect(points[4]).toEqual([5, 5, 0])
  })

  it("caps hub-spoke at 15 closest stars for 20+ stars", () => {
    const stars: StarData[] = []
    for (let i = 0; i < 25; i++) {
      stars.push(makeStar(`s${i}`, [i * 10, 0, 0]))
    }
    const points = buildConstellationPoints(stars)
    // 15 spokes max * 2 points = 30 points
    expect(points).toHaveLength(30)
  })
})
