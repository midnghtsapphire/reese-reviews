import os

import amazon_poster
from comment_pr import sign


def test_amazon_poster_blocks_cloud_ci(monkeypatch):
    monkeypatch.setenv("CIRCLECI", "true")
    monkeypatch.delenv("REVIEW_POSTER_SELF_HOSTED", raising=False)
    try:
        amazon_poster.assert_self_hosted(allow=True)
        raised = False
    except amazon_poster.CloudBlockedError:
        raised = True
    assert raised


def test_amazon_poster_allows_explicit_self_hosted(monkeypatch):
    monkeypatch.delenv("CIRCLECI", raising=False)
    amazon_poster.assert_self_hosted(allow=True)


def test_comment_is_signed():
    text = sign("Published this review to the site.")
    assert text.startswith("**Auky:**")
    assert text.endswith("— Auky")
