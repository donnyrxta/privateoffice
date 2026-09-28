# Production recovery — 28 September 2026

User authorized deployment of the completed build from main, preserving the homepage imagery and working agent sign-in.

Evidence: workflow 36380623513 built, typechecked, passed the API suite and deployed revision dd341f6 to Worker private-office (version 14e637c7-acbf-4b31-b31b-0818daba6c04). Revision verification failed because it discarded every HTTP 503 response as propagation delay.

The application intentionally returns 503 with structured readiness diagnostics when configuration or database schema is incomplete. The revision check must parse those responses; matching the revision establishes deployment identity, not launch readiness. The following anonymous production contract remains mandatory and reports health plus public and protected route behavior. No authentication protections or design are changed.

Next gate: inspect the resulting production contract; correct only the evidenced readiness defect. Deployment acceptance requires the exact main SHA, healthy schema/configuration, functional public navigation and credential sign-in. Production authenticated agent/GPS tests still require issued test accounts and an actual phone for hardware accuracy.
