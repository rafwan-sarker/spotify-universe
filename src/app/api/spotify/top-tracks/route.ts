import { spotifyFetch } from "@/lib/spotify/api-helpers"
import { NextRequest, NextResponse } from "next/server"

const VALID_TIME_RANGES = ["short_term", "medium_term", "long_term"] as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get("time_range")
  const limit = searchParams.get("limit") ?? "50"

  if (!timeRange || !VALID_TIME_RANGES.includes(timeRange as typeof VALID_TIME_RANGES[number])) {
    return NextResponse.json(
      { error: "Invalid time_range. Must be one of: short_term, medium_term, long_term" },
      { status: 400 }
    )
  }

  const limitNum = parseInt(limit)
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return NextResponse.json({ error: "Invalid limit (1-50)" }, { status: 400 })
  }

  // Per Spotify API: top tracks caps at 50 per time range. Never paginate.
  return spotifyFetch(
    request,
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limitNum}&offset=0`
  )
}
