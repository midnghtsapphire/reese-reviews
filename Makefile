# wingit-ci — deterministic local + CI pipeline.
# Usage: make ci
.PHONY: ci install typecheck lint test build

ci: install typecheck lint test build

install:
	npm ci --no-audit --no-fund

typecheck:
	npm run typecheck

lint:
	@if npm run | grep -q "^  lint$$"; then npm run lint; else echo "no lint script; skipping"; fi

test:
	npm test

build:
	npm run build
