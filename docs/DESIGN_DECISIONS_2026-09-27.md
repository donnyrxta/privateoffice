# Private Office — implementation decision record

Authority: the owner's 27 September brief and subsequent nine visual references. Repository: `donnyrxta/privateoffice`. This record supplements DESIGN.md and PORTFOLIO_DESIGN_SYSTEM.md; the current product requirements supersede the old GPS-before-content rule.

| Decision | Reason and implementation | Verification |
|---|---|---|
| Restore earlier homepage composition | Recover composition from 8b4760a: cinematic architecture, ink ground, editorial serif, quiet enquiry; retain established identity | Desktop/mobile screenshots and buyer journey |
| Ship local responsive hero | Recover 2000×1171 JPEG; generate 720/1280/2000 WebP, never enlarge 420px thumbnail | Check natural resolution, request sizes and visual rendering |
| Use references as craft direction | Brownsticks: material depth and deliberate framing. ALFA: strong architecture and controlled hierarchy. Glass examples: thin lit edge and spatial layering | No copied third-party logos, unsupported investment claims or social poster copy |
| Restrict frosted panels to functional layers | Dedicated invited-agent sign-in uses one translucent panel; sufficient opaque ground preserves contrast; opaque fallback handles unsupported/reduced transparency | Mobile, focus, inputs and visual review |
| Preserve public property-first experience | Buyer routes do not collect GPS; agent sign-in remains secondary navigation | Anonymous property route tests |
| Separate identity from activation | Office-issued account grants screening; human-reviewed approval grants visit operations | API tests reject unapproved agents and unrelated identities |
| Five written interview stages | Background, off-plan knowledge, discretion, judgment, territory/availability; saved progress and explicit submission | Reload persistence, reviewer flow, status transitions |
| Transparent classification | Human rubric and supporting evidence, distinct from declared background and scheduling fit; no opaque auto-approval | Reviewer-only decision and revision handling |
| Foreground visit collection | Explicit consent/start; stop on pause/arrival/completion/hide/leave; no automatic restart | Simulated browser GPS and denied-permission tests; physical phone remains required |
| Keep output truthful | No invented inventory, availability, pricing, developer affiliation, returns or exact-GPS promises | Copy review; asset provenance in ASSETS.md |
| Separate implementation from deployment | Main commit records implementation; production D1 migration and Access readiness must be verified separately | Release report names checks and remaining operational requirements |

## Reference handling

The nine supplied images are visual references, not authorized property inventory or evidence for commercial claims. The embedded images were visible in conversation; reported scratch paths were unavailable. No need to recreate or publish those reference files. Connected Canva folder `FAFnNqCSiZA` was inspected; its API exposes thumbnails unsuitable for full-bleed use. Existing verified property source media remains the asset authority.

## Design exceptions

A 16px radius on the sign-in panel is intentional: it identifies one floating access layer, as in the owner's glass references. Architectural frames retain the existing small-radius system. Glass is not applied across forms, interview answers or repeated property cards. No background forest, fintech balances, recruitment badges, signup links or unsupported return claims are transplanted from references.

## Scope and continuity

This turn continues the earlier audit and implementation in this project. Recoverable history and current repository files outrank conversational recollection. The completion plan, changed access contracts, asset provenance, operational runbook and verification record live with the code to prevent subsequent design/access regressions.

## Concurrent main reconciliation

Main advanced to 4a00ac6 during implementation. Its architectural gallery, portfolio ontology/wireframes and optional pre-credential candidate intake are retained. The first-login interview module is named `lib/interview.ts` / `agent-introduction.tsx` to avoid replacing that screening engine. Migration 0005 remains intact; the additive activation/interview schema is 0006. Candidate intake approval issues credentials; it does not bypass first-login professional review. The latest public-property/visit-only-location requirement supersedes historical access statements.
