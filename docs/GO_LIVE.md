# Private Office go-live gates

Status legend: **DONE** = implemented and covered by `npm run test:api` · **OPERATOR** = needs your Cloudflare account / a person · **OPEN** = engineering work not yet done · **FIELD** = can only be proven on physical devices.

## The eight true blockers

| # | Blocker | Status | How it is enforced / what remains |
|---|---------|--------|-----------------------------------|
| 1 | Production D1 bound and migrated | Code **DONE**, binding **OPERATOR** | Build fails without a valid `CLOUDFLARE_D1_DATABASE_ID`; `deploy:built` refuses a config without `DB`; `/api/health` returns 503 until schema `0004_agent_presence_gate` and all enriched columns exist. |
| 2 | Cloudflare Access + runtime secrets | Code **DONE**, config **OPERATOR** | `/api/health` reports `access: missing` → 503 in standalone builds. `npm run office:secret` generates the bootstrap secret; `npm run verify:production` checks the anonymous side of the Access boundary. |
| 3 | Contiguous-sequence terminal validation | **DONE** | Terminal actions require `COUNT = final+1`, `MIN = 0`, `MAX = final`. `0,1,3` cannot close at `3` (`TELEMETRY_PENDING` + exact gaps); data beyond the declared final is `FINAL_SEQUENCE_MISMATCH`. |
| 4 | Production health/readiness checks | **DONE** | `GET /api/health`, plus the cron watchdog/retention heartbeats. |
| 5 | Native Android/iOS location app | **OPEN / FIELD** | `native/` holds the Capacitor 8 architecture only. Platform projects, permissions, the foreground service, and the Fast SQL / uploader / recovery wiring are not built yet. |
| 6 | Native SQLite queue + protected device keys | **OPEN** | Keystore/Keychain non-exportable P-256 keys, and native SQLite for observations, security events, terminal actions, sequence counters and installation metadata. |
| 7 | Play Integrity / App Attest + enrollment | **OPEN / OPERATOR** | Needs Google Play Console and Apple Developer accounts. The Worker will need an attestation verification step on device enrollment. |
| 8 | Physical-device failure/recovery matrix | **FIELD** | See `OPERATIONS.md` → Physical-device acceptance. |

## All gates

| # | Gate | Status |
|---|------|--------|
| 1 | Bind production D1 | OPERATOR (steps below) |
| 2 | `/api/health` readiness | DONE |
| 3 | Missing D1 fails the build | DONE (build + deploy gate) |
| 4 | Cloudflare Access | OPERATOR. App-level matrix covered by tests (wrong agent, wrong/other/expired/revoked client token). |
| 5 | `OFFICE_SETUP_HASH` | OPERATOR (`npm run office:secret`) |
| 6 | Contiguous terminal rule | DONE |
| 7 | `SEQUENCE_GAP` health | DONE: office sees "TRACKING DEGRADED · 1 observation missing" and the missing sequence numbers |
| 8 | Native application | OPEN |
| 9 | Native SQLite outbox | OPEN |
| 10 | Native key storage | OPEN |
| 11 | Attestation | OPEN |
| 12 | Spoofing signals | DONE server-side: `simulated_location`, `implausible_speed`, `timestamp_anomaly` stored per fix as `integrity_flags`; sequence gaps at visit level. Invalid fixes are persisted in `observation_rejections` with raw payload and reason, never silently dropped. |
| 13 | Route-aware ETA | OPEN: needs a routing provider account/key |
| 14 | Production tile provider | OPEN: needs a provider account/key (currently `tile.openstreetmap.org`) |
| 15 | Real agent profiles | PARTIAL: D1 agent accounts, issued credentials, name/email and direct assignment are implemented; photo/vehicle fields remain open. |
| 16 | Arrival challenge code | OPEN |
| 17 | Scheduled retention | DONE: Cron `0 1 * * *` (03:00 Harare). The office dashboard runs retention only if the scheduler is >26 h overdue. |
| 18 | Operational logging | PARTIAL: structured JSON logs (`active_visit_unhealthy`, `terminal_refused`, `retention_completed`, `scheduled_failed`, …) for Workers Observability. Alert routing is OPERATOR. |
| 19 | Active-visit watchdog | DONE: Cron every minute. 0–15 s healthy · 15–45 s delayed · 45–90 s stale · >90 s interrupted (`HEALTH_THRESHOLDS` in `lib/contracts.ts`; tune from field tests). Transitions are written to the visit audit trail. |
| 20 | Physical-device testing | FIELD |
| 21 | Cadence tuning | FIELD |
| 22 | Production domain | OPERATOR. `verify:production` warns on `workers.dev`. |
| 23 | Capability links | DONE structurally; `verify:production --client-link` validates a live link |
| 24 | Backups / evidence export | Export DONE (`GET /api/office/visit/:id/export`, owner-only, SHA-256 digest, logged as `evidence_exported`). Backups OPERATOR: D1 Time Travel restore + scheduled `wrangler d1 export`. |
| 25 | Live rehearsal | FIELD |

## Operator runbook

```bash
# 1. Database
npx wrangler d1 create private-office-d1          # copy the database_id
# Workers Builds → Settings → Build variables: CLOUDFLARE_D1_DATABASE_ID=<id>

# 2. Schema — in order, once each (ALTER TABLE statements are not re-runnable)
npx wrangler d1 execute private-office-d1 --remote --file drizzle/0000_huge_blizzard.sql
npx wrangler d1 execute private-office-d1 --remote --file drizzle/0001_durable_telemetry.sql
npx wrangler d1 execute private-office-d1 --remote --file drizzle/0002_production_readiness.sql
npx wrangler d1 execute private-office-d1 --remote --file drizzle/0003_agent_credentials.sql
npx wrangler d1 execute private-office-d1 --remote --file drizzle/0004_agent_presence_gate.sql
npx wrangler d1 execute private-office-d1 --remote --command "SELECT version FROM schema_migrations ORDER BY version"

# 3. Secrets / vars (Worker → Settings → Variables and Secrets)
npm run office:secret                              # prints secret + OFFICE_SETUP_HASH
#    OFFICE_SETUP_HASH, CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD

# 4. Cloudflare Access protects owner/admin only:
#    /office*  /api/office/*
#    Agents use Private Office credentials, so leave /agent* and /api/agent/* reachable.
#    Public bootstrap/support surfaces: /  /privacy  /gps-test  /visit/*  /api/client/*  /api/enquiries  /api/health
#    Agent portfolio: /residences (Private Office session + fresh precise location required)

# 5. Deploy (Workers Builds: build `npm run build:cloudflare`, deploy `npm run deploy:built`)

# 6. Verify
curl -s https://<domain>/api/health | jq
npm run verify:production -- https://<domain>
npm run verify:production -- https://<domain> --client-link 'https://<domain>/visit/<id>#key=<token>'
```

The deploy gate checks that the generated config contains the watchdog and retention Cron Triggers. After the first minute, `/api/health` should report `scheduler.watchdog: running`.

**Authentication matrix:** contracted agent A signs in with issued Private Office credentials and sees only visits bound to agent A; another agent's `/api/agent/visit/<id>` returns 403. Cloudflare Access is reserved for owner/admin routes: a non-owner cannot use `/api/office/*` or evidence export.

**Backups:** D1 Time Travel gives point-in-time restore (30 days on Workers Paid, 7 on Free) (`npx wrangler d1 time-travel restore private-office-d1 --timestamp=<ISO>`). For off-platform copies, schedule `npx wrangler d1 export private-office-d1 --remote --output=backup-$(date +%F).sql` from a trusted machine and store it encrypted. Rehearse a restore into a scratch database before go-live.

## Agent access gate

A valid username/password creates a session but does not grant portfolio access. The next route is `/agent/location`. The session unlocks only when the server receives a location fix with reported accuracy of 25 m or better. The proof expires after 60 seconds unless refreshed. Agent pages post presence about every 15 seconds and record path + dwell time + coordinates in `agent_page_activity`; stale or denied location returns the user to the location gate. `/agent/demo` and `/office/demo` are disabled for production access.
