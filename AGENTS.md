# AGENTS.md — Private Office

These instructions apply to coding agents and human contributors working in this repository.

## Required read order before UI work

Before modifying any property-facing route or component, read:

1. `DESIGN.md`
2. `PORTFOLIO_DESIGN_SYSTEM.md`
3. `docs/ASSETS.md`
4. the existing implementation being changed

Do not redesign from memory or from a generic component-library default.

## Non-negotiable design gates

- The Anti-Slop Contract in `PORTFOLIO_DESIGN_SYSTEM.md` is a merge gate.
- The Apple Interaction Contract is the motion/interaction baseline.
- The Luxury Composition Rules govern portfolio and property-detail composition.
- The prohibited-pattern catalogue is fail-closed: if a prohibited pattern is introduced, document and justify the exception in the PR.
- Property imagery must use suitable high-resolution sources. Never upscale a low-resolution derivative into a hero.
- Preserve working high-quality surfaces. Every change should compound the design system rather than reset it.

## Product/access invariants

- `/` is the contracted-agent entry surface.
- Portfolio content is protected until agent authentication and the fresh precise-location gate succeed.
- `/residences` and other portfolio surfaces must not leak protected content before that gate.
- Do not turn GPS/telemetry into the public/product proposition.
- Do not invent prices, availability, yield, scarcity, partnerships, testimonials or developer claims.

## Implementation discipline

- Work with the existing stack.
- Prefer targeted improvements over framework rewrites.
- Preserve accessibility, keyboard use and reduced-motion behavior.
- Use transforms/opacity for ordinary motion where possible.
- Add or retain loading, empty, error, focus and pressed states.
- Test responsive behavior on real mobile dimensions, not only desktop.
- Before merging a property-facing change, complete the PR acceptance checklist in `PORTFOLIO_DESIGN_SYSTEM.md`.
