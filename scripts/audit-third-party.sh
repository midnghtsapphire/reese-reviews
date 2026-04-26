#!/usr/bin/env bash
# =============================================================================
# audit-third-party.sh — Third-Party AI Platform Artifact Auditor
# =============================================================================
#
# USAGE:
#   ./scripts/audit-third-party.sh [path/to/repo]
#
# DESCRIPTION:
#   Scans a codebase for artifacts left behind by AI coding platforms
#   (Manus, Lovable, Bolt, Replit, Cursor, etc.) and generates a report
#   showing what was found, what risk it poses, and what to do about it.
#
# OUTPUT:
#   - Printed to stdout (readable without colour support)
#   - Saved to audit-results/YYYY-MM-DD-{appname}.txt
#
# REQUIREMENTS:
#   - bash 3.2+, grep, find, awk, date  — no external dependencies
#   - Works on macOS and Linux
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REPO_DIR="${1:-$(pwd)}"
REPO_DIR="$(cd "$REPO_DIR" && pwd)"
APP_NAME="$(basename "$REPO_DIR")"
SCAN_DATE="$(date +%Y-%m-%d)"
OUTPUT_DIR="$REPO_DIR/audit-results"
OUTPUT_FILE="$OUTPUT_DIR/${SCAN_DATE}-${APP_NAME}.txt"

# ---------------------------------------------------------------------------
# Counters per platform and severity
# ---------------------------------------------------------------------------
declare -A MANUS_COUNTS=([critical]=0 [high]=0 [medium]=0 [low]=0)
declare -A LOVABLE_COUNTS=([critical]=0 [high]=0 [medium]=0 [low]=0)
declare -A BOLT_COUNTS=([critical]=0 [high]=0 [medium]=0 [low]=0)
declare -A REPLIT_COUNTS=([critical]=0 [high]=0 [medium]=0 [low]=0)
declare -A CURSOR_COUNTS=([critical]=0 [high]=0 [medium]=0 [low]=0)
declare -A GENERAL_COUNTS=([critical]=0 [high]=0 [medium]=0 [low]=0)

TOTAL_ISSUES=0

# Collected report sections (we build them as strings then print at the end)
CRITICAL_SECTION=""
HIGH_SECTION=""
MEDIUM_SECTION=""
LOW_SECTION=""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

divider() {
    printf '━%.0s' {1..54}
    printf '\n'
}

# Search for a pattern and return "file:line" pairs, one per line.
# Usage: find_pattern <grep-pattern> [<file-extensions>...]
# Extensions default to ts,tsx,js,jsx,json,sh,env,md,yaml,yml
find_pattern() {
    local pattern="$1"
    shift
    local exts=("${@:-ts tsx js jsx json sh env .env md yaml yml toml}")
    local include_args=()
    for ext in "${exts[@]}"; do
        include_args+=(--include="*.$ext" --include="*$ext")
    done
    # Deduplicate include args derived from bare extensions vs dotted ones
    grep -rn --with-filename "$pattern" "$REPO_DIR" \
        --include="*.ts" --include="*.tsx" \
        --include="*.js" --include="*.jsx" \
        --include="*.json" --include="*.sh" \
        --include="*.env" --include=".env*" \
        --include="*.md" --include="*.yaml" \
        --include="*.yml" --include="*.toml" \
        --include="*.html" --include="*.vue" \
        --include="*.svelte" \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=dist \
        --exclude-dir=build \
        --exclude-dir=audit-results \
        2>/dev/null || true
}

# Format a list of "file:line:content" grep hits into indented "  file:line" lines
format_hits() {
    local hits="$1"
    echo "$hits" | awk -F: '{print "  " $1 ":" $2}' | sort -u
}

# Count unique file:line occurrences
count_hits() {
    local hits="$1"
    if [ -z "$hits" ]; then echo 0; return; fi
    echo "$hits" | grep -c '.' || echo 0
}

# Append to a severity section
append_section() {
    local severity="$1"
    local content="$2"
    case "$severity" in
        critical) CRITICAL_SECTION="${CRITICAL_SECTION}${content}" ;;
        high)     HIGH_SECTION="${HIGH_SECTION}${content}" ;;
        medium)   MEDIUM_SECTION="${MEDIUM_SECTION}${content}" ;;
        low)      LOW_SECTION="${LOW_SECTION}${content}" ;;
    esac
}

# Record a finding. Args: platform severity label description [advice...]
record_finding() {
    local platform="$1"
    local severity="$2"
    local label="$3"
    local hits="$4"
    shift 4
    local advice=("$@")

    local n
    n=$(count_hits "$hits")
    if [ "$n" -eq 0 ]; then return; fi

    TOTAL_ISSUES=$((TOTAL_ISSUES + n))

    # Increment platform counter
    case "$platform" in
        MANUS)   MANUS_COUNTS[$severity]=$((${MANUS_COUNTS[$severity]:-0} + n)) ;;
        LOVABLE) LOVABLE_COUNTS[$severity]=$((${LOVABLE_COUNTS[$severity]:-0} + n)) ;;
        BOLT)    BOLT_COUNTS[$severity]=$((${BOLT_COUNTS[$severity]:-0} + n)) ;;
        REPLIT)  REPLIT_COUNTS[$severity]=$((${REPLIT_COUNTS[$severity]:-0} + n)) ;;
        CURSOR)  CURSOR_COUNTS[$severity]=$((${CURSOR_COUNTS[$severity]:-0} + n)) ;;
        GENERAL) GENERAL_COUNTS[$severity]=$((${GENERAL_COUNTS[$severity]:-0} + n)) ;;
    esac

    local formatted_hits
    formatted_hits=$(format_hits "$hits")

    local block
    block="$(printf '[%s] %s found in:\n%s\n' "$platform" "$label" "$formatted_hits")"
    for adv in "${advice[@]}"; do
        block="${block}$(printf '\n  ⚠️  %s' "$adv")"
    done
    block="${block}"$'\n\n'

    append_section "$severity" "$block"
}

# Check if a directory exists (for non-grep checks like .cursor/)
check_dir_exists() {
    local platform="$1"
    local severity="$2"
    local dir_path="$3"
    local label="$4"
    shift 4
    local advice=("$@")

    if [ -d "$REPO_DIR/$dir_path" ]; then
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        case "$platform" in
            CURSOR)  CURSOR_COUNTS[$severity]=$((${CURSOR_COUNTS[$severity]:-0} + 1)) ;;
            MANUS)   MANUS_COUNTS[$severity]=$((${MANUS_COUNTS[$severity]:-0} + 1)) ;;
            GENERAL) GENERAL_COUNTS[$severity]=$((${GENERAL_COUNTS[$severity]:-0} + 1)) ;;
        esac
        local block
        block="$(printf '[%s] %s found:\n  %s/\n' "$platform" "$label" "$dir_path")"
        for adv in "${advice[@]}"; do
            block="${block}$(printf '\n  ⚠️  %s' "$adv")"
        done
        block="${block}"$'\n\n'
        append_section "$severity" "$block"
    fi
}

# ---------------------------------------------------------------------------
# Prepare output directory
# ---------------------------------------------------------------------------
mkdir -p "$OUTPUT_DIR"

# ---------------------------------------------------------------------------
# Run all checks
# ---------------------------------------------------------------------------

# ── MANUS ────────────────────────────────────────────────────────────────────

record_finding "MANUS" "critical" "forge.manus.ai" \
    "$(find_pattern 'forge\.manus\.ai')" \
    "Every LLM call in this app routes through Manus servers." \
    "You are paying Manus credits AND your LLM provider simultaneously." \
    "This runs 24/7 on your live server whether you use Manus or not."

record_finding "MANUS" "critical" "forge.manus.im" \
    "$(find_pattern 'forge\.manus\.im')" \
    "Older Manus billing proxy — same risk as forge.manus.ai." \
    "All LLM calls are proxied through Manus servers."

record_finding "MANUS" "critical" "BUILT_IN_FORGE_API_URL / BUILT_IN_FORGE_API_KEY" \
    "$(find_pattern 'BUILT_IN_FORGE_API')" \
    "Manus server-side credentials are present in your codebase." \
    "These are used to authenticate your server to the Manus billing proxy."

record_finding "MANUS" "critical" "VITE_FRONTEND_FORGE_API_KEY / VITE_FRONTEND_FORGE_URL" \
    "$(find_pattern 'VITE_FRONTEND_FORGE')" \
    "Manus client-side credentials exposed to the browser." \
    "These enable the frontend to call the Manus billing proxy directly."

record_finding "MANUS" "high" "vite-plugin-manus-runtime" \
    "$(find_pattern 'vite-plugin-manus-runtime')" \
    "Collects browser console logs, network requests, session replay." \
    "POSTs user activity data to Manus servers." \
    "May violate GDPR/CCPA if your users are in EU or California."

record_finding "MANUS" "high" "/__manus__/logs endpoint" \
    "$(find_pattern '__manus__')" \
    "Data collection endpoint — your users' activity is sent to Manus." \
    "Check if this is still active in your server routes."

record_finding "MANUS" "high" "manus-debug-collector" \
    "$(find_pattern 'manus-debug-collector')" \
    "Debug data is being collected and sent to Manus servers." \
    "This may expose sensitive debug information externally."

record_finding "MANUS" "high" ".manus-logs directory reference" \
    "$(find_pattern '\.manus-logs')" \
    "Manus local log directory — may contain sensitive debug data." \
    "Remove this directory and any references to it."

record_finding "MANUS" "high" "manus.space / manus.computer / manuscomputer.ai domain" \
    "$(find_pattern 'manus\.space\|manus\.computer\|manuscomputer\.ai')" \
    "Manus domains allowed in server/Vite config." \
    "These may enable data egress to Manus infrastructure."

record_finding "MANUS" "medium" "ManusDialog component" \
    "$(find_pattern 'ManusDialog')" \
    "Manus-branded UI component — replace or rename for white-label."

record_finding "MANUS" "low" "manusTypes" \
    "$(find_pattern 'manusTypes')" \
    "Manus auth types — verify these are not tied to Manus auth service." \
    "Safe to keep if only used by your own auth logic."

# ── LOVABLE ──────────────────────────────────────────────────────────────────

record_finding "LOVABLE" "high" "lovable-tagger Vite plugin" \
    "$(find_pattern 'lovable-tagger')" \
    "Lovable's Vite plugin tags DOM elements for their editor." \
    "Remove from devDependencies and vite.config."

record_finding "LOVABLE" "high" "gptengineer / gpt-engineer" \
    "$(find_pattern 'gptengineer\|gpt-engineer')" \
    "Lovable's original platform name — may reference Lovable services." \
    "Remove package references and any API calls."

record_finding "LOVABLE" "high" "VITE_GPT_ENGINEER env vars" \
    "$(find_pattern 'VITE_GPT_ENGINEER')" \
    "Lovable environment variables still present." \
    "Remove from .env files and vite.config."

record_finding "LOVABLE" "medium" "Made with Lovable / Built with Lovable branding" \
    "$(find_pattern -i 'Made with Lovable\|Built with Lovable')" \
    "Platform branding in your UI — remove for white-label." \
    "Check Footer.tsx and similar layout components."

record_finding "LOVABLE" "medium" "lovable.dev domain reference" \
    "$(find_pattern 'lovable\.dev')" \
    "Lovable domain in your codebase — may be in allowed hosts." \
    "Remove from vite.config allowedHosts."

record_finding "LOVABLE" "low" "lovable (general reference)" \
    "$(grep -rn -i 'lovable' "$REPO_DIR" \
        --include="*.json" --include="*.ts" --include="*.tsx" \
        --include="*.js" --include="*.jsx" \
        --exclude-dir=node_modules --exclude-dir=.git \
        --exclude-dir=dist --exclude-dir=audit-results \
        2>/dev/null | grep -v 'lovable-tagger\|lovable\.dev\|Made with Lovable\|Built with Lovable' || true)" \
    "General 'lovable' reference — may be a component name or comment." \
    "Review each occurrence and remove platform references."

# ── BOLT ─────────────────────────────────────────────────────────────────────

record_finding "BOLT" "high" "bolt.new reference" \
    "$(find_pattern 'bolt\.new')" \
    "Bolt.new domain reference — may be in config or comments." \
    "Remove from allowed hosts and any proxy configurations."

record_finding "BOLT" "high" "stackblitz reference" \
    "$(find_pattern 'stackblitz')" \
    "StackBlitz is Bolt's parent — infrastructure references may be active." \
    "Verify no live API calls route through StackBlitz servers."

record_finding "BOLT" "high" "VITE_BOLT env vars" \
    "$(find_pattern 'VITE_BOLT')" \
    "Bolt environment variables present." \
    "Remove from .env files and vite.config."

record_finding "BOLT" "medium" "Made with Bolt branding" \
    "$(find_pattern -i 'Made with Bolt\|Built with Bolt\|Powered by Bolt')" \
    "Bolt branding in UI — remove for white-label deployment."

# ── REPLIT ───────────────────────────────────────────────────────────────────

record_finding "REPLIT" "high" "@replit/ npm packages" \
    "$(find_pattern '@replit/')" \
    "Replit npm packages in use — these may phone home." \
    "Replace with equivalent open-source packages."

record_finding "REPLIT" "high" "repl.it / replit.com domain" \
    "$(find_pattern 'repl\.it\|replit\.com')" \
    "Replit domains in your codebase — may be in allowedHosts." \
    "Remove from vite.config and any server CORS config."

record_finding "REPLIT" "medium" "replit reference (general)" \
    "$(grep -rn -i 'replit' "$REPO_DIR" \
        --include="*.json" --include="*.ts" --include="*.tsx" \
        --include="*.js" --include="*.jsx" --include="*.sh" \
        --include="*.yaml" --include="*.yml" \
        --exclude-dir=node_modules --exclude-dir=.git \
        --exclude-dir=dist --exclude-dir=audit-results \
        2>/dev/null | grep -v '@replit/\|repl\.it\|replit\.com' || true)" \
    "General 'replit' reference in code or config." \
    "Review and remove platform-specific references."

# ── CURSOR ───────────────────────────────────────────────────────────────────

check_dir_exists "CURSOR" "low" ".cursor" ".cursor/ directory" \
    "Cursor IDE settings directory committed to repo." \
    "Add .cursor/ to .gitignore to avoid leaking IDE config."

record_finding "CURSOR" "low" "cursor.sh reference" \
    "$(find_pattern 'cursor\.sh')" \
    "Cursor IDE domain reference in codebase." \
    "Review and remove if not intentional."

# ── GENERAL suspicious patterns ───────────────────────────────────────────────

record_finding "GENERAL" "high" "Platform data-collection endpoint pattern /__[a-z]+__/" \
    "$(grep -rn '/__[a-z][a-z_]*__/' "$REPO_DIR" \
        --include="*.ts" --include="*.tsx" \
        --include="*.js" --include="*.jsx" \
        --include="*.json" --include="*.sh" \
        --exclude-dir=node_modules --exclude-dir=.git \
        --exclude-dir=dist --exclude-dir=audit-results \
        2>/dev/null || true)" \
    "Platform-style data collection endpoints detected." \
    "These follow the Manus /__manus__/ pattern used for data exfiltration." \
    "Verify these are intentional or remove them."

record_finding "GENERAL" "medium" "Made with / Built with / Powered by branding" \
    "$(grep -rn -i 'Made with\|Built with\|Powered by' "$REPO_DIR" \
        --include="*.ts" --include="*.tsx" \
        --include="*.js" --include="*.jsx" \
        --include="*.html" --include="*.vue" \
        --include="*.svelte" \
        --exclude-dir=node_modules --exclude-dir=.git \
        --exclude-dir=dist --exclude-dir=audit-results \
        2>/dev/null || true)" \
    "Platform branding in UI components." \
    "Remove before white-label or commercial deployment."

record_finding "GENERAL" "medium" "Non-localhost allowedHosts in vite.config" \
    "$(grep -rn 'allowedHosts' "$REPO_DIR" \
        --include="*.ts" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=.git \
        --exclude-dir=dist --exclude-dir=audit-results \
        2>/dev/null | grep -v 'localhost\|127\.0\.0\.1' || true)" \
    "External domains in allowedHosts may enable SSRF or data egress." \
    "Remove any third-party platform domains from this list."

# ---------------------------------------------------------------------------
# Build the full report
# ---------------------------------------------------------------------------

report() {
printf '╔══════════════════════════════════════════════════════╗\n'
printf '║   THIRD-PARTY PLATFORM AUDIT — %-22s║\n' "$APP_NAME"
printf '╚══════════════════════════════════════════════════════╝\n'
printf '\n'
printf 'Scanned: %s\n' "$REPO_DIR"
printf 'Date:    %s\n' "$SCAN_DATE"
printf '\n'

if [ -n "$CRITICAL_SECTION" ]; then
    divider
    printf '🚨 CRITICAL — Active billing proxy / credentials (you may be charged NOW)\n'
    divider
    printf '%s' "$CRITICAL_SECTION"
fi

if [ -n "$HIGH_SECTION" ]; then
    divider
    printf '⚠️  HIGH — User data collection or active platform dependency\n'
    divider
    printf '%s' "$HIGH_SECTION"
fi

if [ -n "$MEDIUM_SECTION" ]; then
    divider
    printf '📋 MEDIUM — Branding / UI artifacts / platform references\n'
    divider
    printf '%s' "$MEDIUM_SECTION"
fi

if [ -n "$LOW_SECTION" ]; then
    divider
    printf '📦 LOW — Legacy naming / types / IDE config\n'
    divider
    printf '%s' "$LOW_SECTION"
fi

if [ -z "$CRITICAL_SECTION" ] && [ -z "$HIGH_SECTION" ] && \
   [ -z "$MEDIUM_SECTION" ] && [ -z "$LOW_SECTION" ]; then
    divider
    printf '✅ No third-party platform artifacts detected.\n'
    divider
    printf '\n'
fi

divider
printf 'SUMMARY\n'
divider
printf '%-12s  %8s  %4s  %6s  %3s\n' "Platform" "Critical" "High" "Medium" "Low"
printf '%-12s  %8s  %4s  %6s  %3s\n' \
    "MANUS"   "${MANUS_COUNTS[critical]}"   "${MANUS_COUNTS[high]}"   "${MANUS_COUNTS[medium]}"   "${MANUS_COUNTS[low]}"
printf '%-12s  %8s  %4s  %6s  %3s\n' \
    "LOVABLE" "${LOVABLE_COUNTS[critical]}" "${LOVABLE_COUNTS[high]}" "${LOVABLE_COUNTS[medium]}" "${LOVABLE_COUNTS[low]}"
printf '%-12s  %8s  %4s  %6s  %3s\n' \
    "BOLT"    "${BOLT_COUNTS[critical]}"    "${BOLT_COUNTS[high]}"    "${BOLT_COUNTS[medium]}"    "${BOLT_COUNTS[low]}"
printf '%-12s  %8s  %4s  %6s  %3s\n' \
    "REPLIT"  "${REPLIT_COUNTS[critical]}"  "${REPLIT_COUNTS[high]}"  "${REPLIT_COUNTS[medium]}"  "${REPLIT_COUNTS[low]}"
printf '%-12s  %8s  %4s  %6s  %3s\n' \
    "CURSOR"  "${CURSOR_COUNTS[critical]}"  "${CURSOR_COUNTS[high]}"  "${CURSOR_COUNTS[medium]}"  "${CURSOR_COUNTS[low]}"
printf '%-12s  %8s  %4s  %6s  %3s\n' \
    "GENERAL" "${GENERAL_COUNTS[critical]}" "${GENERAL_COUNTS[high]}" "${GENERAL_COUNTS[medium]}" "${GENERAL_COUNTS[low]}"
printf '\n'
printf 'Total issues: %d\n' "$TOTAL_ISSUES"

if [ "${MANUS_COUNTS[critical]:-0}" -gt 0 ]; then
    printf 'Estimated monthly double-billing risk: HIGH\n'
elif [ "${MANUS_COUNTS[high]:-0}" -gt 0 ] || [ "${LOVABLE_COUNTS[high]:-0}" -gt 0 ]; then
    printf 'Estimated monthly double-billing risk: MEDIUM\n'
else
    printf 'Estimated monthly double-billing risk: LOW\n'
fi

printf '\n'
divider
printf 'Next steps:\n'
divider
printf '  1. Run: grep -rn "forge.manus.ai" . --include="*.ts" to see all proxy calls\n'
printf '  2. Replace forge.manus.ai calls with direct OpenRouter/OpenAI calls\n'
printf '  3. Remove vite-plugin-manus-runtime from package.json\n'
printf '  4. Remove platform branding from UI components\n'
printf '  5. See docs/CLEANUP_GUIDE.md for step-by-step instructions\n'
printf '\n'
printf 'Report saved to: %s\n' "$OUTPUT_FILE"
printf '\n'
}

# ---------------------------------------------------------------------------
# Output report to stdout AND file
# ---------------------------------------------------------------------------
report | tee "$OUTPUT_FILE"
