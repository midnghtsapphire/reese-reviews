"""Evaluate a single YAML rule against a normalized document."""

from __future__ import annotations

import re
from typing import Any

from amazon_rules.ledger import load_ledger_asins
from amazon_rules.normalize import document_text


RESULT_PASS = "PASS"
RESULT_WARN = "WARN"
RESULT_FAIL = "FAIL"


def _field_value(data: dict[str, Any], name: str) -> Any:
    return data.get(name)


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if value == "":
        return True
    if isinstance(value, (list, dict, tuple, set)) and len(value) == 0:
        return True
    return False


def condition_holds(condition: dict[str, Any] | None, data: dict[str, Any]) -> bool:
    if not condition:
        return True
    if "all" in condition:
        return all(condition_holds(item, data) for item in condition["all"])
    if "any" in condition:
        return any(condition_holds(item, data) for item in condition["any"])
    if "not" in condition:
        return not condition_holds(condition["not"], data)
    field = condition.get("field")
    value = _field_value(data, field) if field else None
    op = (condition.get("op") or "eq").lower()
    if op == "nonempty":
        return not _is_empty(value)
    if op == "empty":
        return _is_empty(value)
    if op == "eq":
        return value == condition.get("value")
    if op == "neq":
        return value != condition.get("value")
    if op == "in":
        return value in (condition.get("values") or [])
    if op == "not_in":
        return value not in (condition.get("values") or [])
    if op == "contains":
        return condition.get("value") in (value or [])
    if op == "text_matches":
        fields = condition.get("fields") or ([field] if field else [])
        pattern = re.compile(condition["pattern"])
        return bool(pattern.search(document_text(data, fields)))
    raise ValueError(f"Unsupported condition op: {op}")


def _search_text(data: dict[str, Any], rule: dict[str, Any]) -> str:
    fields = rule.get("fields")
    return document_text(data, fields)


def _find_regex(pattern: str, text: str, flags: int = re.IGNORECASE) -> list[str]:
    compiled = re.compile(pattern, flags)
    return [match.group(0) for match in compiled.finditer(text)]


def _keyword_hits(keywords: list[str], text: str, word_boundary: bool = True) -> list[str]:
    hits: list[str] = []
    body = text.lower()
    for raw in keywords:
        word = raw.strip()
        if not word:
            continue
        if word_boundary:
            pattern = r"\b" + re.escape(word.lower()) + r"\b"
            if re.search(pattern, body, flags=re.IGNORECASE):
                hits.append(word)
        elif word.lower() in body:
            hits.append(word)
    return hits


def _field_ok(data: dict[str, Any], rule: dict[str, Any]) -> tuple[bool, str]:
    field = rule.get("field")
    value = _field_value(data, field)
    op = (rule.get("op") or "required").lower()
    if op == "required":
        ok = not _is_empty(value)
        return ok, "" if ok else f"{field} is missing"
    if op == "eq":
        ok = value == rule.get("value")
        return ok, "" if ok else f"{field} is {value!r}, expected {rule.get('value')!r}"
    if op == "neq":
        ok = value != rule.get("value")
        return ok, "" if ok else f"{field} must not be {rule.get('value')!r}"
    if op == "in":
        values = rule.get("values") or []
        ok = value in values
        return ok, "" if ok else f"{field} is {value!r}, expected one of {values!r}"
    if op == "not_in":
        values = rule.get("values") or []
        ok = value not in values
        return ok, "" if ok else f"{field} is {value!r}, which is not allowed"
    if op == "match":
        text = "" if value is None else str(value)
        ok = bool(re.fullmatch(rule["pattern"], text))
        return ok, "" if ok else f"{field}={value!r} does not match {rule['pattern']}"
    if op == "range":
        try:
            number = int(value)
        except (TypeError, ValueError):
            return False, f"{field}={value!r} is not an integer"
        lo = rule.get("min")
        hi = rule.get("max")
        if lo is not None and number < lo:
            return False, f"{field}={number} is below {lo}"
        if hi is not None and number > hi:
            return False, f"{field}={number} is above {hi}"
        return True, ""
    if op == "nonempty":
        ok = not _is_empty(value)
        return ok, "" if ok else f"{field} is empty"
    if op == "empty":
        ok = _is_empty(value)
        return ok, "" if ok else f"{field} is not empty"
    raise ValueError(f"Unsupported field op: {op}")


def _length_ok(data: dict[str, Any], rule: dict[str, Any]) -> tuple[bool, str]:
    # Only run when the rule itself cites an official bound.
    fields = rule.get("fields") or [rule.get("field")]
    text = document_text(data, [f for f in fields if f])
    minimum = rule.get("min")
    maximum = rule.get("max")
    length = len(text)
    if minimum is None and maximum is None:
        return True, "No official length bound is stated on the cited page"
    if minimum is not None and length < minimum:
        return False, f"length {length} is below official minimum {minimum}"
    if maximum is not None and length > maximum:
        return False, f"length {length} is above official maximum {maximum}"
    return True, f"length {length} is within the cited official bounds"


def evaluate_rule(
    rule: dict[str, Any],
    data: dict[str, Any],
    *,
    ledger_path=None,
) -> dict[str, Any]:
    """Return a result dict: id, severity, result, message, evidence."""
    severity = (rule.get("severity") or "fail").lower()
    rule_id = rule["id"]
    message = rule.get("message") or ""
    evidence: list[str] = []
    skipped = False

    if not condition_holds(rule.get("when"), data):
        return {
            "id": rule_id,
            "severity": severity,
            "result": RESULT_PASS,
            "message": message,
            "detail": "Rule did not apply (when-condition was false).",
            "evidence": [],
            "skipped": True,
            "source_kind": rule.get("source_kind") or "official",
            "source_url": rule.get("source_url") or "",
            "source_quote": rule.get("source_quote") or "",
            "house_attribution": rule.get("house_attribution") or "",
        }

    if condition_holds(rule.get("except_when"), data) and rule.get("except_when"):
        return {
            "id": rule_id,
            "severity": severity,
            "result": RESULT_PASS,
            "message": message,
            "detail": "Exception applied (except_when was true).",
            "evidence": [],
            "skipped": True,
            "source_kind": rule.get("source_kind") or "official",
            "source_url": rule.get("source_url") or "",
            "source_quote": rule.get("source_quote") or "",
            "house_attribution": rule.get("house_attribution") or "",
        }

    check = (rule.get("check") or "regex").lower()
    ok = True
    detail = ""

    if check == "regex":
        text = _search_text(data, rule)
        flags = re.IGNORECASE
        if rule.get("case_sensitive"):
            flags = 0
        hits = _find_regex(rule["pattern"], text, flags)
        ok = len(hits) == 0
        if rule.get("invert"):
            ok = not ok
        evidence = hits[:8]
        detail = f"Matched {evidence}" if hits else "No match"
    elif check == "keyword":
        text = _search_text(data, rule)
        hits = _keyword_hits(
            list(rule.get("keywords") or []),
            text,
            word_boundary=rule.get("word_boundary", True),
        )
        ok = len(hits) == 0
        if rule.get("invert"):
            ok = not ok
        evidence = hits
        detail = f"Found keywords {hits}" if hits else "No listed keywords found"
    elif check == "field":
        ok, detail = _field_ok(data, rule)
        if rule.get("invert"):
            ok = not ok
            if ok:
                detail = ""
    elif check == "length":
        ok, detail = _length_ok(data, rule)
    elif check == "duplicate":
        field = rule.get("field") or "asin"
        current = str(_field_value(data, field) or "").strip().upper()
        if not current:
            ok = False
            detail = f"{field} is missing, so a duplicate check cannot be completed"
        elif ledger_path is None:
            ok = True
            detail = "No ledger path was provided; duplicate check skipped"
            skipped = True
        else:
            records = load_ledger_asins(ledger_path)
            if current in records:
                ok = False
                row = records[current]
                detail = (
                    f"ASIN {current} is already in the local ledger"
                    + (f" (WR {row['wr_issue']})" if row.get("wr_issue") else "")
                    + (f": {row['notes']}" if row.get("notes") else "")
                )
                evidence = [current]
            else:
                ok = True
                detail = f"ASIN {current} is not in the local ledger"
    elif check == "reminder":
        # Always emit the configured severity when the when-condition already passed.
        ok = False
        detail = rule.get("detail") or "Reminder"
    else:
        raise ValueError(f"Unsupported check type: {check}")

    if ok:
        result = RESULT_PASS
    elif severity == "warn":
        result = RESULT_WARN
    elif severity == "info":
        result = RESULT_WARN
    else:
        result = RESULT_FAIL

    return {
        "id": rule_id,
        "severity": severity,
        "result": result,
        "message": message,
        "detail": detail,
        "evidence": evidence,
        "skipped": skipped,
        "source_kind": rule.get("source_kind") or "official",
        "source_url": rule.get("source_url") or "",
        "source_quote": rule.get("source_quote") or "",
        "house_attribution": rule.get("house_attribution") or "",
    }
