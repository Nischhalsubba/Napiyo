# Napiyo

Napiyo is a Nepal-focused land area utility for converting local and global units, estimating plot area from an image, visualizing scale, and saving calculations in the browser.

## What it supports

- Hill system: Ropani, Aana, Paisa, Daam
- Terai system: Bigha, Kattha, Dhur
- Global units: square feet, square metres, square yards, acres, hectares
- Image-based plot estimation with manual scale calibration and polygon tracing
- Local saved history and two-item comparison
- Responsive layouts for phone, tablet, and desktop

> Napiyo is an estimation and learning tool. It does not replace certified survey data, cadastral records, legal documents, or licensed professionals.

## Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4 through the Vite plugin
- Lucide icons
- Browser local storage
- Cloudflare Pages

## Local development

Requirements:

- Node.js 22.16 or newer
- npm 10.9 or newer

```bash
npm install
npm run dev
```

Validation:

```bash
npm run check
npm run build
npm run preview
```

## Cloudflare Pages deployment

Connect this repository to Cloudflare Pages and use:

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Node version: 22.16.0
```

The repository includes:

- `.node-version` to pin the Pages build runtime
- `public/_redirects` for SPA navigation fallback
- `public/_headers` for baseline security and asset caching headers

Cloudflare creates preview deployments for pull requests and deploys production after changes reach `main`.

## Data and privacy

Saved calculations remain in the current browser through local storage. Napiyo does not require an account. Uploaded images are processed in the browser and are not stored by Napiyo. The optional URL import uses the Microlink screenshot service, which is separate from Napiyo and may have its own limits and policies.

## Accuracy notes

Unit conversion factors are deterministic. Image-based measurement can vary because of:

- image perspective and distortion
- inaccurate reference distance
- imprecise boundary tracing
- map screenshots that are not top-down or to scale

Always verify consequential property decisions with official records and qualified professionals.
