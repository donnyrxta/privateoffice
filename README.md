# Private Office — Property & People

Private Office is a premium property-introduction and verified-arrival prototype for agents serving private clients. The interface is deliberately restrained; underneath it is a durable, device-bound telemetry system built for auditability and reliable client arrival visibility.

## Architecture

Agent identity -> registered device + P-256 signing key -> Private Office security session -> customer visit share epoch -> high-accuracy device observations -> local durable outbox -> signed bounded batch -> authenticated Cloudflare Worker -> validation + idempotency + anomaly flags -> D1 persistence -> explicit processed_ids ACK -> client latest-position projection / office evidence projection.

The web prototype uses IndexedDB for the durable outbox. The native/ directory contains the Capacitor 8 adapter architecture using @capgo/background-geolocation for native acquisition and @capgo/capacitor-fast-sql for the native SQLite outbox. Both target the same Worker API, schema, sequence model and ACK protocol.

## Reliability properties

- A position callback is committed locally before upload is attempted.
- Network loss does not intentionally stop an active tracking epoch.
- UUIDs provide observation identity; persistent per-epoch sequence numbers provide ordering.
- Uploads are bounded to 100 observations per batch.
- The device deletes only IDs returned in processed_ids.
- Exact retries are ACKed again; changed payloads reusing an observation ID are rejected.
- Reusing an epoch sequence number with another UUID is rejected.
- Terminal actions stop acquisition locally, then wait for the declared final sequence to reach D1 before the server changes visit state.
- Client views show only the latest server-persisted position while tracking is active, with age, reported accuracy and quality.
- Office views retain the richer route, security/lifecycle events, sequence continuity and anomaly flags.

## Cloudflare Workers deployment

This is a full-stack Vinext application. Do not deploy the source checkout with bare npx wrangler deploy before the framework build.

For the Git-connected Worker use:

    Build command:   npm run build:cloudflare
    Deploy command:  npm run deploy:built
    Root directory:  /

build:cloudflare forces the standalone Cloudflare profile and builds Vinext. deploy:built then locates the generated Wrangler config under dist/ and deploys that exact Worker output.

### D1

Create a D1 database named private-office-d1 and expose its database ID as a build variable:

    CLOUDFLARE_D1_DATABASE_ID=<database id>

Apply the schema in order:

    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0000_huge_blizzard.sql
    npx wrangler d1 execute private-office-d1 --remote --file drizzle/0001_durable_telemetry.sql

### Runtime bindings / secrets

Configure:

    OFFICE_SETUP_HASH          SHA-256 digest of a random one-time office bootstrap secret
    CF_ACCESS_TEAM_DOMAIN      https://<team>.cloudflareaccess.com
    CF_ACCESS_AUD              Cloudflare Access application AUD tag

Protect /agent*, /office*, /api/agent* and /api/office* with Cloudflare Access. Standalone builds refuse the legacy injected-header identity path and require a valid Access JWT. The application validates JWT signature, issuer, audience and expiry against the team JWKS before trusting the agent/office identity.

## Development

    npm install
    npm run dev

Production build:

    npm run build:cloudflare

API contract tests run against the built Worker and an isolated Miniflare D1 database:

    npm run build:cloudflare
    npm run test:api

The tests cover device-key enrollment, signed security-event batches, signed observation batches, strict ACKs, duplicate replay, observation-ID conflicts, sequence collisions, terminal sequence gating, client scoping and office evidence access.

## Native prototype

See native/README.md. The native shell intentionally does not use Capgo's best-effort native URL POST as the evidence-retention mechanism. Location callbacks are destined for the Private Office Fast-SQL queue and the same signed batch/ACK protocol used by the web prototype.

## Main routes

- / — Private Office landing and enquiry
- /agent — authenticated agent workspace and telemetry health
- /office — owner workspace, visit history and security activity
- /visit/[id] — private client arrival view
- /privacy — platform tracking/data notice
- /agent/demo, /office/demo, /visit/demo — synthetic demonstrations

## Imagery

The connected Canva library was inspected and the original Private Office source includes the Tierra Viva material. Because this connector path cannot safely transfer the large local binary into GitHub without truncation, this checkpoint uses an official DarGlobal Tierra Viva CDN image for the runtime hero. Asset provenance is documented in docs/ASSETS.md.

## Verification

See docs/VERIFICATION.md and docs/OPERATIONS.md. SQL migrations were replayed successfully against a clean local SQLite database. Full dependency installation/Vinext build could not be executed in the working container because its npm registry access was unavailable; the Cloudflare build is the next end-to-end verification step.
