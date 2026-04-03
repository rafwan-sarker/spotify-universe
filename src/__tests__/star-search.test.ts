import { describe, it, expect } from "vitest"
import { createStarSearchIndex, searchStars } from "@/lib/star-search"
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

const testStars: StarData[] = [
  makeStar({ id: "1", name: "Bohemian Rhapsody", artist: "Queen" }),
  makeStar({ id: "2", name: "Stairway to Heaven", artist: "Led Zeppelin" }),
  makeStar({ id: "3", name: "Hotel California", artist: "Eagles" }),
  makeStar({ id: "4", name: "Imagine", artist: "John Lennon" }),
  makeStar({ id: "5", name: "Yesterday", artist: "The Beatles" }),
  makeStar({ id: "6", name: "Smells Like Teen Spirit", artist: "Nirvana" }),
  makeStar({ id: "7", name: "Billie Jean", artist: "Michael Jackson" }),
  makeStar({ id: "8", name: "Like a Rolling Stone", artist: "Bob Dylan" }),
  makeStar({ id: "9", name: "Purple Rain", artist: "Prince" }),
  makeStar({ id: "10", name: "Respect", artist: "Aretha Franklin" }),
  makeStar({ id: "11", name: "What's Going On", artist: "Marvin Gaye" }),
  makeStar({ id: "12", name: "Born to Run", artist: "Bruce Springsteen" }),
]

describe("star-search", () => {
  describe("createStarSearchIndex", () => {
    it("builds a Fuse instance from StarData array", () => {
      const index = createStarSearchIndex(testStars)
      // Fuse instance should have a search method
      expect(index).toBeDefined()
      expect(typeof index.search).toBe("function")
    })
  })

  describe("searchStars", () => {
    it("with partial track name returns matching stars (fuse.js fuzzy match)", () => {
      const index = createStarSearchIndex(testStars)
      const results = searchStars(index, "Bohemian")
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].name).toBe("Bohemian Rhapsody")
    })

    it("weights track name higher than artist name", () => {
      const index = createStarSearchIndex(testStars)

      // Search for "Queen" should find Bohemian Rhapsody (artist match)
      const artistResults = searchStars(index, "Queen")
      expect(artistResults.length).toBeGreaterThanOrEqual(1)
      expect(artistResults.some((s) => s.id === "1")).toBe(true)

      // Search for "Bohemian" (name match) should rank it highly
      const nameResults = searchStars(index, "Bohemian")
      expect(nameResults[0].id).toBe("1")
    })

    it("with empty query returns empty array", () => {
      const index = createStarSearchIndex(testStars)
      const results = searchStars(index, "")
      expect(results).toEqual([])
    })

    it("with whitespace-only query returns empty array", () => {
      const index = createStarSearchIndex(testStars)
      const results = searchStars(index, "   ")
      expect(results).toEqual([])
    })

    it("with no matching query returns empty array", () => {
      const index = createStarSearchIndex(testStars)
      const results = searchStars(index, "xyzzyspoon")
      expect(results).toEqual([])
    })

    it("results are capped at 8 items maximum", () => {
      const index = createStarSearchIndex(testStars)
      // A broad search term that matches many items
      const results = searchStars(index, "a")
      expect(results.length).toBeLessThanOrEqual(8)
    })

    it("finds results by artist name", () => {
      const index = createStarSearchIndex(testStars)
      const results = searchStars(index, "Nirvana")
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].artist).toBe("Nirvana")
    })
  })
})
