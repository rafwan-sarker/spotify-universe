"use client"

import { Html } from "@react-three/drei"
import { motion, AnimatePresence } from "motion/react"
import { useAppStore } from "@/lib/store"
import type { StarData } from "@/lib/spotify/types"
import { GENRE_COLORS } from "@/lib/spotify/types"

function genreColorToCSS(genre: string): string {
  const color = GENRE_COLORS[genre] ?? GENRE_COLORS["mystery"]
  return `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`
}

function capitalizeGenre(genre: string): string {
  if (!genre) return ""
  return genre.charAt(0).toUpperCase() + genre.slice(1)
}

function StarInfoCardContent({ star }: { star: StarData }) {
  const handleWarpToArtist = () => {
    const state = useAppStore.getState()
    const artistStars = state.stars.filter((s) => s.artist === star.artist)
    if (artistStars.length === 0) return
    const centroid: [number, number, number] = [0, 0, 0]
    for (const s of artistStars) {
      centroid[0] += s.position[0]
      centroid[1] += s.position[1]
      centroid[2] += s.position[2]
    }
    centroid[0] /= artistStars.length
    centroid[1] /= artistStars.length
    centroid[2] /= artistStars.length
    state.setSelectedStar(null)
    state.startWarp({ position: centroid })
  }

  return (
    <div
      className="w-[280px] rounded-xl overflow-hidden"
      style={{
        background: "rgba(0, 0, 20, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(0, 240, 255, 0.6)",
        boxShadow:
          "0 0 10px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.1)",
      }}
    >
      {/* Top section: album art + track info */}
      <div className="p-4 flex gap-3">
        {star.albumArt ? (
          <img
            src={star.albumArt}
            alt={`${star.name} album art`}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: `${genreColorToCSS(star.genre)}30` }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/50"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <p className="text-[16px] font-semibold text-white leading-[1.3] line-clamp-2">
            {star.name}
          </p>
          <p className="text-[14px] text-white/70 leading-[1.5] truncate">
            {star.artist}
          </p>
          <span
            className="inline-block text-[12px] font-semibold px-2 py-0.5 rounded-full mt-1 w-fit"
            style={{
              background: "rgba(0, 240, 255, 0.15)",
              color: "#00f0ff",
            }}
          >
            {capitalizeGenre(star.genre)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        className="border-t"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      />

      {/* Button section */}
      <div className="px-4 py-2 flex flex-col gap-1">
        <a
          href={`https://open.spotify.com/track/${star.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-2 text-[12px] font-semibold transition-opacity hover:opacity-80"
          style={{ color: "#00f0ff" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Open in Spotify
        </a>
        <button
          onClick={handleWarpToArtist}
          className="flex items-center gap-2 py-2 text-[12px] font-semibold transition-opacity hover:opacity-80 cursor-pointer"
          style={{ color: "#00f0ff" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Warp to Artist
        </button>
      </div>
    </div>
  )
}

export function StarInfoCard() {
  const selectedStar = useAppStore((s) => s.selectedStar)

  if (!selectedStar) return null

  return (
    <group
      position={[
        selectedStar.position[0],
        selectedStar.position[1],
        selectedStar.position[2],
      ]}
    >
      <Html
        center
        distanceFactor={10}
        position={[2, 1, 0]}
        className="pointer-events-auto"
        zIndexRange={[16777271, 0]}
      >
        <AnimatePresence>
          <motion.div
            key={selectedStar.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <StarInfoCardContent star={selectedStar} />
          </motion.div>
        </AnimatePresence>
      </Html>
    </group>
  )
}
