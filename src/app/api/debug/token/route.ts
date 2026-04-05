import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })

  if (!token) {
    return NextResponse.json({ error: "No token found", authSecret: !!process.env.AUTH_SECRET })
  }

  return NextResponse.json({
    hasAccessToken: !!token.accessToken,
    hasRefreshToken: !!token.refreshToken,
    expiresAt: token.expiresAt,
    now: Date.now(),
    expired: token.expiresAt ? Date.now() > (token.expiresAt as number) : "unknown",
    error: token.error ?? null,
    tokenKeys: Object.keys(token),
  })
}
