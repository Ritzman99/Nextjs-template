# Next.js Template

Starter template with Next.js 15 (Turbopack), React 19, TypeScript, custom Sass, and common libraries pre-installed.

## Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Custom Sass** (global `scss/` bundle + colocated `*.module.scss` per component)
- **NextAuth** + MongoDB adapter
- **Mongoose**
- **AWS S3** (client + presigner)
- **TipTap** (rich text)
- **React Three Fiber** + Drei + Three.js
- **Lucide React**, **date-fns**, **react-select**, **react-big-calendar**, **emoji-picker-react**, **uuid**, **bcryptjs**, **fast-xml-parser**, **dotenv**

## Setup

```bash
cp .env.example .env
# Edit .env with your NEXTAUTH_SECRET, MONGODB_URI, etc.

npm install
npm run dev
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed board games |
| `npm run seed:ts` | Seed Red Dragon Inn (TS) |
| `npm run seed:tools` | Seed tools |
| `npm run seed:alpha-news` | Seed alpha feature channel + articles |

Replace the placeholder logic in `scripts/` with your own seeding when you use this template.

## Styling

All CSS comes from **compiled Sass** only: the global entry `app/globals.scss` (which loads `scss/main.scss`: themes, base, layout, utilities, global component classes, vendors) and **component module Sass** files colocated with components (`ComponentName.module.scss` next to `ComponentName.tsx`). Use `@use 'abstracts/theme-variables'` or `@use 'abstracts/variables'` in module files (see `next.config.ts` `sassOptions.includePaths`).

## Project structure

- `app/` – App Router (layout, page, globals.scss, page.module.scss)
- `scss/` – Global Sass (themes, base, layout, utilities, components, vendors)
- `scripts/` – Seed and utility scripts
- `next.config.ts`, `tsconfig.json` – Config
