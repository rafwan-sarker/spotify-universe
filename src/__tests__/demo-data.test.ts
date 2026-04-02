import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "fs"
import path from "path"

// This test file validates the demo-galaxy.json contract.
// Tests will FAIL until Plan 02 creates the actual demo data file.
// They serve as the specification for what the demo data must contain.

const DEMO_DATA_PATH = path.resolve(__dirname, "../data/demo-galaxy.json")

describe("Demo Galaxy Data", () => {
  it("demo-galaxy.json file exists", () => {
    expect(existsSync(DEMO_DATA_PATH)).toBe(true)
  })

  describe("stars array", () => {
    it("has approximately 200 stars (150-250 range)", () => {
      const data = JSON.parse(readFileSync(DEMO_DATA_PATH, "utf-8"))
      expect(data.stars).toBeDefined()
      expect(Array.isArray(data.stars)).toBe(true)
      expect(data.stars.length).toBeGreaterThanOrEqual(150)
      expect(data.stars.length).toBeLessThanOrEqual(250)
    })

    it("every star has required fields", () => {
      const data = JSON.parse(readFileSync(DEMO_DATA_PATH, "utf-8"))
      for (const star of data.stars) {
        expect(star).toHaveProperty("id")
        expect(typeof star.id).toBe("string")

        expect(star).toHaveProperty("name")
        expect(typeof star.name).toBe("string")

        expect(star).toHaveProperty("artist")
        expect(typeof star.artist).toBe("string")

        expect(star).toHaveProperty("genre")
        expect(typeof star.genre).toBe("string")

        expect(star).toHaveProperty("position")
        expect(Array.isArray(star.position)).toBe(true)
        expect(star.position).toHaveLength(3)
        star.position.forEach((v: unknown) =>
          expect(typeof v).toBe("number")
        )

        expect(star).toHaveProperty("size")
        expect(typeof star.size).toBe("number")

        expect(star).toHaveProperty("brightness")
        expect(typeof star.brightness).toBe("number")
      }
    })
  })

  describe("genres array", () => {
    it("has 5-7 genre entries", () => {
      const data = JSON.parse(readFileSync(DEMO_DATA_PATH, "utf-8"))
      expect(data.genres).toBeDefined()
      expect(Array.isArray(data.genres)).toBe(true)
      expect(data.genres.length).toBeGreaterThanOrEqual(5)
      expect(data.genres.length).toBeLessThanOrEqual(7)
    })

    it("every genre has required fields", () => {
      const data = JSON.parse(readFileSync(DEMO_DATA_PATH, "utf-8"))
      for (const genre of data.genres) {
        expect(genre).toHaveProperty("id")
        expect(typeof genre.id).toBe("string")

        expect(genre).toHaveProperty("name")
        expect(typeof genre.name).toBe("string")

        expect(genre).toHaveProperty("color")
        expect(Array.isArray(genre.color)).toBe(true)
        expect(genre.color).toHaveLength(3)
        genre.color.forEach((v: unknown) => expect(typeof v).toBe("number"))

        expect(genre).toHaveProperty("centroid")
        expect(Array.isArray(genre.centroid)).toBe(true)
        expect(genre.centroid).toHaveLength(3)
        genre.centroid.forEach((v: unknown) =>
          expect(typeof v).toBe("number")
        )
      }
    })
  })
})
