# Feature Landscape

**Domain:** Spotify data visualization / 3D music exploration
**Researched:** 2026-04-01

## Critical API Context (Read This First)

Spotify's API has been dramatically restricted since November 2024 and February 2026. This fundamentally shapes what features are feasible.

**What's GONE for new apps (development mode):**
- Audio Features endpoint (energy, danceability, valence, tempo) -- DEPRECATED Nov 2024
- Audio Analysis endpoint (beats, sections, timbre) -- DEPRECATED Nov 2024
- 30-second preview URLs in multi-get responses -- DEPRECATED Nov 2024
- Recommendations endpoint -- DEPRECATED Nov 2024
- Related Artists endpoint -- DEPRECATED Nov 2024
- Batch fetch endpoints (GET /tracks, /albums, /artists) -- REMOVED Feb 2026
- Track popularity field -- REMOVED Feb 2026
- Artist popularity and followers fields -- REMOVED Feb 2026
- Artist Top Tracks endpoint -- REMOVED Feb 2026
- Search limit reduced from 50 to 10 results max -- Feb 2026

**What STILL WORKS for new development mode apps (5 users max, Premium required):**
- GET /me/top/{type} -- User's top artists and tracks (short/medium/long term)
- GET /me/tracks -- User's saved tracks (full library)
- GET /me/playlists -- User's playlists
- GET /me/following -- Followed artists
- GET /tracks/{id} -- Single track metadata (name, artist, album, but NO popularity)
- GET /artists/{id} -- Single artist metadata (name, genres, images, but NO popularity/followers)
- GET /artists/{id}/albums -- Artist's albums
- GET /albums/{id}/tracks -- Album tracks
- Search endpoint (max 10 results, default 5)
- All player/playback endpoints (requires Premium)
- Spotify Web Playback SDK (requires Premium)

**Implications:** The original PROJECT.md vision of "stars colored by energy level" and "star size reflects play count" and "spatial audio from 30-second previews" must be redesigned. Energy/valence/danceability data is unavailable. Play count is unavailable. Preview URLs are unavailable. The project needs alternative data sources or alternative visual mapping strategies.

**Confidence:** HIGH -- verified against official Spotify developer documentation (Feb 2026 changelog, quota modes page).

---

## Table Stakes

Features users expect from any Spotify data visualization product. Missing these = product feels broken or pointless.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Spotify OAuth login** | Every Spotify visualization app starts here. Users expect a one-click "Connect Spotify" flow. Receiptify, Obscurify, stats.fm all do this. | Low | Use Authorization Code flow with PKCE. Server-side secret via Vercel functions. Well-documented pattern. |
| **Display user's top artists/tracks** | This is the atomic unit of every Spotify visualization app. Wrapped, Receiptify, Obscurify, Icebergify, stats.fm -- they ALL show your top content. Without this, users have nothing to look at. | Low | GET /me/top/{type} with time_range param (short/medium/long_term). Still fully available. |
| **Time period selection** | Receiptify offers last month / 6 months / all time. Obscurify and stats.fm do the same. Users expect to toggle between recent and lifetime data. | Low | Spotify provides short_term (~4 weeks), medium_term (~6 months), long_term (all time). Map these directly. |
| **Genre visualization/clustering** | Every Noise at Once, Obscurify, musicmap.info all visualize genre relationships. Genre is the most intuitive way for users to understand their music taste spatially. | Medium | Artist genres available via GET /artists/{id}. Must fetch individually (no batch endpoint), so needs careful rate-limit handling. |
| **Visual aesthetic that screenshots well** | Wrapped's entire viral strategy is built on shareable visuals. Receiptify's receipt format is designed for Instagram Stories. If your visualization doesn't look stunning in a screenshot, nobody shares it. | Medium | Neon synthwave aesthetic with bloom/glow effects. This is a core differentiator AND a table stake -- every successful Spotify viz app has a distinct visual identity. |
| **Loading state / progress indicator** | Users must know something is happening while data loads. With individual API calls (no batch), loading 1000+ tracks takes time. Wrapped uses animated reveals. | Low | Progressive loading bar or star-by-star reveal animation. |
| **Responsive layout (desktop)** | Users access these apps in desktop browsers. Must work on standard screen sizes. | Low | WebGL canvas fills viewport. HUD elements overlay with CSS. |
| **Search / find within your data** | Users want to find specific artists or songs in their visualization. Wrapped has discovery; stats.fm has search. Without this, large libraries feel unnavigable. | Medium | Client-side search over loaded data. Warp camera to result location. |
| **Hover/click for track/artist details** | Every interactive visualization (Every Noise, Music Galaxy, Spotify Universe by Davit G) shows details on hover/click. Without it, the visualization is just pretty but useless. | Medium | Raycasting in Three.js to detect clicked star, show info panel with track name, artist, album art. |

## Differentiators

Features that set Spotify Universe apart from every other Spotify visualization app. These create the "wow" moment.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **3D galaxy you fly through** | No existing Spotify app lets you FLY through your personal music library. Music Galaxy (cprimozic) visualizes all artists globally; Spotify Universe (Davit G) maps the whole platform. Neither personalizes a flyable galaxy from YOUR library. This is the core differentiator. | High | Three.js with InstancedMesh for 5000+ stars. Orbit/fly controls. 60fps target. |
| **Progressive galaxy formation ("big bang")** | Instead of a loading screen, stars appear in waves as data streams in. Watching YOUR galaxy form is the experience. Wrapped does animated reveals of data stories; this takes the concept to 3D. | Medium | Stream API responses, add stars as data arrives. Particle burst animation per wave. Turns loading into content. |
| **Hyperspace warp transitions** | Click an artist's star, experience a hyperspace jump to their constellation. No Spotify app has navigation transitions that feel this cinematic. Every Noise just scrolls; Music Galaxy just pans. | High | Custom shader-based warp effect (star streaks, tunnel effect). Camera path interpolation. The "money shot" for shareability. |
| **Genre nebulae as spatial regions** | Instead of a flat genre list (Obscurify) or a scatter-plot text map (Every Noise), genres become glowing volumetric nebulae you fly through. "My rock nebula" is viscerally different from "your rock is 23%." | High | Cluster songs by artist genre. Procedural nebula shader per genre region. Color-coding by genre family. |
| **Star properties derived from available data** | Since audio features (energy, valence) are deprecated, map star visuals to what IS available: genre (color), listening frequency (size from top track ranking), time period (brightness/age -- recent listens glow hotter). | Medium | Creative data mapping. Position: genre clustering. Size: ranking in top tracks. Color: genre family. Brightness: recency. |
| **Spatial audio whispers** | As you fly near a star, you hear a hint of that song. No Spotify viz app does spatial audio in 3D space. Kaleidosync visualizes audio but doesn't spatialize it. | High | **BLOCKED by API changes.** 30-second preview URLs deprecated. Alternatives: (1) Web Playback SDK (Premium only, plays full tracks), (2) Spotify embed iframes (not spatial), (3) Client-side audio analysis of playback. See anti-features for recommendation. |
| **Shareable screenshot/export** | Wrapped generates 2B+ social media impressions. Receiptify went viral because the receipt image is inherently shareable. A screenshot of YOUR galaxy with neon glow is Instagram/Twitter gold. | Medium | Canvas-to-image export. Overlay user name + stats. Optimized for Instagram Story (9:16) and Twitter (16:9) aspect ratios. |
| **Mini-map / galaxy overview** | Large libraries become disorienting in 3D. A mini-map showing your position relative to the whole galaxy aids navigation. No Spotify app does this because none are 3D. | Medium | Render galaxy from above into small HUD element. Show current camera position as a blip. |
| **Artist constellations** | When you warp to an artist, their songs form a constellation pattern. Connect songs with lines. Adds meaning to the spatial layout beyond random scatter. | Medium | Within an artist cluster, position songs by album chronology or track order. Draw line segments between them. |

## Anti-Features

Features to explicitly NOT build. Each one is tempting but harmful.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Energy/valence-based star coloring** | Audio Features API is DEPRECATED for new apps. Building features dependent on it means the app literally cannot work. The PROJECT.md requirement "Stars colored by energy level" must be redesigned. | Color stars by **genre family** instead. Group genres into 8-10 color families (rock = red, electronic = blue, hip-hop = purple, etc.). This is actually MORE intuitive -- users understand "my blue cluster is electronic" better than "cool blue = calm." |
| **Play count-based star sizing** | Play count / stream count is NOT available through the Spotify API at all (never was publicly exposed). The "popularity" field was removed in Feb 2026. Cannot size stars by "how much you listen." | Size stars by **top-track ranking**. GET /me/top/tracks returns tracks in ranked order. Position in ranking = star size. Top 10 = supergiant stars. Top 50 = large. Rest of library = standard. This preserves the "favorites are biggest" intent. |
| **30-second spatial audio previews** | Preview URLs deprecated Nov 2024. The workaround (scraping embed HTML) is fragile and violates ToS. Building a core feature on an unofficial hack is a rewrite waiting to happen. | Two alternatives: (1) **Web Playback SDK** for Premium users -- actual full-song playback with spatial positioning via Web Audio API. (2) **Non-audio fallback** -- visual "pulse" effect when hovering near a star, with a "Play on Spotify" deep link. Design the experience to work WITHOUT audio, then layer audio on for Premium users. |
| **Social features (compare galaxies, public profiles)** | Already in PROJECT.md "Out of Scope" and confirmed correct. Adds auth complexity, data storage, privacy concerns. Obscurify's comparison feature is its weakest -- users just want to see THEIR data. | Keep v1 solo. The shareable screenshot IS the social feature -- it's one-way sharing, zero backend complexity. |
| **Mobile/touch controls** | 3D fly-through with touch is a UX nightmare. Pinch-to-zoom + swipe-to-rotate + tap-to-select all conflict. Every successful 3D web viz (Music Galaxy, Spotify Universe by Davit G) is desktop-first. | Desktop-only v1. Add mobile as a simplified "orbit mode" later (no free flight, just auto-tour with tap-to-warp). |
| **Real-time audio-reactive visualization** | Kaleidosync does this -- visuals that pulse with the beat. Looks cool but is a completely different product category (music visualizer vs. data visualization). Combining both dilutes the "explore your galaxy" core value. | Keep the galaxy static/gently animated. If you add Web Playback SDK later, a subtle pulse on the currently-playing star is enough. Don't turn the whole galaxy into a visualizer. |
| **Full Spotify catalog exploration** | Music Galaxy maps 70K+ artists. Spotify Universe (Davit G) maps 1.4M artists. This is a DIFFERENT product (global music map vs. personal music galaxy). The engineering complexity of clustering millions of items is 10x the personal library case. | Strictly personal library only. Max ~10K songs. The intimacy of "this is MY galaxy" is the value prop. A galaxy of everything is just noise. |
| **Playlist-specific views** | Tempting to let users view individual playlists as sub-galaxies. But it fragments the "one galaxy" concept and multiplies the rendering/UI complexity. | Show all saved tracks as one unified galaxy. Playlists can be a filter overlay (highlight playlist stars) in v2, not separate views. |
| **AI-powered music personality analysis** | Receiptify added "What Your Music Says About You" with AI. Wrapped added AI-generated insights. Tempting to follow. But it requires an LLM integration, server-side processing, and ongoing API costs. Not core. | The galaxy IS the personality analysis. "Look at how big my electronic nebula is" tells you more than an AI paragraph. Let the visual speak. |

## Feature Dependencies

```
Spotify OAuth ──────────────────────────────────────────────────────┐
    │                                                               │
    ├─→ Fetch User's Top Tracks/Artists ─────────────────────┐      │
    │       │                                                 │      │
    │       ├─→ Fetch Artist Genres (per artist, individual)  │      │
    │       │       │                                         │      │
    │       │       └─→ Genre Clustering Algorithm            │      │
    │       │               │                                 │      │
    │       │               ├─→ Star Positioning (3D coords)  │      │
    │       │               │       │                         │      │
    │       │               │       ├─→ Galaxy Rendering ─────┤      │
    │       │               │       │       │                 │      │
    │       │               │       │       ├─→ Fly Controls  │      │
    │       │               │       │       ├─→ Mini-map      │      │
    │       │               │       │       ├─→ Hover/Click   │      │
    │       │               │       │       └─→ Search + Warp │      │
    │       │               │       │                         │      │
    │       │               │       └─→ Genre Nebulae Shaders │      │
    │       │               │                                 │      │
    │       │               └─→ Star Visual Properties        │      │
    │       │                   (color=genre, size=ranking)   │      │
    │       │                                                 │      │
    │       └─→ Progressive Galaxy Formation                  │      │
    │           (stars appear as data streams in)             │      │
    │                                                         │      │
    ├─→ Fetch User's Saved Tracks (full library) ─────────────┘      │
    │                                                                │
    ├─→ Hyperspace Warp Transitions                                  │
    │   (depends on: galaxy rendering + camera system)               │
    │                                                                │
    ├─→ Artist Constellations                                        │
    │   (depends on: warp + artist album/track data)                 │
    │                                                                │
    ├─→ Screenshot Export                                            │
    │   (depends on: galaxy rendering)                               │
    │                                                                │
    └─→ Spatial Audio (v2, Premium only) ───────────────────────────┘
        (depends on: Web Playback SDK + galaxy rendering)
```

## MVP Recommendation

**Prioritize (Phase 1-2):**

1. **Spotify OAuth + data fetching pipeline** -- Nothing works without this. Must handle the new API constraints (individual track/artist fetches, rate limiting, 5-user dev mode cap).

2. **3D galaxy rendering with genre-based clustering** -- This IS the product. Stars positioned by genre cluster, colored by genre family, sized by top-track ranking. InstancedMesh for performance.

3. **Fly-through camera controls** -- The core interaction. WASD/arrow keys + mouse look. Must feel smooth at 60fps.

4. **Progressive galaxy formation** -- Turns the slow data-loading constraint into a feature. Stars appear in bursts as API responses arrive.

5. **Hover/click details** -- Makes the galaxy useful, not just pretty. Show track name, artist, album art on hover.

6. **Search + warp-to-result** -- Essential for libraries over ~100 songs. Client-side text search, animate camera to result.

**Defer to Phase 3+:**

- **Hyperspace warp transition** -- High visual impact but requires solid camera system and shader work. Build after the base galaxy works.
- **Genre nebulae shaders** -- Beautiful but complex. Start with simple colored regions, upgrade to volumetric nebulae later.
- **Artist constellations** -- Requires additional API calls per artist for album data. Adds depth but not critical for "wow" moment.
- **Mini-map** -- Navigation aid that's only needed once the galaxy is complex enough to get lost in.
- **Screenshot export** -- High viral potential but zero value without a galaxy worth screenshotting. Build after the visuals are polished.

**Defer to v2:**

- **Spatial audio** -- BLOCKED by preview URL deprecation. Requires Web Playback SDK (Premium-only). Design v1 to work without audio entirely. Layer audio on later as a Premium enhancement.
- **Mobile support** -- 3D fly-through on mobile is a separate UX project. Do it right or don't do it.

## Competitive Landscape Summary

| Product | What It Does | Shareable | Personal | 3D | Explore |
|---------|-------------|-----------|----------|----|---------| 
| **Spotify Wrapped** | Annual stats story (top songs, artists, genres, personality) | Yes (designed for social sharing) | Yes | No | No |
| **Receiptify** | Receipt-style image of top tracks | Yes (image export) | Yes | No | No |
| **Obscurify** | Obscurity score, genre breakdown, mood, decade analysis | Partial | Yes | No | No |
| **Icebergify** | Iceberg chart showing artist popularity depth | Yes (image export) | Yes | No | No |
| **stats.fm** | Deep listening analytics, play counts, streaks | Partial (profile pages) | Yes | No | Limited |
| **Kaleidosync** | Real-time WebGL audio visualizer | No | No (plays any track) | Yes (2D+3D effects) | No |
| **Every Noise at Once** | 6000+ genre scatter plot | No | No (global data) | No (2D text map) | Yes |
| **musicmap.info** | Genre genealogy tree with history | No | No (global data) | No (2D zoomable) | Yes |
| **Music Galaxy** (cprimozic) | 70K artist relationship map in 3D | No | Partial (highlights your artists) | Yes | Yes |
| **Spotify Universe** (Davit G) | 1.4M artist + 6K genre 3D map | No | No (global data) | Yes | Yes |
| **Spotify Universe (this project)** | Personal library as a flyable 3D galaxy | Yes (screenshot export) | Yes | Yes | Yes |

**The gap:** No existing product combines personal data + 3D + flyable + shareable. That's the opportunity.

## Sources

- Spotify Web API changes (Nov 2024): https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
- Spotify Web API changes (Feb 2026): https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- Spotify Feb 2026 migration guide: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
- Spotify quota modes: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Spotify extended access criteria (May 2025): https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access
- Spotify Web Playback SDK: https://developer.spotify.com/documentation/web-playback-sdk
- Music Galaxy blog post: https://cprimozic.net/blog/building-music-galaxy/
- Spotify Universe (Davit G): https://davitg.com/projects/spotify-universe/
- Every Noise at Once: https://everynoise.com/
- Receiptify: https://receiptify.tools/
- Obscurify: https://www.obscurifymusic.com/
- Kaleidosync: https://github.com/zachwinter/kaleidosync
- musicmap.info: https://musicmap.info/
- Spotify Wrapped 2025: https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/
- TechCrunch on Spotify API crackdown (Feb 2026): https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/
