> Current owner instruction (29 September 2026): public access is limited to the property splash, enquiry/privacy, sign-in and capability-based invitation/client pages. Full portfolio routes require an issued agent session. Invitation screening requests explicit consent to best-effort continuous precise device location so the office can assess prospect proximity; independent agents may benefit from nearby opportunity matching. Browser background execution is not guaranteed, location never affects expertise scoring, and a human-approved manual alternative remains. Visit sharing keeps its separate explicit consent/start contract. See docs/PRIVATE_SCREENING_RELEASE_2026-09-28.md.

> Current access correction (27 September 2026): portfolio pages are public. Agent sign-in is `/agent/sign-in`; first-login interviews and human approval precede visits. Presence-gate descriptions and re-lock states below are historical and superseded by AGENTS.md. Retain the property/media ontology and architectural viewer composition.

# Private Office — Portfolio Wireframes

> Status: implementation map. These are structural wireframes, not generic component recipes. Visual execution is governed by `PORTFOLIO_DESIGN_SYSTEM.md`.

## 1. Representative entry — desktop

```text
┌─────────────────────────────────────────────────────────────────────┐
│ PRIVATE OFFICE                                      THE OFFICE ↗    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [full-bleed architectural atmosphere]                              │
│                                                                     │
│  REPRESENTATIVE ACCESS                     ┌──────────────────────┐  │
│                                            │ AGENT SIGN IN        │  │
│  Private property.                         │                      │  │
│  Professional                              │ username             │  │
│  representation.                           │ password             │  │
│                                            │                      │  │
│  quiet explanatory line                    │ ENTER PRIVATE OFFICE │  │
│                                            │                      │  │
│                                            │ location follows     │  │
│                                            └──────────────────────┘  │
│                                                                     │
│  ZIMBABWE · INTERNATIONAL OFF-PLAN                    PRIVACY       │
└─────────────────────────────────────────────────────────────────────┘
```

Rules:
- login is the one dominant action;
- architecture sets tone but reveals no protected inventory;
- location is explained once, calmly, below credential intent.

## 2. Presence gate — mobile

```text
┌──────────────────────────────┐
│ PRIVATE OFFICE      Sign out │
├──────────────────────────────┤
│ IDENTITY CONFIRMED           │
│                              │
│ Verify where                 │
│ you are working              │
│ from.                        │
│                              │
│ AUTHENTICATION   VERIFIED    │
│ LOCATION         ± 7 m       │
│ ACCESS           VERIFYING   │
│                              │
│ acquisition/recovery copy    │
│                              │
│ Portfolio remains locked     │
└──────────────────────────────┘
```

No gallery, project preview or ornamental carousel appears here.

## 3. Portfolio index — desktop

```text
┌─────────────────────────────────────────────────────────────────────┐
│ PRIVATE OFFICE                     PORTFOLIO   VISITS   SIGN OUT    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PRIVATE OFFICE · PORTFOLIO                                         │
│  Selected property.                     explanatory note            │
│  Prepared for private                   ─────────────────────        │
│  conversations.                         SESSION · LOCATION VERIFIED │
│                                                                     │
├──────────────────────────────────────────┬──────────────────────────┤
│                                          │ CURRENT WORKING BRIEF    │
│                                          │                          │
│      DOMINANT PROJECT IMAGE              │ TIERRA VIVA              │
│                                          │ editorial positioning    │
│                                          │ facts as ruled lines     │
│                                          │                          │
│                                          │ ENTER PROJECT BRIEF →    │
├──────────────────────────────────────────┴──────────────────────────┤
│                                                                     │
│  RESIDENCE TYPES                 Three expressions of the hillside. │
│                                                                     │
│  ┌─────────────────────┐              ┌──────────────────────────┐  │
│  │                     │              │                          │  │
│  │     DIAMANTE        │              │         ZAFIRO           │  │
│  │      portrait       │              │        landscape         │  │
│  │                     │              └──────────────────────────┘  │
│  │                     │         ┌────────────────────────────────┐ │
│  │                     │         │          ESMERALDA             │ │
│  └─────────────────────┘         └────────────────────────────────┘ │
│                                                                     │
│  PORTFOLIO STATE — WORKING BRIEF                                   │
└─────────────────────────────────────────────────────────────────────┘
```

The grid is intentionally asymmetric. It is not a marketplace card wall.

## 4. Project chapter — desktop

```text
┌─────────────────────────────────────────────────────────────────────┐
│ discreet portfolio navigation                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│            FULL-VIEWPORT SIGNATURE PROJECT IMAGE                    │
│                                                                     │
│  BENAHAVÍS · SPAIN                                                  │
│  TIERRA                                                             │
│  VIVA                                                               │
│  one verified positioning line                                      │
│                                                                     │
│  PRIVATE OFFICE · WORKING BRIEF                 EXPLORE PROJECT ↓   │
├─────────────────────────────────────────────────────────────────────┤
│  THE SETTING                 Architecture placed above              │
│                              the Mediterranean.                     │
│                                           two short source-safe     │
│                                           narrative paragraphs      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                       MASTERPLAN / AERIAL                            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ property type │ project status │ expected completion │ area         │
├─────────────────────────────────────────────────────────────────────┤
│ RESIDENCE TYPES                                                     │
│                                                                     │
│ [large Diamante image]        DIAMANTE / 6 bedrooms                 │
│                               ─────────────────────────────── ↗      │
│                               ZAFIRO / 5 bedrooms   [large image]   │
│                               ─────────────────────────────── ↗      │
│ [large Esmeralda image]       ESMERALDA / 4 bedrooms                │
├─────────────────────────────────────────────────────────────────────┤
│ COMMERCIAL BRIEF                                                    │
│ Current terms require confirmation.       source-dated fact ledger  │
└─────────────────────────────────────────────────────────────────────┘
```

## 5. Residence chapter — desktop

```text
┌─────────────────────────────────────────────────────────────────────┐
│ discreet portfolio navigation                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│             SIGNATURE RESIDENCE IMAGE                               │
│                                                                     │
│  TIERRA VIVA · BENAHAVÍS                                           │
│  DIAMANTE                                     ╭──────────────────╮  │
│                                               │ RESIDENCE TYPE   │  │
│                                               │ Diamante         │  │
│                                               │ 6 bedrooms       │  │
│                                               │                  │  │
│                                               │ Confirm terms    │  │
│                                               ╰──────────────────╯  │
├─────────────────────────────────────────────────────────────────────┤
│ OVERVIEW                                                            │
│ Diamante within Tierra Viva.            source-safe description     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [portrait exterior]              [landscape exterior]               │
│                                                                     │
│                                  [landscape living]                 │
│                                                                     │
│              [wide interior / dining / bedroom sequence]            │
│                                                                     │
│ Every image can open into a full-screen architectural viewer.       │
├─────────────────────────────────────────────────────────────────────┤
│ AGENT NOTE                                                          │
│ Beautiful material is not the same thing as live inventory.         │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Full-screen architectural viewer

```text
┌─────────────────────────────────────────────────────────────────────┐
│  03 / 07   LIVING                                      CLOSE ×      │
│                                                                     │
│                                                                     │
│                     [uncropped architecture]                        │
│                                                                     │
│                                                                     │
│  PREVIOUS ‹                                          › NEXT         │
│  Tierra Viva · Diamante                    source/library label      │
└─────────────────────────────────────────────────────────────────────┘
```

Interaction:
- image opens from the gallery object;
- focus moves into the viewer;
- Escape closes;
- Left/Right arrows navigate;
- touch controls remain at least 44px;
- no scroll hijacking;
- background scroll is locked while open;
- reduced-motion mode removes decorative transitions.

## 7. Portfolio index — mobile reprioritisation

Mobile is not desktop stacked mechanically.

Order:
1. compact brand/nav;
2. project context;
3. dominant image;
4. project name + one-line proposition;
5. project entry action;
6. residence types as large image chapters;
7. portfolio-state/source boundary.

Avoid:
- side-by-side fact columns below ~700px;
- tiny captions over images;
- preserving desktop offsets that create dead vertical space.

## 8. State wireframes

### Loading

Use the page's real composition with neutral image fields and ruled text placeholders. Do not introduce generic rounded skeleton cards.

### Missing image

Retain the layout with a quiet ink/paper field:

```text
ARCHITECTURAL MEDIA
Not available in this brief.
```

Never replace missing project media with unrelated stock property.

### Commercial data unavailable

```text
PRICE / AVAILABILITY     Confirm with office
PAYMENT TERMS            Confirm with office
LAST SOURCE CHECK        <date>
```

### Presence lost while browsing

The current screen is immediately covered by the re-lock layer. Protected content must not remain interactable behind a merely decorative warning.

## 9. Page transition principle

The interface should feel continuous:
- portfolio image -> project hero;
- residence image -> residence hero;
- gallery frame -> full-screen viewer.

The same object should appear to persist conceptually even where route navigation prevents literal shared-element animation.
