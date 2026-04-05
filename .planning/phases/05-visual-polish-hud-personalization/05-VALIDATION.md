---
phase: 5
slug: visual-polish-hud-personalization
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | VIS-01, VIS-05 | unit | `npx vitest run src/__tests__/galaxy-buffers.test.ts` | written with task | ⬜ pending |
| 05-01-02 | 01 | 1 | VIS-06, UI-07 | unit + manual | `npx vitest run src/__tests__/constellation.test.ts` | written with task | ⬜ pending |
| 05-02-01 | 02 | 2 | UI-05, UI-06 | unit | `npx vitest run src/__tests__/galaxy-stats.test.ts src/__tests__/minimap.test.ts` | written with task | ⬜ pending |
| 05-02-02 | 02 | 2 | UI-01 | manual | browser test | N/A | ⬜ pending |
| 05-02-03 | 02 | 2 | all | manual | browser visual verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Test files are created alongside implementation within each TDD-flagged task (write-alongside pattern). This is appropriate for Phase 5 because:

- The testable logic (galaxy-stats computation, constellation geometry, buffer tiering) has TDD-flagged tasks that create tests as part of the task action
- The visual/rendering work (bloom, genre labels, minimap canvas) is inherently manual-verification and cannot be meaningfully unit tested
- All `<verify>` elements have `<automated>` commands that run vitest

No separate Wave 0 plan is needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bloom/glow visual quality | VIS-01 | Visual effect — requires human evaluation | View galaxy, verify stars have neon glow halos |
| Top-5 beacon brightness | VIS-05 | Visual comparison — requires human judgment | Verify top stars are visibly brighter |
| Genre labels positioning | VIS-06 | 3D placement — requires visual check | Fly around, verify labels at cluster centers |
| Constellation lines | UI-07 | Visual effect on interaction | Click star, verify cyan lines to same-artist stars |
| Mini-map accuracy | UI-01 | Spatial accuracy — requires interaction | Fly around, verify cursor moves on mini-map |
| 60fps performance | Success criterion 8 | Performance — requires profiling | Open DevTools, verify framerate with effects |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are manual-only (visual effects)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 not needed — test files written alongside implementation in TDD tasks
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (write-alongside pattern accepted for visual-heavy phase)
