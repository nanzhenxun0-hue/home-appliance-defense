# 家電タワーディフェンス (Home Appliance Tower Defense)

## Overview
A Japanese-language tower defense game built with React, TypeScript, and Vite. Players defend a town using home appliances against demonized appliance enemies.

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5 (port 5000)
- **UI**: Tailwind CSS, Radix UI components, shadcn/ui
- **Routing**: React Router v6
- **State/Data**: TanStack React Query
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

## Project Structure
- `src/` — Main source code
  - `App.tsx` — Root app with routing
  - `pages/` — Page components (Index, NotFound)
  - `components/` — Shared UI components
  - `game/` — Game logic and components
  - `hooks/` — Custom React hooks
  - `lib/` — Utilities
  - `assets/` — Static assets

## Running the App
- **Dev server**: `npm run dev` (port 5000)
- **Build**: `npm run build`

## Replit Setup Notes
- Migrated from Lovable to Replit
- `lovable-tagger` removed from vite config (dev-only Lovable plugin)
- Vite server configured to bind to `0.0.0.0` on port 5000 with `allowedHosts: true` for Replit proxy compatibility
