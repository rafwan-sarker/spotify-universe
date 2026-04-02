import { describe, it, expect } from "vitest"
import { SPOTIFY_SCOPES } from "@/lib/spotify-scopes"

describe("Spotify OAuth Scopes", () => {
  it("includes user-library-read for saved tracks access", () => {
    expect(SPOTIFY_SCOPES).toContain("user-library-read")
  })

  it("includes user-top-read for top tracks/artists access", () => {
    expect(SPOTIFY_SCOPES).toContain("user-top-read")
  })

  it("includes user-read-email for user profile email", () => {
    expect(SPOTIFY_SCOPES).toContain("user-read-email")
  })

  it("includes user-read-private for user profile details", () => {
    expect(SPOTIFY_SCOPES).toContain("user-read-private")
  })

  it("uses space-separated format (not commas)", () => {
    expect(SPOTIFY_SCOPES).not.toContain(",")
    // Verify it's a single string of space-separated scopes
    const scopes = SPOTIFY_SCOPES.split(" ")
    expect(scopes.length).toBe(4)
    scopes.forEach((scope) => {
      expect(scope.length).toBeGreaterThan(0)
    })
  })
})
