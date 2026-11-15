"""Fill the Amazon review form on Audrey's computer, then stop.

Runs ONLY on a machine she controls (ops/self-hosted-ci or her laptop),
using her already-logged-in browser profile. It never stores Amazon
credentials and never clicks Submit.

Usage:
  python3 amazon_poster.py --slug 2-pocket-toploader-binder --allow-self-hosted
  python3 amazon_poster.py --slug 2-pocket-toploader-binder --allow-self-hosted --delay 3-6

The start button is this command (or the Start button in Review Desk, which
can call a local listener). After title, a pause, images, a pause, and the
review text are filled, she presses Submit herself.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts" / "review-pr"
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(SCRIPTS))

from frontmatter import load_review  # noqa: E402
from sequential_fill import FillConfig, parse_delay_arg, run_fill  # noqa: E402

# Conservative selectors for Amazon's review form. Audrey can override
# these if the page changes. The poster stops before Submit either way.
DEFAULT_SELECTORS = {
    "title": 'input[name="reviewTitle"], input#reviewTitle, input[id*="reviewTitle" i]',
    "body": 'textarea[name="reviewText"], textarea#reviewText, textarea[id*="reviewText" i]',
    "photos": 'input[type="file"]',
    "star": 'input[type="radio"][name*="star" i], [aria-label*="star" i]',
}


class CloudBlockedError(RuntimeError):
    pass


def assert_self_hosted(allow: bool) -> None:
    if os.environ.get("CIRCLECI") == "true" and os.environ.get("REVIEW_POSTER_SELF_HOSTED") != "1":
        raise CloudBlockedError(
            "The Amazon poster will not run on CircleCI cloud. "
            "Run it on Audrey's computer with --allow-self-hosted."
        )
    if not allow and os.environ.get("REVIEW_POSTER_SELF_HOSTED") != "1":
        raise CloudBlockedError(
            "Pass --allow-self-hosted to confirm this is running on Audrey's computer."
        )


class PlaywrightAdapter:
    def __init__(self, page, selectors: dict[str, str]):
        self.page = page
        self.selectors = selectors

    def set_rating(self, stars: int) -> None:
        # Rating is applied during the title step when the form requires it.
        locator = self.page.locator(self.selectors["star"])
        if locator.count() >= stars and stars >= 1:
            locator.nth(stars - 1).click()
            return
        # Fallback: click a button whose label includes the star count.
        self.page.get_by_role("button", name=str(stars)).first.click()

    def set_title(self, title: str) -> None:
        self.page.locator(self.selectors["title"]).first.fill(title)

    def attach_photos(self, paths: list[str]) -> None:
        if not paths:
            return
        self.page.locator(self.selectors["photos"]).first.set_input_files(paths)

    def set_body(self, body: str) -> None:
        self.page.locator(self.selectors["body"]).first.fill(body)


def load_doc(root: Path, slug: str):
    path = root / "reviews" / slug / "review.md"
    if not path.is_file():
        raise SystemExit(f"No review found at {path}")
    return load_review(path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug", required=True)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--delay", default="3-6", help="Pause between fields in seconds, e.g. 4 or 3-6")
    parser.add_argument("--allow-self-hosted", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Print the fill plan without opening a browser")
    parser.add_argument("--user-data-dir", default=os.environ.get("REVIEW_POSTER_USER_DATA_DIR", ""))
    parser.add_argument(
        "--url",
        default="",
        help="Override the Amazon review form URL (default: /review/create-review?asin=...)",
    )
    args = parser.parse_args(argv)

    try:
        assert_self_hosted(args.allow_self_hosted or args.dry_run)
    except CloudBlockedError as exc:
        print(exc)
        return 2

    doc = load_doc(args.root, args.slug)
    delay_min, delay_max = parse_delay_arg(args.delay)
    photos = [str(p) for p in doc.image_files()]
    form_url = args.url or f"https://www.amazon.com/review/create-review?asin={doc.asin}"

    print(f"Product: {doc.product}")
    print(f"ASIN: {doc.asin}")
    print("Fill order: title, then images, then review, with a pause between fields.")
    print(f"Delay: {delay_min}-{delay_max} seconds")
    print("Submit will not be clicked.")
    if args.dry_run:
        print(f"Would open: {form_url}")
        print(f"Title: {doc.title}")
        print(f"Images: {len(photos)}")
        print(f"Review characters: {len(doc.body)}")
        return 0

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Install Playwright on this computer: pip install playwright && playwright install chromium")
        return 1

    launch_kwargs = {"headless": False}
    with sync_playwright() as playwright:
        if args.user_data_dir:
            context = playwright.chromium.launch_persistent_context(args.user_data_dir, **launch_kwargs)
            page = context.pages[0] if context.pages else context.new_page()
        else:
            browser = playwright.chromium.launch(**launch_kwargs)
            context = browser.new_context()
            page = context.new_page()
        page.goto(form_url, wait_until="domcontentloaded")
        adapter = PlaywrightAdapter(page, DEFAULT_SELECTORS)
        run_fill(
            adapter,
            title=doc.title,
            body=doc.body,
            photo_paths=photos,
            rating=doc.rating,
            config=FillConfig(delay_min=delay_min, delay_max=delay_max),
        )
        print("Waiting for you to press Submit. Close the browser when you are done.")
        page.wait_for_timeout(10 * 60 * 1000)
        context.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
