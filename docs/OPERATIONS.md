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
2. Add build variable `CLOUDFLARE_D1_DATABASE_ID` with that database ID.
3. Apply `drizzle/0000_huge_blizzard.sql`, then `drizzle/0001_durable_telemetry.sql` to the remote database.
4. Configure `OFFICE_SETUP_HASH` as a runtime secret.
5. Configure Cloudflare Access for agent/office routes and provide `CF_ACCESS_TEAM_DOMAIN` + `CF_ACCESS_AUD` to the Worker.
6. Deploy from `main`.
7. Activate the office with the one-time setup secret.

## Agent security session

Opening the authenticated agent workspace enrolls or reconnects a browser device identity and opens an auditable security session. The browser generates a P-256 signing key and stores the non-extractable signing key in its local IndexedDB record. Relevant workspace lifecycle, network and location-provider events are queued locally and sent as signed security-event batches.

If location permission has already been granted, the web prototype also records lower-frequency engaged-session location observations as security events while the agent workspace is active. The native shell is designed to start its native provider for the same engaged state.

## Customer visit

1. Office creates an assignment and sends the private agent/client links.
2. Agent accepts the assignment with the current notice version.
3. At departure the agent starts the visit. The server creates a new share epoch bound to the registered device.
4. The device requests the best practical fix and begins high-accuracy acquisition.
5. Every callback is written to the local durable outbox with UUID + persistent sequence before transport.
6. Batches are signed by the registered device key and sent to `/api/agent/visit/:id/observations`.
7. D1 validates identity, device, epoch, timestamps, observation IDs and sequence uniqueness, then returns explicit `processed_ids`.
8. Only ACKed rows are deleted locally.
9. The client polls the latest server-persisted position; the office can inspect the route and security trail.

## Offline behavior

Loss of network changes health to `offline`; it does not intentionally clear acquisition. Observations continue to the local outbox while the browser/platform continues supplying them. Reconnect triggers batch replay. A lost server response is safe because exact UUID retries are idempotently ACKed.

## Closing a visit

Pause and arrival stop local acquisition first. Private Office records a pending terminal action locally, drains the observation queue, then submits the terminal action with the final sequence number. D1 refuses to close the epoch if that sequence has not yet been persisted. The pending action retries after reconnect/reload.

## Native shell

`native/` targets Capacitor 8, Capgo Background Geolocation and Capgo Fast SQL. Android visit tracking uses the native foreground/background provider with the persistent notification. iOS uses Core Location background behavior through the plugin. The native shell replaces acquisition/storage adapters; it does not change the Worker observation protocol.

## Physical-device acceptance

Before live use, test at least two actual phones across: permission grant/revocation, screen lock, app backgrounding, network loss/recovery, process restart, poor GNSS conditions, duplicate retry, terminal close while offline, restart epoch, office revocation, and client freshness/accuracy display. Record the raw reported accuracy and timestamps for each test case.
