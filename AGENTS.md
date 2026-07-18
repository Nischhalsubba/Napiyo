# Repository Instructions

## Product

Napiyo is a Nepal-focused land area utility. Preserve conversion accuracy, plain-language explanations, mobile usability, and the legal-survey disclaimer.

## Setup

```bash
npm install
npm run dev
```

## Commands

```bash
npm run check
npm run build
npm run preview
```

## Conventions

- Use strict TypeScript and semantic React components.
- Keep conversion factors in `constants.ts` and conversion logic in `utils/conversions.ts`.
- Keep screens keyboard accessible and mobile-first.
- Use the design tokens defined in `index.css` instead of adding one-off colours.
- Use Lucide icons rather than emoji or text symbols for interface actions.
- Write direct, specific microcopy. Do not imply AI or automatic detection unless the feature genuinely performs it.
- Treat image-based plot results as estimates and show the disclaimer near the result.

## Testing and verification

- Run `npm run check` after TypeScript changes.
- Run `npm run build` before opening a pull request.
- Verify converter math with at least 1 Ropani, 1 Aana, 1 Bigha, and 1 Kattha.
- Verify phone layouts around 320 px and 390 px widths.
- Verify keyboard focus, dialogs, upload errors, saved-item deletion, and comparison selection.

## Do not

- Do not add Vercel-specific configuration.
- Do not expose API keys in the Vite client bundle.
- Do not replace reliable manual measurement with fake automatic detection.
- Do not remove the legal and accuracy disclaimers.
