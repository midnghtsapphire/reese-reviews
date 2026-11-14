# Amazon rules engine

Scripts that check **one** Amazon review (or, later, one KDP book) against a YAML rules pack.

Audrey’s ask: build this as a rules engine in GitHub, then **she reviews an area** and **Proofy does the final review and uploads to the site**. The engine automates WR stages 1–3 as checks only. **It does not post anything to Amazon or KDP.**

## Who does what

1. Audrey drafts one review on a **WR: Amazon review** issue (or a YAML file with the same fields).
2. Proofy (or Audrey) runs `amazon-rules check` on that one file.
3. The engine writes a markdown report (PASS / WARN / FAIL per rule) that can be pasted into the WR issue.
4. **Audrey reviews the report area.**
5. Proofy does the **final** review. Nothing is uploaded until **Proofy: FINAL APPROVED** and **Audrey's yes** are both on the WR.
6. Proofy posts the review manually in the browser, **one item at a time**. Vine items go through the Vine review form.

Do not batch files. Do not bulk-load. Do not wire this engine to a publish or submit step.

## Fields on a review file

Match the WR: product, ASIN, Vine or purchase, used yes/no, title, stars, body, and a photo list.

```yaml
# EXAMPLE ONLY — use a real WR file for a live review
example: false
pack: reviews
product: "Exact product name"
asin: "B0XXXXXXXX"
amazon_url: "https://www.amazon.com/dp/B0XXXXXXXX"
review_source: vine          # or purchase, or the WR dropdown text
used: "yes"                  # yes / no / not yet / unsure
stars: 4
title: "Review title"
body: |
  The review body.
photos:
  - photos/front.jpg
photo_owner: audrey          # audrey / permission / unknown
```

Sample files in `examples/` are clearly labeled **EXAMPLE ONLY** and use fake ASINs such as `B0TEST0001`. Do not post them.

## Run it locally

From this directory (`tools/amazon-rules` in midnghtsapphire/reese-reviews):

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=.
python -m amazon_rules check examples/EXAMPLE-review-pass.yml --pack reviews
python -m amazon_rules check path/to/one-review.yml --pack reviews --ledger examples/EXAMPLE-ledger.csv --out /tmp/report.md
```

Exit codes: `0` if there is no FAIL (PASS or WARN), `1` if any rule FAILs, `2` on usage or file errors.

A WARN does not block the CLI. Audrey still reviews WARN items (photos, stock-AI phrasing, shipping language) before Proofy’s final review.

### KDP skeleton

```bash
python -m amazon_rules check examples/EXAMPLE-kdp-pass.yml --pack kdp
```

The `kdp` pack is a skeleton for the amazon-books WR (AI disclosure, house trim sizes, no words in cover art). It also does not upload.

## Tests

```bash
export PYTHONPATH=.
python -m pytest -q
```

## GitHub Actions and CircleCI

- A **workflow_dispatch** workflow lives at `.github/workflows/amazon-rules-engine.yml` in reese-reviews. It is **manual only** (not on push or pull_request). Enter the path to one review file and, optionally, a WR issue number. If an issue number is given, the job comments the report on that issue. The comment starts with `Proofy:` and ends with `— Proofy`.
- midnghtsapphire/reese-reviews is a **public** repository, so GitHub-hosted Actions minutes for this manual workflow are included in GitHub’s public-repo plan. If the repository is later made **private**, each run would count against private-repo Actions minutes. In that case, run the CLI locally (or on the existing CircleCI setup) instead of turning on push or schedule triggers.
- A CircleCI job snippet is in `ci/circleci-job.yml`. It is **not** installed as the repo’s root `.circleci/config.yml`, so connecting CircleCI later will not start a new pipeline by surprise and will not add a self-hosted runner. There is already only one CircleCI self-hosted runner in the fleet; do not add another. If you merge the snippet into an existing CircleCI config, keep `run_amazon_rules` defaulting to `false` and use a CircleCI Docker image, not a new runner.

This workflow never publishes a review.

## Rule packs

Rules live in YAML, not in hardcoded Python. Each rule has an `id`, a `severity` (`fail` or `warn`), a `check` type (`regex`, `keyword`, `field`, `length`, or `duplicate`), a `message`, and a `source_url` plus a short quote from that page.

- `official` — quoted from an official Amazon page that was fetched on **14 November 2026** (America/Denver). See [SOURCES.md](SOURCES.md).
- `house_rule` — not stated on those official pages, and attributed to Audrey (the WR or her standing KDP answers).

Official public help pages **do not state** a review character limit, Vine review percentages, evaluation-period length, or a public per-item Vine deadline. This engine does not invent those numbers. Length checks are omitted for reviews.

The one-review-per-ASIN check uses a **local CSV ledger** (`examples/EXAMPLE-ledger.csv` is sample data only). Add a real ledger when you start posting, and do not commit secrets or order numbers.

Canonical copies of the packs and these docs are mirrored in [midnghtsapphire/revvel-standards](https://github.com/midnghtsapphire/revvel-standards) under `docs/reviews/rules-engine/` on the matching branch.

## Related WRs

- Review WR: `.github/ISSUE_TEMPLATE/amazon-review-wr.yml` and `docs/AMAZON-REVIEWS-REFERENCE.md` on branch `docs/amazon-review-wr-template-2026-11-14`.
- KDP WR: midnghtsapphire/amazon-books, branch `docs/kdp-reference-2026-11-14`.
