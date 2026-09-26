# Private Office — design contract

A restrained international property office serving Zimbabwe. Private Office is a premium off-plan property service first: public pages lead with residences, private advisory and considered introductions. Agent location is an operational coordination and trust layer shown only where relevant; it must never become the public value proposition. Architecture is the visual subject: a large cinematic image, deep ink margins, disciplined editorial serif, understated silver rules, and practical, light visit pages. The supplied house animation is a motion reference, not inventory. The name Private Office is a working identity; no current DarGlobal affiliation, property availability or sales mandate is asserted.

```json
{"ink":"#101b22","paper":"#f6f7f7","white":"#ffffff","accent":"#c7a878","muted":"#56636a","line":"#d8dde0","radius":"4px","bodyFont":"Arial, Helvetica, sans-serif","displayFont":"Georgia, Times New Roman, serif","bodySize":"16px","labelSize":"14px","contentWidth":"1360px"}
```

The landing page contains one introduction and an enquiry action. Agent and office routes are working surfaces, with a primary task above the fold. No invented inventory, testimonials, prices, or partner badges. Synthetic visits are labelled Demonstration throughout. Render attribution remains visible.

Tracking is explicit, session-bound and auditable. Opening the authenticated agent workspace creates the Private Office security session; starting an assigned customer visit creates a separate high-accuracy visit epoch. The installed native application is designed to maintain the active visit service through normal backgrounding and screen lock, while the browser prototype remains subject to browser/OS lifecycle limits. Coordinates always accompany reported accuracy and freshness. Stale data is never labelled live. Clients receive only their appointment's latest persisted position, not the full office evidence trail. Office histories require authenticated ownership. Terminal actions stop local acquisition and are not server-confirmed until the declared final sequence is persisted. Location is evidence about the registered device, not proof of physical identity by itself.

Forms, focus, status and error states share the same tokens. Body copy remains >=16px. Keyboard and reduced-motion support are mandatory. Large imagery has a local optimized fallback. No decorative dashboards or fabricated roads.


## Product hierarchy guardrails

- Public navigation prioritises residences and private enquiries. Agent and office tools are operational surfaces, not the sales proposition.
- The homepage may reference service and introductions, but should not market consent, tracking, telemetry, evidence capture or GPS.
- Arrival visibility is a quiet appointment feature. Detailed telemetry belongs in agent, office, privacy and diagnostic routes.
- Property-facing pages use cinematic architecture, editorial hierarchy, generous negative space and restrained interaction; do not turn them into dashboards.
- Full-bleed hero imagery must use a source at least 1600 px wide. Never stretch the 420×246 derivative across a hero. The supplied source package includes a 2000×1171 render and the connected Canva source is higher resolution.


## Portfolio design system — mandatory

All property-facing UI must comply with [PORTFOLIO_DESIGN_SYSTEM.md](./PORTFOLIO_DESIGN_SYSTEM.md).

That document is normative and acts as a design merge gate. Its Anti-Slop Contract, Apple Interaction Contract, Luxury Composition Rules, Canva Property Media Contract, prohibited-pattern catalogue and PR acceptance checklist must be read before modifying the homepage, portfolio, project/residence detail pages or shared property components.

If an implementation conflicts with that contract, the implementation must change unless the PR follows the documented exception protocol.
