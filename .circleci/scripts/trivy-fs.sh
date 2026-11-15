#!/usr/bin/env bash
# CircleCI filesystem scan that reuses the settings from
# midnghtsapphire/revvel-standards .github/workflows/trivy.yml
# (PR scan-type fs; scanners vuln,misconfig,secret; severity
# CRITICAL,HIGH,MEDIUM; ignore-unfixed). That Actions job uses
# exit-code 0 and uploads SARIF. This script writes the same
# table report (including MEDIUM) as an artifact, then fails
# the job on unfixed HIGH or CRITICAL findings.
#
# Requires `trivy` on PATH. Pin the installer or image in the
# job (currently v0.76.2). Do not run this as a service on the
# Grok Bot box.
set -euo pipefail

ROOT="${1:-.}"
REPORT="${TRIVY_TABLE_OUT:-/tmp/trivy-report.txt}"
TRIVY_BIN="${TRIVY_BIN:-trivy}"

"$TRIVY_BIN" fs "$ROOT" \
  --scanners vuln,misconfig,secret \
  --severity CRITICAL,HIGH,MEDIUM \
  --ignore-unfixed \
  --format table \
  --output "$REPORT"

cat "$REPORT"

# Second pass: fail on HIGH/CRITICAL only. MEDIUM stays in the report.
set +e
"$TRIVY_BIN" fs "$ROOT" \
  --scanners vuln,misconfig,secret \
  --severity CRITICAL,HIGH \
  --ignore-unfixed \
  --format table \
  --exit-code 1
status=$?
set -e
exit "$status"
