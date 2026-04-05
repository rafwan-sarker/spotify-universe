import { describe, it, expect } from "vitest"
import {
  computeGalaxyStats,
  computePersonality,
} from "@/lib/galaxy-stats"
import type { StarData, GenreCluster } from "@/lib/spotify/types"

// Helper to create a star with minimal required fields
function makeStar(overrides: Partial<StarData> & { genre: string }): StarData {
  return {
    id: `star-${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Star",
    artist: "Test Artist",
    position: [0, 0, 0],
    size: 1.0,
    brightness: 0.5,
    ...overrides,
  }
}

// Helper to create genre clusters
function makeGenre(id: string, name: string): GenreCluster {
  return {
    id,
    name,
    color: [1, 0, 0],
    centroid: [0, 0, 0],
  }
}

describe("computeGalaxyStats", () => {
  it("returns correct totalStars, genreCount, dominantGenre, dominantPercent", () => {
    // 10 stars across 3 genres: 5 pop, 3 rock, 2 jazz
    const stars: StarData[] = [
      ...Array.from({ length: 5 }, () => makeStar({ genre: "pop" })),
      ...Array.from({ length: 3 }, () => makeStar({ genre: "rock" })),
      ...Array.from({ length: 2 }, () => makeStar({ genre: "jazz" })),
    ]
    const genres = [
      makeGenre("pop", "Pop"),
      makeGenre("rock", "Rock"),
      makeGenre("jazz", "Jazz"),
    ]

    const stats = computeGalaxyStats(stars, genres)

    expect(stats.totalStars).toBe(10)
    expect(stats.genreCount).toBe(3)
    expect(stats.dominantGenre).toBe("Pop")
    expect(stats.dominantGenreId).toBe("pop")
    expect(stats.dominantPercent).toBe(50)
  })

  it("returns zeroed stats for empty stars array", () => {
    const stats = computeGalaxyStats([], [])

    expect(stats.totalStars).toBe(0)
    expect(stats.genreCount).toBe(0)
    expect(stats.dominantPercent).toBe(0)
    expect(stats.dominantGenre).toBe("")
    expect(stats.dominantGenreId).toBe("")
  })
})

describe("computePersonality", () => {
  it("returns 'Genre Loyalist' when >50% one genre", () => {
    const stars: StarData[] = [
      ...Array.from({ length: 6 }, () => makeStar({ genre: "pop" })),
      ...Array.from({ length: 2 }, () => makeStar({ genre: "rock" })),
      ...Array.from({ length: 2 }, () => makeStar({ genre: "jazz" })),
    ]

    expect(computePersonality(stars)).toBe("Genre Loyalist")
  })

  it("returns 'Eclectic Explorer' when no genre >30% AND >=6 genres", () => {
    // 10 stars across 7 genres, none above 25%
    const genres = ["pop", "rock", "jazz", "electronic", "rnb", "indie", "metal"]
    const stars: StarData[] = genres.map((g) =>
      makeStar({ genre: g, brightness: 0.5 })
    )
    // Add a few more to reach 10 total without exceeding 30% on any genre
    stars.push(makeStar({ genre: "pop", brightness: 0.5 }))
    stars.push(makeStar({ genre: "rock", brightness: 0.5 }))
    stars.push(makeStar({ genre: "jazz", brightness: 0.5 }))

    const result = computePersonality(stars)
    expect(result).toBe("Eclectic Explorer")
  })

  it("returns 'Mainstream Voyager' when >60% high-brightness stars", () => {
    const stars: StarData[] = [
      ...Array.from({ length: 7 }, () =>
        makeStar({ genre: "pop", brightness: 0.8 })
      ),
      ...Array.from({ length: 3 }, () =>
        makeStar({ genre: "rock", brightness: 0.3 })
      ),
    ]

    expect(computePersonality(stars)).toBe("Mainstream Voyager")
  })

  it("returns 'Deep Diver' when <30% high-brightness stars", () => {
    const stars: StarData[] = [
      ...Array.from({ length: 2 }, () =>
        makeStar({ genre: "pop", brightness: 0.8 })
      ),
      ...Array.from({ length: 8 }, () =>
        makeStar({ genre: "rock", brightness: 0.3 })
      ),
    ]

    expect(computePersonality(stars)).toBe("Deep Diver")
  })

  it("returns 'Time Traveler' when addedAt dates span 3+ decades", () => {
    // 15 stars with dates spanning 1990s, 2000s, 2020s
    const stars: StarData[] = [
      ...Array.from({ length: 5 }, () =>
        makeStar({ genre: "pop", brightness: 0.5, addedAt: "1990-01-01T00:00:00Z" })
      ),
      ...Array.from({ length: 5 }, () =>
        makeStar({ genre: "rock", brightness: 0.5, addedAt: "2005-06-15T00:00:00Z" })
      ),
      ...Array.from({ length: 5 }, () =>
        makeStar({ genre: "jazz", brightness: 0.5, addedAt: "2020-03-01T00:00:00Z" })
      ),
    ]

    expect(computePersonality(stars)).toBe("Time Traveler")
  })

  it("does NOT return 'Time Traveler' when dates span only 1 decade", () => {
    // 15 stars all in the 2020s, balanced genres and brightness
    const genres = ["pop", "rock", "jazz", "electronic", "rnb"]
    const stars: StarData[] = genres.flatMap((g) =>
      Array.from({ length: 3 }, () =>
        makeStar({ genre: g, brightness: 0.5, addedAt: "2023-06-15T00:00:00Z" })
      )
    )

    const result = computePersonality(stars)
    expect(result).not.toBe("Time Traveler")
  })

  it("does NOT return 'Time Traveler' when no addedAt data (all null)", () => {
    // Stars with null addedAt, balanced distribution
    const stars: StarData[] = [
      ...Array.from({ length: 4 }, () =>
        makeStar({ genre: "pop", brightness: 0.3, addedAt: null })
      ),
      ...Array.from({ length: 3 }, () =>
        makeStar({ genre: "rock", brightness: 0.3, addedAt: null })
      ),
      ...Array.from({ length: 3 }, () =>
        makeStar({ genre: "jazz", brightness: 0.3, addedAt: null })
      ),
    ]

    const result = computePersonality(stars)
    expect(result).not.toBe("Time Traveler")
    expect(result).toBe("Deep Diver")
  })
})
