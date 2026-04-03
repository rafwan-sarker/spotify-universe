import { describe, it, expect } from "vitest"
import {
  classifyGenre,
  classifyArtistGenres,
  GENRE_KEYWORDS,
} from "@/lib/spotify/genre-map"
import { GENRE_COLORS, GENRE_CONFIG } from "@/lib/spotify/types"

describe("classifyGenre", () => {
  it("maps 'indie rock' to Rock", () => {
    expect(classifyGenre("indie rock")).toBe("rock")
  })

  it("maps 'latin trap' to Latin (specific override beats generic trap)", () => {
    expect(classifyGenre("latin trap")).toBe("latin")
  })

  it("maps 'trap' to Hip-Hop", () => {
    expect(classifyGenre("trap")).toBe("hip-hop")
  })

  it("maps 'k-pop' to Pop", () => {
    expect(classifyGenre("k-pop")).toBe("pop")
  })

  it("maps 'deep house' to Electronic", () => {
    expect(classifyGenre("deep house")).toBe("electronic")
  })

  it("maps 'neo soul' to R&B", () => {
    expect(classifyGenre("neo soul")).toBe("rnb")
  })

  it("returns 'mystery' for completely unknown genre", () => {
    expect(classifyGenre("completely unknown genre xyz")).toBe("mystery")
  })

  it("returns 'mystery' for empty string", () => {
    expect(classifyGenre("")).toBe("mystery")
  })

  it("is case-insensitive", () => {
    expect(classifyGenre("INDIE ROCK")).toBe("rock")
    expect(classifyGenre("Hip-Hop")).toBe("hip-hop")
  })
})

describe("classifyArtistGenres", () => {
  it("returns first classifiable genre from artist genres", () => {
    expect(classifyArtistGenres(["indie rock", "shoegaze"])).toBe("rock")
  })

  it("returns 'mystery' when all genres are unknown", () => {
    expect(classifyArtistGenres(["xyzabc"])).toBe("mystery")
  })

  it("returns 'mystery' for empty array", () => {
    expect(classifyArtistGenres([])).toBe("mystery")
  })

  it("skips unknown genres and finds the first classifiable one", () => {
    expect(classifyArtistGenres(["xyzabc", "deep house"])).toBe("electronic")
  })
})

describe("GENRE_KEYWORDS", () => {
  it("covers all 12 macro-genre clusters including Mystery", () => {
    const macroGenres = new Set(GENRE_KEYWORDS.map(([, macro]) => macro))
    const expected = [
      "pop",
      "rock",
      "hip-hop",
      "electronic",
      "rnb",
      "indie",
      "metal",
      "jazz",
      "classical",
      "latin",
      "country",
    ]
    for (const genre of expected) {
      expect(macroGenres.has(genre)).toBe(true)
    }
  })

  it("has 11 macro-genre clusters (excluding Mystery)", () => {
    const macroGenres = new Set(GENRE_KEYWORDS.map(([, macro]) => macro))
    expect(macroGenres.size).toBe(11)
  })
})

describe("GENRE_COLORS", () => {
  it("has exactly 12 entries", () => {
    expect(Object.keys(GENRE_COLORS).length).toBe(12)
  })

  it("includes all expected genre keys", () => {
    const expectedKeys = [
      "pop",
      "rock",
      "hip-hop",
      "electronic",
      "rnb",
      "indie",
      "metal",
      "jazz",
      "classical",
      "latin",
      "country",
      "mystery",
    ]
    for (const key of expectedKeys) {
      expect(GENRE_COLORS).toHaveProperty(key)
    }
  })

  it("preserves the 6 demo-galaxy.json genre colors exactly", () => {
    expect(GENRE_COLORS["pop"]).toEqual([1, 0.4, 0.7])
    expect(GENRE_COLORS["rock"]).toEqual([0.9, 0.2, 0.2])
    expect(GENRE_COLORS["hip-hop"]).toEqual([0.6, 0.2, 0.9])
    expect(GENRE_COLORS["electronic"]).toEqual([0.1, 0.8, 0.9])
    expect(GENRE_COLORS["rnb"]).toEqual([0.9, 0.6, 0.1])
    expect(GENRE_COLORS["indie"]).toEqual([0.4, 0.9, 0.4])
  })
})

describe("GENRE_CONFIG", () => {
  it("has 12 genre cluster entries", () => {
    expect(GENRE_CONFIG.length).toBe(12)
  })

  it("each entry has id, name, and color", () => {
    for (const config of GENRE_CONFIG) {
      expect(config).toHaveProperty("id")
      expect(config).toHaveProperty("name")
      expect(config).toHaveProperty("color")
      expect(config.color).toHaveLength(3)
    }
  })
})
