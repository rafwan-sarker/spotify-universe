---
phase: 03-galaxy-renderer
created: 2026-04-03
source: 03-RESEARCH.md
---

# Phase 3: Galaxy Renderer — Validation Strategy

## Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |

## Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GLXY-01 | InstancedMesh renders stars with correct count and buffer setup | unit | `npx vitest run src/__tests__/galaxy-buffers.test.ts -t "buffer creation"` | No — Wave 0 |
| GLXY-02 | Stars positioned within correct genre cluster regions | unit | `npx vitest run src/__tests__/star-data.test.ts` | Yes (existing) |
| GLXY-03 | Star colors match genre color mapping | unit | `npx vitest run src/__tests__/galaxy-buffers.test.ts -t "color mapping"` | No — Wave 0 |
| GLXY-04 | Birth times staggered for smooth progressive appearance | unit | `npx vitest run src/__tests__/galaxy-buffers.test.ts -t "birth times"` | No — Wave 0 |
| GLXY-05 | Star size reflects top-track ranking | unit | `npx vitest run src/__tests__/star-data.test.ts -t "computeStarSize"` | Yes (existing) |

## Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

## Wave 0 Gaps
- [ ] `src/__tests__/galaxy-buffers.test.ts` — covers buffer creation, color mapping, birth time staggering, partial updates
- [ ] Test for birth time stagger spread: verify times are evenly distributed across spread duration
- [ ] Test for buffer write range: verify only new indices are written (startIndex to endIndex)

## Visual Verification (Manual)
Shader visual output (glow appearance, twinkle animation, additive blending) cannot be unit tested — these require visual/manual verification in the browser. Tests focus on the data flow (buffer contents, attribute values) that feeds the shaders.
