import { spotifyFetch } from "@/lib/spotify/api-helpers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const offset = searchParams.get("offset") ?? "0"
  const limit = searchParams.get("limit") ?? "50"

  const offsetNum = parseInt(offset)
  const limitNum = parseInt(limit)

  if (isNaN(offsetNum) || offsetNum < 0) {
    return NextResponse.json({ error: "Invalid offset" }, { status: 400 })
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return NextResponse.json({ error: "Invalid limit (1-50)" }, { status: 400 })
  }

  // IMPORTANT: Never follow the `next` URL from Spotify playlist responses.
  // The `next` URL points to the removed GET /users/{id}/playlists endpoint
  // and returns 403 (Spotify Feb 2026 pagination bug). Always construct
  // pagination URLs manually with offset-based parameters.
  return spotifyFetch(
    request,
    `https://api.spotify.com/v1/me/playlists?offset=${offsetNum}&limit=${limitNum}`
  )
}
