# Plan 03-02: RealGalaxy Renderer + Scene Wiring — Summary

**Status:** Complete (demo-only verified — OAuth redirect URI blocked in dev by Auth.js v5 beta limitation)
**Duration:** ~5 min
**Tasks:** 3/3 (2 automated + 1 human checkpoint)

## What Was Built

- **RealGalaxy.tsx** — Single InstancedMesh renderer with custom ShaderMaterial. 12K pre-allocated capacity. Imperative Zustand subscription (zero React re-renders). Birth-time Map for persistent star tracking across store resets.
- **star-shaders.ts** — Shader source strings as TypeScript exports (Turbopack can't do ?raw GLSL imports)
- **GalaxyScene.tsx** — Updated with DemoGalaxyFader for 1-second overlap transition from demo to real galaxy

## Deviations

1. Shader strings in TypeScript instead of ?raw GLSL imports (Next.js Turbopack limitation)
2. Zustand v5 subscribe pattern (single-arg, not selector-based)
3. OAuth not testable in dev — Auth.js v5 beta.30 ignores NEXTAUTH_URL for redirect_uri, sends localhost which Spotify Dashboard rejects. Works on deployed domains.

## Key Files

### Created
- `src/components/canvas/RealGalaxy.tsx`
- `src/shaders/star-shaders.ts`

### Modified
- `src/components/canvas/GalaxyScene.tsx`
- `src/auth.ts` (state-only checks, trustHost)
