import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"
import { SPOTIFY_SCOPES } from "@/lib/spotify-scopes"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: { scope: SPOTIFY_SCOPES },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: persist OAuth tokens from provider
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at! * 1000,
        }
      }

      // Token still valid: return immediately (5-minute buffer prevents
      // race conditions when jwt callback fires multiple times per render)
      if (Date.now() < (token.expiresAt as number) - 5 * 60 * 1000) {
        return token
      }

      // Token expired: refresh silently via Spotify token endpoint
      try {
        const response = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
              ).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          }
        )

        const refreshed = await response.json()

        if (!response.ok) throw refreshed

        return {
          ...token,
          accessToken: refreshed.access_token,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
          // Spotify may return a new refresh token
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
        }
      } catch (error) {
        console.error("Token refresh failed:", error)
        return { ...token, error: "RefreshTokenError" }
      }
    },

    async session({ session, token }) {
      // Pass user identity to client -- never raw tokens
      session.user.id = token.sub!
      // Signal to client if token refresh failed
      if (token.error === "RefreshTokenError") {
        session.error = "RefreshTokenError"
      }
      return session
    },
  },
})
