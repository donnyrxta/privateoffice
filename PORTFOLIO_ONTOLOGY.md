> Current access correction (27 September 2026): portfolio pages are public. Agent sign-in is `/agent/sign-in`; first-login interviews and human approval precede visits. Presence-gate descriptions and re-lock states below are historical and superseded by AGENTS.md. Retain the property/media ontology and architectural viewer composition.

# Private Office — Portfolio Ontology

> Status: normative information architecture. This document describes what the property experience *is*, how its entities relate, and which facts may appear on which surfaces. It is subordinate to `PORTFOLIO_DESIGN_SYSTEM.md` and the access/location invariants.

## 1. Core principle

Private Office is not a public property marketplace. It is an authenticated representative environment.

The property experience is a projection of this chain:

```text
AGENT
  -> AUTHENTICATED SESSION
  -> VERIFIED PRECISE PRESENCE
  -> PORTFOLIO
  -> PROJECT
  -> RESIDENCE TYPE
  -> MEDIA + VERIFIED FACTS + SOURCE
  -> CURRENT COMMERCIAL BRIEF
  -> CLIENT VISIT / CONVERSATION
```

The location gate protects the environment. It does not become the subject of the property experience once access is granted.

## 2. Entities

### Agent

A contracted representative with an issued Private Office account.

Owns:
- identity;
- authenticated web session;
- current verified presence state;
- page-activity history;
- assigned visits.

Does **not** own portfolio truth. Property facts come from project/residence source records.

### Presence state

The current server-accepted location evidence that unlocks authenticated portfolio surfaces.

Required attributes:
- latitude;
- longitude;
- reported accuracy;
- provider timestamp;
- server receipt time;
- freshness;
- current route.

Presence is an access predicate, not a marketing claim.

### Portfolio

The curated set of project briefs currently prepared for representative use.

The portfolio is not equivalent to:
- live inventory;
- all developer stock;
- a marketplace;
- a promise of sales mandate.

### Project

A development-level object such as Tierra Viva.

Minimum fields:
- stable slug;
- project name;
- location;
- country;
- developer/source attribution;
- concise positioning line;
- source-dated verified facts;
- hero media;
- project/context media;
- residence-type children;
- source/provenance record;
- commercial-state boundary.

### Residence type

A project child such as Diamante, Zafiro or Esmeralda.

Minimum fields:
- stable slug;
- name;
- verified bedroom/type descriptor where supported;
- hero image;
- architectural gallery;
- source note;
- parent project relation.

A residence type is not a live unit.

### Media asset

An architectural render, photograph, plan, aerial or contextual visual.

Minimum provenance where available:
- source library;
- Canva folder ID;
- Canva asset ID;
- original filename;
- media role;
- runtime derivative/source;
- alt text;
- focal point.

The existence of media proves only that the media exists.

### Verified fact

A source-dated project or residence statement that has passed the portfolio content gate.

Examples:
- location;
- project status;
- residence type;
- area range;
- expected completion when source-supported.

A fact record should carry:
- label;
- value;
- source;
- checked-at date;
- scope: project or residence.

### Commercial brief

The current transaction-facing state that can change independently of the architectural/project record.

Examples:
- price;
- availability;
- payment plan;
- incentives;
- booking/EOI requirements;
- current mandate/representation status.

Until explicitly verified, the UI must say **Confirm with office** rather than synthesize a value.

### Visit

An appointment/assignment binding:
- agent;
- client;
- property/project context;
- meeting point;
- schedule;
- share epoch;
- telemetry.

Visits live in the operational workspace, not inside the visual hierarchy of the portfolio.

## 3. Relationship graph

```text
Agent
  | 1
  | has
  v
AgentSession
  | 1
  | requires
  v
PresenceState
  |
  | unlocks
  v
Portfolio
  |
  +---- Project 1
  |       |
  |       +---- ResidenceType A
  |       |       +---- MediaAsset*
  |       |       +---- VerifiedFact*
  |       |
  |       +---- ResidenceType B
  |       +---- ResidenceType C
  |       +---- Project MediaAsset*
  |       +---- Project VerifiedFact*
  |       +---- CommercialBrief (mutable)
  |
  +---- Project N

AgentSession ---- PageActivity*
Agent ----------- Visit*
Visit ----------- Client capability view
```

## 4. Page ontology

### `/` — representative entry

Question: **Can I enter Private Office?**

Shows:
- brand;
- architectural atmosphere;
- credential form;
- discreet operational note.

Does not show:
- portfolio cards;
- protected project names;
- telemetry dashboarding.

### `/agent/location` — presence gate

Question: **Is this authenticated agent currently supplying an acceptable location fix?**

Shows:
- authentication verified;
- acquisition state;
- reported accuracy;
- locked/verifying state;
- recovery path.

Success transitions to `/residences`.

### `/residences` — portfolio index

Question: **What project should I prepare to present?**

Shows:
- one dominant current project;
- editorial project/residence sequence;
- project recognition cues;
- source-safe portfolio-state notice.

### `/residences/[project]` — project chapter

Question: **What is this development, and what can I safely say about it?**

Shows:
- cinematic project arrival;
- setting/story;
- project context/masterplan media;
- source-dated facts;
- residence types;
- commercial-state boundary;
- source note.

### `/residences/[project]/[residence]` — residence chapter

Question: **How does this residence type look and fit within the project?**

Shows:
- signature residence image;
- type/name;
- architectural story;
- gallery;
- source note;
- commercial confirmation boundary;
- route back to project or visits.

### `/agent` — visits workspace

Question: **What assigned client work do I need to execute?**

This remains operational and may be denser. It must not become the visual template for portfolio pages.

### `/visit/[id]` — client arrival projection

Question: **Where is my assigned agent and how fresh/accurate is the latest server-persisted fix?**

This is a client trust surface, not a property catalogue.

### `/office` — owner/admin evidence workspace

Question: **What happened, who did it, and what evidence supports it?**

Office density is acceptable because its purpose is oversight.

## 5. Truth classes

Every property datum belongs to one of four truth classes:

| Class | Meaning | UI treatment |
|---|---|---|
| Architectural source | Render/photo/plan exists | Can be shown with provenance |
| Verified project fact | Source-supported and checked | Can be stated directly |
| Mutable commercial state | May change frequently | Show only when current; otherwise “Confirm with office” |
| Inference/marketing interpretation | Not a source fact | Avoid unless explicitly labelled and justified |

No class may silently upgrade into another.

## 6. Access invariants

1. No protected portfolio page renders without a valid agent session.
2. No protected portfolio page renders without fresh precise presence.
3. Presence expiry or permission loss re-locks the environment.
4. Client capability pages never inherit agent portfolio access.
5. Office Access remains a separate administrative identity boundary.

## 7. Extension rule

New projects must be added as data first, then projected through the same page grammar.

Do not build a one-off visual page that bypasses:
- project identity;
- media provenance;
- verified facts;
- commercial-state boundary;
- access/location gates.

The ontology must scale by adding records, not by cloning bespoke pages until they diverge.
