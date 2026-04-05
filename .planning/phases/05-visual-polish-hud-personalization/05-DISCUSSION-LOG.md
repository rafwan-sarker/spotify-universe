# Phase 5: Visual Polish, HUD & Personalization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 05-visual-polish-hud-personalization
**Areas discussed:** Bloom & glow intensity, Galaxy stats & personality, Genre labels & mini-map, Artist constellation lines

---

## Bloom & Glow Intensity

### Q1: How intense should bloom/glow be?

| Option | Description | Selected |
|--------|-------------|----------|
| Dramatic neon glow | Strong bloom, stars radiate halos, dense clusters glow like nebulae. Synthwave visualizer. | ✓ |
| Subtle soft halos | Gentle glow, more realistic, less stylized. |  |
| You decide | Claude picks. |  |

**User's choice:** Dramatic neon glow

### Q2: How should top-5 beacons stand out?

| Option | Description | Selected |
|--------|-------------|----------|
| Bright + larger glow radius | 2-3x brighter, wider halo. Visible from across galaxy. | ✓ |
| Different color tint | Gold/white overlay on genre color. |  |
| Pulsing animation | More dramatic pulse rhythm. |  |

**User's choice:** Bright + larger glow radius

---

## Galaxy Stats & Personality

### Q3: When should stats card appear?

| Option | Description | Selected |
|--------|-------------|----------|
| On load, then toggleable | Fades in after galaxy builds, auto-hides after 5s, toggleable. | ✓ |
| Always visible HUD | Persistent corner overlay. |  |
| Only on demand | Hidden until user requests. |  |

**User's choice:** On load, then toggleable

### Q4: Where should stats card be?

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom-left corner | No conflict with other HUD elements. | ✓ |
| Center overlay on load | Big centered reveal, then shrinks. |  |
| You decide | Claude picks layout. |  |

**User's choice:** Bottom-left corner

### Q5: Personality types?

| Option | Description | Selected |
|--------|-------------|----------|
| Full set (5 types) | Eclectic Explorer, Genre Loyalist, Deep Diver, Mainstream Voyager, Time Traveler | ✓ |
| Simple set (3 types) | Diverse, Focused, Balanced |  |
| You decide | Claude designs it. |  |

**User's choice:** Full set (5 types)

---

## Genre Labels & Mini-map

### Q6: Genre label style?

| Option | Description | Selected |
|--------|-------------|----------|
| Glowing text at centroids | Neon-colored, billboard, distance-fading. | ✓ |
| Subtle small labels | Small, dimmed, only visible close. |  |
| You decide | Claude picks. |  |

**User's choice:** Glowing text at centroids

### Q7: Mini-map design?

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right, dots + cursor | 150px box, colored cluster dots, white camera triangle. | ✓ |
| Bottom-right, circular | Radar-style, rotates with camera. |  |
| You decide | Claude picks. |  |

**User's choice:** Top-right, dots + cursor

---

## Artist Constellation Lines

### Q8: When do lines appear?

| Option | Description | Selected |
|--------|-------------|----------|
| On star selection | Lines appear with info card, connect same-artist stars, disappear on dismiss. | ✓ |
| Always for top artists | Top 3-5 artists always have lines visible. |  |
| You decide | Claude picks trigger. |  |

**User's choice:** On star selection

### Q9: Line style?

| Option | Description | Selected |
|--------|-------------|----------|
| Thin glowing cyan | #00f0ff accent color, fade in/out animation. | ✓ |
| Genre-colored | Lines match genre cluster color. |  |
| You decide | Claude picks style. |  |

**User's choice:** Thin glowing cyan

---

## Claude's Discretion

- Bloom intensity/threshold values
- Top-5 determination method
- Genre label font size and distance fade curves
- Stats card toggle hotkey
- Constellation line geometry approach
- Mini-map rendering approach
- Performance optimization for bloom + 5000 stars

## Deferred Ideas

None — discussion stayed within phase scope
