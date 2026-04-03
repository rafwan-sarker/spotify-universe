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

  it("includes playlist-read-private for playlist access", () => {
    expect(SPOTIFY_SCOPES).toContain("playlist-read-private")
  })

  it("includes user-read-recently-played for recently played access", () => {
    expect(SPOTIFY_SCOPES).toContain("user-read-recently-played")
  })

  it("uses space-separated format (not commas)", () => {
    expect(SPOTIFY_SCOPES).not.toContain(",")
    // Verify it's a single string of space-separated scopes
    const scopes = SPOTIFY_SCOPES.split(" ")
    expect(scopes.length).toBe(6)
    scopes.forEach((scope) => {
      expect(scope.length).toBeGreaterThan(0)
    })
  })
})
