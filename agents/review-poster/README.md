# review-poster (GitHub-native agent)

This is an **in-repo GitHub agent**, not a Grok bot. It lives in `agents/review-poster/` and is also declared at `.github/agents/review-poster.agent.md` so GitHub can see it.

It has two jobs:

1. **Website.** When a review PR is merged to `main` with the `approved-to-post` label, a CircleCI job on `main` publishes the `reviews/<slug>/` folder to the Reese Reviews site (the site already in this repository) and comments on the PR.
2. **Amazon.** Amazon has no review-posting API. A Playwright filler runs **only on Audrey's computer** (or ops/self-hosted-ci she controls), using her already-logged-in browser profile. It never stores Amazon passwords. It never clicks Submit.

## Start button

All of the review data is already in `review.md` and `images/`. You press one button — the Review Desk **Start** button, or this command — and the filler writes the fields one after another:

1. Title (star rating is set here if the form requires it)
2. A pause (default 3–6 seconds, or `--delay 3-6`)
3. Images
4. A pause
5. The written review
6. Stop. You press Submit.

```bash
# Plan only, no browser
python3 agents/review-poster/amazon_poster.py --slug 2-pocket-toploader-binder --dry-run --delay 3-6

# On your computer, with your logged-in Chrome profile
python3 agents/review-poster/amazon_poster.py --slug 2-pocket-toploader-binder --allow-self-hosted --user-data-dir "$HOME/.config/google-chrome" --delay 3-6
```

## Site publish

```bash
python3 agents/review-poster/publish_to_site.py
```

CircleCI runs this on `main`. It will not run the Amazon filler.

PR comments are signed `**Auky:** … — Auky`.
