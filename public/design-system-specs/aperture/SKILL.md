---
name: aperture-design
description: Use this skill to generate well-branded interfaces and assets for Aperture, an AI-powered health platform (genomics, biomarkers, wearables), either for production or throwaway prototypes/mocks. Contains design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (tokens/, components/, ui_kits/).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Link `styles.css`, load `_ds_bundle.js`, and read components from `window.ApertureDesignSystem_<hash>`. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

Key facts: teal brand accent (`--brand`, #0EA5A0); Fustat display/UI + Geist Mono for numerics; warm off-white canvas, white cards, chunky radii (26px cards), soft shadows + one teal aura per screen; Lucide line icons (CDN); health domains are color-coded (Sleep=indigo, Activity=green, Nutrition=amber, Mindfulness=violet, Vitals=coral, Heart=rose). Voice is warm, second-person, coaching; sentence case; no emoji.

If the user invokes this skill without other guidance, ask what they want to build, ask a few clarifying questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
