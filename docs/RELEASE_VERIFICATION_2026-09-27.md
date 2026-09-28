# Release verification — 27 September 2026

## Implemented

- Property-led public homepage restored from historical composition with local responsive 720/1280/2000px images.
- Public collection, project and residence pages; qualified enquiry with persisted reference.
- Dedicated invited-agent sign-in; saved first-login professional profile and five written interview stages.
- Owner-only evidence/rubric review, explicit activation, feedback, conflict protection and audit record.
- Credential-only visit access; explicit consent/start, foreground acquisition, pause/arrival/end, accurate error handling and minimized client location projection.
- Concurrent main's architectural viewer and pre-credential invitation screening preserved. 0005 remains; new interviews/activation use additive migration 0006.

## Verified locally

- `npm run build:test`: pass (test-only build; not deployable without production D1 configuration).
- `npx tsc --noEmit`: pass.
- `npm run test:api`: 155 assertions pass, including readiness, invitation screening, interview persistence/revision lock, reviewer activation, identity boundaries, telemetry integrity/ACK/closure and retention.
- Headless Chromium: homepage at 375/768/1440px without horizontal overflow; buyer enquiry receipt; credential sign-in; saved profile after reload; all five interview stages; human approval; synthetic location with ±7m accuracy; pause; denied-permission error; permission recovery after reload and explicit End visit.
- Homepage mobile/desktop, sign-in and GPS screenshots visually inspected. Browser reports no page errors through the complete grant/pause/denial/recovery/end journey.
- `git diff --check`: pass.
- Full `npm run lint`: not green (61 errors, 40 warnings after reconciliation), principally existing explicit-any and React/style rules. Original checkout already had 64 errors/40 warnings; concurrent main added additional source. No lint rules were disabled to conceal this. New interview/review modules passed scoped lint.

## Reproduction

Build with `npm run build:test`, then run `node tests/browser-server.mjs` and `node tests/browser.test.mjs` in the same local environment. Provide `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` when Playwright is not installed in the default environment. The server is loopback-only, uses ephemeral D1 and synthetic identities, and must never be deployed. Screenshots go to `SCREENSHOT_DIR` or `/tmp/privateoffice-shots`.

## Production requirements and limits

1. Apply existing migration `0005_agent_onboarding_screening.sql` if absent, then `0006_agent_interviews.sql`, after a backup. Do not reapply old ALTER TABLE migrations.
2. Confirm owner Cloudflare Access configuration, office bootstrap and `/api/health`; deploy with the existing production build/deploy commands.
3. Existing credential accounts need first-login interview review before visits. Optional candidate screening approval issues credentials, not visit activation.
4. Test an actual phone on HTTPS for device-specific permission, fix quality, network loss, background stop and resumption behavior. Automated coordinates are explicitly synthetic and do not prove physical GPS accuracy.
5. Other gallery media and map tiles remain external dependencies. Local homepage images render independently; map failure displays a useful notice and preserves coordinate readout.
6. This release records source implementation and local verification. It does not claim that production D1 migrations, secrets, hosting deployment or physical-device acceptance were completed.
