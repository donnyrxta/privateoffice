# Private Office — Property & People

Private Office is a premium international property experience for private buyers, with off-plan property discovery, considered introductions and discreet appointment coordination. The public proposition is property first. Device-bound telemetry sits underneath as an operational trust layer for assigned-agent visits; it is not the product being marketed.

## Architecture

Agent identity -> registered device + P-256 signing key -> Private Office security session -> customer visit share epoch -> high-accuracy device observations -> local durable outbox -> signed bounded batch -> authenticated Cloudflare Worker -> validation + idempotency + anomaly flags -> D1 persistence -> explicit processed_ids ACK -> client latest-position projection / office evidence projection.

The web prototype uses IndexedDB for the durable outbox. The native/ directory contains an earlier, unshipped adapter exploration. It is not part of the current foreground-only website workflow.

## Reliability properties

- A position callback is committed locally before upload is attempted.
- Network loss does not intentionally stop an active tracking epoch.
- UUIDs provide observation identity; persistent per-epoch sequence numbers provide ordering.
- Uploads are bounded to 100 observations per batch.
- The device deletes only IDs returned in processed_ids.
- Exact retries are ACKed again; changed payloads reusing an observation ID are rejected.
- Reusing an epoch sequence number with another UUID is rejected.
- Terminal actions stop acquisition locally, then the server refuses to close the epoch until every sequence 0..final_sequence is accounted for (COUNT = final+1, MIN = 0, MAX = final). A gap such as 0,1,3 returns TELEMETRY_PENDING with the exact missing sequence numbers.
- Server-rejected fixes (bad timestamps, out-of-range values) are persisted in observation_rejections with the raw payload and reason, so they never silently disappear and never deadlock the close.
- Suspicious fixes are stored with server-derived integrity_flags (simulated_location, implausible_speed, timestamp_anomaly), not dropped.
- Health is evaluated server-side (healthy / delayed / degraded / stale / interrupted). Sequence gaps show the office "TRACKING DEGRADED · N observations missing".
- A Cron Trigger watchdog re-evaluates every sharing visit each minute and writes health transitions to the audit trail. A daily cron (03:00 Harare) applies retention.
- Client views show only the latest server-persisted position while tracking is active, with age, reported accuracy and quality.
- Office views retain the richer route, security/lifecycle events, sequence continuity and anomaly flags.

## Cloudflare Workers deployment

This is a full-stack Vinext application. Do not deploy the source checkout with bare npx wrangler deploy before the framework build.

For the Git-connected Worker use:

    Build command:   npm run build:cloudflare
    Deploy command:  npm run deploy:built
    Root directory:  /

build:cloudflare forces the standalone Cloudflare profile and builds Vinext. deploy:built then locates the generated Wrangler config under dist/ and deploys that exact Worker output.

### D1 (required: the build fails without it)

Create a D1 database named private-office-d1 and expose its database ID as a build variable:

    CLOUDFLARE_D1_DATABASE_ID=<database id>

build:cloudflare terminates with "CLOUDFLARE_D1_DATABASE_ID is required for production deployment." if it is missing or not a UUID. deploy:built independently refuses any generated config that lacks the DB binding or the Cron Triggers.

Apply the schema in order:

    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0000_huge_blizzard.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0001_durable_telemetry.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0002_production_readiness.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0003_agent_credentials.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0004_agent_presence_gate.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0005_agent_onboarding_screening.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0006_agent_interviews.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0007_screening_location.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0008_screening_location_stream.sql

### Readiness

GET /api/health returns 200 (ready or degraded) or 503 (not_ready). It checks the DB binding, a live D1 query, all required tables and enriched telemetry columns, schema version 0008_screening_location_stream, the Cloudflare Access runtime config (standalone builds), office bootstrap state, and the watchdog/retention scheduler heartbeats. It returns no visit, client or agent data.

### Go-live

See docs/GO_LIVE.md for the gate-by-gate status, the operator runbook, npm run office:secret and npm run verify:production.

### Runtime bindings / secrets

Configure:

    OFFICE_SETUP_HASH          SHA-256 digest of a random one-time office bootstrap secret
    CF_ACCESS_TEAM_DOMAIN      https://<team>.cloudflareaccess.com
    CF_ACCESS_AUD              Cloudflare Access application AUD tag

Protect /office* and /api/office* with Cloudflare Access. Contracted agents sign in at /agent using Private Office-issued credentials backed by D1 HttpOnly sessions; /agent* and /api/agent* must remain reachable so app-level authentication can run. The office validates Cloudflare Access JWT signature, issuer, audience and expiry against the team JWKS before trusting owner/admin identity.

## Development

    npm install
    npm run dev

Production build:

    npm run build:cloudflare

API contract tests run against the built Worker and an isolated Miniflare D1 database. build:test is the only build allowed without a D1 ID (its output cannot be deployed):

    npm run build:test
    npm run test:api

The tests cover readiness (no DB, unmigrated, migrated), device-key enrollment, signed batches, strict ACKs, duplicate replay, ID and sequence conflicts, in-batch duplicates, contiguous terminal gating (gaps, FINAL_SEQUENCE_MISMATCH), persisted rejections, integrity flags, SEQUENCE_GAP health, the cron watchdog and retention, the evidence export, and the app-level access matrix (wrong agent, wrong/other/expired/revoked client token).

## Native prototype

See native/README.md. The native shell intentionally does not use Capgo's best-effort native URL POST as the evidence-retention mechanism. Location callbacks are destined for the Private Office Fast-SQL queue and the same signed batch/ACK protocol used by the web prototype.

## Main routes

- `/` — public property introduction and qualified enquiry
- `/residences` — editorial collection
- `/residences/tierra-viva` — project context
- `/residences/tierra-viva/[residence]` — residence detail and contextual enquiry
- `/agent/sign-in` — office-issued credentials; no public registration
- `/agent/onboarding` — saved first-login profile, five screening stages and activation status
- `/agent` — approved agent's assigned visits
- `/office` — authenticated owner workspace
- `/office/reviews` — screening review and human activation
- `/visit/[id]` — private client arrival view
- `/privacy` — purpose, access, retention and location alternatives
- `/gps-test` — explicitly initiated local acquisition diagnostic; no D1 upload

## Imagery

The homepage and primary Diamante exterior use local 720/1280/2000 px WebP derivatives of the recovered 2000×1171 source. Other portfolio images retain official CDN sources. Canva folder and source provenance are recorded in `docs/ASSETS.md`; thumbnails must never be enlarged into heroes.

## Verification

See docs/VERIFICATION.md, docs/OPERATIONS.md and docs/GO_LIVE.md.

### Screening proximity location

Invitation screening begins with explicit consent to a best-effort continuous device-location stream. The notice explains that Private Office wants to determine whether prospects or appointments are already close to the agent, and that independent agents may benefit from proximity matching. High-accuracy browser fixes are batched and persisted to D1 while the screening page/browser/device allow it. Background execution is not guaranteed. Screening location is not part of expertise scoring and is retained for up to 30 days.

### First-time agent onboarding

First-time representatives are invited by the office rather than self-registering. The office creates a time-limited capability link, the candidate completes a professional profile and versioned scenario screening, and the system stores a transparent dimension-by-dimension expertise map. The map never auto-approves or auto-rejects. Only an authenticated office owner can approve a submitted application; approval provisions the existing D1 agent account and returns the generated password once. See `AGENT_ONBOARDING_SYSTEM.md`.

### Contracted-agent access invariant

Credentials allow onboarding. Saved interview responses inform an office-owner review and explicit human activation; they never auto-approve an agent. Invitation-based pre-credential screening may request best-effort continuous precise location only after the candidate accepts the proximity notice and explicitly starts sharing. Credentialed first-login interviews do not request location. Approved agents can accept and start assigned visits; visit location still requires its own explicit consent/start. The legacy presence endpoint is disabled. See `docs/COMPLETION_PLAN.md` and `docs/PRIVATE_SCREENING_RELEASE_2026-09-28.md` for the current contracts.


Integration with concurrent main updates: preserve migration `0005_agent_onboarding_screening.sql` and apply it before `0006_agent_interviews.sql`. Optional invitation-link screening is pre-credential intake; the contracted agent then completes the first-login professional interview for visit activation. Public residences never require GPS.
