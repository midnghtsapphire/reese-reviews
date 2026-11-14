# Amazon rules engine

The runnable engine lives in [`tools/amazon-rules/`](../tools/amazon-rules/README.md) on branch `feat/amazon-rules-engine-2026-11-14`.

It checks **one** review (or one KDP book, skeleton pack) against YAML rules. It automates WR stages 1–3 as checks only. **It does not post to Amazon or KDP.** Audrey reviews the report area. Proofy does the final review and, after **Proofy: FINAL APPROVED** and **Audrey's yes**, uploads manually in the browser, one item at a time.

Official sources fetched on 14 November 2026 (America/Denver) are listed in [`tools/amazon-rules/SOURCES.md`](../tools/amazon-rules/SOURCES.md). House rules are attributed to Audrey.

Canonical docs and rule packs are also mirrored in [revvel-standards `docs/reviews/rules-engine/`](https://github.com/midnghtsapphire/revvel-standards/tree/feat/amazon-rules-engine-2026-11-14/docs/reviews/rules-engine).
