# Private Office completion — 27 September 2026

## Approved product boundary

The public experience sells a carefully considered property introduction. The office issues credentials to contracted agents. Saved screening informs a human activation decision. Location is requested only within an explicitly started assigned visit, with purpose, access, retention and alternatives explained. The current brief supersedes the prior portfolio location gate.

## Audited baseline

- Main at `fe347a1` contains a Next/React application deployed through Vinext to Cloudflare Workers with D1.
- Original property-led homepage composition exists at `8b4760a`; recent homepage instead prioritizes agent sign-in.
- Editorial portfolio routes exist, but authentication and device-presence gates obstruct the requested public buyer journey.
- Repository design contracts include Anti-Slop, Apple Interaction and Luxury Composition rules; preserve those craft constraints while correcting outdated access rules.
- Existing local WebP hero is only 420×246. A matching original JPEG was recovered from the earlier project checkout. Canva folder `FAFnNqCSiZA` remains available; its connector returns thumbnails, which are unsuitable as production masters.
- Office-issued credential authentication, visit assignment, D1 telemetry, signed observations and enquiry persistence already exist.
- No persisted first-login screening or human classification/activation workflow exists in the baseline.
- Existing workspace entry and automatic resume logic can request location without an explicit new visit action.

## Work packages and acceptance

| Priority | Delivery | Dependency | Acceptance |
|---|---|---|---|
| P0 | Restore property-led homepage and sharp hero | Historical composition; original media | Public home, portfolio and detail load without geolocation; architecture remains the visual subject; mobile and desktop rendering inspected |
| P0 | Qualified enquiry | Existing D1 enquiry handler | Validation, consent, truthful persisted receipt, error/retry; context includes selected property |
| P0 | Invited onboarding and five interviews | Existing credential auth; migration 0005 | Saved profile and answers survive reload; explicit completion/status; no public signup; agent cannot approve themselves |
| P0 | Human reviewer decision | Completed interview; office-owner auth | Reviewer sees answers, evidence and rubric; records expertise, reasons and activation; unauthorized access denied |
| P0 | Assigned visit and GPS | Human activation; registered device | Explicit start/consent; observable accuracy/freshness; accepted observations persist; deny/timeout/unavailable recover; stop on pause/end/hide/leave |
| P1 | Regression/security verification | Integrated implementation | Type/build checks; API authorization and state tests; real browser buyer, onboarding, reviewer and GPS journeys |
| P1 | Release and operations | Successful checks; production permissions | Reviewable GitHub changes; deployment/migration instructions; production-only blockers stated precisely |

## Interview design

1. Identity and background: essential professional profile and experience; contract acknowledgement without collecting identity-document copies.
2. Market and off-plan expertise: evidence of project diligence, commercial understanding and risk communication.
3. Client service and discretion: handling sensitive client information and confidential appointment details.
4. Scenario judgment: unsupported yield claims, delayed completion and confidentiality dilemmas.
5. Territory and availability: operating markets, languages, coverage and practical scheduling.

Answers and claimed experience are evidence for a reviewer, not automatic proof. Activation is a recorded human decision; assignments should reflect demonstrated expertise and any supervision requirements.

## Verification boundaries

Automated GPS tests can establish browser/API behavior using explicitly synthetic coordinates. A physical phone test on HTTPS is still required to establish the device's actual fix quality and permission behavior. Successful local tests do not prove production secrets, Access configuration, migrations or scheduled retention are installed.
