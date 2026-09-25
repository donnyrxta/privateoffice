# Private Office native acquisition layer

This directory is deliberately isolated from the Cloudflare web build. It is the Capacitor 8 acquisition/durability adapter for the same telemetry contract implemented by the web prototype.

## Components

- `@capgo/background-geolocation`: native foreground/background acquisition. Visit mode configures the persistent Android foreground notification and does **not** use the plugin's best-effort `url` uploader.
- `@capgo/capacitor-fast-sql`: native SQLite durable outbox. Observations are committed locally before our uploader attempts the existing signed Worker batch API.
- `@capacitor/app` and `@capacitor/network`: lifecycle and reconnect signals for queue reconciliation.

The backend observation schema, device signing, share epochs, sequence numbers, strict `processed_ids` ACK contract and D1 storage are intentionally provider-independent.

## Android

The Capgo plugin currently requires the legacy Capacitor Android bridge for sustained background updates, configured in `capacitor.config.ts`. Add the required foreground/background location and Android 13+ notification permissions to the generated Android project before device testing. The foreground notification should remain visible for an active Private Office security/visit session.

## iOS

Add the When-In-Use and Always location usage descriptions and `location` background mode to the generated iOS project. The backend health model must continue to distinguish background operation from OS termination.

## Fast SQL

The production native shell should move the full web `IndexedDB` stores (`observations`, `security_events`, `terminal_actions`, sequence metadata and device identity metadata) into Fast SQL. `sqlite-outbox.ts` establishes the observation storage contract; the next native pass can wire the shared uploader to it without changing the Worker API.
