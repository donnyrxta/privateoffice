# Private Office — Portfolio Design System

> **Status: normative.** This document is a merge gate for all property-facing UI in this repository. It is not inspiration, a moodboard, or optional guidance.

Private Office must feel like the properties it represents: composed, discreet, image-led, precise and expensive without being loud. The interface is an editorial frame around architecture. It must never look like a generic SaaS template, a dashboard theme, a glassmorphism demo, or a stock AI-generated landing page.

This contract applies to `/`, `/residences`, residence/project detail routes, property galleries, shortlist/favourites surfaces, authenticated agent portfolio browsing, and any future client-facing property presentation.

Operational surfaces such as `/agent`, `/office`, `/gps-test` and visit diagnostics may be denser, but must still inherit the typography, spacing, interaction and accessibility rules below.

## Source of truth and precedence

When rules conflict, use this order:

1. Product and access invariants in this repository.
2. This file.
3. `DESIGN.md`.
4. Existing production components that already satisfy 1–3.
5. Upstream craft references:
   - `donnyrxta/taste-skill`
   - `donnyrxta/ui-skills`
   - `donnyrxta/skills/skills/apple-design`
   - relevant production patterns in Soho Connect and Zimbabwe Mining Intelligence
6. Visual references and exploratory mockups.

No external reference may override Private Office product truth, access control, asset provenance or factual accuracy.

## Product truth that design must preserve

- The homepage is a premium contracted-agent entry surface, not a public property catalogue.
- Portfolio content remains unavailable until the agent is authenticated and the precise-location gate is satisfied.
- Property imagery and project names in the asset library are **not** proof of current availability, price, mandate, developer relationship or right to sell.
- Never invent inventory, prices, payment plans, scarcity, yields, testimonials, partner badges, availability, delivery dates or developer claims.
- Operational GPS/telemetry is a backstage trust mechanism. It must not dominate property-facing copy or visual hierarchy.
- Any render, concept image or artist impression must keep its applicable attribution/status visible where required.

---

# 1. Anti-Slop Contract

Every property-facing implementation MUST pass this section before merge.

## 1.1 Composition must be authored, not templated

Do not default to repeated equal modules. Each important page needs a deliberate visual composition built around the strongest property media available.

Required characteristics:

- asymmetric editorial grids where the content supports them;
- mixed image aspect ratios driven by the source imagery;
- purposeful overlap or depth only where it clarifies hierarchy;
- large uninterrupted visual fields;
- generous negative space;
- meaningful variation in scale between primary and secondary content;
- clear reading order on both desktop and mobile.

A page must not look as though its sections could be shuffled without consequence.

## 1.2 Generic AI fingerprints are merge failures

The following are prohibited unless a documented product reason justifies them:

- three equal feature cards in a row;
- repeated `icon → heading → paragraph` modules;
- every section centered;
- every element using the same radius;
- every section wrapped in a bordered white card;
- purple/blue AI gradients;
- gratuitous glows;
- giant gradient text;
- generic SaaS dashboard sidebars on portfolio pages;
- excessive pills and badges;
- filler statistics;
- fake social proof;
- ornamental charts;
- generic testimonial carousels;
- generic FAQ accordions used only to fill space;
- decorative “premium” gold everywhere;
- stock “luxury” iconography standing in for real property imagery;
- random glass panels laid over every image;
- floating blobs, abstract mesh backgrounds or tech motifs unrelated to property;
- copy such as “Elevate”, “Unlock”, “Seamless”, “Next-Gen”, “Reimagine”, “Unleash”, “Game-changing” unless the phrase is part of verified source material.

## 1.3 Hierarchy must be obvious in one glance

Every screen must have one dominant object or action.

For portfolio surfaces, the dominant object is usually one of:

- the property image;
- the project name;
- the active gallery frame;
- a decision-critical fact;
- the next clear agent action.

Do not let navigation chrome, filters, pills, metadata, buttons and decoration compete at the same visual weight.

## 1.4 Typography must carry personality

- Display typography may use the editorial serif language established in `DESIGN.md`.
- Interface controls and body copy use a restrained sans-serif.
- Large display type gets tighter tracking and tighter leading.
- Small labels get slightly more tracking for clarity.
- Body copy remains at least 16px.
- Avoid all-caps paragraphs.
- Avoid title case on every heading.
- Use `text-wrap: balance` or `text-wrap: pretty` where supported for important headings and editorial copy.
- Long paragraphs should stay near a readable 60–70 character measure.
- Numeric property data uses tabular figures where alignment matters.

## 1.5 One accent, many neutrals

The default Private Office palette remains:

```text
Ink       #101b22
Paper     #f6f7f7
White     #ffffff
Accent    #c7a878
Muted     #56636a
Line      #d8dde0
```

Rules:

- the accent is punctuation, not wallpaper;
- warm and cool gray systems must not be mixed casually;
- avoid pure black where the ink tone works;
- avoid introducing new saturated accents without a documented project-level reason;
- property imagery supplies most of the color.

## 1.6 Cards must earn their existence

Use a card only when containment communicates a real relationship, state or layer.

Prefer:

- spacing;
- alignment;
- image cropping;
- type hierarchy;
- separators;
- background tone changes;

before adding another rounded rectangle.

---

# 2. Apple Interaction Contract

Private Office borrows Apple's interaction principles, not Apple's branding.

The interface should feel direct, continuous and physically coherent.

## 2.1 Immediate response

- Interactive controls must acknowledge pointer/touch down immediately.
- Do not wait for a network round trip before showing pressed/loading state.
- Press feedback should be subtle: typically scale or tone shift, not bounce.
- Never add artificial delay to make an interaction feel “cinematic”.

## 2.2 Continuity over page tricks

When an object conceptually persists, the transition should preserve that relationship.

Examples:

- a residence card image expanding into the residence hero should feel like the same object;
- a gallery thumbnail should lead directly to the selected large frame;
- a filter control should open from its visual source;
- a panel should exit toward the place it came from.

Avoid unrelated enter/exit directions.

## 2.3 Motion must be interruptible where practical

- Do not lock input while decorative transitions finish.
- Gesture-driven interactions should animate from their current on-screen state, not restart from a hidden logical state.
- Prefer spring-like motion for draggable, swipeable or directly manipulated surfaces.
- Default spring behavior should be critically damped or near it; visible bounce is reserved for momentum-driven interaction.

Private Office house defaults:

```text
Direct UI settle        ~0.30–0.40 s perceived response
Decorative reveal       ~0.45–0.70 s
Press feedback          ~0.08–0.12 s
Default overshoot       none
Momentum overshoot      minimal and justified
```

These are tuning ranges, not fixed animation durations.

## 2.4 Animate compositor-friendly properties

For normal UI motion, prefer:

- `transform`
- `opacity`
- masks/clip-path only after performance verification

Avoid layout-thrashing animation of `top`, `left`, `width`, or `height` when a transform can express the same motion.

## 2.5 Parallax is spatial, not decorative

Parallax may be used on premium property pages only when it reinforces depth in the architecture or the relationship between foreground and background.

Rules:

- motion amplitude stays restrained;
- no full-viewport continuously drifting background;
- no parallax on forms, login controls or dense operational surfaces;
- mobile behavior must be tested independently;
- disable or replace with cross-fade/static composition for `prefers-reduced-motion: reduce`.

## 2.6 Materials communicate hierarchy

Glass/translucency is an interaction material, not a site-wide visual effect.

Appropriate uses:

- compact navigation;
- gallery controls;
- shortlist tray;
- floating property facts;
- temporary context panels;
- modal/sheet chrome.

Inappropriate uses:

- every section;
- long text blocks;
- every property card;
- stacked translucent panels over other translucent panels;
- large low-contrast forms.

Where glass is used:

- preserve strong text contrast;
- add a subtle edge/highlight rather than a generic shadow;
- use stronger opacity fallbacks when transparency reduction is requested;
- never depend on blur for legibility.

## 2.7 Touch, focus and accessibility are non-negotiable

Private Office project minimums:

- primary touch targets: at least 44×44 CSS px;
- visible keyboard focus;
- keyboard-operable galleries and controls;
- no information conveyed by color alone;
- reduced-motion alternative for every significant animation;
- no critical text baked into property images when HTML text can express it.

---

# 3. Luxury Composition Rules

Luxury is communicated through restraint, image quality, proportion, material truth and calm hierarchy — not decorative excess.

## 3.1 Architecture is the visual subject

Property renders and photography must dominate property-facing pages.

UI chrome should recede.

The default visual ratio for key portfolio screens should feel closer to an architecture editorial than a SaaS product catalogue.

## 3.2 Hero composition

A residence/project hero should normally contain:

- one exceptional image or cinematic sequence;
- project/residence name;
- location;
- one concise positioning line if verified;
- restrained navigation/context;
- one primary action at most.

Do not place dense specification tables, five CTAs, badges and telemetry above the fold.

## 3.3 Portfolio index

`/residences` should behave as a curated portfolio, not a marketplace search grid.

Preferred structure:

1. quiet portfolio header/context;
2. one dominant featured residence/project;
3. asymmetric editorial sequence of other residences;
4. optional filter/sort layer that remains visually secondary;
5. graceful empty/loading/error states.

Avoid an uninterrupted wall of identical cards.

## 3.4 Residence detail page

The recommended information rhythm is:

1. cinematic arrival / hero;
2. essential verified facts;
3. architecture story;
4. exterior gallery;
5. interior sequence;
6. plans/masterplan where available;
7. location/context;
8. commercial information only when verified;
9. downloadable/agent materials where authorized;
10. clear next action.

The exact modules depend on evidence available for that property. Missing information must not be replaced with invented filler.

## 3.5 Editorial asymmetry

Desktop may intentionally use:

- 5/7 or 4/8 column splits;
- offset captions;
- image bleed;
- large whitespace;
- one portrait frame beside one landscape frame;
- staggered vertical starts.

Mobile should simplify the composition rather than merely stacking desktop columns mechanically.

## 3.6 Restraint in borders, radii and shadows

- Use fine rules more often than boxes.
- Radius is small and deliberate on architectural content.
- Larger radii are reserved for floating interactive materials where softness communicates layer.
- Shadows should be subtle, tinted to the environment and used only for elevation.
- Do not surround every image with a border.

## 3.7 Navigation

Portfolio navigation should feel like a discreet private gallery.

Use:

- minimal labels;
- strong active state;
- controlled translucency only when floating over imagery;
- no oversized mega-menu unless the portfolio genuinely requires it;
- no noisy icon labels for self-evident text actions.

---

# 4. Canva Property Media Contract

The connected Canva library contains high-resolution property masters. The website must use the strongest available source and generate fit-for-purpose local derivatives instead of stretching thumbnails.

Verified examples from the connected Tierra Viva / Diamante Villa folder include:

| Asset | Source dimensions |
|---|---:|
| DG.AL_Diamente Villa Ext 1.jpg | 6000×3636 |
| DG.AL_Diamente Villa Ext 2.jpg | 6658×3000 |
| DG.AL_Diamente Villa Ext 3.jpg | 6000×3158 |
| DG.AL_Diamente Villa_ID_Dining.jpg | 6000×3333 |
| DG.AL_Diamente Villa_ID_Kitchen Dining.jpg | 9060×3000 |
| DG.AL_Diamente Villa_ID_Living.jpg | 7410×3000 |
| DG.AL_Diamente Villa_ID_MasterBedroom.jpg | 6000×3000 |

These records prove that high-resolution masters exist in Canva. They do **not** prove current inventory or sales rights.

## 4.1 Image-quality rules

- Never use a Canva thumbnail as a production hero.
- Never stretch the 420×246 local derivative across a full-width desktop hero.
- Prefer local production derivatives generated from the high-resolution master.
- Produce responsive `srcset` sizes appropriate to actual rendered width.
- Prefer AVIF/WebP for delivery while retaining a high-quality source/master outside runtime.
- Preserve enough source resolution for high-density displays.
- Do not over-compress architectural texture, glass, lighting gradients or fine façade detail.
- Avoid aggressive sharpening halos.

## 4.2 Crop rules

Crop around architecture, not around the UI.

- Exterior hero: protect building silhouette and horizon.
- Interior hero: protect room depth lines, key furniture anchors and natural light source.
- Portrait crops are acceptable only when the composition survives them.
- Use focal-point-aware `object-position`; do not default every image to `center center`.
- If the source is extremely panoramic, use it as a panoramic sequence instead of forcing it into a generic 4:3 card.

## 4.3 Media role hierarchy

Use source media according to role:

- **Hero** — highest-impact exterior or signature interior.
- **Chapter image** — architectural sequence supporting a story section.
- **Gallery** — broader visual evidence.
- **Thumbnail** — navigation only.
- **Social creative** — never preferred over the underlying clean property master when the master exists.

Text-heavy social posts from Canva are references for composition and campaign collateral, not primary website imagery.

---

# 5. Prohibited Pattern Catalogue

Any of the following appearing without explicit justification is a design-review failure:

| Pattern | Why it fails Private Office |
|---|---|
| Three equal cards | generic template rhythm |
| Purple/blue gradient hero | AI/SaaS visual fingerprint |
| Glass on every surface | destroys hierarchy and legibility |
| Equal 24px radius everywhere | generic component-library look |
| Sidebar-first portfolio | makes residences feel like software records |
| Giant icon feature grid | replaces architecture with symbols |
| Fake stats/yields | breaks factual integrity |
| “Limited units” without source | manufactured urgency |
| Seven CTAs above fold | weak decision hierarchy |
| Stock luxury imagery where real assets exist | lowers credibility |
| Low-res hero stretched to viewport | destroys perceived quality |
| Auto-playing ornamental motion | competes with property media |
| Scroll hijacking | reduces direct control |
| Parallax on forms/login | harms usability for no product gain |
| Decorative maps without verified data | creates false precision |
| GPS/tracking marketing copy on portfolio pages | confuses backstage operations with the proposition |
| Same card component for login, property, KPI and alert | collapses semantic hierarchy |
| All-caps everywhere | removes typographic nuance |
| Generic black shadow on every component | flattens material hierarchy |
| Fake developer logos/partner badges | unsupported commercial claim |

---

# 6. Page-family constraints

## 6.1 Homepage / agent entry

Purpose: premium access point for contracted agents.

Must:

- remain visually sophisticated but intentionally sparse;
- contain login as the primary task;
- use architecture/property imagery as atmosphere, not as browsable inventory;
- disclose location requirement at the correct step rather than turning the hero into a tracking explanation;
- reveal no protected portfolio content before authentication + precise-location gate.

Must not:

- become a public property marketplace;
- become a GPS marketing page;
- expose portfolio thumbnails before access is satisfied.

## 6.2 Location-acquisition step

Purpose: unlock the authenticated environment after credential verification.

Must:

- explain what is needed in plain language;
- show acquisition status, reported accuracy and failure state;
- give immediate feedback;
- avoid luxury decoration that obscures the task;
- transition cleanly into the portfolio after the server accepts the fix.

## 6.3 Portfolio

Purpose: help an authenticated agent understand and present the property collection.

Must:

- privilege visual quality;
- support rapid project recognition;
- allow filtering without becoming a dashboard;
- provide loading, empty and error states that retain the visual system;
- make current/selected state obvious.

## 6.4 Agent operational workspace

Purpose: visit execution and assigned work.

May be denser than portfolio pages, but:

- do not reuse marketing composition blindly;
- keep primary task above the fold;
- make location health/status factual and readable;
- maintain the same type, spacing and interaction discipline.

---

# 7. Implementation and review gates

## 7.1 Mandatory pre-flight for code-generating agents

Before changing property-facing UI, an agent MUST read:

1. `AGENTS.md`
2. `DESIGN.md`
3. `PORTFOLIO_DESIGN_SYSTEM.md`
4. the specific existing page/component being modified
5. the relevant asset provenance in `docs/ASSETS.md`

Do not redesign from memory.

## 7.2 Pull-request acceptance checklist

A property-facing PR is not ready to merge until the author/reviewer can answer **yes** to all applicable items:

- [ ] Product access invariants remain intact.
- [ ] No protected inventory leaks before the location gate.
- [ ] No invented property facts or commercial claims.
- [ ] The layout avoids generic equal-card repetition.
- [ ] The visual subject is the property, not the UI.
- [ ] Source imagery is high enough resolution for its rendered size.
- [ ] Mobile composition was designed, not merely stacked.
- [ ] Motion has a reduced-motion path.
- [ ] Interactive controls have pressed, focus, loading and error states where relevant.
- [ ] Glass/translucency communicates hierarchy rather than decoration.
- [ ] Portfolio pages do not resemble dashboards.
- [ ] No prohibited-pattern item was introduced without documented justification.
- [ ] Existing high-quality components were preserved or improved; no design regression.
- [ ] Build/tests still pass.

## 7.3 Regression rule

Every implementation must compound the existing design system.

A change is a regression if it makes a previously high-quality surface more generic, lower-resolution, less coherent, less accessible, less factual or less operationally reliable — even if the new component “works”.

When uncertain between a novel component and an existing high-quality pattern, preserve the existing pattern and improve it incrementally.

## 7.4 Exception protocol

A rule in this document may be broken only when the PR explains:

1. which rule is being broken;
2. the product reason;
3. why the alternative is better;
4. how it was tested;
5. how the exception remains consistent with Private Office product truth.

“Looks better”, “AI suggested it”, “common pattern”, or “easier to implement” are not sufficient reasons.
