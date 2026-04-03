import { spotifyFetch } from "@/lib/spotify/api-helpers"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // This is the highest-volume endpoint (one request per unique artist).
  // Rate limiting is handled client-side by the fetch orchestrator in Plan 03.
  return spotifyFetch(
    request,
    `https://api.spotify.com/v1/artists/${id}`
  )
}
