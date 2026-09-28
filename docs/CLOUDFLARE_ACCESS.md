# Cloudflare Access — Private Office admin paths

> Status: production operator contract. The public homepage, public residences and agent credential sign-in must remain reachable. Only owner/admin paths are protected by Cloudflare Access.

## Why path-scoped Access is required

Private Office runs public buyer and agent surfaces on the same Worker as the owner workspace.

Do **not** enable Worker-level Access from **Workers & Pages → private-office → Access → Protect this Worker behind Access**. Worker-level protection applies to the Worker across its associated domains and would put the public site and agent sign-in behind the owner gate.

Use a hostname/path self-hosted Access application instead.

## Required application

In **Zero Trust → Access controls → Applications**:

1. Create a **Self-hosted / public hostname** application.
2. Name it **Private Office Admin**.
3. Add the production hostname with these protected paths:
   - `private-office.donny-gee.workers.dev/office*`
   - `private-office.donny-gee.workers.dev/api/office*`
4. Add an **Allow** policy for the intended office owner/admin identity only.
5. Select the identity provider used by that owner. If one IdP is used, instant authentication is preferred.
6. Save the application.
7. Open the application’s additional settings and copy the **Application Audience (AUD) Tag**.

The path wildcard is intentional: it covers the parent route and descendants.

## GitHub production variables

Set repository/environment variables used by the production workflow:

```text
CF_ACCESS_TEAM_DOMAIN=https://<team>.cloudflareaccess.com
CF_ACCESS_AUD=<64-character AUD copied from the live Private Office Admin application>
```

Never use an AUD copied from a deleted/recreated application. Cloudflare assigns the AUD to the application; deleting/recreating the app requires updating `CF_ACCESS_AUD`.

The production workflow deliberately has **no fallback AUD**. A deployment must fail rather than manufacture a login URL for an application that does not exist.

## Runtime behavior

Cloudflare Access is the authentication edge.

Anonymous request:

```text
GET /office
  -> Cloudflare Access intercepts before Worker execution
  -> identity challenge
  -> Access issues signed application token
  -> request reaches Worker with Cf-Access-Jwt-Assertion
```

Private Office then validates:
- RS256 signature;
- issuer = configured team domain;
- audience contains `CF_ACCESS_AUD`;
- token expiry/not-before;
- authenticated identity against the bound office owner in D1.

The application does **not** construct a `/cdn-cgi/access/login/...` URL. If Access is absent, the Worker renders a non-sensitive missing-auth state and production verification fails.

## Acceptance checks

Anonymous:

- `/` → 200
- `/residences` → 200
- `/agent/sign-in` → 200
- `/office` → 3xx to `*.cloudflareaccess.com`
- `/api/office/visits` → 3xx to `*.cloudflareaccess.com`

Authenticated owner:

- Access challenge succeeds.
- `/office` reaches the Worker.
- First valid owner may see the one-time office bootstrap screen if the office is not yet bound.
- Once bound, only the same owner identity enters the workspace.

A different authenticated Access identity must receive the Private Office owner-denied state.

## Failure signature fixed on 2026-09-28

Observed:

```text
Cloudflare Access
Unable to find your Access application!
```

The Worker Access tab simultaneously reported **This Worker is not protected by Access**.

Root cause: application code generated a direct Access login URL using a stale deployment fallback AUD even though no matching Access application existed.

Correction:
- direct login URL construction removed;
- stale AUD fallback removed from production workflow;
- real `CF_ACCESS_AUD` is mandatory;
- path-scoped Access is an explicit production gate.
