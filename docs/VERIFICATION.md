# Verification record

This pass changes the tracking model from direct single-point HTTP delivery to durable signed telemetry.

## Automated contract coverage

`tests/api.test.mjs` is designed to run against the built Worker in Miniflare with isolated D1. It covers:

- office ownership and capability separation;
- current agent tracking notice acceptance;
- P-256 device enrollment;
- signed security-event batch ingestion and explicit ACK;
- visit epoch creation on a registered device;
- signed observation batch ingestion;
- exact duplicate ACK replay;
- observation UUID payload conflicts;
- sequence-number collisions;
- client latest-only projection and quality classification;
- office route history projection;
- terminal final-sequence gating;
- idempotent terminal retry;
- epoch restart;
- arrival and client confirmation;
- recent office security-activity projection;
- readiness endpoint: DB missing (503), unmigrated (503), migrated/ready (200), Access config missing in standalone;
- contiguous terminal gate: 0,1,3 cannot close at 3; closing below persisted MAX is FINAL_SEQUENCE_MISMATCH;
- persisted rejection records account for sequences and replay idempotently;
- in-batch duplicate sequences are rejected without failing the batch;
- SEQUENCE_GAP → degraded health with exact missing ranges (office only, not client);
- integrity flags: simulated_location, timestamp_anomaly;
- Cron watchdog marks a silent visit interrupted and audits the transition; daily retention cron deletes per policy;
- evidence export (owner-only, contiguity proof, raw rejections, digest, no capability token);
- access matrix: other agent 403, other visit's / wrong / expired / revoked client token denied, revoked visit rejects telemetry.

103 assertions pass locally (`npm run build:test && npm run test:api`).

## Schema verification

All three SQL migrations have been applied in sequence against a clean SQLite database during this implementation pass. The resulting schema includes `devices`, `agent_sessions`, `security_events`, enriched `points`, and visit tracking-health/device/sequence fields.

## Build and type checks

Dependencies install and the Vinext Cloudflare build completes. `npx tsc --noEmit` reports no errors. The pinned local workerd only supports compatibility dates up to 2026-05-22, so the contract test clamps the date for local runs only; the deployed Worker still targets 2026-09-25.

## Required field test

Browser automation cannot prove physical background location behavior or actual GNSS quality. Complete the physical-device matrix in `OPERATIONS.md` before using the native path as a production assurance signal.
