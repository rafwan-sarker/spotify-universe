import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // List all cookies to see what Auth.js is using
  const cookieNames = request.cookies.getAll().map(c => c.name)

  // Try both cookie name patterns
  const tokenDefault = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  const tokenAuthJs = await getToken({ req: request, secret: process.env.AUTH_SECRET, cookieName: "authjs.session-token" })
  const tokenSecure = await getToken({ req: request, secret: process.env.AUTH_SECRET, cookieName: "__Secure-authjs.session-token" })

  return NextResponse.json({
    cookieNames,
    defaultToken: tokenDefault ? Object.keys(tokenDefault) : null,
    authJsToken: tokenAuthJs ? Object.keys(tokenAuthJs) : null,
    secureToken: tokenSecure ? Object.keys(tokenSecure) : null,
    hasAccessTokenDefault: !!tokenDefault?.accessToken,
    hasAccessTokenAuthJs: !!tokenAuthJs?.accessToken,
    hasAccessTokenSecure: !!tokenSecure?.accessToken,
  })
}
