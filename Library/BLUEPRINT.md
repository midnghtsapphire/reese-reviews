# Blueprint — Reese Reviews

> Stub per revvel-standards. Fill in as architecture decisions are made.

## Purpose
Product review platform (Vite + React + TypeScript, Supabase backend).

## Architecture
- Frontend: Vite, React, shadcn/ui, Tailwind (`src/`)
- Data: Supabase (`supabase/`), local stores (`src/stores/`)
- Optional backend API: Python/FastAPI (`app/`)

## Build / CI / Deploy
- CI: `make ci` (npm ci → typecheck → lint → test → build), run by `.github/workflows/wingit-ci.yml`
- Deploy: `scripts/wingit-deploy.sh` (GitHub Pages via gh-pages branch, dry-run default)
- DigitalOcean deploy: disabled (commented out)

## Security notes
- `VITE_*` env vars ship in the browser bundle; no secrets there.

## Open questions
- TODO
