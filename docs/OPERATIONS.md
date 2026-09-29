# Private Office operations

## Cloudflare build settings

For Workers Builds connected to `donnyrxta/privateoffice`:

```text
Branch: main
Build command: npm run build:cloudflare
Deploy command: npm run deploy:built
Root directory: /
```

The previous configuration with a blank build command and `npx wrangler deploy` attempts to deploy the source checkout before Vinext has produced a Worker, which causes Wrangler to report that it cannot find deployable static/application output.

## First deployment

1. Create D1 database `private-office-d1`.
2. Add build variable `CLOUDFLARE_D1_DATABASE_ID` with that database ID. Without it the build fails.
3. Apply migrations in order through `drizzle/0008_screening_location_stream.sql` to the remote database. The production workflow reapplies only additive/idempotent screening migrations before deployment.
4. Run `npm run office:secret` and configure the printed `OFFICE_SETUP_HASH` as a runtime secret.
5. Configure a hostname/path self-hosted Cloudflare Access app for `/office*` and `/api/office/*` only. Do **not** use Worker-level Access. Copy the live app AUD into `CF_ACCESS_AUD` and set `CF_ACCESS_TEAM_DOMAIN`. See `docs/CLOUDFLARE_ACCESS.md`.
6. Deploy from `main`.
7. Confirm `GET /api/health` returns `"status":"ready"`, then run `npm run verify:production -- https://<domain>`.
8. Activate the office with the one-time setup secret, confirm the `office` row, then rotate `OFFICE_SETUP_HASH`.

Full checklist: `docs/GO_LIVE.md`.

## Invitation screening location

Invitation screening starts with an explicit location notice. The stated purpose is to determine whether Private Office already has prospects or appointments near the agent; for independent agents, precise location may help identify proximity-based opportunities. Sharing does not guarantee allocation.

After consent and an explicit start action, the browser uses high-accuracy `watchPosition` and keeps the watcher alive through the screening. Device callbacks are buffered and sent as bounded observation batches to D1 with client UUID, session ID, sequence, coordinates, reported accuracy, optional motion/altitude fields, device timestamp, server receipt time and consent version. Exact retries are idempotent by observation ID / session sequence. The browser cannot guarantee background execution: screen lock, backgrounding, power management or operating-system policy may throttle or suspend callbacks. The page therefore describes this as best-effort continuous capture, never guaranteed background tracking.

The latest adequate persisted fix must remain current for screening mutations; the manual-review alternative remains available. Screening observations are owner-only and follow the 30-day telemetry retention policy.

## Agent access and activation

Issue credentials from the authenticated office. The agent signs in and completes a saved professional profile and five screening interviews. An office reviewer reads the responses, records evidence-backed competency ratings and a reasoned activation decision. Credentials alone do not permit visit access; missing/pending screening returns `ONBOARDING_REQUIRED`. Existing agents also require review after this migration; there is no automatic grandfathered approval.

Device enrollment happens in the approved visit workspace. The browser creates a non-extractable P-256 key in IndexedDB. Enrollment itself does not request location. Signing in, interviews, public properties and page navigation do not collect location.

## Customer visit

1. Office creates the contracted agent account once and gives the username/password directly to that agent.
2. After human approval, office assigns a customer visit to that agent username and sends only the private arrival link to the intended client.
3. The agent visits `/agent`, signs in, sees the assigned visit, and at departure starts the visit. The server creates a new share epoch bound to the registered device.
4. The device requests the best practical fix and begins high-accuracy acquisition.
5. Every callback is written to the local durable outbox with UUID + persistent sequence before transport.
6. Batches are signed by the registered device key and sent to `/api/agent/visit/:id/observations`.
7. D1 validates identity, device, epoch, timestamps, observation IDs and sequence uniqueness, then returns explicit `processed_ids`.
8. Only ACKed rows are deleted locally.
9. The client polls the latest server-persisted position; the office can inspect the route and security trail.

## Offline behavior

While the visit page remains visible, loss of network changes health to `offline`; it does not intentionally clear acquisition. Observations continue to the local outbox while the browser/platform continues supplying them. Reconnect triggers batch replay. A lost server response is safe because exact UUID retries are idempotently ACKed.

## Closing a visit

Pause and arrival stop local acquisition first. Private Office records a pending terminal action locally, drains the observation queue, re-declares the final sequence from the local counter, then submits the terminal action. The Worker closes the epoch only when every sequence `0..final_sequence` is accounted for: a persisted observation or a persisted rejection record. Otherwise it answers `409 TELEMETRY_PENDING` with the missing ranges, or `409 FINAL_SEQUENCE_MISMATCH` if it holds data beyond the declared final. The pending action retries after reconnect/reload.

## Tracking health and the watchdog

The server evaluates health from the latest persisted position of the active epoch: 0–15 s healthy, 15–45 s delayed, 45–90 s stale, >90 s interrupted. A sequence gap, or a flagged current fix, turns healthy/delayed into **degraded**, and the office sees e.g. "TRACKING DEGRADED · 1 observation missing · Missing sequence: 84 · last received 87". The Cron watchdog (every minute) evaluates every `sharing` visit without anyone having the dashboard open. It writes `tracking_health_changed` events and logs `active_visit_unhealthy` for Workers Observability alerts. Thresholds live in `HEALTH_THRESHOLDS` (`lib/contracts.ts`) and should be tuned from field tests.

## Retention and evidence export

Retention runs daily at 01:00 UTC (03:00 Africa/Harare) from the Cron Trigger. Policy: `RETENTION_POLICY` in `lib/maintenance.ts`. The office dashboard triggers retention only if the scheduler is more than 26 h overdue. Before retention removes a visit you need to keep, export it from the visit review ("Export evidence package"). The export is an owner-only JSON package with visit, agent, device keys, per-epoch sequence proof, raw observations, rejections, audit and security events, client confirmation, and a SHA-256 digest.

## Browser lifecycle and earlier native exploration

The website stops collection on hiding or leaving the visit page and queues a pause. Returning never silently restarts GPS. Final delivery/closure can remain pending while offline; the UI distinguishes stopped acquisition from server-confirmed closure.

`native/` is an earlier unshipped exploration, not an enabled background-tracking feature or a prerequisite for this website release. Any future native product requires a separate approved scope and consent design.

## Physical-device acceptance

Before live use, test at least two actual phones across: permission grant/revocation, screen lock, app backgrounding, network loss/recovery, process restart, poor GNSS conditions, duplicate retry, terminal close while offline, restart epoch, office revocation, and client freshness/accuracy display. Record the raw reported accuracy and timestamps for each test case.

## Legacy presence gate

The former location-before-content gate has been retired. `/api/agent/presence` returns 410 and does not accept new coordinates. Historical tables remain for migration compatibility and follow the configured retention policy. The public portfolio does not depend on an agent session or device fix.


Integration with concurrent main updates: preserve migration `0005_agent_onboarding_screening.sql` and apply it before `0006_agent_interviews.sql`. Optional invitation-link screening is pre-credential intake; the contracted agent then completes the first-login professional interview for visit activation. Public residences never require GPS.
