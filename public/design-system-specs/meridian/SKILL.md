---
name: meridian-design
description: Use this skill to generate well-branded interfaces and assets for Meridian, a dark, data-forward gamified health & longevity product (sleep / recovery / strain rings, gamified plans, bio-age healthspan). Use for production UI or throwaway prototypes, mocks, and slides. Contains design guidelines, colors, type, fonts, assets, and a full component + UI-kit library.
user-invocable: true
---

Read `README.md` in this skill first — it is the design guide and component manifest — then explore the other files.

- **Tokens:** link `styles.css` (it `@import`s everything). All colors, type, spacing, radii, shadows, glows and keyframes are CSS custom properties (dark canvas, electric-mint brand, recovery/strain/sleep/stress channels).
- **Components:** React primitives under `components/*`, compiled to `_ds_bundle.js` and exposed on `window.MeridianDesignSystem_0f3f3a`. Read each component's `.prompt.md` for usage. Icons use **Lucide** via CDN — include the Lucide UMD script.
- **UI kit:** `ui_kits/app/` is an interactive mobile recreation — a reference for composing screens.
- **Foundations:** `guidelines/*.card.html` are specimen cards for colors, type, spacing and brand.

If creating **visual artifacts** (slides, mocks, throwaway prototypes), copy the assets you need out and produce self-contained static HTML for the user to view. If working on **production code**, copy assets and follow the rules here to design as an expert in the Meridian brand.

If invoked with no further guidance, ask the user what they want to build, ask a few focused questions, then act as an expert designer who outputs HTML artifacts _or_ production code as needed. Keep the voice second-person and evidence-led; never use emoji; carry status through color and Lucide glyphs, not decoration.
