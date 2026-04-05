import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

/**
 * Extracts the Spotify access token from the JWT cookie.
 * Uses getToken() from next-auth/jwt (NOT auth()) because the session
 * callback strips the access token for security -- only getToken()
 * exposes the raw JWT with accessToken.
 */
export async function getSpotifyToken(request: NextRequest): Promise<string | null> {
  // Auth.js v5 on HTTPS uses __Secure-authjs.session-token cookie name
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: request.cookies.has("__Secure-authjs.session-token")
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  })
  return (token?.accessToken as string) ?? null
}

/**
 * Proxies a request to the Spotify API with the user's access token.
 * Handles 401 (unauthorized) and 429 (rate limit) responses.
 */
export async function spotifyFetch(
  request: NextRequest,
  spotifyUrl: string
): Promise<NextResponse> {
  const accessToken = await getSpotifyToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const response = await fetch(spotifyUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After") ?? "5"
    return NextResponse.json(
      { error: "Rate limited", retryAfter: parseInt(retryAfter) },
      { status: 429, headers: { "Retry-After": retryAfter } }
    )
  }

  if (!response.ok) {
    const errorBody = await response.text()
    return NextResponse.json(
      { error: `Spotify API error: ${response.status}`, details: errorBody },
      { status: response.status }
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}
