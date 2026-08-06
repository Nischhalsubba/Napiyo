<!-- interactive-readme-standard:start -->

<div align="center">

# Napiyo

**Branch-aware technical guide for [`agent/seo-social-preview`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview)**

<p><img alt="branch: agent/seo-social-preview" src="https://img.shields.io/static/v1?label=&message=branch%3A%20agent%2Fseo-social-preview&color=5965F2&style=flat-square"> <img alt="React" src="https://img.shields.io/static/v1?label=&message=React&color=24292F&style=flat-square"> <img alt="Vite" src="https://img.shields.io/static/v1?label=&message=Vite&color=24292F&style=flat-square"> <img alt="Tailwind CSS" src="https://img.shields.io/static/v1?label=&message=Tailwind%20CSS&color=24292F&style=flat-square"> <img alt="TypeScript" src="https://img.shields.io/static/v1?label=&message=TypeScript&color=24292F&style=flat-square"> <img alt="CSS" src="https://img.shields.io/static/v1?label=&message=CSS&color=24292F&style=flat-square"> <img alt="JavaScript" src="https://img.shields.io/static/v1?label=&message=JavaScript&color=24292F&style=flat-square"> <img alt="docs: branch-aware" src="https://img.shields.io/static/v1?label=&message=docs%3A%20branch-aware&color=8250DF&style=flat-square"></p>

<p>
  <a href="https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview"><strong>Browse source</strong></a> ·
  <a href="https://github.com/Nischhalsubba/Napiyo/issues"><strong>Issues</strong></a> ·
  <a href="https://github.com/Nischhalsubba/Napiyo/codespaces/new?ref=agent%2Fseo-social-preview"><strong>Open in Codespaces</strong></a>
</p>

</div>

> [!IMPORTANT]
> This guide is generated from the files actually present on `agent/seo-social-preview`. It links to detected source paths, preserves project-authored notes, and avoids claiming components that were not found.

## At a glance

| Item | Detected value |
|---|---|
| Purpose | A trustworthy, Nepal-focused land unit converter, plot estimator, visualizer, and saved calculation utility. |
| Branch role | Compared with `main` |
| Stack | React, Vite, Tailwind CSS, TypeScript, CSS, JavaScript, HTML |
| Manifests | package.json |
| Prerequisites | Node.js |
| Delivery | GitHub Actions |
| License | No license file detected |

## Branch scope

This branch differs from the default branch in the following detected paths:

- [`README.md`](https://github.com/Nischhalsubba/Napiyo/blob/agent/seo-social-preview/README.md)

## Quick start

```bash
npm install
npm run dev
npm run build
npm run test
npm run preview
```

### Configuration surface

- No committed environment example file was detected.

> Never commit secrets, private keys, production credentials, customer data, or unredacted infrastructure details.

## Repository map

```mermaid
flowchart TD
    ROOT["Napiyo / agent/seo-social-preview"]
    ROOT --> P0[".github/"]
    ROOT --> P1["components/"]
    ROOT --> P2["docs/"]
    ROOT --> P3["lib/"]
    ROOT --> P4["public/"]
    ROOT --> P5["scripts/"]
    ROOT --> P6["seo-assets/"]
    ROOT --> P7["tests/"]
    ROOT --> P8["utils/"]
    ROOT --> P9[".node-version"]
    ROOT --> P10["accessibility.css"]
    ROOT --> P11["AGENTS.md"]
    ROOT --> P12["App.tsx"]
    ROOT --> P13["constants.ts"]
    ROOT --> P14["dark-contrast.css"]
    ROOT --> P15["index.css"]
    ROOT --> P16["index.html"]
    ROOT --> P17["index.tsx"]
    ROOT --> MORE["+ 6 more top-level entries"]
```

| Responsibility | Detected source paths |
|---|---|
| Interface | [`public`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/public), [`components`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/components) |
| Application logic | [`lib`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/lib) |
| Quality | [`tests`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/tests) |
| Documentation | [`docs`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/docs) |
| Delivery | [`.github`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/.github), [`scripts`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/scripts) |

## Website or application map

```mermaid
flowchart TD
    APP["Napiyo"]
    APP --> R0["public"]
```

## Architecture and responsibility flow

```mermaid
flowchart LR
    USER["User / contributor"]
    USER --> A0["Interface: public, components"]
    A0 --> A1["Application logic: lib"]
    A1 --> A2["Quality: tests"]
    A2 --> A3["Documentation: docs"]
    A3 --> A4["Delivery: .github, scripts"]
    A4 --> DELIVERY["Delivery: GitHub Actions"]
```



## Quality, security, and operations

<table>
<tr>
<td width="33%" valign="top">

### Quality

- [`tests`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview/tests)

Detected commands:
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run preview`

</td>
<td width="33%" valign="top">

### Security

- No dedicated security policy or automated dependency configuration was detected.

Review authentication, authorization, input validation, dependency updates, secret handling, and failure recovery before release.

</td>
<td width="34%" valign="top">

### Observability

- No dedicated observability integration was detected automatically.

Define useful logs, metrics, traces, alerts, and rollback signals for production-facing branches.

</td>
</tr>
</table>

## Delivery flow

```mermaid
flowchart LR
    CHANGE["Change on agent/seo-social-preview"] --> CHECK["Tests and quality checks"]
    CHECK --> REVIEW["Review architecture and documentation impact"]
    REVIEW --> BUILD["Build or package"]
    BUILD --> DEPLOY["Deploy or release"]
    DEPLOY --> VERIFY["Verify health and rollback readiness"]
```

### Automation detected

- [`.github/workflows/ci.yml`](https://github.com/Nischhalsubba/Napiyo/blob/agent/seo-social-preview/.github/workflows/ci.yml)
- [`.github/workflows/cloudflare-build.yml`](https://github.com/Nischhalsubba/Napiyo/blob/agent/seo-social-preview/.github/workflows/cloudflare-build.yml)
- [`.github/workflows/quality.yml`](https://github.com/Nischhalsubba/Napiyo/blob/agent/seo-social-preview/.github/workflows/quality.yml)

## Contribution flow

```mermaid
flowchart LR
    FORK["Create branch"] --> CHANGE["Make focused change"]
    CHANGE --> TEST["Run relevant checks"]
    TEST --> DOCS["Update README and diagrams"]
    DOCS --> PR["Open pull request"]
    PR --> REVIEW["Review and iterate"]
    REVIEW --> MERGE["Merge when ready"]
```

- Keep changes focused and explain architectural consequences.
- Run the checks relevant to the changed area.
- Update diagrams whenever routes, modules, data models, authentication, jobs, or delivery paths change.
- Add screenshots or recordings for visual behavior changes when useful.
- Use issues for reproducible defects and pull requests for reviewable changes.

## Ownership and support

| Topic | Source |
|---|---|
| Repository | [`Nischhalsubba/Napiyo`](https://github.com/Nischhalsubba/Napiyo) |
| Branch | [`agent/seo-social-preview`](https://github.com/Nischhalsubba/Napiyo/tree/agent/seo-social-preview) |
| Ownership | No CODEOWNERS file detected |
| Contributing | Use the contribution flow above |
| Support | [Open or review issues](https://github.com/Nischhalsubba/Napiyo/issues) |
| License | No license file detected |

<details>
<summary><strong>Documentation maintenance checklist</strong></summary>

- [ ] Purpose and branch scope are accurate.
- [ ] Setup and configuration commands still work.
- [ ] Repository, application, API, data, authentication, job, and deployment diagrams match the code.
- [ ] Tests, security controls, observability, and rollback behavior are documented.
- [ ] Links point to real files on this branch.
- [ ] No secrets or private operational details are exposed.

</details>

<!-- interactive-readme-standard:end -->

<!-- project-authored-notes:start -->
<details>
<summary><strong>Project-authored notes preserved from this branch</strong></summary>

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

</details>
<!-- project-authored-notes:end -->
