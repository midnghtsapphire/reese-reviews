# DigitalOcean App Platform — Quick Reference

## App Spec Location
`.do/app.yaml` — committed to this repo. Used by `doctl apps create --spec .do/app.yaml`.

## Key Settings
- **Type:** Static Site
- **Repo:** MIDNGHTSAPPHIRE/reese-reviews @ main
- **Build:** `npm run build`
- **Output:** `dist/`
- **SPA fallback:** `error_document: index.html`
- **Auto-deploy:** On every push to main

## Deploy Command (one-liner)
```bash
doctl apps create --spec .do/app.yaml
```

## Full Guide
See `docs/DIGITALOCEAN_DEPLOYMENT.md` for the complete step-by-step guide including:
- Dashboard setup walkthrough
- DNS configuration for Namecheap
- Environment variables
- Troubleshooting
