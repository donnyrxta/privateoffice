# AGENTS.md — Private Office

These instructions apply to coding agents and human contributors working in this repository.

## Required read order before UI work

Before modifying any property-facing route or component, read:

1. `DESIGN.md`
2. `PORTFOLIO_DESIGN_SYSTEM.md`
3. `PORTFOLIO_ONTOLOGY.md`
4. `PORTFOLIO_WIREFRAMES.md`
5. `AGENT_ONBOARDING_SYSTEM.md` when touching agent lifecycle, identity, screening or provisioning
6. `docs/ASSETS.md`
7. the existing implementation being changed

Do not redesign from memory or from a generic component-library default.

## Non-negotiable design gates

- The Anti-Slop Contract in `PORTFOLIO_DESIGN_SYSTEM.md` is a merge gate.
- The Apple Interaction Contract is the motion/interaction baseline.
- The Luxury Composition Rules govern portfolio and property-detail composition.
- The prohibited-pattern catalogue is fail-closed: if a prohibited pattern is introduced, document and justify the exception in the PR.
- Property imagery must use suitable high-resolution sources. Never upscale a low-resolution derivative into a hero.
- Preserve working high-quality surfaces. Every change should compound the design system rather than reset it.

## Product/access invariants

- The current approved brief (28 September 2026) supersedes earlier access models; see docs/PRIVATE_SCREENING_RELEASE_2026-09-28.md.
- `/` is a public property preview with discreet enquiry and agent sign-in. Every residences route requires a server-verified agent session.
- Agent operations require office-issued credentials. No public self-registration or automatic agent approval.
- First-time agents complete saved screening; an authorized human reviewer records expertise and activation.
- Request location only for an explicit screening check-in or an approved agent’s explicitly started/resumed assigned visit, with informed consent and a manual alternative.
- Stop browser acquisition on pause, arrival, completion, backgrounding and leaving the visit workspace. Resume requires an explicit action.
- Never request location for the public splash or ordinary portfolio browsing, or market telemetry as the product.
- Do not invent prices, availability, yield, scarcity, partnerships, testimonials or developer claims.

## Implementation discipline

- Work with the existing stack.
- Prefer targeted improvements over framework rewrites.
- Preserve accessibility, keyboard use and reduced-motion behavior.
- Use transforms/opacity for ordinary motion where possible.
- Add or retain loading, empty, error, focus and pressed states.
- Test responsive behavior on real mobile dimensions, not only desktop.
- Before merging a property-facing change, complete the PR acceptance checklist in `PORTFOLIO_DESIGN_SYSTEM.md`.
