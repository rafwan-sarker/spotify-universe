# Phase 5: Visual Polish, HUD & Personalization - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Bloom/glow post-processing on all stars, top-5 beacon stars, floating genre labels in 3D, galaxy stats card with personality label, artist constellation lines on star selection, and a mini-map HUD. Transforms the galaxy from functional to visually stunning and personally meaningful.

</domain>

<decisions>
## Implementation Decisions

### Bloom & Glow
- **D-01:** Dramatic neon glow bloom — strong bloom that makes stars radiate light halos. Dense clusters glow like nebulae. Synthwave music visualizer intensity.
- **D-02:** Use `@react-three/postprocessing` EffectComposer with Bloom effect. Already in the project's recommended stack.
- **D-03:** Bloom should amplify the existing additive blending on stars (Phase 3 D-04) — the two effects compound.

### Top-5 Beacon Stars
- **D-04:** Top 5 most-listened stars are 2-3x brighter with a wider glow radius. Visible from across the galaxy. Unmissable beacons.
- **D-05:** Leverage existing `instanceIsTopTrack` shader attribute — extend it to differentiate top-5 from other top tracks with a stronger brightness multiplier.

### Genre Labels
- **D-06:** Glowing genre text at each `GenreCluster.centroid` position in 3D space. Billboard (always face camera). Neon-colored matching the genre color.
- **D-07:** Labels fade based on distance — fully visible when near, semi-transparent when far, hidden when very far. Prevents clutter at galaxy-wide zoom.
- **D-08:** Use drei `Text` or `Html` component for rendering at cluster centroids.

### Galaxy Stats Card
- **D-09:** Stats card fades in after galaxy finishes building. Shows for ~5 seconds, auto-hides. User can toggle it back with a hotkey.
- **D-10:** Positioned in bottom-left corner. Doesn't conflict with search (top-center), profile (top-right), or mini-map (top-right).
- **D-11:** Shows: total star count, genre count, dominant genre percentage, galaxy personality label.
- **D-12:** Galaxy personality types: "Eclectic Explorer" (balanced genres), "Genre Loyalist" (>50% one genre), "Deep Diver" (lots of obscure/small tracks), "Mainstream Voyager" (mostly popular/top tracks), "Time Traveler" (spans many decades via addedAt dates).

### Artist Constellation Lines
- **D-13:** Lines appear when you click a star and the info card opens. Connect all stars by that same artist. Disappear when info card dismisses.
- **D-14:** Thin glowing cyan lines (#00f0ff) matching the synthwave accent color. Fade in/out with animation.
- **D-15:** Use Three.js `Line` or `LineSegments` with a custom material for glow effect.

### Mini-map HUD
- **D-16:** Small ~150px box in top-right corner. Always visible during exploration.
- **D-17:** Shows all genre clusters as colored dots (matching genre colors) with a white triangle for camera position/direction.
- **D-18:** Dark semi-transparent background (`rgba(0, 0, 20, 0.85)`) matching established glassy aesthetic.
- **D-19:** 2D top-down projection of the 3D galaxy — flatten Y axis, show X/Z positions.

### Claude's Discretion
- Bloom intensity value and threshold tuning
- How to determine "top 5" beacon stars (from topRanking field or store sort)
- Genre label font size and opacity curves for distance fading
- Stats card toggle hotkey (suggestion: `i` for info)
- Constellation line geometry approach (BufferGeometry lines vs drei Line)
- Mini-map update frequency and rendering approach (Canvas 2D overlay vs mini R3F scene)
- Performance optimization if bloom + 5000 stars causes frame drops

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — VIS-01, VIS-02, VIS-05, VIS-06, UI-01, UI-05, UI-06, UI-07 requirements
- `.planning/ROADMAP.md` — Phase 5 success criteria (8 items)

### Prior Phase Code (reuse/extend)
- `src/shaders/star-shaders.ts` — Star vertex/fragment shaders with instanceBrightness, instanceIsTopTrack attributes
- `src/components/canvas/RealGalaxy.tsx` — InstancedMesh renderer, buffer attributes, imperative store subscription
- `src/components/canvas/GalaxyScene.tsx` — R3F Canvas wrapper, component layout
- `src/components/canvas/FlightController.tsx` — Camera state machine (idle/cruising/warping/inspecting)
- `src/components/canvas/StarInfoCard.tsx` — drei Html info card (extend with constellation lines)
- `src/components/canvas/StarClickHandler.tsx` — Star selection handler (triggers constellation lines)
- `src/lib/store.ts` — Zustand store with stars[], genres[], selectedStar, cameraMode
- `src/lib/spotify/types.ts` — StarData (name, artist, genre, position, size, brightness, albumArt), GenreCluster (centroid, color)
- `src/components/ui/ControlsHint.tsx` — Transient overlay pattern (reuse for stats card auto-hide)

### Prior Phase Context
- `.planning/phases/03-galaxy-renderer/03-CONTEXT.md` — D-04 additive blending, D-01 glowing orbs
- `.planning/phases/04-navigation-interaction/04-CONTEXT.md` — D-09 drei Html for info card, neon synthwave styling
- `.planning/phases/04-navigation-interaction/04-UI-SPEC.md` — Color palette, spacing, typography contracts

### Research
- `.planning/research/PITFALLS.md` — InstancedMesh performance, React/Three.js boundary
- `.planning/research/ARCHITECTURE.md` — Three-tier architecture

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `star-shaders.ts` — Already has `instanceBrightness` and `instanceIsTopTrack` attributes. Extend shader for beacon glow without changing buffer layout.
- `RealGalaxy.tsx` — Buffer setup pattern for instanced attributes. Top-5 detection can reuse `isTopTracks` buffer.
- `ControlsHint.tsx` — Auto-dismiss + fade animation pattern. Reuse for stats card timing.
- `StarInfoCard.tsx` — drei Html overlay pattern. Constellation lines trigger on same selectedStar state.
- `GenreCluster.centroid` — Pre-computed cluster centers. Direct positions for genre labels.
- `GENRE_COLORS` in `types.ts` — Color mapping for genre label coloring.

### Established Patterns
- Zustand for state with imperative subscriptions (no R3F re-renders)
- Module-scope temp objects for allocation-free render loops
- Motion (Framer Motion) for DOM overlay animations
- drei `Html` for 3D-anchored DOM elements
- GLSL string constants in TypeScript (Turbopack compatibility)

### Integration Points
- `GalaxyScene.tsx` — Add EffectComposer, genre labels, constellation lines, mini-map inside Canvas
- `page.tsx` — Add stats card as DOM overlay
- `store.ts` — Add stats computation (genre distribution, personality)
- `star-shaders.ts` — Modify vertex/fragment for beacon glow boost

</code_context>

<specifics>
## Specific Ideas

- Bloom should make the galaxy look like a synthwave music visualizer — dramatic, not subtle
- Top-5 beacons should be the first thing you notice when you see the galaxy — "those must be my favorites"
- Galaxy personality labels should feel fun and shareable — "I'm an Eclectic Explorer" is something you'd tell friends
- Constellation lines create recognition moments — "oh, I have 12 Radiohead songs and they form a pattern!"
- The stats card is the "this is MY galaxy" moment — seeing your personal numbers makes it feel real

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-visual-polish-hud-personalization*
*Context gathered: 2026-04-04*
