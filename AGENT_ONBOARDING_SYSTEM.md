> 27 September integration update: this document describes optional pre-credential invitation intake. The current owner brief makes residences public. Credential issuance leads to first-login professional interviews and explicit owner activation at `/office/reviews`; GPS is requested only for an explicitly started assigned visit. The earlier precise-location gate below is superseded. See docs/DESIGN_DECISIONS_2026-09-27.md.

# Private Office — Agent Onboarding & Screening System

> Status: normative operating contract. This document governs first-time agent onboarding and must be read with `PORTFOLIO_DESIGN_SYSTEM.md`, `AGENTS.md`, and the existing authentication/location contracts.

## 1. Purpose

Private Office must know who a representative is **before** granting portfolio access.

The lifecycle is:

```text
OFFICE INVITATION
  -> CANDIDATE PROFILE
  -> STRUCTURED SCREENING
  -> DESCRIPTIVE EXPERTISE MAP
  -> HUMAN OFFICE REVIEW
  -> APPROVAL
  -> PRIVATE OFFICE CREDENTIALS
  -> PRECISE LOCATION GATE
  -> PORTFOLIO / VISITS
```

The screening system does not replace human judgment and must never silently become an automated hiring or rejection engine.

## 2. Access model

- There is no open public agent registration.
- The office issues a high-entropy, time-limited onboarding link.
- The token is stored only as a SHA-256 hash.
- A link may be bound to an intended email address.
- Submitted applications become read-only to the candidate.
- Only the authenticated office owner may approve or decline an application.
- Approval provisions the existing `agent_accounts` credential model.
- Approval does **not** bypass the existing precise-location gate.

## 3. Screening doctrine

The screening measures work-relevant evidence only.

It may assess:
- off-plan property knowledge;
- client discovery and advisory judgment;
- transaction execution;
- international/cross-border awareness;
- compliance and confidentiality judgment;
- operating discipline and follow-through.

It must not ask for or score:
- race or ethnicity;
- religion;
- political beliefs;
- disability or health;
- sexual orientation;
- family status;
- other protected or irrelevant personal traits.

No single aggregate “quality score” is produced. The output is a dimension-by-dimension expertise map plus interview follow-up areas.

## 4. Expertise levels

Each scored dimension is expressed as:

- **Foundation** — evidence suggests the subject needs guided development.
- **Practiced** — evidence suggests independent working familiarity.
- **Advanced** — evidence suggests strong applied judgment.

These labels are descriptive, not approval rules.

## 5. Candidate profile

A completed profile should contain:

- full name;
- professional email;
- phone;
- city and country;
- current company / independent status;
- years in property sales/advisory;
- languages;
- markets worked;
- specialisms;
- concise experience summary;
- reason for wanting to represent through Private Office.

The candidate explicitly confirms that the information supplied is accurate and that screening responses may be reviewed by the office.

## 6. Screening stages

### Stage A — Practice profile

Establishes experience context and declared markets/specialisms.

### Stage B — Property advisory

Scenario questions covering off-plan proposition understanding, discovery, suitability, objection handling and transaction mechanics.

### Stage C — Judgment & trust

Scenario questions covering confidentiality, source truth, conflicts, pressure, and client representation.

### Stage D — Operating discipline

Scenario questions covering CRM hygiene, follow-up, handoffs, appointment preparation, digital workflow and evidence retention.

### Stage E — Review

The candidate reviews their supplied profile, agrees to the declaration and submits.

## 7. Classification output

The system stores:

```text
classification_version
dimension scores
dimension levels
primary strengths
recommended human interview focus
profile archetype
generated_at
```

The office sees the underlying responses and the derived map. Approval remains an explicit human action.

After approval, the operational agent account projects the screening-derived professional profile — experience, markets, specialisms, languages, archetype and dimension map — through the existing office agent view. The application remains the source record; manual/legacy accounts are explicitly shown as having no screening-derived profile rather than receiving inferred data.

## 8. Profile archetypes

Archetypes are descriptive summaries, not rankings:

- **Private Client Adviser**
- **Off-plan Deal Builder**
- **International Property Adviser**
- **Execution & Follow-through Specialist**
- **Developing Generalist**

An agent can still have strengths across several dimensions.

## 9. Auditability

The system must preserve:

- invitation creation and expiry;
- candidate submission timestamp;
- screening version;
- answers used for classification;
- classification output;
- office review timestamp and reviewer;
- review note;
- approved agent account ID, when applicable.

Credentials are returned once at approval and are never stored in plaintext.

## 10. Design rules

Candidate onboarding is calm, editorial and focused. It must not become:
- a generic SaaS wizard;
- a dashboard card wall;
- a gamified personality quiz;
- a public recruitment marketplace;
- a progress experience full of ornamental animations.

Use the Private Office typography, spacing, restrained palette and interaction rules. Preserve reduced-motion behavior and strong keyboard/focus states.

## 11. Non-regression invariants

1. Do not change the public homepage composition to advertise recruitment.
2. Do not reveal protected property inventory during onboarding.
3. Do not provision credentials before human approval.
4. Do not bypass the existing agent location gate.
5. Do not use screening classification as an automatic rejection condition.
