import { GENRE_CONFIG } from "./types"

// Genre mapping: ordered array of [keyword, macroGenreId] pairs.
// First match wins -- specific overrides MUST come before generic keywords.
// All macro-genre IDs are lowercase, matching GENRE_COLORS keys.
export const GENRE_KEYWORDS: [string, string][] = [
  // --- Specific overrides first (prevent misclassification) ---
  ["trap metal", "metal"],
  ["latin trap", "latin"],
  ["latin pop", "latin"],
  ["latin rock", "latin"],
  ["latin jazz", "latin"],
  ["indie pop", "indie"],
  ["indie rock", "rock"],
  ["indie folk", "indie"],
  ["art rock", "rock"],

  // --- Hip-Hop / Rap ---
  ["trap", "hip-hop"],
  ["drill", "hip-hop"],
  ["grime", "hip-hop"],
  ["hip hop", "hip-hop"],
  ["hip-hop", "hip-hop"],
  ["rap", "hip-hop"],

  // --- Metal (before Rock, since "metal" is more specific) ---
  ["metal", "metal"],
  ["core", "metal"], // metalcore, deathcore, grindcore

  // --- Rock ---
  ["rock", "rock"],
  ["punk", "rock"],
  ["grunge", "rock"],
  ["emo", "rock"],

  // --- Pop ---
  ["pop", "pop"],
  ["k-pop", "pop"],

  // --- Electronic ---
  ["electro", "electronic"],
  ["edm", "electronic"],
  ["house", "electronic"],
  ["techno", "electronic"],
  ["trance", "electronic"],
  ["dubstep", "electronic"],
  ["dnb", "electronic"],
  ["drum and bass", "electronic"],
  ["ambient", "electronic"],
  ["idm", "electronic"],
  ["breakbeat", "electronic"],
  ["synthwave", "electronic"],
  ["chillwave", "electronic"],

  // --- R&B / Soul ---
  ["r&b", "rnb"],
  ["rnb", "rnb"],
  ["soul", "rnb"],
  ["funk", "rnb"],
  ["neo soul", "rnb"],
  ["motown", "rnb"],

  // --- Indie / Alternative ---
  ["indie", "indie"],
  ["alternative", "indie"],
  ["lo-fi", "indie"],
  ["lofi", "indie"],
  ["shoegaze", "indie"],
  ["dream pop", "indie"],

  // --- Jazz ---
  ["jazz", "jazz"],
  ["bebop", "jazz"],
  ["swing", "jazz"],
  ["bossa nova", "jazz"],

  // --- Classical ---
  ["classical", "classical"],
  ["orchestra", "classical"],
  ["symphony", "classical"],
  ["piano", "classical"],
  ["opera", "classical"],
  ["chamber", "classical"],
  ["baroque", "classical"],

  // --- Latin ---
  ["latin", "latin"],
  ["reggaeton", "latin"],
  ["salsa", "latin"],
  ["bachata", "latin"],
  ["cumbia", "latin"],
  ["banda", "latin"],
  ["corrido", "latin"],
  ["norteno", "latin"],
  ["merengue", "latin"],
  ["tropicalia", "latin"],

  // --- Country ---
  ["country", "country"],
  ["bluegrass", "country"],
  ["americana", "country"],
  ["honky tonk", "country"],
]

/**
 * Classify a single Spotify micro-genre string into a macro-genre cluster ID.
 * Returns lowercase genre ID matching GENRE_COLORS keys.
 * Returns "mystery" for unknown or empty genres (per D-06).
 */
export function classifyGenre(spotifyGenre: string): string {
  if (!spotifyGenre) return "mystery"

  const lower = spotifyGenre.toLowerCase()
  for (const [keyword, macro] of GENRE_KEYWORDS) {
    if (lower.includes(keyword)) return macro
  }
  return "mystery"
}

/**
 * Classify an artist's genre array into a single macro-genre cluster ID.
 * Returns the first successfully classified genre, or "mystery" if all fail.
 */
export function classifyArtistGenres(artistGenres: string[]): string {
  for (const genre of artistGenres) {
    const classified = classifyGenre(genre)
    if (classified !== "mystery") return classified
  }
  return "mystery"
}
