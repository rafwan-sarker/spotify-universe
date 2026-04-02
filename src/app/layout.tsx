import type { Metadata } from "next"
import "./globals.css"
import Providers from "@/components/providers/Providers"

export const metadata: Metadata = {
  title: "Spotify Universe",
  description:
    "Transform your Spotify library into an interactive 3D galaxy you can fly through",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ background: "#000005" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
