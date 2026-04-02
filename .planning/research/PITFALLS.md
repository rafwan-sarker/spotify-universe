# Domain Pitfalls

**Domain:** 3D music visualization (Spotify API + Three.js + React + Vercel)
**Researched:** 2026-04-01

---

## Critical Pitfalls

Mistakes that cause rewrites, blocked features, or project failure.

---

### Pitfall 1: Spotify Audio Features Endpoint Is Deprecated for New Apps

**What goes wrong:** The entire star-coloring and genre-clustering system depends on Spotify's Audio Features endpoint (energy, danceability, valence, tempo). As of November 27, 2024, this endpoint is **completely inaccessible** to newly registered applications. New apps get a 403 error. This is not a rate limit -- it is a hard block.

**Why it happens:** Spotify restricted access to Audio Features, Audio Analysis, Recommendations, and Related Artists endpoints for all apps created after November 27, 2024, citing security concerns. Only apps that had extended quota approval before that date retain access.

**Consequences:** Without audio features, there is no energy value to drive star color, no danceability/valence for positioning, and no tempo data for animation. The core "galaxy from your music data" concept loses its primary data source for visual differentiation.

**Prevention:**
- Accept this constraint upfront and design around it. Do NOT assume you can get extended quota -- Spotify now requires a legally registered business with 250,000+ MAU for extended access.
- Use genre strings from artist/track metadata (still available) as the primary clustering dimension.
- Derive "energy proxies" from genre classification (metal/EDM = high energy, ambient/classical = low energy) using a local genre-to-energy mapping table.
- If audio features become available later (via extended quota), treat them as an enhancement layer, not a dependency.
- Alternative: Use a third-party audio analysis service (Cyanite, Musicae API) as a supplementary data source, though this adds cost and complexity.

**Detection:** If `GET /v1/audio-features/{id}` returns 403 during early development, this pitfall is confirmed. Test this in the first sprint.

**Confidence:** HIGH -- verified via official Spotify developer blog (November 2024) and multiple community reports.

**Phase impact:** Phase 1 (data layer design). Must architect the galaxy generation system to work WITHOUT audio features from day one.

---

### Pitfall 2: Spotify 30-Second Preview URLs Are Restricted for New Apps

**What goes wrong:** The spatial audio feature (hearing song previews as you fly near stars) depends on Spotify's 30-second preview URLs (`preview_url` field). These are restricted in "multi-get" responses (SimpleTrack objects) for new applications. Single-track GET responses may still return preview URLs inconsistently, but this is not guaranteed.

**Why it happens:** Same November 2024 API restriction wave. Preview URLs in batch responses are blocked for new dev-mode apps.

**Consequences:** The spatial audio feature -- a core differentiator -- becomes unreliable or impossible without a workaround. Flying through the galaxy in silence eliminates a major "wow factor."

**Prevention:**
- Do NOT design spatial audio as a launch-critical feature. Build the visual galaxy first, audio second.
- For single-track fetches, `preview_url` may still be returned -- test this early.
- Workaround exists: extract preview URLs from Spotify's embed player HTML (unofficial, may break). Evaluate reliability before depending on it.
- Alternative approach: Use the Spotify Web Playback SDK (requires Premium) to play full tracks instead of previews. This limits the audience to Premium users but provides better audio.
- Design the audio system with a clean interface that can swap between preview URLs, Web Playback SDK, or silence gracefully.

**Detection:** Fetch a batch of tracks via `GET /v1/tracks?ids=...` and check if `preview_url` is null across all results. Test in the first sprint.

**Confidence:** HIGH -- verified via official Spotify blog and community reports confirming the restriction.

**Phase impact:** Phase 1 (architecture) -- design the audio interface as pluggable. Phase 3+ (spatial audio implementation) -- implement with fallback strategy.

---

### Pitfall 3: React Re-Renders Destroying Three.js Performance

**What goes wrong:** React's state management triggers full component re-renders. When Three.js scene objects (camera position, star colors, particle positions) are stored in React state, every frame update causes React reconciliation across the component tree. At 60fps, this means 60 full re-render cycles per second -- obliterating performance.

**Why it happens:** React's declarative model (state change -> re-render -> diff -> commit) fundamentally conflicts with Three.js's imperative render loop (mutate objects directly each frame). Developers new to react-three-fiber instinctively use `useState` for everything, including animation values.

**Consequences:** Frame rate drops from 60fps to 5-15fps. Garbage collection spikes from creating new Vector3/Color objects every frame. UI becomes completely unresponsive during galaxy fly-through.

**Prevention:**
- Use `useRef` + direct mutation for ALL per-frame updates (camera position, star glow intensity, warp animation progress).
- Use `useFrame` callback for animation -- never `useEffect` + `requestAnimationFrame`.
- Use `useState` ONLY for discrete UI state (menu open/closed, search query text, selected star ID).
- Fetch Zustand/state manager values inside `useFrame` via `getState()`, not via reactive subscriptions.
- Never create `new THREE.Vector3()` or `new THREE.Color()` inside `useFrame`. Allocate once in `useMemo` or at module scope, reuse via `.set()`.
- Use `<mesh visible={false}>` instead of conditional rendering (`{show && <mesh>}`) to avoid mount/unmount overhead for Three.js objects.

**Detection:** If `Stats.js` or Chrome DevTools show GC spikes coinciding with frame drops, or if React DevTools Profiler shows components re-rendering every frame -- this pitfall is active.

**Confidence:** HIGH -- documented in official react-three-fiber pitfalls page and multiple Three.js forum threads.

**Phase impact:** Phase 1 (architecture) -- establish the boundary between React state and Three.js mutation from the start. This is an architectural decision, not an optimization you bolt on later.

---

### Pitfall 4: Spotify API Pagination Hard Cap at 10,000 Items

**What goes wrong:** The project targets users with 5,000+ song libraries. Spotify's `GET /me/tracks` endpoint has a maximum offset of 10,000 (with limit=50, that is 200 requests). Users with more than 10,000 saved tracks simply cannot retrieve their full library through standard pagination. The API returns a 404 when offset exceeds 10,000.

**Why it happens:** Spotify enforces a hard 10,000-item offset cap on pagination endpoints. This is documented, intentional, and marked "wontfix" on their GitHub issues.

**Consequences:** Power users (the most engaged audience for a music visualization app) have incomplete galaxies. Missing songs mean missing stars, broken genre clusters, and a degraded experience for exactly the users who would love the product most.

**Prevention:**
- Communicate the 10,000 track limit clearly in the UI. "Showing your 10,000 most recent saves."
- Supplement saved tracks with other data sources: top tracks (`GET /me/top/tracks`), playlist tracks, recently played -- these have separate pagination limits.
- De-duplicate across sources (a track in "Liked Songs" may also be in a playlist).
- Consider building the galaxy progressively from multiple endpoints, not just saved tracks.
- Design the galaxy to feel "complete" at any count -- a 2,000-star galaxy should look as intentional as a 10,000-star galaxy.

**Detection:** Check `total` field in the first pagination response. If > 10,000, the user will hit the cap.

**Confidence:** HIGH -- confirmed via Spotify GitHub issue #862 (marked wontfix) and official API documentation.

**Phase impact:** Phase 2 (data fetching) -- implement multi-source aggregation from the start. Do not build around a single endpoint.

---

### Pitfall 5: Spotify Developer Mode Limits (February 2026 Changes)

**What goes wrong:** As of February 2026, Spotify Dev Mode apps are limited to 5 authorized users maximum, 1 Client ID per developer, and require the app owner to have an active Spotify Premium subscription. If the Premium subscription lapses, the app stops working entirely.

**Why it happens:** Spotify tightened developer access in February 2026 to combat automated/AI-driven API abuse.

**Consequences:** During development, only 5 people (including the developer) can test the app. Public launch is impossible without Extended Quota Mode approval, which requires 250,000+ MAU and a legally registered business. This is a Catch-22: you need users to get approval, but you cannot have users without approval.

**Prevention:**
- Plan for the 5-user dev mode limit during all development and testing phases.
- Design the app to function as a portfolio/demo piece initially. The 5-user limit is fine for showcasing.
- For public launch: apply for Extended Quota Mode early (the review process is slow and opaque). Have the application ready and polished before applying.
- Keep the Premium subscription active throughout development -- a lapsed subscription kills the entire app.
- Consider a "demo mode" with pre-fetched sample data that works without Spotify auth, so anyone can experience the app.

**Detection:** Create a test account and verify API access works. Check Spotify Developer Dashboard for quota mode status.

**Confidence:** HIGH -- verified via official Spotify developer blog (February 2026) and TechCrunch coverage.

**Phase impact:** All phases. Factor the 5-user limit into testing plans. Phase 1 should include a demo mode with mock data.

---

## Moderate Pitfalls

Mistakes that cause significant debugging time or performance issues.

---

### Pitfall 6: Bloom Post-Processing Tanking Frame Rate

**What goes wrong:** UnrealBloomPass (the standard Three.js bloom effect) renders multiple mip-map blur passes per frame. With a neon synthwave aesthetic requiring heavy bloom, this can consume 40-60% of GPU budget alone -- leaving insufficient headroom for 5,000+ instanced stars, custom shaders, and spatial audio processing.

**Prevention:**
- Start with a low bloom resolution (256x256 or 512x512), NOT the canvas resolution. Bloom on lower-res buffers looks nearly identical but costs a fraction.
- Use `threshold` aggressively -- only bloom objects with emissive values above 0.8, not the entire scene.
- For selective bloom (only stars glow, not the HUD), use the selective bloom pattern: render bloomed objects to a separate layer, composite in a final pass. Do NOT bloom the entire scene.
- Profile early: add `Stats.js` in phase 1 and monitor GPU time per pass.
- Consider a simpler additive glow shader on star materials instead of full-screen bloom for the base look, reserving UnrealBloomPass for hero moments (warp transitions).

**Detection:** GPU time per frame > 12ms on a mid-range GPU (GTX 1060 equivalent). FPS drops when camera is pointing at dense star clusters.

**Confidence:** HIGH -- documented Three.js forum reports of 40fps on i7 systems with UnrealBloomPass.

**Phase impact:** Phase 2 (visual rendering) -- set bloom parameters conservatively and profile before adding more effects.

---

### Pitfall 7: CORS Errors on Spotify Token Exchange

**What goes wrong:** The Spotify token endpoint (`https://accounts.spotify.com/api/token`) does not support CORS for browser-origin requests. Attempting to exchange the authorization code for tokens directly from client-side JavaScript fails with "Cross-Origin Request Blocked."

**Prevention:**
- NEVER call the token endpoint from the browser. Use Vercel serverless functions as a proxy.
- Auth flow: Browser redirects to Spotify -> Spotify redirects back with code -> Browser sends code to YOUR Vercel function -> Vercel function exchanges code for tokens server-side -> Returns tokens to browser.
- For PKCE flow (no client secret): the authorization code exchange STILL needs server-side handling to avoid CORS. PKCE eliminates the need for a client secret, not the need for a server proxy.
- Token refresh must also go through the server proxy for the same reason.

**Detection:** Network tab shows a CORS error (preflight OPTIONS request fails) when calling `accounts.spotify.com/api/token`. This manifests immediately during auth implementation.

**Confidence:** HIGH -- documented across dozens of Spotify community threads and GitHub issues.

**Phase impact:** Phase 1 (auth setup) -- Vercel function for token exchange is a day-1 requirement, not an afterthought.

---

### Pitfall 8: Rate Limiting During Bulk Data Fetch

**What goes wrong:** Fetching a 5,000-track library requires 100+ API calls (50 tracks per request). Firing these in rapid succession (or in parallel) triggers Spotify's 429 rate limit within seconds. The rolling 30-second window means aggressive parallelism is punished.

**Prevention:**
- Implement a request queue with configurable concurrency (start with 2-3 concurrent requests, not 10+).
- Respect `Retry-After` headers on 429 responses -- back off for the specified duration, then resume.
- Use exponential backoff with jitter for retries.
- Cache fetched data in the browser (IndexedDB, not localStorage -- track data can be several MB). On subsequent visits, only fetch new/changed tracks.
- Show progressive loading: render stars as batches arrive (every 50 tracks = new stars appearing). This turns the rate limit into a feature ("watch your galaxy form").
- For audio features (if available): batch 100 IDs per request (`GET /v1/audio-features?ids=...`) to minimize request count.

**Detection:** 429 responses in the network tab. Galaxy loading takes > 30 seconds for a modest library.

**Confidence:** HIGH -- Spotify's rate limit documentation is clear, and community reports confirm aggressive clients get throttled quickly.

**Phase impact:** Phase 2 (data fetching) -- implement the request queue and progressive loading from the start.

---

### Pitfall 9: WebGL Context Loss on Mobile/Low-End Devices

**What goes wrong:** Browsers will kill the WebGL context if GPU memory is exhausted. With 5,000+ instanced meshes, bloom post-processing, custom shaders, and potentially spatial audio processing, low-end GPUs can exceed their memory budget. The canvas goes black with a "WebGL: CONTEXT_LOST_WEBGL" error.

**Prevention:**
- Listen for the `webglcontextlost` event on the canvas element. Display a user-friendly "GPU overloaded, try reducing quality" message instead of a black screen.
- Listen for `webglcontextrestored` to automatically reinitialize the scene.
- Implement a quality settings system: reduce star count, disable bloom, lower resolution for weaker devices.
- Call `.dispose()` on ALL geometries, materials, and textures when they are no longer needed. Three.js does NOT garbage collect GPU resources automatically.
- Avoid recreating the WebGLRenderer -- persist it across React navigation events.
- Use `renderer.info` to monitor active textures, geometries, and programs during development.

**Detection:** Black canvas after prolonged use or on lower-end hardware. `renderer.info.memory` showing increasing texture/geometry counts over time (leak).

**Confidence:** HIGH -- documented in Three.js GitHub issues and forum threads.

**Phase impact:** Phase 2 (rendering) -- add context loss handlers. Phase 4 (polish) -- add quality settings.

---

### Pitfall 10: Web Audio API Autoplay Policy Blocking Spatial Audio

**What goes wrong:** All modern browsers require a user gesture (click, tap, keypress) before an AudioContext can produce sound. Creating an AudioContext on page load results in a "suspended" state. Attempting to play spatial audio previews while flying through the galaxy silently fails because the context was never resumed.

**Prevention:**
- Do NOT create the AudioContext at app initialization. Create it lazily on the first user interaction.
- Check `audioContext.state` -- if "suspended", call `audioContext.resume()` inside a click handler.
- Add a prominent "Enter Galaxy" or "Start Exploration" button that doubles as the user gesture to unlock audio.
- Use `navigator.getAutoplayPolicy()` (where supported) to check audio policy before attempting playback.
- Provide a visual indicator when audio is muted/blocked, with a clear "Enable Audio" button.
- Safari has additional restrictions: AudioContext must be created AND resumed within the same user gesture callback.

**Detection:** `audioContext.state === 'suspended'` after creation. Audio plays in dev (where you have clicked around) but fails in fresh page loads or after sharing a link.

**Confidence:** HIGH -- documented in Chrome developer blog and MDN Web Audio API best practices.

**Phase impact:** Phase 3 (spatial audio) -- design the UX flow to include an explicit user interaction before audio begins.

---

### Pitfall 11: Vercel Serverless Cold Starts During OAuth Callback

**What goes wrong:** Vercel serverless functions experience cold starts of 1-3 seconds. During OAuth, the user is redirected from Spotify back to a Vercel function that exchanges the code for tokens. If the function is cold, there is a noticeable delay where the user sees a blank page or loading spinner after granting Spotify access.

**Prevention:**
- Keep the OAuth serverless function minimal -- no heavy imports, no database connections. Import only `fetch` (native) and process the token exchange.
- Use Vercel's Edge Functions (run at the edge, near-zero cold start) for the OAuth callback if the Spotify token exchange does not require Node.js-specific APIs.
- Show an intermediate loading page ("Connecting to Spotify...") that the serverless function redirects TO, so the cold start happens in the background while the user sees feedback.
- On Vercel free tier, the function timeout is 10 seconds. OAuth token exchange typically takes < 1 second, so even with a 3-second cold start you have margin.

**Detection:** First login after deployment is noticeably slow (3-5 seconds on the callback URL). Subsequent logins are fast (warm function).

**Confidence:** MEDIUM -- cold start times vary by region and function size. Documented in Vercel community discussions.

**Phase impact:** Phase 1 (auth) -- keep the function lean. Not a launch blocker, but affects first impression.

---

### Pitfall 12: Token Storage Security (XSS via localStorage)

**What goes wrong:** Storing Spotify access/refresh tokens in `localStorage` exposes them to any JavaScript running on the page. A single XSS vulnerability (including in third-party dependencies) can steal all stored tokens, granting full access to the user's Spotify account.

**Prevention:**
- Store tokens in memory (JavaScript variable/Zustand store) for the session, not in localStorage.
- Use httpOnly cookies set by the Vercel serverless function for refresh token persistence across sessions. httpOnly cookies are inaccessible to client-side JavaScript.
- Flow: Vercel function exchanges code for tokens -> sets refresh token as httpOnly cookie -> returns access token in response body -> client stores access token in memory only.
- When the access token expires (1 hour), the client calls the Vercel function with the httpOnly cookie, which refreshes the token server-side and returns a new access token.
- Set Content Security Policy headers to mitigate XSS risk.

**Detection:** Open browser DevTools -> Application -> Local Storage. If Spotify tokens are visible there, this pitfall is active.

**Confidence:** HIGH -- well-documented security best practice across OWASP, Auth0, and security-focused blogs.

**Phase impact:** Phase 1 (auth architecture) -- design the token flow correctly from the start. Retrofitting httpOnly cookies onto a localStorage-based auth system is painful.

---

## Minor Pitfalls

Mistakes that cause friction or wasted time but are recoverable.

---

### Pitfall 13: InstancedMesh vs Points -- Wrong Primitive for Stars

**What goes wrong:** Using `InstancedMesh` with sphere geometry for 5,000+ stars creates significant vertex processing overhead. Each "star" becomes a full 3D sphere with hundreds of vertices. Alternatively, using `Points` (GL_POINTS) limits star size to a few pixels and prevents custom star shapes.

**Prevention:**
- Use `InstancedMesh` with a simple billboard quad (PlaneGeometry, 4 vertices) + custom fragment shader that renders a star/glow shape. This gives custom shapes with minimal geometry cost.
- For distant stars that are < 3 pixels on screen, switch to a `Points` system with a star texture. Use LOD to transition between detailed quads (near) and simple points (far).
- Do NOT use SphereGeometry with high segment counts for instanced stars. A 32-segment sphere has ~1,000 vertices -- times 5,000 instances, that is 5 million vertices per frame.
- `InstancedMesh` supports raycasting (click on a star to select it). `Points` requires custom raycasting. Choose based on interaction needs.

**Detection:** Draw call count > 10 for the star field. Vertex count > 100,000 for stars alone.

**Confidence:** HIGH -- documented in Three.js forum discussions comparing Points vs InstancedMesh.

**Phase impact:** Phase 2 (star rendering) -- choose the right primitive on first implementation.

---

### Pitfall 14: Genre Data Inconsistency in Spotify API

**What goes wrong:** Spotify genre tags are attached to artists, not tracks. A single artist can have 5+ genre tags ("indie rock", "modern rock", "alternative rock", "garage rock", "portland indie"). Genre strings are not standardized -- there are 5,000+ unique genre values. Building genre "nebulae" from raw Spotify genres produces a chaotic mess with too many clusters.

**Prevention:**
- Build a genre normalization layer that maps Spotify's granular genres to 15-25 macro-genres (Rock, Electronic, Hip-Hop, Jazz, Classical, etc.).
- Use "Every Noise at Once" (everynoise.com, a Spotify-adjacent project) as reference for genre taxonomy.
- Assign each track the macro-genre of its primary artist. If an artist has genres ["indie rock", "modern rock", "alternative rock"], all resolve to "Rock".
- Allow users to see the specific sub-genre on hover/click, but cluster by macro-genre for spatial layout.
- Tracks with artists that have NO genre tags (common for small artists) should go into an "Undiscovered" nebula rather than being randomly placed.

**Detection:** If the genre clustering produces > 50 distinct clusters, the normalization is too fine-grained.

**Confidence:** MEDIUM -- based on Spotify API response structure and community experience. Genre taxonomy design is subjective.

**Phase impact:** Phase 2 (data processing) -- build the genre normalization map before implementing galaxy layout.

---

### Pitfall 15: Warp/Hyperspace Transition Breaking Scene State

**What goes wrong:** A hyperspace warp transition (zooming to a specific artist constellation) involves rapidly changing camera position, field of view, post-processing intensity, and star visibility. If any of these transitions fail or are interrupted (user clicks another star mid-warp), the scene can end up in an inconsistent state -- bloom stuck at maximum, camera at wrong position, stars invisible.

**Prevention:**
- Implement transitions as cancellable state machines (IDLE -> WARPING -> ARRIVING -> IDLE), not as fire-and-forget tweens.
- When a new warp is triggered during an active warp, cancel the current transition and lerp from the CURRENT state to the new target, not from the original start.
- Store all visual parameters that transitions modify (camera position, bloom intensity, FOV, star scale) and expose a "reset to defaults" function for recovery.
- Use a single animation manager (a `useFrame` loop checking transition state) rather than independent `gsap.to()` calls on different objects that can desync.

**Detection:** Rapidly clicking different stars during warp transitions. If the scene looks "stuck" or wrong after fast interactions, this pitfall is active.

**Confidence:** MEDIUM -- based on general 3D application state management patterns. Specific to this project's feature set.

**Phase impact:** Phase 3 (navigation/transitions) -- design the transition state machine before implementing the visual effect.

---

### Pitfall 16: Spotify OAuth Implicit Grant Flow Is Dead

**What goes wrong:** Older Spotify tutorials and examples use the Implicit Grant flow (returns token directly in URL hash). Spotify deprecated this flow and enforced migration by November 27, 2025. New apps CANNOT use Implicit Grant. Code copied from pre-2025 tutorials will not work.

**Prevention:**
- Use Authorization Code Flow with PKCE for the client-side component.
- Use Authorization Code Flow (with client secret) for the server-side token exchange via Vercel functions.
- All redirect URIs must be HTTPS (localhost is exempt during development).
- Ignore any tutorial or example that uses `response_type=token` in the Spotify authorize URL. Use `response_type=code` instead.

**Detection:** Auth flow returns an error or Spotify dashboard rejects the configuration.

**Confidence:** HIGH -- verified via official Spotify migration documentation (November 2025 deadline).

**Phase impact:** Phase 1 (auth) -- use the correct flow from the start.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Auth & Data Architecture | Audio Features API unavailable (P1), Preview URLs restricted (P2), CORS on token exchange (P7), Implicit Grant deprecated (P16), Token storage XSS (P12) | Design data layer without audio features. Server-side token exchange via Vercel functions. httpOnly cookie refresh tokens. |
| Data Fetching & Processing | Pagination cap at 10K (P4), Rate limiting (P8), Genre inconsistency (P14), Dev mode 5-user limit (P5) | Request queue with backoff, multi-source aggregation, genre normalization layer, demo mode with mock data. |
| 3D Rendering & Visual Effects | React re-renders killing FPS (P3), Bloom performance (P6), Wrong star primitive (P13), WebGL context loss (P9) | Strict React/Three.js boundary, conservative bloom settings, billboard quad instancing, context loss handlers. |
| Spatial Audio & Navigation | Autoplay policy blocking audio (P10), Warp transition state bugs (P15) | User gesture gate before audio, cancellable transition state machine. |
| Deployment & Polish | Vercel cold starts (P11), Dev mode user limits (P5) | Lean serverless functions, pre-built demo mode for portfolio showcase. |

---

## Sources

### Spotify API
- [Spotify Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)
- [February 2026 Dev Mode Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [November 2024 Web API Changes](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)
- [Extended Quota Criteria Update (April 2025)](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access)
- [Spotify Dev Mode Premium Requirement (TechCrunch)](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)
- [OAuth Migration Reminder (November 2025)](https://developer.spotify.com/blog/2025-10-14-reminder-oauth-migration-27-nov-2025)
- [Spotify Pagination Offset Limit (GitHub #862)](https://github.com/spotify/web-api/issues/862)
- [CORS on Token Exchange (GitHub #1553)](https://github.com/spotify/web-api/issues/1553)
- [Preview URL Deprecation (Community Thread)](https://community.spotify.com/t5/Spotify-for-Developers/Preview-URLs-Deprecated/td-p/6791368)

### Three.js / react-three-fiber
- [react-three-fiber Performance Pitfalls (Official)](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- [InstancedMesh vs Points (Three.js Forum)](https://discourse.threejs.org/t/better-performance-instanced-mesh-or-points/20293)
- [InstancedMesh Performance Issue (GitHub #30352)](https://github.com/mrdoob/three.js/issues/30352)
- [UnrealBloomPass Optimization (Three.js Forum)](https://discourse.threejs.org/t/unreal-bloom-optimize/35476)
- [WebGL Context Loss (Three.js Forum)](https://discourse.threejs.org/t/webgl-context-lost/69251)
- [Three.js Memory Leak (GitHub #2851)](https://github.com/mrdoob/three.js/issues/2851)
- [100 Three.js Performance Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

### Web Audio API
- [Chrome Autoplay Policy for Web Audio](https://developer.chrome.com/blog/web-audio-autoplay)
- [MDN Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

### Security
- [Token Storage Best Practices (Auth0)](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
- [localStorage XSS Risk (Pragmatic Web Security)](https://pragmaticwebsecurity.com/articles/oauthoidc/localstorage-xss.html)

### Vercel
- [Serverless Function Timeouts](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Cold Start Performance](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel)
