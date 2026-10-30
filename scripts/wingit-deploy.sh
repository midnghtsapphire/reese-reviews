#!/usr/bin/env bash
# wingit-deploy — build and publish dist/ to the gh-pages branch with plain git.
# DRY RUN BY DEFAULT. Nothing is pushed unless you pass --publish.
#
#   scripts/wingit-deploy.sh             # dry run: build + prepare commit, no push
#   scripts/wingit-deploy.sh --publish   # build + push to origin gh-pages
#
# Env: REMOTE (default origin), BRANCH (default gh-pages), SKIP_BUILD=1 to reuse dist/.
# Reminder: VITE_* env vars are baked into the public bundle — never put secrets in them.
set -euo pipefail

PUBLISH=0
[[ "${1:-}" == "--publish" ]] && PUBLISH=1
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-gh-pages}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  npm ci --no-audit --no-fund
  npm run build
fi
[[ -f dist/index.html ]] || { echo "dist/index.html missing; build failed?" >&2; exit 1; }

# SPA fallback + disable Jekyll on GitHub Pages
cp dist/index.html dist/404.html
touch dist/.nojekyll

SRC_SHA="$(git rev-parse --short HEAD)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cp -a dist/. "$WORK/"
cd "$WORK"
git init -q
git checkout -q -b "$BRANCH"
git add -A
git -c user.name="wingit-deploy" -c user.email="wingit-deploy@users.noreply.github.com" \
  commit -q -m "deploy: dist from ${SRC_SHA}"
URL="$(git -C "$ROOT" remote get-url "$REMOTE")"

if [[ "$PUBLISH" == "1" ]]; then
  echo "Publishing dist (${SRC_SHA}) to ${REMOTE}/${BRANCH}..."
  git push --force "$URL" "$BRANCH:$BRANCH"
  echo "Done. Enable Pages (Settings > Pages > Branch: ${BRANCH}) if not already."
else
  echo "[dry-run] Would force-push $(git ls-files | wc -l) files from dist (${SRC_SHA}) to ${REMOTE}/${BRANCH}."
  echo "[dry-run] Re-run with --publish to deploy."
fi
