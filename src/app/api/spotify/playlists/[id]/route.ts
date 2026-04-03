import { spotifyFetch } from "@/lib/spotify/api-helpers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const offset = searchParams.get("offset") ?? "0"
  const limit = searchParams.get("limit") ?? "100"

  const offsetNum = parseInt(offset)
  const limitNum = parseInt(limit)

  if (isNaN(offsetNum) || offsetNum < 0) {
    return NextResponse.json({ error: "Invalid offset" }, { status: 400 })
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return NextResponse.json({ error: "Invalid limit (1-100)" }, { status: 400 })
  }

  return spotifyFetch(
    request,
    `https://api.spotify.com/v1/playlists/${id}/tracks?offset=${offsetNum}&limit=${limitNum}`
  )
}
