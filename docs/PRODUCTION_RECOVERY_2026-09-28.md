# Production recovery — 28 September 2026

User authorized deployment of the completed build from main, preserving the homepage imagery and working agent sign-in.

Evidence: workflow 36380623513 built, typechecked, passed the API suite and deployed revision dd341f6 to Worker private-office (version 14e637c7-acbf-4b31-b31b-0818daba6c04). Revision verification failed because it discarded every HTTP 503 response as propagation delay.

The application intentionally returns 503 with structured readiness diagnostics when configuration or database schema is incomplete. The revision check must parse those responses; matching the revision establishes deployment identity, not launch readiness. The following anonymous production contract remains mandatory and reports health plus public and protected route behavior. No authentication protections or design are changed.

Next gate: inspect the resulting production contract; correct only the evidenced readiness defect. Deployment acceptance requires the exact main SHA, healthy schema/configuration, functional public navigation and credential sign-in. Production authenticated agent/GPS tests still require issued test accounts and an actual phone for hardware accuracy.

## Verified production findings

Recovery run 36382037709 confirmed exact revision e49aeca live. D1 is connected but all five tables introduced by migrations 0005/0006 are absent. Apply those additive CREATE IF NOT EXISTS/INSERT OR IGNORE migrations before deployment; do not replay historical ALTER TABLE migrations. Office is awaiting setup, not bootstrapped. Retention scheduler is stale. Anonymous agent routes redirect correctly, API returns 401, and public routes return 200. Office API rejects anonymous/spoofed identity; /office returns a non-sensitive missing-auth panel rather than an Access redirect. This remains a launch blocker, not an exposed workspace.

Production browser tests now click the enquiry modal, agent credential entry, residences navigation and mobile sign-in, fail on uncaught JS errors and retain screenshots. They submit no enquiries, credentials or location data. They run even if the readiness contract fails, to avoid hiding independent UI defects.

## Owner login correction

The owner page now initiates Cloudflare Access login using the configured team and audience and a fixed canonical return target. Both Access header and application cookie transports feed the existing RS256 signature, issuer, audience and expiry verification. Cookie presence alone never authenticates; duplicate cookies are rejected and explicit assertion headers take precedence. Owner database identity and bootstrap-secret requirements remain unchanged. TypeScript and bounded redirect/token-transport checks passed. A real owner OTP session is still needed to complete activation; no owner identity or credentials are fabricated.

## Reproduced public navigation regression

Production browser run 36382277821 proved the enquiry modal opens, then reproduced an uncaught `e is not a function` during client-router navigation from the homepage to agent access. Server routes separately returned the correct redirects and credential page. Replace framework Link interception with native anchors on the landing page, shared portfolio header and portfolio/detail pages. Preserve every class, image and composition. This deliberately trades client-side transitions for dependable browser navigation until the Vinext router defect is isolated. Browser verification now clicks through agent sign-in, portfolio, project detail, project enquiry, and mobile sign-in; no production records are created. TypeScript passes.


## Access application mismatch

Production evidence then showed two facts at the same time:

- the Worker Access tab reported **This Worker is not protected by Access**;
- opening the generated team-login URL returned **Unable to find your Access application**.

The failing URL used the deployment fallback AUD as `kid`, but no matching Access application existed. That redirect was application-generated, not proof that Cloudflare Access protected the route.

Correction is path-scoped: create a self-hosted Access application for `/office*` and `/api/office/*`, keep public/agent routes outside Access, copy the live application AUD into the GitHub `CF_ACCESS_AUD` variable, and remove all fallback/direct-login construction. See `docs/CLOUDFLARE_ACCESS.md`.
