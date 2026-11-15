"""Publish a merged review to the Reese Reviews site.

Reviews already live in reviews/<slug>/ on main. The site loader shows
any review whose status is approved-to-post, published, posted-site, or
posted-amazon. This script records what was published and comments on the PR.
It does not post to Amazon and does not need a CMS form.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts" / "review-pr"
sys.path.insert(0, str(SCRIPTS))

from frontmatter import find_reviews, load_review  # noqa: E402
from comment_pr import comment_on_pr  # noqa: E402

PUBLISHABLE = {"approved-to-post", "published", "posted-site", "posted-amazon"}


def changed_review_slugs(root: Path) -> list[str]:
    try:
        output = subprocess.check_output(
            ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
            cwd=root,
            text=True,
        )
    except subprocess.CalledProcessError:
        return []
    slugs: list[str] = []
    for line in output.splitlines():
        parts = line.split("/")
        if len(parts) >= 2 and parts[0] == "reviews":
            if parts[1] not in slugs:
                slugs.append(parts[1])
    return slugs


def find_merged_pr(repo: str) -> int | None:
    sha = os.environ.get("CIRCLE_SHA1") or ""
    if not sha:
        try:
            sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        except subprocess.CalledProcessError:
            return None
    try:
        output = subprocess.check_output(
            [
                "gh",
                "pr",
                "list",
                "--repo",
                repo,
                "--state",
                "merged",
                "--search",
                sha,
                "--json",
                "number,labels,headRefName",
                "--jq",
                ".[0].number",
            ],
            text=True,
        ).strip()
        return int(output) if output and output != "null" else None
    except (subprocess.CalledProcessError, ValueError):
        return None


def pr_has_label(repo: str, number: int, label: str) -> bool:
    try:
        output = subprocess.check_output(
            [
                "gh",
                "pr",
                "view",
                str(number),
                "--repo",
                repo,
                "--json",
                "labels",
                "--jq",
                "[.labels[].name]",
            ],
            text=True,
        )
        return label in output
    except subprocess.CalledProcessError:
        return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--repo", default=os.environ.get("GITHUB_REPO", "midnghtsapphire/reese-reviews"))
    parser.add_argument("--require-label", default="approved-to-post")
    args = parser.parse_args(argv)

    # Never run the Amazon poster from this job.
    slugs = changed_review_slugs(args.root)
    if not slugs:
        print("No reviews/ changes in HEAD. Site publish skipped.")
        return 0

    number = find_merged_pr(args.repo)
    if args.require_label and number:
        if not pr_has_label(args.repo, number, args.require_label):
            print(f"PR #{number} does not have the {args.require_label} label. Site publish skipped.")
            return 0
    elif args.require_label and not number:
        # On a main checkout without gh, still list publishable reviews so deploys work.
        print("Could not look up the merged PR. Publishing any reviews/ changes that are already publishable.")

    published = []
    for path in find_reviews(args.root):
        if path.parent.name not in slugs:
            continue
        doc = load_review(path)
        if doc.status in PUBLISHABLE or not args.require_label:
            published.append(doc.slug or path.parent.name)
            print(f"On the site: {doc.product} ({doc.slug})")

    message = (
        "Published this review to the Reese Reviews site from `reviews/`. "
        "Amazon posting was not run. That only happens on Audrey's computer, "
        "fills title then images then the review with a pause between fields, "
        "and waits for her to press Submit."
    )
    if number:
        comment_on_pr(args.repo, number, message)
    else:
        print(message)
    print(f"Published {len(published)} review(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
