# Product reviews

Each product review lives in its own folder and is opened as a draft pull request on a `review/<asin-or-slug>` branch.

```
reviews/<slug>/
  review.md      # front matter + written review
  images/        # Final Review Photo and any replacements
```

`review.md` front matter:

- `product`, `asin`, `url`, `rating`, `title`, `status`, `slug`
- `text_only: true` when this review has no photo
- optional `category`, `notion_url`

Status values:

- `draft` — still being edited (the site ignores these)
- `ready-for-proofy` — completeness check is green; waiting on Proofy and Audrey
- `approved-to-post` — label the PR `approved-to-post` and merge; the in-repo review-poster agent publishes it to the Reese Reviews site
- `published` / `posted-site` — on the website
- `posted-amazon` — also posted on Amazon after Audrey pressed Submit

Do not put order numbers, addresses, or affiliate tags in these files.

See `docs/REVIEW-DESK.md` for the full walkthrough.
