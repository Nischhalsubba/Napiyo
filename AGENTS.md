# Repository Instructions

## Setup

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Product scope

Napiyo is a Nepal-focused land-unit conversion and visual measurement prototype. It converts Hill, Terai, and international units, supports local saved history, and includes a manually calibrated image-tracing workflow for approximate plot-area measurement.

## Key files

- `App.tsx`: top-level screen routing and saved-item state.
- `components/ConvertScreen.tsx`: conversion inputs and results.
- `components/MeasureScreen.tsx`: image loading, calibration, polygon tracing, and report flow.
- `components/SavedScreen.tsx`: local history.
- `components/VisualizeScreen.tsx`: area comparison and visualization.
- `utils/conversions`: unit conversion and polygon calculations.
- `constants`: supported units and conversion factors.
- `lib/storage`: browser persistence.
- `docs/images/napiyo-readme-hero.svg`: repository presentation asset.

## Accuracy rules

- Keep one documented internal base unit for conversions.
- Do not change a conversion constant without a cited source and verification date.
- Treat Smart Measure output as an estimate.
- Keep manual calibration visible and editable.
- Do not describe prototype scale placement as computer vision.
- Never represent calculated output as certified survey, cadastral, legal, tax, or ownership evidence.

## Engineering conventions

- Keep conversion functions pure and testable.
- Keep display formatting separate from numeric conversion.
- Preserve deterministic calculations for identical inputs.
- Validate image dimensions, calibration distance, and polygon point count.
- Avoid storing large uploaded image data in local history without an explicit storage policy.
- Keep external screenshot-service failures recoverable through manual upload.

## Accessibility and UX

- Keep all unit inputs labeled.
- Make keyboard focus visible.
- Do not communicate measurement state through color alone.
- Provide text instructions for calibration and polygon closure.
- Test the fixed-height shell and floating dock on narrow mobile screens.
- Replace browser alerts and confirms with accessible dialogs when practical.

## Verification

Before meaningful changes:

1. Run `npm run build`.
2. Test representative Hill, Terai, and global conversions.
3. Test zero, negative, decimal, and very large inputs.
4. Test manual image upload.
5. Test failed URL extraction.
6. Test calibration and polygon closure.
7. Compare a known rectangle against an independently calculated area.
8. Test saving and deleting history.
9. Review desktop and mobile layouts.

## Do not

- Do not claim legal or survey accuracy.
- Do not advertise an AI feature unless active code supports it.
- Do not hard-code unexplained conversion constants.
- Do not present the README hero as a browser screenshot.
- Do not publish user land images or location data without a privacy model.