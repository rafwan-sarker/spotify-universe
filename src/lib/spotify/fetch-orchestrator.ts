import type {
  SpotifyTrackRaw,
  SpotifyArtistRaw,
  NormalizedTrack,
  TopTrackRanking,
} from "@/lib/spotify/types"

export interface OrchestratorCallbacks {
  onProgress: (phase: string, loaded: number, total: number) => void
  onTrackBatch: (
    tracks: NormalizedTrack[],
    artistGenres: Record<string, string[]>
  ) => void
  onComplete: () => void
  onError: (error: Error) => void
}

/**
 * Client-side fetch orchestrator managing the full data pipeline:
 * Spotify API (via proxy routes) -> raw tracks -> deduplicate -> artist genres -> worker batches.
 *
 * Rate limiting: max 2 concurrent requests, 200ms spacing, Retry-After respect.
 * Dedup: Map<trackId, NormalizedTrack> with source-priority merging.
 * Fetch order: top tracks -> saved -> recently played -> playlists -> artists (parallel).
 */
export class SpotifyFetchOrchestrator {
  private callbacks: OrchestratorCallbacks
  private aborted = false
  private abortController: AbortController

  // Rate limiting state
  private activeRequests = 0
  private readonly maxConcurrency = 2
  private readonly minSpacingMs = 200
  private lastRequestTime = 0
  private retryAfterMs = 0

  // Deduplication
  private trackMap = new Map<string, NormalizedTrack>()

  // Artist genre cache
  private artistGenreCache: Record<string, string[]> = {}
  private fetchedArtistIds = new Set<string>()
  private pendingArtistIds = new Set<string>()

  constructor(callbacks: OrchestratorCallbacks) {
    this.callbacks = callbacks
    this.abortController = new AbortController()
  }

  /**
   * Start the full fetch pipeline. Fetches in priority order:
   * 1. Top tracks (3 requests, one per time range)
   * 2. Saved tracks (paginated, up to 10000)
   * 3. Recently played (1 request, max 50)
   * 4. Playlists (list + each playlist's tracks)
   * 5. Artists (parallel with track fetching as IDs accumulate)
   */
  async start(): Promise<void> {
    try {
      // Phase 1: Top tracks (fast, provides ranking data)
      this.callbacks.onProgress("top-tracks", 0, 3)
      await this.fetchTopTracks()
      if (this.aborted) return
      await this.emitCurrentBatch()

      // Phase 2: Saved tracks (the bulk)
      this.callbacks.onProgress("tracks", 0, 0)
      await this.fetchSavedTracks()
      if (this.aborted) return
      await this.emitCurrentBatch()

      // Phase 3: Recently played
      this.callbacks.onProgress("recently-played", 0, 1)
      await this.fetchRecentlyPlayed()
      if (this.aborted) return
      await this.emitCurrentBatch()

      // Phase 4: Playlists
      this.callbacks.onProgress("playlists", 0, 0)
      await this.fetchPlaylists()
      if (this.aborted) return
      await this.emitCurrentBatch()

      // Phase 5: Fetch all accumulated artist genres
      this.callbacks.onProgress("artists", 0, this.pendingArtistIds.size)
      await this.fetchAllArtistGenres()
      if (this.aborted) return

      // Final batch with all artist genres resolved
      await this.emitCurrentBatch()

      this.callbacks.onProgress("complete", this.trackMap.size, this.trackMap.size)
      this.callbacks.onComplete()
    } catch (error) {
      if (!this.aborted) {
        this.callbacks.onError(
          error instanceof Error ? error : new Error(String(error))
        )
      }
    }
  }

  /** Stop all pending fetches. */
  abort(): void {
    this.aborted = true
    this.abortController.abort()
  }

  // ---------------------------------------------------------------------------
  // Fetch phases
  // ---------------------------------------------------------------------------

  private async fetchTopTracks(): Promise<void> {
    const timeRanges = ["short_term", "medium_term", "long_term"] as const

    for (let i = 0; i < timeRanges.length; i++) {
      if (this.aborted) return
      const timeRange = timeRanges[i]

      const data = await this.rateLimitedFetch(
        `/api/spotify/top-tracks?time_range=${timeRange}&limit=50`
      )
      if (!data || this.aborted) return

      const items: SpotifyTrackRaw[] = data.items ?? []
      for (let j = 0; j < items.length; j++) {
        const track = items[j]
        this.addTrack(track, "top", null, {
          position: j,
          timeRange,
        })
      }

      this.callbacks.onProgress("top-tracks", i + 1, 3)
    }
  }

  private async fetchSavedTracks(): Promise<void> {
    let offset = 0
    const limit = 50
    let total = 0

    // First page to get total
    const firstPage = await this.rateLimitedFetch(
      `/api/spotify/tracks?offset=0&limit=${limit}`
    )
    if (!firstPage || this.aborted) return

    total = firstPage.total ?? 0
    const cappedTotal = Math.min(total, 10000) // Spotify offset cap
    this.callbacks.onProgress("tracks", 0, cappedTotal)

    this.processSavedTrackItems(firstPage.items ?? [])
    offset += limit

    // Remaining pages
    while (offset < cappedTotal && !this.aborted) {
      const data = await this.rateLimitedFetch(
        `/api/spotify/tracks?offset=${offset}&limit=${limit}`
      )
      if (!data || this.aborted) return

      this.processSavedTrackItems(data.items ?? [])
      offset += limit

      this.callbacks.onProgress("tracks", Math.min(offset, cappedTotal), cappedTotal)

      // Emit batch every 200 tracks for progressive rendering
      if (offset % 200 === 0) {
        await this.emitCurrentBatch()
      }
    }
  }

  private processSavedTrackItems(
    items: Array<{ track: SpotifyTrackRaw; added_at: string }>
  ): void {
    for (const item of items) {
      if (item.track) {
        this.addTrack(item.track, "saved", item.added_at, null)
      }
    }
  }

  private async fetchRecentlyPlayed(): Promise<void> {
    const data = await this.rateLimitedFetch(
      `/api/spotify/recently-played?limit=50`
    )
    if (!data || this.aborted) return

    const items: Array<{ track: SpotifyTrackRaw; played_at: string }> =
      data.items ?? []
    for (const item of items) {
      if (item.track) {
        this.addTrack(item.track, "recent", null, null)
      }
    }

    this.callbacks.onProgress("recently-played", 1, 1)
  }

  private async fetchPlaylists(): Promise<void> {
    // First, get the list of playlists
    let offset = 0
    const limit = 50
    const playlistIds: string[] = []

    // Paginate playlist list
    let hasMore = true
    while (hasMore && !this.aborted) {
      const data = await this.rateLimitedFetch(
        `/api/spotify/playlists?offset=${offset}&limit=${limit}`
      )
      if (!data || this.aborted) return

      const items: Array<{ id: string; tracks: { total: number } }> =
        data.items ?? []
      for (const playlist of items) {
        playlistIds.push(playlist.id)
      }

      // Manual pagination (never follow `next` URL -- Spotify Feb 2026 bug)
      const total = data.total ?? 0
      offset += limit
      hasMore = offset < total
    }

    this.callbacks.onProgress("playlists", 0, playlistIds.length)

    // Fetch tracks from each playlist
    for (let i = 0; i < playlistIds.length; i++) {
      if (this.aborted) return
      await this.fetchPlaylistTracks(playlistIds[i])
      this.callbacks.onProgress("playlists", i + 1, playlistIds.length)

      // Emit batch every 5 playlists for progressive rendering
      if ((i + 1) % 5 === 0) {
        await this.emitCurrentBatch()
      }
    }
  }

  private async fetchPlaylistTracks(playlistId: string): Promise<void> {
    let offset = 0
    const limit = 100
    let hasMore = true

    while (hasMore && !this.aborted) {
      const data = await this.rateLimitedFetch(
        `/api/spotify/playlists/${playlistId}?offset=${offset}&limit=${limit}`
      )
      if (!data || this.aborted) return

      const items: Array<{ track: SpotifyTrackRaw | null; added_at: string }> =
        data.items ?? []
      for (const item of items) {
        if (item.track) {
          this.addTrack(item.track, "playlist", item.added_at, null)
        }
      }

      const total = data.total ?? 0
      offset += limit
      hasMore = offset < total
    }
  }

  private async fetchAllArtistGenres(): Promise<void> {
    const artistIds = Array.from(this.pendingArtistIds)
    let completed = 0

    for (const artistId of artistIds) {
      if (this.aborted) return
      if (this.fetchedArtistIds.has(artistId)) {
        completed++
        continue
      }

      const data = await this.rateLimitedFetch(
        `/api/spotify/artists/${artistId}`
      )
      if (!data || this.aborted) return

      const artist = data as SpotifyArtistRaw
      this.artistGenreCache[artistId] = artist.genres ?? []
      this.fetchedArtistIds.add(artistId)
      completed++

      this.callbacks.onProgress("artists", completed, artistIds.length)
    }
  }

  // ---------------------------------------------------------------------------
  // Track normalization and deduplication
  // ---------------------------------------------------------------------------

  private addTrack(
    raw: SpotifyTrackRaw,
    source: NormalizedTrack["source"],
    addedAt: string | null,
    topRanking: TopTrackRanking | null
  ): void {
    const normalized: NormalizedTrack = {
      id: raw.id,
      name: raw.name,
      artistName: raw.artists[0]?.name ?? "Unknown",
      artistId: raw.artists[0]?.id ?? "",
      genre: "", // Set later by worker using artist genres
      topRanking,
      addedAt,
      source,
    }

    // Queue artist ID for genre fetching
    if (normalized.artistId) {
      this.pendingArtistIds.add(normalized.artistId)
    }

    // Dedup: merge with existing entry if duplicate
    const existing = this.trackMap.get(raw.id)
    if (existing) {
      this.mergeTrack(existing, normalized)
    } else {
      this.trackMap.set(raw.id, normalized)
    }
  }

  /**
   * Merge duplicate tracks. Priority for metadata:
   * top ranking > saved (has addedAt) > playlist > recent
   *
   * If existing has no topRanking but new one does, merge the ranking in.
   */
  private mergeTrack(
    existing: NormalizedTrack,
    incoming: NormalizedTrack
  ): void {
    // Merge top ranking if the existing lacks one
    if (!existing.topRanking && incoming.topRanking) {
      existing.topRanking = incoming.topRanking
    }

    // Merge addedAt if existing lacks one
    if (!existing.addedAt && incoming.addedAt) {
      existing.addedAt = incoming.addedAt
    }

    // Upgrade source priority: top > saved > recent > playlist
    const sourcePriority: Record<NormalizedTrack["source"], number> = {
      top: 4,
      saved: 3,
      recent: 2,
      playlist: 1,
    }
    if (sourcePriority[incoming.source] > sourcePriority[existing.source]) {
      existing.source = incoming.source
    }
  }

  // ---------------------------------------------------------------------------
  // Batch emission
  // ---------------------------------------------------------------------------

  private async emitCurrentBatch(): Promise<void> {
    if (this.aborted) return

    const tracks = Array.from(this.trackMap.values())
    if (tracks.length === 0) return

    this.callbacks.onTrackBatch(tracks, { ...this.artistGenreCache })
  }

  // ---------------------------------------------------------------------------
  // Rate-limited fetch
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async rateLimitedFetch(
    url: string,
    retryCount = 0
  ): Promise<any | null> {
    if (this.aborted) return null

    // Wait for available concurrency slot
    while (this.activeRequests >= this.maxConcurrency) {
      await this.sleep(50)
      if (this.aborted) return null
    }

    // Wait for retry-after period (global pause)
    if (this.retryAfterMs > 0) {
      await this.sleep(this.retryAfterMs)
      this.retryAfterMs = 0
    }

    // Enforce minimum spacing between requests
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    if (elapsed < this.minSpacingMs) {
      await this.sleep(this.minSpacingMs - elapsed)
    }

    this.activeRequests++
    this.lastRequestTime = Date.now()

    try {
      const response = await fetch(url, {
        signal: this.abortController.signal,
      })

      if (response.status === 429) {
        // Rate limited -- pause ALL requests
        const retryAfter = parseInt(
          response.headers.get("Retry-After") ?? "5"
        )
        this.retryAfterMs = retryAfter * 1000

        if (retryCount < 3) {
          this.activeRequests--
          return this.rateLimitedFetch(url, retryCount + 1)
        }
        console.warn(`Rate limited 3 times for ${url}, skipping`)
        return null
      }

      if (response.status === 401) {
        throw new Error("Unauthorized -- session may have expired")
      }

      if (!response.ok) {
        if (retryCount < 3) {
          // Exponential backoff: 1s, 2s, 4s
          const backoff = Math.pow(2, retryCount) * 1000
          await this.sleep(backoff)
          this.activeRequests--
          return this.rateLimitedFetch(url, retryCount + 1)
        }
        console.warn(`Failed after 3 retries: ${url} (${response.status})`)
        return null
      }

      return await response.json()
    } catch (error) {
      if (this.aborted) return null

      if (retryCount < 3) {
        const backoff = Math.pow(2, retryCount) * 1000
        await this.sleep(backoff)
        this.activeRequests--
        return this.rateLimitedFetch(url, retryCount + 1)
      }

      throw error
    } finally {
      this.activeRequests--
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
