"""Render a markdown report suitable for pasting into a WR issue."""

from __future__ import annotations

from typing import Any


def _example_banner(report: dict[str, Any]) -> str:
    if report.get("example"):
        return (
            "> This file is labeled **EXAMPLE ONLY**. It is sample data for the "
            "rules engine, not a real product review or a real KDP title.\n"
        )
    return ""


def _source_line(item: dict[str, Any]) -> str:
    kind = item.get("source_kind") or "official"
    url = item.get("source_url") or ""
    quote = (item.get("source_quote") or "").replace("\n", " ").strip()
    if kind == "house_rule":
        who = item.get("house_attribution") or "Audrey"
        line = f"house_rule (Audrey / {who})"
        if url:
            line += f" — {url}"
        if quote:
            line += f' — “{quote}”'
        return line
    line = "official"
    if url:
        line += f" — {url}"
    if quote:
        line += f' — “{quote}”'
    return line


def render_markdown(report: dict[str, Any]) -> str:
    doc = report.get("document") or {}
    product = doc.get("product") or doc.get("title") or "(untitled)"
    asin = doc.get("asin") or ""
    overall = report["overall"]
    lines = [
        "# Amazon rules engine report",
        "",
        _example_banner(report).rstrip(),
        "",
        f"- Pack: `{report['pack']}` ({report.get('pack_version') or 'unversioned'})",
        f"- File: `{report['document_path']}`",
        f"- Product or title: {product}",
    ]
    if asin:
        lines.append(f"- ASIN: `{asin}`")
    if doc.get("review_source"):
        lines.append(f"- Source: {doc['review_source']}")
    if doc.get("used"):
        lines.append(f"- Used: {doc['used']}")
    lines.extend(
        [
            f"- Overall: **{overall}** "
            f"({report['fail_count']} FAIL, {report['warn_count']} WARN, {report['pass_count']} PASS)",
            "",
            "The engine automates WR stages 1–3 as checks only. It does **not** post "
            "to Amazon or KDP. Audrey reviews this report area. Proofy does the final "
            "review and, after **Proofy: FINAL APPROVED** and **Audrey's yes**, uploads "
            "manually in the browser, one item at a time.",
            "",
            "## Results",
            "",
            "| ID | Severity | Result | Message | Detail |",
            "| --- | --- | --- | --- | --- |",
        ]
    )
    for item in report["results"]:
        detail = (item.get("detail") or "").replace("|", "\\|")
        message = (item.get("message") or "").replace("|", "\\|")
        evidence = item.get("evidence") or []
        if evidence:
            shown = ", ".join(f"`{hit}`" for hit in evidence[:5])
            detail = f"{detail} Evidence: {shown}".strip()
        lines.append(
            f"| `{item['id']}` | {item['severity']} | **{item['result']}** | {message} | {detail} |"
        )

    fails = [item for item in report["results"] if item["result"] == "FAIL"]
    warns = [item for item in report["results"] if item["result"] == "WARN"]
    if fails:
        lines.extend(["", "## FAIL (must be fixed before Proofy's final review)"])
        for item in fails:
            lines.append(f"- `{item['id']}`: {item['message']} — {item.get('detail') or ''}")
    if warns:
        lines.extend(["", "## WARN (human review needed)"])
        for item in warns:
            lines.append(f"- `{item['id']}`: {item['message']} — {item.get('detail') or ''}")

    lines.extend(["", "## Sources cited by the rules that fired or were checked", ""])
    seen: set[str] = set()
    for item in report["results"]:
        key = f"{item['id']}|{item.get('source_url')}"
        if key in seen:
            continue
        seen.add(key)
        lines.append(f"- `{item['id']}` ({_source_line(item)})")

    unverified = report.get("unverified") or []
    if unverified:
        lines.extend(
            [
                "",
                "## What official public pages do not spell out",
                "",
            ]
        )
        for note in unverified:
            lines.append(f"- {note}")

    notes = report.get("notes") or []
    if notes:
        lines.extend(["", "## Pack notes", ""])
        for note in notes:
            lines.append(f"- {note}")

    lines.extend(
        [
            "",
            "---",
            "",
            "Proofy: this report was produced by the Amazon rules engine. It is not an upload.",
            "— Proofy",
            "",
        ]
    )
    # Drop accidental blank-only gaps from the optional example banner
    cleaned: list[str] = []
    for line in lines:
        if line == "" and cleaned and cleaned[-1] == "":
            continue
        cleaned.append(line)
    return "\n".join(cleaned)
