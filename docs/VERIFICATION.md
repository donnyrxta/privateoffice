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
- recent office security-activity projection.

## Schema verification

Both SQL migrations have been applied in sequence against a clean SQLite database during this implementation pass. The resulting schema includes `devices`, `agent_sessions`, `security_events`, enriched `points`, and visit tracking-health/device/sequence fields.

## Build limitation in this execution environment

The working container does not have the project dependencies installed and cannot reach the npm registry, so a fresh Vinext dependency installation/build cannot be executed here. TypeScript parsing was checked with the available compiler until missing external type definitions became the blocking errors. Cloudflare Workers Builds will perform the real dependency installation from the committed package manifest.

## Required field test

Browser automation cannot prove physical background location behavior or actual GNSS quality. Complete the physical-device matrix in `OPERATIONS.md` before using the native path as a production assurance signal.
