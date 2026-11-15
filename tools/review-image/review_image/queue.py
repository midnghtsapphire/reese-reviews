"""CircleCI runner for open Product Image Process work requests.

Finds open GitHub issues labeled image-process that do not yet have
image-done, parses the issue form, runs the image process, commits
outputs to the non-default branch `review-images` (folder issue-<N>/),
comments on the issue (signed Auky), optionally uploads to Notion, and
adds the image-done label.

This is intended to run on CircleCI (or ops/self-hosted-ci), never as a
bot-box cron. Missing tokens print setup help and exit. Tests stay
offline and only cover parsing / path helpers.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from . import __version__
from .fetch import load_from_url_or_asin
from .io import load_image, save_image
from .issues import (
    STEP_BACKGROUND,
    STEP_COPY,
    STEP_CROP,
    STEP_FILTER,
    STEP_TEXT,
    ImageProcessRequest,
    parse_issue_body,
)
from .presets import spec_for
from .process import process_image
from .upload import NotionTokenUploader

IMAGE_PROCESS_LABEL = "image-process"
IMAGE_DONE_LABEL = "image-done"
OUTPUT_BRANCH = "review-images"
AUKY_SIGN = "— Auky"

SETUP_HELP = """
Image-process queue is not fully configured.

To make Product Image Process (WR) issues run on a schedule:

  1. Create GitHub labels `image-process` and `image-done` on this repo
     (the issue form applies image-process when the label exists).
  2. Create a GitHub token that can read/write issues and push the
     `review-images` branch (fine-grained: Issues + Contents on
     midnghtsapphire/reese-reviews). Store it in a CircleCI context
     named `image-process` as IMAGE_PROCESS_GITHUB_TOKEN.
  3. Optional: add NOTION_TOKEN to the same context so a Notion page
     URL on the form can receive the finished photo.
  4. In CircleCI → Project Settings → Triggers, add a Schedule:
     every 15 minutes, branch main, pipeline parameter
     run_image_process_queue = true. Attach the image-process context
     if you created one.
  5. Or trigger the same pipeline from n8n / Zapier (see the README).

Do not put tokens in the repo. GitHub Actions is billing-locked; this
runner is CircleCI (or ops/self-hosted-ci on a machine Audrey controls).
"""


def github_token() -> str | None:
    for key in ("IMAGE_PROCESS_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"):
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return None


def repo_slug() -> str:
    explicit = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if explicit:
        return explicit
    user = os.environ.get("CIRCLE_PROJECT_USERNAME", "").strip()
    name = os.environ.get("CIRCLE_PROJECT_REPONAME", "").strip()
    if user and name:
        return f"{user}/{name}"
    return "midnghtsapphire/reese-reviews"


def _gh_api(
    method: str,
    path: str,
    *,
    token: str,
    body: dict | None = None,
    raw_out: bool = False,
) -> dict | list | str:
    url = path if path.startswith("http") else f"https://api.github.com{path}"
    cmd = [
        "curl",
        "-sS",
        "-X",
        method,
        "-H",
        f"Authorization: Bearer {token}",
        "-H",
        "Accept: application/vnd.github+json",
        "-H",
        "X-GitHub-Api-Version: 2022-11-28",
        "--max-time",
        "30",
        url,
    ]
    if body is not None:
        cmd.extend(["-H", "Content-Type: application/json", "-d", json.dumps(body)])
    out = subprocess.check_output(cmd)
    if raw_out:
        return out.decode("utf-8", "replace")
    if not out.strip():
        return {}
    return json.loads(out.decode("utf-8"))


def list_open_jobs(token: str, repo: str) -> list[dict]:
    data = _gh_api(
        "GET",
        f"/repos/{repo}/issues?state=open&labels={IMAGE_PROCESS_LABEL}&per_page=50",
        token=token,
    )
    if not isinstance(data, list):
        raise RuntimeError(f"Unexpected GitHub issues response: {data!r}"[:400])
    jobs = []
    for issue in data:
        labels = {str(lab.get("name") or "") for lab in issue.get("labels") or []}
        if IMAGE_DONE_LABEL in labels:
            continue
        if issue.get("pull_request"):
            continue
        jobs.append(issue)
    return jobs


def parse_issue(issue: dict) -> ImageProcessRequest:
    return parse_issue_body(
        issue.get("body") or "",
        issue_number=issue.get("number"),
        issue_url=issue.get("html_url") or "",
        title=issue.get("title") or "",
    )


def output_dir_for(issue_number: int, root: Path) -> Path:
    return root / f"issue-{issue_number}"


def run_request(
    req: ImageProcessRequest, dest_dir: Path
) -> tuple[list[Path], str | None, str | None]:
    """Process one WR. Returns (output paths, source_url, error)."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    source = req.source()
    if not source:
        return [], None, "No product URL, ASIN, or image link was given."
    source_url = None
    try:
        if source.startswith("http://") or source.startswith("https://") or len(source) == 10:
            img, source_url = load_from_url_or_asin(source)
        else:
            img, _ = load_image(source)
    except Exception as exc:
        return [], None, f"Could not copy the product image: {exc}"

    from .fetch import save_original

    original_path = save_original(img, dest_dir / "original.jpg")
    written = [original_path]
    steps = req.steps_or_default()
    filter_name = req.color_filter if req.wants(STEP_FILTER) else "none"
    try:
        for name in req.presets_or_default():
            spec = spec_for(name)
            result = process_image(
                img,
                background=spec.background,
                color_filter=filter_name,
                remove_text=req.wants(STEP_TEXT),
                do_crop=req.wants(STEP_CROP),
                do_background=req.wants(STEP_BACKGROUND),
                preset=name,
            )
            dest = dest_dir / f"product{spec.suffix}"
            written.append(save_image(result, dest, background=spec.background))
    except Exception as exc:
        return written, source_url, f"Processing failed: {exc}"
    # STEP_COPY is recorded on the original we just saved.
    _ = STEP_COPY
    return written, source_url, None


def _git(cwd: Path, *args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=str(cwd), text=True)


def ensure_output_branch(repo_dir: Path, token: str, repo: str) -> None:
    """Check out review-images (create from the current HEAD if needed). No force-push."""
    # Fetch the branch if it exists on the remote.
    remote = f"https://x-access-token:{token}@github.com/{repo}.git"
    fetch = subprocess.run(
        ["git", "fetch", remote, f"{OUTPUT_BRANCH}:refs/remotes/origin/{OUTPUT_BRANCH}"],
        cwd=str(repo_dir),
        capture_output=True,
        text=True,
    )
    if fetch.returncode == 0:
        _git(repo_dir, "checkout", OUTPUT_BRANCH)
        return
    # Create the branch locally from the current commit without deleting anything.
    _git(repo_dir, "checkout", "-B", OUTPUT_BRANCH)


def commit_and_push(repo_dir: Path, token: str, repo: str, issue_number: int, paths: list[Path]) -> str:
    _git(repo_dir, "config", "user.name", "Auky")
    _git(repo_dir, "config", "user.email", "4635833+midnghtsapphire@users.noreply.github.com")
    rels = [str(p.relative_to(repo_dir)) for p in paths]
    _git(repo_dir, "add", "--", *rels)
    status = _git(repo_dir, "status", "--porcelain")
    if not status.strip():
        return f"https://github.com/{repo}/tree/{OUTPUT_BRANCH}/issue-{issue_number}"
    message = (
        f"Auky: add processed images for issue #{issue_number}\n\n"
        f"Outputs for Product Image Process WR #{issue_number}.\n\n"
        f"{AUKY_SIGN}"
    )
    _git(repo_dir, "commit", "-m", message)
    # Regular push only. Never --force.
    remote = f"https://x-access-token:{token}@github.com/{repo}.git"
    subprocess.check_call(
        ["git", "push", remote, f"HEAD:{OUTPUT_BRANCH}"],
        cwd=str(repo_dir),
    )
    return f"https://github.com/{repo}/tree/{OUTPUT_BRANCH}/issue-{issue_number}"


def comment_and_label(
    token: str,
    repo: str,
    issue_number: int,
    *,
    folder_url: str,
    files: list[Path],
    source_url: str | None,
    error: str | None,
    notion_ok: str | None,
) -> None:
    lines = [
        f"**Auky:** Processed Product Image Process WR #{issue_number}.",
        "",
    ]
    if source_url:
        lines.append(f"Copied image from: {source_url}")
        lines.append("")
    if files:
        lines.append(f"Files on the `{OUTPUT_BRANCH}` branch: {folder_url}")
        lines.append("")
        for path in files:
            name = path.name
            raw = (
                f"https://raw.githubusercontent.com/{repo}/{OUTPUT_BRANCH}/"
                f"issue-{issue_number}/{name}"
            )
            blob = (
                f"https://github.com/{repo}/blob/{OUTPUT_BRANCH}/"
                f"issue-{issue_number}/{name}"
            )
            lines.append(f"- [{name}]({blob}) ([raw]({raw}))")
        lines.append("")
    if notion_ok:
        lines.append(notion_ok)
        lines.append("")
    if error:
        lines.append(f"Stopped short: {error}")
        lines.append("The issue was left without the image-done label so it can be retried.")
        lines.append("")
    lines.append(AUKY_SIGN)
    _gh_api(
        "POST",
        f"/repos/{repo}/issues/{issue_number}/comments",
        token=token,
        body={"body": "\n".join(lines)},
    )
    if not error:
        _gh_api(
            "POST",
            f"/repos/{repo}/issues/{issue_number}/labels",
            token=token,
            body={"labels": [IMAGE_DONE_LABEL]},
        )


def maybe_upload_notion(req: ImageProcessRequest, files: list[Path]) -> str | None:
    page = (req.notion_page_url or "").strip()
    if not page:
        return None
    token = os.environ.get("NOTION_TOKEN", "").strip()
    if not token:
        return (
            "A Notion page was given, but NOTION_TOKEN is not set in the "
            "CircleCI context, so nothing was uploaded."
        )
    # Prefer the review (white, original-size) file, else the first finished photo.
    review = next((p for p in files if p.name.endswith("-final-review.jpg")), None)
    photo = review or next((p for p in files if p.suffix.lower() in {".jpg", ".jpeg", ".png"} and p.name != "original.jpg"), None)
    if photo is None:
        return "No finished photo was available to upload to Notion."
    from PIL import Image

    img = Image.open(photo)
    img.load()
    NotionTokenUploader().upload(page, img, filename=photo.name)
    return f"Uploaded {photo.name} to the Notion page (existing content was left in place)."


def main(argv: list[str] | None = None) -> int:
    token = github_token()
    if not token:
        sys.stderr.write(SETUP_HELP)
        return 2
    repo = repo_slug()
    start = Path(os.environ.get("CIRCLE_WORKING_DIRECTORY") or os.getcwd()).expanduser().resolve()
    repo_dir = start
    here = start
    for _ in range(8):
        if (here / ".git").exists():
            repo_dir = here
            break
        if here.parent == here:
            break
        here = here.parent
    print(f"review-image queue {__version__} repo={repo}")
    issues = list_open_jobs(token, repo)
    if not issues:
        print("No open image-process issues without image-done.")
        return 0
    print(f"Found {len(issues)} open WR(s).")
    ensure_output_branch(repo_dir, token, repo)
    had_error = False
    for issue in issues:
        number = int(issue["number"])
        req = parse_issue(issue)
        dest = output_dir_for(number, repo_dir)
        print(f"Processing #{number}: {req.title or ''} source={req.source()!r}")
        files, source_url, error = run_request(req, dest)
        notion_ok = None
        if not error:
            try:
                notion_ok = maybe_upload_notion(req, files)
            except Exception as exc:
                notion_ok = f"Notion upload failed: {exc}"
        try:
            folder_url = commit_and_push(repo_dir, token, repo, number, files) if files else (
                f"https://github.com/{repo}/tree/{OUTPUT_BRANCH}"
            )
        except Exception as exc:
            error = (error + "; " if error else "") + f"git push failed: {exc}"
            folder_url = f"https://github.com/{repo}/tree/{OUTPUT_BRANCH}"
        try:
            comment_and_label(
                token,
                repo,
                number,
                folder_url=folder_url,
                files=files,
                source_url=source_url,
                error=error,
                notion_ok=notion_ok,
            )
        except Exception as exc:
            sys.stderr.write(f"Could not comment on #{number}: {exc}\n")
            had_error = True
            continue
        if error:
            had_error = True
            print(f"  incomplete: {error}")
        else:
            print(f"  done: {folder_url}")
    return 1 if had_error else 0


if __name__ == "__main__":
    raise SystemExit(main())
