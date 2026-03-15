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

1. **Read this entire file.**
2. **Assess the repo state.** Run the commands in the "Assess Repo State" section below. Understand what exists, what works, what is broken, and what is missing.
3. **Check for a HANDOFF.md or TODO.md.** If one exists, it was left by the last agent or human. Follow its instructions as your primary task list.
4. **Check open issues and PRs.** If there are open issues, they are your task list.
5. **If no handoff, no issues, and no explicit instructions:** analyze the codebase, identify what is incomplete or broken, fix it, and ship it.

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
