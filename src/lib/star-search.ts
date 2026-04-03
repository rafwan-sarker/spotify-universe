import Fuse, { type IFuseOptions } from "fuse.js"
import type { StarData } from "@/lib/spotify/types"

const SEARCH_OPTIONS: IFuseOptions<StarData> = {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "artist", weight: 0.3 },
  ],
  threshold: 0.4,
  includeScore: true,
}

const MAX_RESULTS = 8

/**
 * Create a Fuse.js search index from a StarData array.
 * Memoize this on the consumer side (useMemo keyed on stars.length).
 */
export function createStarSearchIndex(stars: StarData[]): Fuse<StarData> {
  return new Fuse(stars, SEARCH_OPTIONS)
}

/**
 * Search stars using a pre-built Fuse index. Returns up to 8 results.
 * Empty query returns empty array (not all stars).
 */
export function searchStars(index: Fuse<StarData>, query: string): StarData[] {
  if (!query.trim()) return []
  return index
    .search(query)
    .slice(0, MAX_RESULTS)
    .map((r) => r.item)
}
