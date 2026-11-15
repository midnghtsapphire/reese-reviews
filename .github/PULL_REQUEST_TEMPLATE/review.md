Thanks for opening a product review PR. This template is for one product. It does **not** post the review to Amazon.

**Flow:** edit the prefilled `reviews/<slug>/review.md` and replace photos in `reviews/<slug>/images/` if you want → CircleCI completeness check turns green → Proofy approval → Audrey's yes → add the `approved-to-post` label and merge. The in-repo **review-poster** agent (not a Grok bot) then publishes the review to the Reese Reviews site. Amazon posting only runs on Audrey's computer and stops so she can press Submit.

## Product
- Name:
- ASIN:
- Amazon URL:
- Folder: `reviews/`

## Checklist
- [ ] Star rating (1-5) is set in review.md
- [ ] Review title is filled
- [ ] Written review is filled
- [ ] Final Review Photo is in `images/` OR `text_only: true`
- [ ] Photos are Audrey's own (not listing shots), unless this is text-only
- [ ] I replaced generated photos with my own where I wanted to
- [ ] Proofy: APPROVED
- [ ] Audrey's yes
- [ ] Label `approved-to-post` will be applied before merge
