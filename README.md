<div align="center">

# 🇳🇵 Napiyo

### Nepal Land Measurement & Unit Conversion Utility

**A clean, Nepal-focused land measurement app for converting traditional land units into modern metric/imperial formats with a product-design-first user experience.**

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=111111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Lucide](https://img.shields.io/badge/Icons-Lucide-111111?style=for-the-badge)
![Nepal](https://img.shields.io/badge/Context-Nepal%20Land%20Units-DC143C?style=for-the-badge)

</div>

---

## ✨ Overview

**Napiyo** is a Nepal-focused land measurement and unit conversion utility. It is designed for people who need to convert between traditional Nepali land units and modern measurement systems in a faster, clearer, and more user-friendly way.

Land measurement in Nepal can be confusing because different regions commonly use different systems. Hill regions often use the **Ropani / Aana / Paisa / Daam** system, while Terai regions often use the **Bigha / Kattha / Dhur** system. Many professional and digital workflows also require square feet, square meters, or other standard units.

Napiyo is designed to make this easier through a modern React interface.

---

## 🧭 Table of Contents

- [Why Napiyo Exists](#-why-napiyo-exists)
- [Designer’s Perspective](#-designers-perspective)
- [Core Features](#-core-features)
- [Supported Measurement Systems](#-supported-measurement-systems)
- [Tech Stack](#-tech-stack)
- [Product UX Direction](#-product-ux-direction)
- [Accuracy & Conversion Notes](#-accuracy--conversion-notes)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Quality Checklist](#-quality-checklist)
- [Roadmap](#-roadmap)
- [Credits](#-credits)

---

## 🏔 Why Napiyo Exists

In Nepal, land measurement is not always straightforward.

A single land conversation may include:

- Ropani
- Aana
- Paisa
- Daam
- Bigha
- Kattha
- Dhur
- Square feet
- Square meters

For real estate buyers, landowners, engineers, architects, surveyors, and families discussing property, this can create confusion.

Napiyo exists to reduce that confusion by giving users a clear and modern interface for land unit conversion.

---

## 🎨 Designer’s Perspective

This project is designed from the perspective of a product designer who understands practical front-end implementation.

The product challenge is not only mathematical conversion. The real UX challenge is helping users feel confident about what they are calculating.

A good land measurement tool should:

- make input fields obvious
- explain unit relationships clearly
- reduce conversion anxiety
- work well on mobile
- avoid visual clutter
- show results instantly
- support Nepal-specific mental models
- feel trustworthy enough for property discussions

Because land can involve money, ownership, and legal decisions, the interface should be calm, precise, and transparent.

---

## 🧩 Core Features

| Feature | Description |
|---|---|
| 🇳🇵 Nepal-specific units | Supports traditional Nepali land measurement systems |
| 🔄 Universal conversion | Converts between local and standard measurement units |
| 📱 Responsive UI | Designed for desktop and mobile usage |
| 🧮 Practical calculator flow | Helps users quickly calculate land area values |
| 💾 Save/organize direction | README-level product direction includes saved measurements/history |
| ✨ Modern interface | React + TypeScript + Vite foundation for clean UX |
| 🧠 AI-ready dependency | Includes Google GenAI dependency for possible future helper features |

---

## 📐 Supported Measurement Systems

### Hill System

Commonly used in many hill-region land contexts:

| Unit | Relationship |
|---|---:|
| 1 Ropani | 16 Aana |
| 1 Aana | 4 Paisa |
| 1 Paisa | 4 Daam |

### Terai System

Commonly used in Terai-region land contexts:

| Unit | Relationship |
|---|---:|
| 1 Bigha | 20 Kattha |
| 1 Kattha | 20 Dhur |

### Standard Units

The app direction includes conversion support for modern units such as:

- square feet
- square meters
- other metric/imperial formats where useful

> Conversion values should be verified carefully before using the app for legal, survey, or purchase decisions.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React `18.3.1` | Component-based UI |
| Language | TypeScript `5.x` | Safer conversion logic and app structure |
| Build Tool | Vite `5.x` | Fast local dev and production builds |
| Icons | Lucide React | Clean interface iconography |
| AI Dependency | `@google/genai` | Potential future AI assistant/helper features |

---

## 🧠 Product UX Direction

The app should feel like a practical tool, not a complicated engineering dashboard.

### UX Priorities

- fast input
- instant results
- clear unit labels
- mobile-first readability
- visible conversion steps where needed
- no hidden assumptions
- simple save/history flow
- plain language for non-technical users

### Ideal User Types

- land buyers
- land sellers
- homeowners
- real estate agents
- civil engineers
- architects
- surveyors
- students
- families comparing land plots

---

## ✅ Accuracy & Conversion Notes

Land measurement tools should be treated carefully.

### Important Rule

Napiyo can help users calculate and understand conversions, but official land decisions should always be verified through certified survey data, official documents, or qualified professionals.

### QA Rules for Conversion Logic

- Keep conversion constants in one place.
- Add comments explaining each unit relationship.
- Test both Hill and Terai unit systems.
- Test edge cases like empty input, decimals, and zero values.
- Do not round too aggressively.
- Show enough decimal precision for professional use.
- Avoid silently changing user input.

---

## 📁 Repository Structure

A typical Vite + React + TypeScript structure for this project:

```text
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   ├── utils/
│   └── styles/
└── README.md
```

> The exact internal file names may evolve as the app grows. Keep conversion utilities separate from UI components when possible.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nischhalsubba/Napiyo.git
```

### 2. Move into the project

```bash
cd Napiyo
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

---

## 📜 Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Builds the app for production |
| `npm run preview` | Previews the production build locally |

---

## 🌐 Deployment

Napiyo can be deployed to any static frontend hosting platform:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- Firebase Hosting

Typical build settings:

```text
Build command: npm run build
Output directory: dist
```

---

## ✅ Quality Checklist

### Conversion QA

- [ ] Ropani to Aana conversion is correct.
- [ ] Aana to Paisa conversion is correct.
- [ ] Paisa to Daam conversion is correct.
- [ ] Bigha to Kattha conversion is correct.
- [ ] Kattha to Dhur conversion is correct.
- [ ] Square feet and square meter conversions are verified.
- [ ] Decimal values work correctly.
- [ ] Empty values do not crash the UI.
- [ ] Rounding is consistent and explained.

### UX QA

- [ ] Main conversion flow is understandable within 5 seconds.
- [ ] Mobile layout is easy to use.
- [ ] Unit labels are clear.
- [ ] Results are visually separated from inputs.
- [ ] Error states are friendly.
- [ ] Save/history flows are simple if implemented.

### Technical QA

- [ ] `npm install` works.
- [ ] `npm run dev` works.
- [ ] `npm run build` works.
- [ ] `npm run preview` works.
- [ ] No console errors appear.

---

## 🗺 Roadmap

- Add verified conversion constants documentation.
- Add saved calculation history.
- Add plot comparison mode.
- Add printable/exportable conversion summary.
- Add Nepali language support.
- Add map/measurement integration if needed.
- Add offline/PWA support.
- Add AI assistant for explaining land unit conversions in simple language.
- Add examples for common Nepal land sizes.

---

## 👤 Credits

| Role | Name |
|---|---|
| Designed by | **Nischhal Raj Subba** |
| Coded by | **Nischhal Raj Subba** |

---

<div align="center">

Built for Nepal’s real-world land measurement context. 🇳🇵

</div>
