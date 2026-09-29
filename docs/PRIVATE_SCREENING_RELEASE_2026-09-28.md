# Private splash and screening release — 28 September 2026

## Owner decision and scope
The owner now requests most site content behind agent login, with selected property images on the public splash and location evidence during invitation-based screening. This expressly supersedes the 27 September public-portfolio brief. Preserve the recovered architectural design, native navigation fix, Access path configuration correction and issued-credential authentication.

## Access matrix
| Surface | Access | Location |
| --- | --- | --- |
| `/`, enquiry, privacy, sign-in | Public | None |
| `/residences` and all descendants | Active issued agent session, checked in each server page before rendering | None |
| `/agent` visits | Issued credentials plus professional review/activation | Explicit visit start/resume only |
| `/onboarding/[token]` and API | Existing unexpired, unrevoked capability invitation | Explicit best-effort continuous screening location after consent |
| `/office`, office API | Existing Cloudflare Access plus application owner authorization | Owner-only screening evidence |
| Client arrival link | Existing visit capability | Existing sanitized visit projection; no candidate location |
| Health and GPS diagnostics | Existing public diagnostics | GPS diagnostic requires its own explicit action |

Preview images are public marketing material. Gating a page does not turn already-public developer imagery into confidential files. Candidate invitation tokens must never be placed in docs, commits, analytics or test fixtures. The supplied real invitation was not opened, changed or submitted during development.

## Design decisions
- Retain ink, ivory, restrained brass, editorial serif and architectural imagery.
- Hero retains the supplied composition. Agent sign-in is the main action; enquiry remains available.
- Three image selectors show Diamante, Zafiro and Esmeralda. These are villa types in one source-backed project. This is a small gallery selector, not generic feature cards; no autoplay or decorative motion.
- Do not fabricate additional projects, stock, availability or prices. Source-matched 2000px imagery is local; Canva IDs are in ASSETS.md.
- Interview: three small background groups followed by one scenario per screen, native radio controls, Back, explicit Save & next, progress, reload recovery and review before submission. No timer, badges, fake chat persona or opaque pass/fail.
- Pattern basis: GOV.UK question pages (https://design-system.service.gov.uk/patterns/question-pages/) recommends one question per page, clear heading, back and continue controls. This is established usability guidance, not a claimed measured conversion uplift for this site.
- Each scenario answer persists on Next. Background is saved after its third short step, disclosed in the UI. Reload restores server-saved progress; unsaved text is not represented as saved.
- Existing expertise classification remains descriptive and subject to human review; location never changes it.

## Screening location contract
Owner update, 29 September 2026: the screening location purpose is proximity matching. The first notice must tell the invited agent that Private Office wants to determine whether prospects or appointments may already be close to them. For independent agents, sharing precise location may be advantageous because it can help identify nearby opportunities that fit their operating area. The UI must not promise that a prospect will be assigned.

`0007_screening_location` retains manual-review/check-in compatibility. `0008_screening_location_stream` adds an append-only observation stream tied to the hashed-token invitation. Browser geolocation starts only after the candidate accepts the continuous-location notice and explicitly chooses **Start precise location sharing**. The client uses high-accuracy `watchPosition`, disallows cached fixes, keeps the watcher alive through the interview, buffers callbacks, and uploads bounded batches every few seconds or when the buffer fills.

Each persisted observation carries a client UUID, screening-session ID, sequence number, latitude, longitude, reported accuracy, optional altitude/heading/speed, device timestamp, server receipt time and consent version. The server accepts at most 25 observations per batch, validates coordinate/timestamp bounds, uses idempotent inserts for retries, and rate-limits location batches separately from form mutations. Accuracy worse than 100 m may be preserved as low-quality evidence but does not unlock screening. A current adequate persisted fix permits interview mutations; submission still requires current evidence.

This is **best-effort continuous browser capture**, not guaranteed background tracking. The watcher is not intentionally stopped merely because the document becomes hidden, but browsers and operating systems may throttle or suspend geolocation when backgrounded, screen-locked, power-constrained or terminated. The UI must say this clearly. A reload never silently reuses prior consent to restart the watcher; the candidate explicitly starts location sharing again unless the office has approved the manual alternative.

Denied/unavailable/timeout/insecure/unsupported errors explain recovery. A candidate may stop sharing or request manual screening. Only the authenticated owner may approve the manual alternative, with a recorded reason. That approval does not approve the candidate or issue credentials. Location never changes expertise scoring.

Only the candidate capability and authorized office review API can see screening state. Owner review receives the latest persisted location stream; buyer/client APIs never receive candidate coordinates. Invitation pages remain no-index/no-referrer. Both screening location tables follow the existing 30-day telemetry retention policy. Device-reported location is evidence from the device, not independent proof of identity or physical presence.

## Deployment and rollback
Use existing main → GitHub Actions → built Cloudflare Worker pipeline. Apply migrations 0007 then 0008 after 0005/0006. Both new screening-location migrations are additive and repeat-safe. Never replay old ALTER migrations. Readiness requires 0008. Preserve current Access audience from repository variables; do not restore the invalid historic AUD or manufacture Access login links. UI rollback can redeploy the previous artifact while leaving the additive table intact; do not delete production evidence to roll back.

## Acceptance checks
- Anonymous portfolio and nested project links redirect to sign-in; issued sessions render the portfolio.
- All splash selectors load high-resolution images, enquiry opens, and desktop/mobile sign-in links work.
- Invalid, missing-consent, stale and low-accuracy location submissions do not unlock screening.
- Continuous watch starts only after explicit consent; multiple synthetic fixes persist with stable session/sequence identity; retries are idempotent; saved responses and submission use fresh persisted location.
- Manual request cannot self-approve; owner decision is distinct from agent approval.
- Authenticated reviewer sees time/accuracy and manual requests; anonymous requests fail.
- Existing first-login interview, human activation and visit GPS success/denial/end paths still pass.
- Build, TypeScript, API contracts, browser suite, targeted lint and production revision verification are required. Final operational status is recorded by the deployment run; no launch claim based only on a commit.

## Verified release evidence
- Local production-style build and TypeScript check passed on 28 September 2026.
- API suite: 172 assertions passed, including synthetic screening location validation, owner-only manual approval, retention, portfolio authorization and existing visit contracts.
- Previous browser suite evidence covered the single-check-in implementation. The 29 September continuous-stream change requires a fresh CI/browser run before launch evidence is updated.
- Targeted lint passed for new screening components/helpers. Full repository lint is not claimed clean: legacy API `any` annotations remain.
- Browser coordinates were simulated. Real device GPS accuracy still depends on the browser/device; no actual candidate invitation or production screening record was used for tests.
- Deployment evidence is the main-branch GitHub Actions run for this commit: it records migration, exact deployed revision, public/private route verification and production browser checks. Failed deployment checks must be resolved before announcing launch.
