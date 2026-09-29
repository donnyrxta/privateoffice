# Website release gates

This runbook supersedes the earlier always-on presence/native-app launch checklist. Code implementation and local tests do not establish production configuration.

## Required production setup

1. Keep the existing D1 database; do not create a replacement for an existing deployment. Confirm binding `DB` and the real `CLOUDFLARE_D1_DATABASE_ID` build variable.
2. Apply missing migrations in order through `drizzle/0008_screening_location_stream.sql`. Back up first. Existing credential accounts must complete onboarding and human review before their next visit.
3. Create a **hostname/path self-hosted Cloudflare Access application** for `/office*` and `/api/office/*`; do not use Worker-level Access because the public site and agent sign-in share this Worker. Set `CF_ACCESS_TEAM_DOMAIN` and the live application’s `CF_ACCESS_AUD`. See `docs/CLOUDFLARE_ACCESS.md`.
4. Bootstrap the office only if not already configured, using `OFFICE_SETUP_HASH` and the existing setup flow. Never re-bootstrap a working office.
5. Build with `npm run build:cloudflare`; deploy with `npm run deploy:built`. A test build without D1 must not be deployed.
6. Verify `/api/health`: current schema, configured Access, office state and cron heartbeats. Run `npm run verify:production -- https://<domain>`.

For an already-migrated deployment, the new database command is:

```bash
npx wrangler d1 execute private-office-d1 --remote --file drizzle/0008_screening_location_stream.sql
```

## Acceptance rehearsal

- Buyer: public homepage → residences → detail → qualified enquiry → persisted receipt visible to office.
- New invited agent: open private invitation → accept the proximity-location notice → explicitly start precise sharing → continuous best-effort fixes persist while the page/browser allow it → saved profile/scenarios → submit → pending review. Reload must retain interview progress but must not silently restart location sharing.
- Reviewer: owner signs in → agent review → evidence and rubric → recorded human approval or changes requested. A different identity must not gain review access.
- Approved agent: assigned visit → explicit consent/start → browser permission → coordinate, reported accuracy and freshness → pause/arrive/complete. Denied permission must provide retry/manual coordination; no location request on ordinary browsing.
- Hide/leave the visit page: acquisition stops. Returning requires an explicit start. Offline final sync is visibly pending, never falsely confirmed.
- Client: only the correct private link sees the appointment's latest persisted shared position. No full device identifiers or office history.

## Physical-device check

Use HTTPS on an actual Android phone. For invitation screening, test permission grant/denial, multiple successive fixes, temporary network loss/recovery, tab background, screen lock, reload and explicit stop. Confirm that background/lock may interrupt browser callbacks and is never described as guaranteed tracking. Separately test visit permission grant/denial, poor indoor fix, timeout, pause and end. Automated synthetic coordinates verify behavior, not actual GNSS accuracy.

## Operations

Watchdog runs every minute; retention runs daily at 03:00 Harare. Current policy retains visit evidence 30 days and enquiries 90 days. D1 backup/restore, production access, domain and real-phone rehearsal require operational verification. An unshipped native app, route-aware ETA, attestation and vehicle profiles are separate future work, not claimed deliverables of this website change.


Migration order for the screening lifecycle is `0005_agent_onboarding_screening.sql` → `0006_agent_interviews.sql` → `0007_screening_location.sql` → `0008_screening_location_stream.sql`. Invitation-link screening is pre-credential intake and may collect consented best-effort continuous location for proximity matching; the contracted agent then completes the first-login professional interview for visit activation.
