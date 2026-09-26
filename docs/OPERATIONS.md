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
3. Apply `drizzle/0000_huge_blizzard.sql`, `drizzle/0001_durable_telemetry.sql`, `drizzle/0002_production_readiness.sql`, `drizzle/0003_agent_credentials.sql`, then `drizzle/0004_agent_presence_gate.sql` to the remote database.
4. Run `npm run office:secret` and configure the printed `OFFICE_SETUP_HASH` as a runtime secret.
5. Configure Cloudflare Access for `/office*` and `/api/office/*` only, then provide `CF_ACCESS_TEAM_DOMAIN` + `CF_ACCESS_AUD`. Contracted agents use Private Office-issued credentials.
6. Deploy from `main`.
7. Confirm `GET /api/health` returns `"status":"ready"`, then run `npm run verify:production -- https://<domain>`.
8. Activate the office with the one-time setup secret, confirm the `office` row, then rotate `OFFICE_SETUP_HASH`.

Full checklist: `docs/GO_LIVE.md`.

## Agent security session

After a contracted agent signs in with the Private Office credentials issued by the office, Private Office immediately enters the location gate. Portfolio/dashboard access is blocked until the same session supplies a fresh device fix with reported accuracy <=25 m. The proof must remain fresher than 60 seconds. Once unlocked, the workspace enrolls or reconnects a browser device identity and opens the auditable security session. The browser generates a P-256 signing key and stores the non-extractable signing key in its local IndexedDB record. Relevant workspace lifecycle, network and location-provider events are queued locally and sent as signed security-event batches.

If location permission has already been granted, the web prototype also records lower-frequency engaged-session location observations as security events while the agent workspace is active. The native shell is designed to start its native provider for the same engaged state.

## Customer visit

1. Office creates the contracted agent account once and gives the username/password directly to that agent.
2. Office assigns a customer visit to that agent username and sends only the private arrival link to the intended client.
3. The agent visits `/agent`, signs in, sees the assigned visit, and at departure starts the visit. The server creates a new share epoch bound to the registered device.
4. The device requests the best practical fix and begins high-accuracy acquisition.
5. Every callback is written to the local durable outbox with UUID + persistent sequence before transport.
6. Batches are signed by the registered device key and sent to `/api/agent/visit/:id/observations`.
7. D1 validates identity, device, epoch, timestamps, observation IDs and sequence uniqueness, then returns explicit `processed_ids`.
8. Only ACKed rows are deleted locally.
9. The client polls the latest server-persisted position; the office can inspect the route and security trail.

## Offline behavior

Loss of network changes health to `offline`; it does not intentionally clear acquisition. Observations continue to the local outbox while the browser/platform continues supplying them. Reconnect triggers batch replay. A lost server response is safe because exact UUID retries are idempotently ACKed.

## Closing a visit

Pause and arrival stop local acquisition first. Private Office records a pending terminal action locally, drains the observation queue, re-declares the final sequence from the local counter, then submits the terminal action. The Worker closes the epoch only when every sequence `0..final_sequence` is accounted for: a persisted observation or a persisted rejection record. Otherwise it answers `409 TELEMETRY_PENDING` with the missing ranges, or `409 FINAL_SEQUENCE_MISMATCH` if it holds data beyond the declared final. The pending action retries after reconnect/reload.

## Tracking health and the watchdog

The server evaluates health from the latest persisted position of the active epoch: 0–15 s healthy, 15–45 s delayed, 45–90 s stale, >90 s interrupted. A sequence gap, or a flagged current fix, turns healthy/delayed into **degraded**, and the office sees e.g. "TRACKING DEGRADED · 1 observation missing · Missing sequence: 84 · last received 87". The Cron watchdog (every minute) evaluates every `sharing` visit without anyone having the dashboard open. It writes `tracking_health_changed` events and logs `active_visit_unhealthy` for Workers Observability alerts. Thresholds live in `HEALTH_THRESHOLDS` (`lib/contracts.ts`) and should be tuned from field tests.

## Retention and evidence export

Retention runs daily at 01:00 UTC (03:00 Africa/Harare) from the Cron Trigger. Policy: `RETENTION_POLICY` in `lib/maintenance.ts`. The office dashboard triggers retention only if the scheduler is more than 26 h overdue. Before retention removes a visit you need to keep, export it from the visit review ("Export evidence package"). The export is an owner-only JSON package with visit, agent, device keys, per-epoch sequence proof, raw observations, rejections, audit and security events, client confirmation, and a SHA-256 digest.

## Native shell

`native/` targets Capacitor 8, Capgo Background Geolocation and Capgo Fast SQL. Android visit tracking uses the native foreground/background provider with the persistent notification. iOS uses Core Location background behavior through the plugin. The native shell replaces acquisition/storage adapters; it does not change the Worker observation protocol.

## Physical-device acceptance

Before live use, test at least two actual phones across: permission grant/revocation, screen lock, app backgrounding, network loss/recovery, process restart, poor GNSS conditions, duplicate retry, terminal close while offline, restart epoch, office revocation, and client freshness/accuracy display. Record the raw reported accuracy and timestamps for each test case.

## Agent presence and page-use audit

While an unlocked agent session is visible, the browser keeps high-accuracy geolocation active and posts a presence heartbeat approximately every 15 seconds. Each accepted heartbeat updates the session's last coordinates, reported accuracy and current path, and appends an `agent_page_activity` row containing path, dwell interval and the location context for that interval. The office agent panel aggregates the last 24 hours by path. Permission loss, a fix worse than the access threshold, or a stale fix re-locks the agent environment. This is separate from the higher-detail visit telemetry epoch shown to the client.
