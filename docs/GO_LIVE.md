# Website release gates

This runbook supersedes the earlier always-on presence/native-app launch checklist. Code implementation and local tests do not establish production configuration.

## Required production setup

1. Keep the existing D1 database; do not create a replacement for an existing deployment. Confirm binding `DB` and the real `CLOUDFLARE_D1_DATABASE_ID` build variable.
2. Apply missing migrations in order, once each: 0000 through 0004, then `drizzle/0006_agent_interviews.sql`. Back up first. Existing credential accounts must complete onboarding and human review before their next visit.
3. Create a **hostname/path self-hosted Cloudflare Access application** for `/office*` and `/api/office/*`; do not use Worker-level Access because the public site and agent sign-in share this Worker. Set `CF_ACCESS_TEAM_DOMAIN` and the live application’s `CF_ACCESS_AUD`. See `docs/CLOUDFLARE_ACCESS.md`.
4. Bootstrap the office only if not already configured, using `OFFICE_SETUP_HASH` and the existing setup flow. Never re-bootstrap a working office.
5. Build with `npm run build:cloudflare`; deploy with `npm run deploy:built`. A test build without D1 must not be deployed.
6. Verify `/api/health`: current schema, configured Access, office state and cron heartbeats. Run `npm run verify:production -- https://<domain>`.

For an already-migrated deployment, the new database command is:

```bash
npx wrangler d1 execute private-office-d1 --remote --file drizzle/0006_agent_interviews.sql
```

## Acceptance rehearsal

- Buyer: public homepage → residences → detail → qualified enquiry → persisted receipt visible to office.
- New invited agent: issued login → saved profile and all five interview stages → submit → pending review. Reload must retain progress; visits must remain unavailable.
- Reviewer: owner signs in → agent review → evidence and rubric → recorded human approval or changes requested. A different identity must not gain review access.
- Approved agent: assigned visit → explicit consent/start → browser permission → coordinate, reported accuracy and freshness → pause/arrive/complete. Denied permission must provide retry/manual coordination; no location request on ordinary browsing.
- Hide/leave the visit page: acquisition stops. Returning requires an explicit start. Offline final sync is visibly pending, never falsely confirmed.
- Client: only the correct private link sees the appointment's latest persisted shared position. No full device identifiers or office history.

## Physical-device check

Use HTTPS on an actual Android phone. Test permission grant and denial, poor indoor fix, timeout, offline/reconnect, tab background, screen lock, reload, pause and end. Automated synthetic coordinates verify behavior, not actual GNSS accuracy. Do not promise exact coordinates or continuous background tracking.

## Operations

Watchdog runs every minute; retention runs daily at 03:00 Harare. Current policy retains visit evidence 30 days and enquiries 90 days. D1 backup/restore, production access, domain and real-phone rehearsal require operational verification. An unshipped native app, route-aware ETA, attestation and vehicle profiles are separate future work, not claimed deliverables of this website change.


Integration with concurrent main updates: preserve migration `0005_agent_onboarding_screening.sql` and apply it before `0006_agent_interviews.sql`. Optional invitation-link screening is pre-credential intake; the contracted agent then completes the first-login professional interview for visit activation. Public residences never require GPS.
