# Asset provenance

Connected Canva material inspected for Private Office includes:

- Folder `FAFnNqCSiZA` — **TierraViva Diamente Villa_jpg**
- Asset `MAFnNhJ_TxE` — `DG.AL_Diamente Villa Ext 1.jpg`, original metadata 6000 × 3636
- Additional Tierra Viva Esmeralda/Zafiro, DG1 and DaVinci folders are present in the connected Canva library.

The runtime hero is a web-optimized derivative of the matching higher-resolution Tierra Viva render supplied with the Private Office source package. The connected Canva asset remains the provenance reference; the local derivative avoids an external CDN dependency in the arrival platform.

The large `docs/reference/house-animation-reference.mp4` is a design reference only and is not required by the application runtime. It is omitted from this GitHub source import.

Runtime file: `public/assets/villa-exterior.webp`. The render is treated as architectural marketing material, not evidence of current property availability or a current sales mandate.


## Hero quality rule

The 420×246 `public/assets/villa-exterior.webp` derivative is not suitable for a full-bleed hero and must not be used there. The original source package contains `villa-exterior.jpg` at 2000×1171 and the connected Canva Tierra Viva source is higher resolution. The landing/residences runtime has been restored to the original high-resolution DarGlobal CDN render used by the earlier design. A future local replacement must be generated from the 2000 px/Canva original, never from the 420 px derivative.


## Portfolio experience sources

The authenticated portfolio experience is built from the existing Tierra Viva source library rather than invented stock property.

Connected Canva folders used to verify source coverage:

- `FAFnNqCSiZA` — TierraViva Diamante Villa JPG
- `FAFnNzU9ibc` — TierraViva Zafiro Villa JPG
- `FAFnN2fIZnU` — Tierra Viva Esmeralda Villa pix
- `FAFnN_lBXaI` — Tierra Viva Masterplan pix

Verified Canva masters include:

- Diamante exterior: 6000×3636
- Diamante exterior panoramic: 6658×3000
- Diamante kitchen/dining: 9060×3000
- Diamante living: 7410×3000
- Diamante master bedroom: 6000×3000

The connected Canva API currently exposes asset metadata and thumbnails, not a safe original-binary transfer path into this repository. Runtime portfolio imagery therefore uses matching official DarGlobal CDN media instead of low-resolution Canva thumbnails. Do not replace these with Canva thumbnail URLs.

Project facts in `lib/portfolio.ts` are source-dated and intentionally exclude price, unit availability, payment plans and investment-return claims. The UI marks those as confirmation-required.

The presence of project media in Canva or this repository is not evidence of current unit availability, commercial terms, a sales mandate or developer affiliation.

## 27 September 2026 restoration

Recovered the original 2000 × 1171 JPEG from the existing local project at `property-private-office/public/assets/villa-exterior.jpg`. Generated `villa-hero-{720,1280,2000}.webp` at quality 90, without upscaling; homepage and Diamante/project heroes now use local responsive sources. This removes the external-CDN dependency for the primary image. Other gallery views retain their source-matched official CDN URLs; no thumbnail or unrelated image is substituted. Homepage composition restored from commit `8b4760a`, with the current public property / private agent workflow required by the user.


## Canva portfolio asset registry

The following IDs were re-checked against the connected Canva library during the portfolio interaction pass.

### Tierra Viva — Diamante

Folder: `FAFnNqCSiZA`

| Canva asset ID | Filename |
|---|---|
| `MAFnNhJ_TxE` | DG.AL_Diamente Villa Ext 1.jpg |
| `MAFnNjbu7Do` | DG.AL_Diamente Villa Ext 2.jpg |
| `MAFnNsNYi1c` | DG.AL_Diamente Villa Ext 3.jpg |
| `MAFnNphIP-M` | DG.AL_Diamente Villa_ID_Dining.jpg |
| `MAFnNgT7WH8` | DG.AL_Diamente Villa_ID_Kitchen Dining.jpg |
| `MAFnNigjZe4` | DG.AL_Diamente Villa_ID_Living.jpg |
| `MAFnNlbgXUw` | DG.AL_Diamente Villa_ID_MasterBedroom.jpg |

The Canva API reports `MAFnNhJ_TxE` as a 6000×3636 original.

### Tierra Viva — Zafiro

Folder: `FAFnNzU9ibc`

| Canva asset ID | Filename |
|---|---|
| `MAFnN3U-GyY` | DG.AL_Zafiro Villa_Ext 1.jpg |
| `MAFnN6VzrqM` | DG.AL_Zafiro Villa_Ext 2.jpg |
| `MAFnN0qmrTQ` | DG.AL_Zafiro Villa_Int_Dining.jpg |
| `MAFnN4GSXsk` | DG.AL_Zafiro Villa_Int_Living Kitchen.jpg |
| `MAFnN6vrKSI` | DG.AL_Zafiro Villa_Int_Living.jpg |
| `MAFnNywqzmk` | DG.AL_Zafiro Villa_Int_MasterBedroom.jpg |

### Tierra Viva — Esmeralda

Folder: `FAFnN2fIZnU`

| Canva asset ID | Filename |
|---|---|
| `MAFnNonr9IQ` | DG.AL_Esmeralda Villa_Ext 1.jpg |
| `MAFnNtRvN-A` | DG.AL_Esmeralda Villa_Ext 2.jpg |
| `MAFnNsTi0LU` | DG.AL_Esmeralda Villa_Ext 3.jpg |
| `MAFnNg2MqM8` | DG.AL_Esmeralda Villa_Int_Balcony.jpg |
| `MAFnNupiey0` | DG.AL_Esmeralda Villa_Int_Dining Kitchen.jpg |
| `MAFnNpAHLys` | DG.AL_Esmeralda Villa_Int_Living Terrace.jpg |
| `MAFnNtuIoM8` | DG.AL_Esmeralda Villa_Int_Living.jpg |
| `MAFnN0Mv82Y` | DG.AL_Esmeralda Villa_Int_MasterBedroom.jpg |

### Tierra Viva — masterplan / aerial

Folder: `FAFnN_lBXaI`

| Canva asset ID | Filename |
|---|---|
| `MAFnN-O-S_s` | DG.AL_TierraViva Aerial 1.jpg |
| `MAFnN0KRLMk` | DG.AL_TierraViva Aerial 2.jpg |
| `MAFnN51E-Rc` | DG.AL_TierraViva Aerial 3.jpg |

These IDs are provenance references. Do not embed temporary Canva thumbnail URLs in production.
