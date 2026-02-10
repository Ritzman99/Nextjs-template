# Next.js Template

Starter template with Next.js 15 (Turbopack), React 19, TypeScript, Tailwind CSS 4, and common libraries pre-installed.

## Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
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

## Project structure

- `app/` – App Router (layout, page, globals.css)
- `scripts/` – Seed and utility scripts
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` – Config
