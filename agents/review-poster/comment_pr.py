"""Post a status comment on a review PR, signed as Auky."""

from __future__ import annotations

import os
import urllib.error
import urllib.request
import json


def sign(body: str) -> str:
    text = body.strip()
    if not text.startswith("**Auky:**"):
        text = f"**Auky:** {text}"
    if not text.endswith("— Auky"):
        text = f"{text} — Auky"
    return text


def comment_on_pr(repo: str, number: int, body: str, token: str | None = None) -> None:
    token = token or os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        print("No GITHUB_TOKEN; skipping PR comment.")
        print(sign(body))
        return
    url = f"https://api.github.com/repos/{repo}/issues/{number}/comments"
    data = json.dumps({"body": sign(body)}).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"Commented on PR #{number} ({resp.status}).")
    except urllib.error.URLError as exc:
        print(f"Could not comment on PR #{number}: {exc}")
