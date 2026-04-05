// Star data shape -- MUST match demo-galaxy.json structure exactly
export interface StarData {
  id: string // Spotify track ID or "demo-XXX"
  name: string // Track name
  artist: string // Primary artist name
  genre: string // Macro-genre lowercase ID
  position: [number, number, number] // 3D world-space position
  size: number // 0.3 to 2.0
  brightness: number // 0.0 to 1.0
  albumArt?: string // Album cover URL (300x300 preferred, 640x640 fallback)
  addedAt?: string | null // ISO date from saved tracks (for Time Traveler personality)
}

export interface GenreCluster {
  id: string // Lowercase (e.g., "pop", "hip-hop")
  name: string // Display name (e.g., "Pop", "Hip-Hop")
  color: [number, number, number] // RGB 0-1 range
  centroid: [number, number, number] // 3D cluster center
}

export interface GalaxyData {
  version: number
  description: string
  genres: GenreCluster[]
  stars: StarData[]
}

// Raw Spotify API response shapes (subset of fields we need)
export interface SpotifyTrackRaw {
  id: string
  name: string
  artists: { id: string; name: string }[]
  album: { name: string; images: { url: string }[] }
}

export interface SpotifyArtistRaw {
  id: string
  name: string
  genres: string[]
}

export interface NormalizedTrack {
  id: string
  name: string
  artistName: string
  artistId: string
  genre: string // Macro-genre ID after normalization
  topRanking: TopTrackRanking | null
  addedAt: string | null // ISO date from saved tracks
  source: "saved" | "top" | "playlist" | "recent"
  albumArt?: string // Album cover URL from Spotify API
}

export interface TopTrackRanking {
  position: number // 0-49 within time range
  timeRange: "short_term" | "medium_term" | "long_term"
}

// Genre colors -- consistent with demo-galaxy.json for the first 6,
// extended with 5 new genres + mystery (per D-07)
export const GENRE_COLORS: Record<string, [number, number, number]> = {
  pop: [1.0, 0.4, 0.7], // Hot pink (from demo)
  rock: [0.9, 0.2, 0.2], // Red (from demo)
  "hip-hop": [0.6, 0.2, 0.9], // Purple (from demo)
  electronic: [0.1, 0.8, 0.9], // Cyan (from demo)
  rnb: [0.9, 0.6, 0.1], // Gold (from demo)
  indie: [0.4, 0.9, 0.4], // Green (from demo)
  metal: [0.8, 0.1, 0.1], // Dark red
  jazz: [0.9, 0.8, 0.3], // Warm yellow
  classical: [0.7, 0.7, 1.0], // Soft blue-white
  latin: [1.0, 0.5, 0.2], // Orange
  country: [0.6, 0.4, 0.2], // Brown/earth
  mystery: [0.8, 0.8, 0.8], // Silver/white (per D-06)
}

// Genre config array for building GenreCluster objects
export const GENRE_CONFIG: { id: string; name: string; color: [number, number, number] }[] = [
  { id: "pop", name: "Pop", color: GENRE_COLORS["pop"] },
  { id: "rock", name: "Rock", color: GENRE_COLORS["rock"] },
  { id: "hip-hop", name: "Hip-Hop", color: GENRE_COLORS["hip-hop"] },
  { id: "electronic", name: "Electronic", color: GENRE_COLORS["electronic"] },
  { id: "rnb", name: "R&B", color: GENRE_COLORS["rnb"] },
  { id: "indie", name: "Indie", color: GENRE_COLORS["indie"] },
  { id: "metal", name: "Metal", color: GENRE_COLORS["metal"] },
  { id: "jazz", name: "Jazz", color: GENRE_COLORS["jazz"] },
  { id: "classical", name: "Classical", color: GENRE_COLORS["classical"] },
  { id: "latin", name: "Latin", color: GENRE_COLORS["latin"] },
  { id: "country", name: "Country", color: GENRE_COLORS["country"] },
  { id: "mystery", name: "Mystery", color: GENRE_COLORS["mystery"] },
]
