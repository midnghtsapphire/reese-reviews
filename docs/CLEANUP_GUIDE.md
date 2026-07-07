# CLEANUP_GUIDE.md — Removing Third-Party AI Platform Artifacts

This guide provides step-by-step instructions for removing artifacts left by AI coding platforms from your codebase. Run `scripts/audit-third-party.sh` first to identify what is present.

---

## Table of Contents

1. [Manus Cleanup](#manus-cleanup)
2. [Lovable Cleanup](#lovable-cleanup)
3. [Bolt Cleanup](#bolt-cleanup)
4. [Replit Cleanup](#replit-cleanup)
5. [Cursor Cleanup](#cursor-cleanup)
6. [Verifying Cleanup](#verifying-cleanup)
7. [Post-Cleanup Checklist](#post-cleanup-checklist)

---

## Manus Cleanup

Manus artifacts fall into three categories: **billing proxy** (critical), **tracking/session replay** (high), and **branding/types** (low). Address them in that order.

### Step 1 — Remove the billing proxy

The most urgent issue is `forge.manus.ai` (or `forge.manus.im`) in your server code. Every LLM call routed through this URL is being billed by Manus _in addition to_ your underlying LLM provider (OpenAI, Anthropic, etc.).

```bash
# Find all files containing the proxy URL
grep -rn "forge\.manus\.ai\|forge\.manus\.im" . --include="*.ts" --include="*.js"
```

For each occurrence, replace the Manus proxy call with a direct call to the LLM provider:

**Before (Manus proxy):**

```typescript
const response = await fetch(
  `${process.env.BUILT_IN_FORGE_API_URL}/v1/chat/completions`,
  {
    headers: { Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}` },
    // ...
  }
);
```

**After (direct call):**

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
  // ...
});
```

### Step 2 — Remove Manus credentials

Remove `forgeApiUrl` and `forgeApiKey` from your server environment config:

```bash
# Find all credential references
grep -rn "BUILT_IN_FORGE\|VITE_FRONTEND_FORGE\|forgeApiUrl\|forgeApiKey" . \
  --include="*.ts" --include="*.js" --include="*.env" --include="*.sh"
```

1. Delete `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` from `server/_core/env.ts`
2. Delete `VITE_FRONTEND_FORGE_API_KEY` and `VITE_FRONTEND_FORGE_URL` from any `.env` files
3. Remove these variables from `deploy.sh` if present

### Step 3 — Remove the browser tracking plugin

```bash
# Remove from devDependencies
pnpm remove vite-plugin-manus-runtime
```

Then clean `vite.config.ts`:

```typescript
// Remove these lines:
import manusRuntime from "vite-plugin-manus-runtime";
import { manusDebugCollector } from "manus-debug-collector";

// Remove from plugins array:
plugins: [
  manusRuntime(), // ← remove
  manusDebugCollector(), // ← remove
  // ... keep your other plugins
];

// Remove Manus domains from allowedHosts:
server: {
  allowedHosts: [
    "localhost",
    "127.0.0.1",
    // Remove: 'manus.space', 'manus.computer', 'manuscomputer.ai'
  ];
}
```

### Step 4 — Remove proxy server files

If your app has files that are purely Manus proxy wrappers, either remove or replace them:

```bash
# Files commonly added by Manus that you may want to replace:
# server/_core/dataApi.ts       — replace callDataApi() with direct fetch()
# server/_core/imageGeneration.ts — replace with direct OpenAI/Replicate call
# server/_core/voiceTranscription.ts — replace with direct Whisper/Deepgram call
```

If `server/storage.ts` proxies through Manus object storage, replace it with your own S3/R2/Cloudflare bucket integration.

### Step 5 — Remove Manus auth types (if safe)

```bash
# Check if manusTypes is used outside the auth system
grep -rn "manusTypes\|ManusAuthType" . --include="*.ts" --include="*.tsx"
```

If `manusTypes` is only used within your own auth system (not calling Manus servers), it is safe to rename rather than delete:

```bash
# Rename for clarity
mv server/_core/types/manusTypes.ts server/_core/types/authTypes.ts
# Update all imports
```

If it references Manus OAuth endpoints, remove it and replace with your own auth types.

### Step 6 — Remove the .manus-logs directory

```bash
rm -rf .manus-logs
echo '.manus-logs/' >> .gitignore
```

### Step 7 — Rename ManusDialog

```bash
# Rename the component
mv client/src/components/ManusDialog.tsx client/src/components/LoginDialog.tsx
# Update all imports (sed works on both macOS and Linux)
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak 's/ManusDialog/LoginDialog/g'
# Remove backup files
find . -name "*.bak" -delete
```

### Step 8 — Update the lockfile and verify

```bash
pnpm install        # regenerate lockfile after removing packages
pnpm check          # verify TypeScript compiles cleanly
pnpm test           # verify all tests pass
```

---

## Lovable Cleanup

### Step 1 — Remove the Lovable Vite plugin

```bash
pnpm remove lovable-tagger
# Also remove gpt-engineer if present
pnpm remove gpt-engineer
```

Clean `vite.config.ts`:

```typescript
// Remove:
import { componentTagger } from "lovable-tagger";
plugins: [componentTagger()]; // ← remove
```

### Step 2 — Remove Lovable environment variables

```bash
grep -rn "VITE_GPT_ENGINEER" . --include=".env*" --include="*.ts" --include="*.sh"
# Delete each occurrence
```

### Step 3 — Remove Lovable branding

```bash
grep -rn -i "Made with Lovable\|Built with Lovable" . \
  --include="*.tsx" --include="*.jsx" --include="*.html"
```

Remove or replace the branding text in `Footer.tsx` or similar layout components.

### Step 4 — Remove lovable.dev from allowed hosts

```typescript
// vite.config.ts — remove:
allowedHosts: ["lovable.dev"]; // ← remove
```

### Step 5 — Rename Lovable-named components

```bash
# Find any components with 'Lovable' or 'GPTEngineer' in their names
find . -name "*[Ll]ovable*" -o -name "*[Gg]ptEngineer*" | grep -v node_modules
```

---

## Bolt Cleanup

### Step 1 — Remove StackBlitz/Bolt references

```bash
grep -rn "bolt\.new\|stackblitz" . \
  --include="*.ts" --include="*.tsx" --include="*.json" --include="*.sh"
```

Remove from `allowedHosts`, package.json scripts, and any proxy configurations.

### Step 2 — Remove Bolt environment variables

```bash
grep -rn "VITE_BOLT" . --include=".env*" --include="*.ts"
# Delete each occurrence
```

### Step 3 — Remove Bolt branding

```bash
grep -rn -i "Made with Bolt\|Built with Bolt\|Powered by Bolt" . \
  --include="*.tsx" --include="*.jsx" --include="*.html"
```

---

## Replit Cleanup

### Step 1 — Remove Replit npm packages

```bash
# List installed Replit packages
grep -r '"@replit/' package.json
# Remove each one
pnpm remove @replit/<package-name>
```

### Step 2 — Remove Replit domains

```bash
grep -rn "repl\.it\|replit\.com" . \
  --include="*.ts" --include="*.json" --include="*.sh"
```

Remove from `allowedHosts` and any CORS configuration.

### Step 3 — Remove Replit-specific config files

```bash
# Replit-specific files (safe to delete outside Replit)
rm -f .replit replit.nix
echo '.replit' >> .gitignore
echo 'replit.nix' >> .gitignore
```

---

## Cursor Cleanup

### Step 1 — Remove .cursor/ from the repo

The `.cursor/` directory contains IDE-specific settings and should not be committed:

```bash
# Remove from git tracking (keep local copy if you want)
git rm -r --cached .cursor/
echo '.cursor/' >> .gitignore
git commit -m "chore: remove .cursor IDE config from repo"
```

---

## Verifying Cleanup

After completing cleanup steps, run this verification command. It should return **no results**:

```bash
grep -rn \
  "forge\.manus\.ai\|forge\.manus\.im\|BUILT_IN_FORGE\|VITE_FRONTEND_FORGE\|vite-plugin-manus-runtime\|manus-debug-collector\|__manus__\|ManusDialog\|lovable-tagger\|gpt-engineer\|VITE_GPT_ENGINEER\|Made with Lovable\|Built with Lovable\|bolt\.new\|VITE_BOLT\|Made with Bolt\|@replit/" \
  . \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.json" --include="*.sh" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=audit-results
```

Then re-run the audit script to confirm a clean report:

```bash
./scripts/audit-third-party.sh .
```

---

## Post-Cleanup Checklist

- [ ] `pnpm install` — lockfile updated after package removal
- [ ] `pnpm check` — TypeScript reports 0 errors
- [ ] `pnpm test` — all unit tests pass
- [ ] Deployed to staging and verified no requests to `forge.manus.ai` in network traffic
- [ ] Deployed to production and verified same
- [ ] `.gitignore` updated for any removed directories (`.cursor/`, `.manus-logs/`)
- [ ] `audit-results/` added to `.gitignore`
- [ ] DARE-007 updated to status `R — Responded` in `standards/05_DARE_LOG.md`
- [ ] Verification grep above returns no results
- [ ] Re-run `./scripts/audit-third-party.sh .` — shows ✅ No artifacts detected

---

_See also: `scripts/audit-third-party.sh` for automated scanning, `standards/05_DARE_LOG.md` DARE-007 for tracking._
