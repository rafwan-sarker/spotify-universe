import { describe, it, expect } from "vitest"
import {
  computeGalaxyBounds,
  projectToMinimap,
} from "@/lib/galaxy-stats"
import type { GenreCluster } from "@/lib/spotify/types"

function makeGenre(
  id: string,
  centroid: [number, number, number]
): GenreCluster {
  return {
    id,
    name: id,
    color: [1, 0, 0],
    centroid,
  }
}

describe("computeGalaxyBounds", () => {
  it("returns correct bounds with 20-unit padding", () => {
    const genres = [
      makeGenre("pop", [10, 0, 20]),
      makeGenre("rock", [-30, 0, 50]),
      makeGenre("jazz", [40, 0, -10]),
    ]

    const bounds = computeGalaxyBounds(genres)

    // Raw: minX=-30, maxX=40, minZ=-10, maxZ=50
    // With 20-unit padding:
    expect(bounds.minX).toBe(-50)
    expect(bounds.maxX).toBe(60)
    expect(bounds.minZ).toBe(-30)
    expect(bounds.maxZ).toBe(70)
  })
})

describe("projectToMinimap", () => {
  const bounds = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 }
  const mapSize = 150

  it("maps min-bound position to (0, 0)", () => {
    const result = projectToMinimap([-50, 0, -50], bounds, mapSize)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0)
  })

  it("maps max-bound position to (mapSize, mapSize)", () => {
    const result = projectToMinimap([50, 0, 50], bounds, mapSize)
    expect(result.x).toBeCloseTo(mapSize)
    expect(result.y).toBeCloseTo(mapSize)
  })

  it("maps center position to (mapSize/2, mapSize/2)", () => {
    const result = projectToMinimap([0, 0, 0], bounds, mapSize)
    expect(result.x).toBeCloseTo(mapSize / 2)
    expect(result.y).toBeCloseTo(mapSize / 2)
  })
})
