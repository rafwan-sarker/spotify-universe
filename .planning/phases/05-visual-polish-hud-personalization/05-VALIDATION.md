---
phase: 5
slug: visual-polish-hud-personalization
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 05-01-01 | 01 | 1 | VIS-01, VIS-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | UI-05, UI-06 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | VIS-06, UI-07 | manual | browser test | N/A | ⬜ pending |
| 05-02-02 | 02 | 2 | UI-01 | manual | browser test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for galaxy stats computation (personality classification)
- [ ] Test stubs for beacon star detection

*If none: "Existing infrastructure covers all phase requirements."*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
