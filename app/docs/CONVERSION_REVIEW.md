# Napiyo land measurement review protocol

Napiyo provides practical unit conversion, plot estimation and display. It is **not** a survey certificate, legal boundary determination or substitute for a licensed land professional. All contributors must distinguish mathematical conversions from assumptions about a physical parcel.

## Source of truth

- Identify the unit and its geographic convention before editing a conversion constant.
- Record the original formula or authoritative reference for the unit relationship.
- Separate the internal calculation precision from the rounded display value.
- Preserve exact user input for review and make the selected source/target units visible.
- Do not silently change an existing factor because another convention exists: document the applicability and migration impact first.

## Regression matrix

| Input | Expected review |
| --- | --- |
| Zero | Deterministic zero, without NaN, Infinity or negative-zero visual artifacts |
| Negative values | Validated or rejected clearly according to the input's domain |
| Very small decimals | Appropriate precision without unexplained rounding to zero |
| Large values | No overflow/unsafe truncation; readable digit grouping |
| Inverse conversion | Convert A → B → A and compare within the documented tolerance |
| Missing/invalid input | Specific error and clear recovery, no misleading output |
| Local units | Ropani/aana/paisa/daam and bigha/kattha/dhur are labelled unambiguously where supported |
| Saved calculations | Reopened values retain source units, inputs and documented rounding |
| Accessibility | Keyboard operation, labels, contrast, zoom and result announcements |

A test for round-trip invariance should use the **canonical numeric values**, not the already-rounded text.

## Run automated checks

From the maintained \`app/\` directory, with the package's Node version:

~~~bash
npm install
npm run check
npm run test
npm run build
~~~

For user interaction changes, run \`npm run test:e2e\` after installing the required Playwright browsers and capture the environment and result. \`npm run build\` itself runs typechecking and unit tests. Do not claim browser verification solely from a successful build.

## Product copy and review evidence

Explain the source unit, target unit, numeric precision and assumptions in the UI. Avoid describing an estimate as a cadastral or legal measurement. A PR changing factors must include a table of before/after calculations, source reference, relevant region/convention, test cases, known uncertainties and any stored-data compatibility impact.

## Rollback plan

A faulty factor may alter user decisions: revert the narrow change, retain evidence of which results were affected, and flag recalculation of any affected saved estimates. Never silently overwrite original user-entered values.
