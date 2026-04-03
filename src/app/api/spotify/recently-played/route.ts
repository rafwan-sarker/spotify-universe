import { spotifyFetch } from "@/lib/spotify/api-helpers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit") ?? "50"

  const limitNum = parseInt(limit)
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return NextResponse.json({ error: "Invalid limit (1-50)" }, { status: 400 })
  }

  // Recently played only returns up to 50 items. No pagination needed.
  return spotifyFetch(
    request,
    `https://api.spotify.com/v1/me/player/recently-played?limit=${limitNum}`
  )
}
