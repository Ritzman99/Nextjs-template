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
| `npm run seed:admin` | Seed admin user |
| `npm run seed:roles` | Seed baseline security roles |

Replace the placeholder logic in `scripts/` with your own seeding when you use this template.

## Role management base

This template includes a scalable role system you can adapt to LMS, ecommerce, or subscription apps.

**Hierarchy**
- Company → Location → Team, with nullable parents. If `companyId` is null, a location is the top-level parent. If `locationId` is null, a team is the top-level parent.

**User fields**
- `companyId`, `locationId`, `teamId`, `securityRoleId` (all nullable) are attached to users for fast scoping.
- `roleAssignments` embeds per-scope assignments and optional permission overrides.

**Security roles**
- Roles define section/action permissions with optional conditions for dynamic access.
- Seed example roles with `npm run seed:roles` and customize in `scripts/seedSecurityRoles.cjs`.

**App mappings**
- LMS: company=school, location=classroom/team, team=study group; roles Owner/Teacher/Student.
- Ecommerce: no org hierarchy; single Admin role.
- Recipe: no company/location; team is family group; roles FreeUser/PremiumUser/AdminUser/ModeratorUser/PayrollUser.

## Styling

All CSS comes from **compiled Sass** only: the global entry `app/globals.scss` (which loads `scss/main.scss`: themes, base, layout, utilities, global component classes, vendors) and **component module Sass** files colocated with components (`ComponentName.module.scss` next to `ComponentName.tsx`). Use `@use 'abstracts/theme-variables'` or `@use 'abstracts/variables'` in module files (see `next.config.ts` `sassOptions.includePaths`).

## Project structure

- `app/` – App Router (layout, page, globals.scss, page.module.scss)
- `scss/` – Global Sass (themes, base, layout, utilities, components, vendors)
- `scripts/` – Seed and utility scripts
- `next.config.ts`, `tsconfig.json` – Config
