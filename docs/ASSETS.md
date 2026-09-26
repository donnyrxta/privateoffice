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
