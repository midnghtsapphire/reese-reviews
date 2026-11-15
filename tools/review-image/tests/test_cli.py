"""CLI tests. No live Notion, no rembg download."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from review_image.cli import main
from review_image.io import default_output_path


def test_cli_writes_final_review_jpg(tmp_path: Path, monkeypatch, capsys):
    monkeypatch.setenv("REVIEW_IMAGE_FORCE_OPENCV", "1")
    src = tmp_path / "widget.jpg"
    img = Image.new("RGB", (180, 120), (30, 160, 40))
    Image.Image.paste(img, Image.new("RGB", (60, 50), (190, 30, 30)), (60, 35))
    img.save(src)
    assert main([str(src), "--filter", "none"]) == 0
    out = default_output_path(src)
    assert out.is_file()
    result = Image.open(out)
    assert result.size == (180, 120)
    printed = capsys.readouterr().out
    assert "Final Review Photo" in printed
    assert str(out) in printed


def test_cli_notion_without_token_prints_instructions(monkeypatch, capsys):
    monkeypatch.delenv("NOTION_TOKEN", raising=False)
    page = "4002aa319908810f9ce4df3f07ac55df"
    code = main(["--notion", page])
    assert code == 2
    err = capsys.readouterr().err
    assert "NOTION_TOKEN" in err
    assert "notion.so/my-integrations" in err
