# Private splash and screening release — 28 September 2026

## Owner decision and scope
The owner now requests most site content behind agent login, with selected property images on the public splash and location evidence during invitation-based screening. This expressly supersedes the 27 September public-portfolio brief. Preserve the recovered architectural design, native navigation fix, Access path configuration correction and issued-credential authentication.

## Access matrix
| Surface | Access | Location |
| --- | --- | --- |
| `/`, enquiry, privacy, sign-in | Public | None |
| `/residences` and all descendants | Active issued agent session, checked in each server page before rendering | None |
| `/agent` visits | Issued credentials plus professional review/activation | Explicit visit start/resume only |
| `/onboarding/[token]` and API | Existing unexpired, unrevoked capability invitation | Explicit screening check-ins |
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
`0007_screening_location` adds an append-only check-in table tied to the hashed-token invitation record. Browser geolocation is requested only after notice acceptance and Check my location. No watcher, interval, background sharing or silent permission request. A pending callback is ignored after hidden/unmount. Each check-in records device latitude/longitude/accuracy/time, receipt time and consent version. Single-fix API has a 15-second timeout, requests high accuracy and disallows cached positions.

Server validates explicit notice consent, numeric ranges, device timestamp no older than 60 seconds and no more than 10 seconds ahead. Accuracy worse than 100m is stored as low-quality evidence but does not unlock the interview. Most recent adequate check-in permits saves for 15 minutes. Submission needs a check-in within 2 minutes; UI requests a fresh check immediately before submission. Reload asks explicitly again. Device-reported location cannot establish physical presence or identity independently and can be spoofed; never label it independent verification.

Denied/unavailable/timeout/insecure/unsupported errors explain recovery. A candidate may request manual screening. Only the authenticated owner may approve that alternative, with a recorded reason. A request alone does not unlock anything. Approval does not approve the candidate or issue credentials. Existing invited candidates follow the same new location contract.

Only the candidate capability and authorized office review API can see screening state; raw coordinates are shown only in the owner review panel, never in buyer/client APIs. Invitation pages have no-index/no-referrer metadata. The daily retention job deletes check-in records after 30 days. Deletion is covered by the existing retention job, not a fake timestamp update.

## Deployment and rollback
Use existing main → GitHub Actions → built Cloudflare Worker pipeline. Add migration 0007 after 0005/0006; CREATE IF NOT EXISTS and INSERT OR IGNORE are repeat-safe. Never replay old ALTER migrations. Readiness requires 0007. Preserve current Access audience from repository variables; do not restore the invalid historic AUD or manufacture Access login links. UI rollback can redeploy the previous artifact while leaving the additive table intact; do not delete production evidence to roll back.

## Acceptance checks
- Anonymous portfolio and nested project links redirect to sign-in; issued sessions render the portfolio.
- All splash selectors load high-resolution images, enquiry opens, and desktop/mobile sign-in links work.
- Invalid, missing-consent, stale and low-accuracy location submissions do not unlock screening.
- Good check-in, saved responses, reload recovery, final check-in and submission work.
- Manual request cannot self-approve; owner decision is distinct from agent approval.
- Authenticated reviewer sees time/accuracy and manual requests; anonymous requests fail.
- Existing first-login interview, human activation and visit GPS success/denial/end paths still pass.
- Build, TypeScript, API contracts, browser suite, targeted lint and production revision verification are required. Final operational status is recorded by the deployment run; no launch claim based only on a commit.

## Verified release evidence
- Local production-style build and TypeScript check passed on 28 September 2026.
- API suite: 172 assertions passed, including synthetic screening location validation, owner-only manual approval, retention, portfolio authorization and existing visit contracts.
- Browser suite passed at 375/768/1440px: splash, enquiry receipt, screening permission denial/retry, saved progress recovery, all scenarios and final check-in, issued-agent login, first-login interview, human review, visit GPS success/denial/stop/end; no browser page errors. Mobile screening screenshot reviewed with no horizontal overflow.
- Targeted lint passed for new screening components/helpers. Full repository lint is not claimed clean: legacy API `any` annotations remain.
- Browser coordinates were simulated. Real device GPS accuracy still depends on the browser/device; no actual candidate invitation or production screening record was used for tests.
- Deployment evidence is the main-branch GitHub Actions run for this commit: it records migration, exact deployed revision, public/private route verification and production browser checks. Failed deployment checks must be resolved before announcing launch.
