# AGENTS.md — Universal AI Agent Instructions

<!--
  MIDNGHTSAPPHIRE UNIVERSAL REPO INSTRUCTIONS
  Owner: Audrey Evans (@midnghtsapphire)
  
  This file is read automatically by:
  - Claude Code (also reads CLAUDE.md symlink)
  - GitHub Copilot Coding Agent
  - OpenAI Codex / ChatGPT
  - Cursor (.cursorrules symlink)
  - Google Jules (GEMINI.md symlink)
  - Windsurf (.windsurfrules symlink)
  - Cline (.clinerules symlink)
  - Devin (reads repo files including AGENTS.md automatically)
  - Aider, Amp, Replit, and others
  
  SETUP: Run this once per repo to create symlinks:
  
  ln -sf AGENTS.md CLAUDE.md
  ln -sf AGENTS.md .cursorrules
  ln -sf AGENTS.md .windsurfrules
  ln -sf AGENTS.md .clinerules
  mkdir -p .github && ln -sf ../AGENTS.md .github/copilot-instructions.md
-->

## Prime Directive

Ship working, tested code. Not plans. Not proposals. Not summaries of what you would do. Working code, pushed to this repo.

## Ownership

All code in this repository belongs to Audrey Evans, operating under the MIDNGHTSAPPHIRE GitHub organization. All work product you generate belongs to her. Do not add licenses, contributor agreements, or attribution headers without explicit instruction.

## First Steps — Before Writing Any Code

> ⚠️ **This repository uses a mandatory backlog + handoff protocol.** Skipping steps 3–4 is the #1 cause of incomplete work.

1. **Read this entire file.**
2. **Assess the repo state.** Run the commands in the "Assess Repo State" section below.
3. **Read `docs/scrum/HANDOFF.md`** — always. It tells you what the last agent did and what's next.
4. **Read `docs/BACKLOG.md`** — pick the highest-priority `To Do` item. Update its status to `In Progress` with today's date.
5. **Check open issues and PRs.** If there are open issues, cross-reference them with the backlog.
6. **If no backlog item applies to your task:** add a new item to `docs/BACKLOG.md` Inbox section before writing any code.
7. **Before ending your session:** update the backlog item status and update `docs/scrum/HANDOFF.md` with what you did and what's next.

> See `docs/AGENT_COMPLETION_GUIDE.md` for the complete protocol and why it matters.

## Assess Repo State

Run these commands (adapt to your runtime) to understand what you are working with:

```bash
# What exists?
find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.next/*' -not -path './dist/*' -not -path './.venv/*' | head -100

# Tech stack?
cat package.json 2>/dev/null || cat requirements.txt 2>/dev/null || cat Cargo.toml 2>/dev/null || echo "No manifest found"

# What is this project?
cat README.md 2>/dev/null | head -50

# Tests pass?
npm test 2>/dev/null || python -m pytest 2>/dev/null || cargo test 2>/dev/null || echo "No test runner"

# Build succeeds?
npm run build 2>/dev/null || cargo build 2>/dev/null || echo "No build script"

# Env vars needed?
cat .env.example 2>/dev/null || echo "No env template"

# Last work done?
git log --oneline -10 && git status && git branch -a
```

## How to Work

- **Execute autonomously.** Do not ask for permission or confirmation unless genuinely ambiguous with multiple valid interpretations.
- **One iteration, all-inclusive.** Deliver the complete solution. Do not propose "Phase 1" or "MVP first" unless explicitly told to.
- **Fix what is broken before adding what is new.** If tests fail, fix them first. If the build is broken, fix it first.
- **Write tests.** Every functional component gets a test. Run tests before declaring anything complete.
- **Commit frequently.** Small, descriptive commits. Not one giant commit at the end.
- **Leave the codebase better than you found it.** If you touch a file, clean it up. Fix obvious bugs. Remove dead code.

## Commit Messages

```
<type>: <short description>

Types: feat, fix, refactor, test, docs, chore, style
Examples:
  feat: add dark mode toggle to settings page
  fix: resolve auth token refresh race condition
  test: add unit tests for payment processing
  chore: update dependencies to latest stable
```

## Code Standards

- **FOSS first.** Use open-source tools and libraries. Do not introduce paid dependencies, proprietary SDKs, or vendor-locked services without explicit approval.
- **No credentials in code.** API keys, tokens, passwords, and secrets go in environment variables. Never commit `.env` files. If a `.env.example` exists, keep it updated with placeholder values.
- **TypeScript over JavaScript** when the project uses TypeScript. Strict mode. No `any` types.
- **Python:** Type hints on all functions. Use `ruff` for formatting if available.
- **Comments:** Only for non-obvious logic. No boilerplate comments like `// Import dependencies` or `# Initialize variables`.
- **Error handling:** Never swallow errors silently. Log them or propagate them.

## Tech Stack Defaults

When the repo does not have an established stack, use these defaults:

| Layer | Default |
|-------|---------|
| Cross-platform apps | Expo (React Native) + TypeScript + NativeWind (Tailwind) |
| Web-only apps | React + TypeScript + Vite + Tailwind |
| Backend / API | Node.js (Express or Fastify) or Python (FastAPI) |
| Database | PostgreSQL (via Supabase or direct) |
| ORM | Prisma (Node) or SQLAlchemy (Python) |
| Auth | Supabase Auth or custom JWT |
| Hosting | DigitalOcean (Droplets or App Platform) |
| CI/CD | GitHub Actions |
| App builds | Expo EAS Build (no local Xcode/Android Studio needed) |
| Package manager | pnpm (Node) or pip (Python) |

### Cross-Platform Framework: Expo (React Native)

All apps targeting mobile (iOS + Android) MUST use Expo with React Native. This is non-negotiable.

**Why Expo:**
- Same React + TypeScript + Tailwind stack used across all projects
- One codebase compiles to native iOS, native Android, and web
- EAS Build handles App Store / Play Store builds in the cloud — no Xcode or Android Studio required
- Over-the-air updates via EAS Update (push fixes without app store review)
- Expo Router for file-based navigation (like Next.js but for native)
- NativeWind for Tailwind CSS styling in React Native
- Expo has an MCP server for AI coding tools (Claude Code, Cursor)

**Standard Expo Stack:**
```
expo (latest SDK)
expo-router          # File-based routing
nativewind           # Tailwind CSS for React Native
react-native-reanimated  # Animations
expo-image           # Optimized images
expo-secure-store    # Secure credential storage
@supabase/supabase-js    # Backend (when using Supabase)
```

**Creating a new cross-platform project:**
```bash
npx create-expo-app@latest ProjectName --template blank-typescript
cd ProjectName
npx expo install nativewind tailwindcss
npx expo start
```

**Building for stores:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure builds
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**DO NOT use:**
- Flutter (requires Dart — different language, less AI training data)
- Ionic/Cordova (WebView wrapper, not native)
- Xamarin/.NET MAUI (C# ecosystem, not our stack)
- Separate native iOS + Android codebases (double the work)

If the repo already uses something different, use what is already there. Do not migrate stacks mid-project.

## Security

- Never expose secrets, API keys, or tokens in code, commits, logs, or responses.
- Never commit `.env` files. Ensure `.env` is in `.gitignore`.
- All API endpoints must have authentication unless explicitly public.
- Sanitize all user inputs.
- If you find a security vulnerability while working, fix it immediately and note it in your commit message.

## Secrets Management — Doppler

All secrets for MIDNGHTSAPPHIRE projects are managed in **Doppler** (https://dashboard.doppler.com). The full standard lives at `growlingeyes/standards/08_SECRETS_MANAGEMENT_STANDARD.md`.

### Rules for Agents

1. **Never hardcode secrets.** All API keys, tokens, passwords, and connection strings live in Doppler. Reference them via environment variables at runtime.
2. **Never commit `.env` files.** The `.env.example` file documents which variables exist — but real values come from Doppler.
3. **Never put secret values in documentation.** Use `[REDACTED — managed in Doppler: project/config]` as the placeholder.
4. **When you need a secret value:** Use the Doppler MCP server (`doppler` MCP) if available, or the Doppler CLI (`doppler secrets get SECRET_NAME`). Do NOT ask the human to paste secrets into chat.
5. **When you need to ADD a new secret:** Use the Doppler MCP server or CLI to set it: `doppler secrets set SECRET_NAME=value`. Then update `.env.example` with a placeholder for the new variable.
6. **When you need to ROTATE a secret:** Generate the new value, set it in Doppler, and Doppler auto-syncs to all connected services. Log the rotation in your commit message.
7. **If Doppler is not accessible:** Document what secret is needed and why, add a `[BLOCKED: needs Doppler access]` note, and continue with other work that doesn't require the secret.

### Doppler Project Map

| Repo | Doppler Project | Environments |
|---|---|---|
| growlingeyes | `growlingeyes` | dev · stg · prd |
| neurooz | `neurooz` | dev · stg · prd |
| reese-reviews | `reese-reviews` | dev · stg · prd |

### How Secrets Flow

```
Doppler Dashboard (single source of truth)
    │
    ├──► GitHub Actions secrets (auto-synced)
    ├──► DigitalOcean App Platform env vars (auto-synced, reese-reviews)
    ├──► Supabase Edge Function secrets (auto-synced, neurooz)
    ├──► Droplet runtime via `doppler run` (growlingeyes)
    └──► Agent access via Doppler MCP server or CLI
```

### Running Locally with Doppler

```bash
# Install Doppler CLI (one time)
curl -Ls https://cli.doppler.com/install.sh | sudo sh

# Login (one time)
doppler login

# Link this repo to its Doppler project (one time per repo)
doppler setup  # Interactive — select project and config

# Run any command with secrets injected
doppler run -- npm run dev
```

## Problem-Solving — Creative Autonomy

Audrey is a solo developer in cancer treatment with AUDHD. She cannot do manual CLI work, SSH, or copy-paste operations. **You are her hands.** This means:

### Think Like an Engineer, Not a Chatbot

When you hit a blocker, do NOT immediately ask the human. Instead:

1. **Investigate first.** Read logs, check configs, search docs, inspect the codebase. Most answers are already in the repo or on the internet.
2. **Try multiple approaches.** If approach A fails, try B, then C. Document what you tried.
3. **Use your tools creatively.** You have a browser, a shell, file access, MCP servers, and API access. Combine them in unexpected ways to solve problems.
4. **Build the infrastructure you need.** If a script doesn't exist, write one. If a workflow is missing, create it. If a config file is wrong, fix it. You have permission to improve the repo.
5. **Automate the manual step.** If something "requires manual intervention," figure out how to automate it. Write a script, create a GitHub Action, use an API. The goal is zero manual work for the human.

### When You Discover a Problem

Don't just report it — fix it. Or if you can't fix it, create an actionable plan:

1. **Describe** what's wrong (with evidence — logs, screenshots, error messages)
2. **Diagnose** the root cause (not just the symptom)
3. **Propose** 2-3 concrete solutions ranked by effort vs. impact
4. **Implement** the best solution if it's safe and reversible
5. **Document** what you did in your commit message and HANDOFF.md

### Resourcefulness Checklist

Before asking the human for help, verify you've tried:

- [ ] Read all relevant docs in the repo (`HANDOFF.md`, `standards/`, `docs/`)
- [ ] Searched the codebase for similar patterns or prior solutions
- [ ] Checked git history for how similar issues were solved before
- [ ] Looked up official documentation for the tool/service/API
- [ ] Tried the Doppler MCP server or CLI for secret access
- [ ] Checked available MCP integrations for relevant tools
- [ ] Attempted at least 2 different approaches to the problem
- [ ] Searched the web for the specific error message or pattern

### Permanent Solutions Over Temporary Fixes

When you solve a problem, make it permanent:

- **Save credentials** to Doppler (not just in your session)
- **Write scripts** for recurring manual tasks
- **Update AGENTS.md** or standards with new knowledge
- **Create GitHub Actions** for automated checks
- **Update `.env.example`** when you discover new required variables
- **Add to HANDOFF.md** so the next agent doesn't hit the same blocker

## What NOT to Do

- **Do not ask unnecessary questions.** If the task is clear, execute it.
- **Do not propose phases.** Deliver the complete solution in one pass.
- **Do not hallucinate progress.** If something failed, say it failed. Show the error.
- **Do not suggest paid tools** when free alternatives exist.
- **Do not skip tests.** Write them. Run them. Fix failures.
- **Do not create placeholder files** with `// TODO: implement` unless told to scaffold.
- **Do not rewrite working code** unless broken, insecure, or asked to refactor.
- **Do not add a LICENSE file** unless explicitly asked.

## When You Are Done

Before declaring work complete:

1. All tests pass.
2. The build succeeds (if applicable).
3. No linter errors (if a linter is configured).
4. All changes are committed with descriptive messages.
5. If there is remaining work, create a `HANDOFF.md` with:
   - What you completed
   - What remains
   - Known issues or blockers
   - Exact next steps for the next agent or human

## Multi-Agent Coordination

Multiple AI agents may work on this repo (Devin, Copilot, Claude Code, etc.). To avoid conflicts:

- **Devin** creates branches named `devin/<id>-<description>` and opens PRs as `devin-ai-integration[bot]`. Check open Devin PRs before starting overlapping work.
- **Copilot Coding Agent** creates branches named `copilot/...`. Check open Copilot PRs similarly.
- **Before starting work:** Run `git fetch --all && git branch -r | grep -E 'devin/|copilot/'` to see active agent branches.
- **SHIP_STATUS.md** tracks all active workstreams. If another agent has a workstream `active` or `implementing`, do not start the same work.
- **ASSUMPTIONS.md** contains assumptions from previous agent sessions. Read it. Do not contradict existing assumptions without good reason.

## Project-Specific Context

### What This Project Is
Sessiono — session musician subscription platform. Users browse, book, and pay session musicians. Musicians list their services, set rates, and manage bookings.

### Architecture
```
app/                    # Expo Router file-based routing
  (tabs)/               # Bottom tab navigation
    index.tsx           # Home — browse featured musicians
    search.tsx          # Search by instrument/genre
    bookings.tsx        # My bookings list
    profile.tsx         # User profile + subscription
  auth/login.tsx        # Login/signup modal
  musician/[id].tsx     # Musician detail + booking
components/             # Reusable UI components
lib/supabase.ts         # Supabase client with SecureStore
constants/              # Theme, config
```

### Key Commands
```bash
npx expo start          # Dev server (scan QR with Expo Go)
npx expo start --web    # Web dev server
eas build --platform all  # Build for iOS + Android
eas submit --platform ios  # Submit to App Store
```

### Current State
- UI scaffolding complete with dark cinematic theme
- Demo data in place — needs Supabase integration
- Auth screen built — needs Supabase auth wiring
- Stripe subscription integration not started
- Musician profile photos not implemented (use expo-image)
- Push notifications not implemented
- Search is static — needs Supabase full-text search
