# KAHVE Theme Update

This frontend package was redesigned into a premium coffee brand style inspired by the provided UI references.

## Main changes

- Reworked Home page into a KAHVE coffee e-commerce landing page.
- Added warm coffee color palette, cream backgrounds, brown/gold accents, rounded cards and soft shadows.
- Redesigned:
  - Home hero slider
  - Category navigation
  - Product cards
  - Product search section
  - Feature strip
  - KAHVE story section
  - Main navigation
  - Welcome page
  - Footer
  - Contact navigation
- Added local assets:
  - `src/assets/images/kahve-products.jpg`
  - `src/assets/images/kahve-hero-mockup.png`
- Cleaned `angular.json` scripts/styles configuration and removed the global VTO script from automatic loading to avoid the missing `jeelizVTOWidget.js` run error.

## Run

From the frontend folder:

```bash
npm install --legacy-peer-deps
npx ng serve --open
```

If you already have `node_modules`, you can try directly:

```bash
npx ng serve --open
```

## Note

The Virtual Try-On feature files are still present. The global script was only removed from `angular.json` to avoid blocking the app startup. We can remove the whole AI/VTO feature in a later phase.
