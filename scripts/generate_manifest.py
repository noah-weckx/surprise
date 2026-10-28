#!/usr/bin/env python3
"""Build JSON and file://-friendly JavaScript manifests for the archive."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content"
MANIFEST_PATH = CONTENT_DIR / "manifest.json"
FALLBACK_PATH = CONTENT_DIR / "manifest-data.js"
FOLDERS = ("audio", "lyrics", "letters", "code")
TEXT_EXTENSIONS = {
    ".md", ".markdown", ".txt", ".py", ".js", ".ts", ".html", ".css", ".json", ".yaml", ".yml"
}
IGNORE_NAMES = {"manifest.json", "manifest-data.js"}


def parse_value(raw: str) -> Any:
    value = raw.strip()
    if value.startswith("[") and value.endswith("]"):
        try:
            result = json.loads(value)
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            return [part.strip().strip("'\"") for part in value[1:-1].split(",") if part.strip()]
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_markdown(text: str) -> tuple[dict[str, Any], str]:
    match = re.match(r"\A(?:\ufeff)?---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|$)", text, re.DOTALL)
    if not match:
        return {}, text

    metadata: dict[str, Any] = {}
    current_list: str | None = None
    for line in match.group(1).splitlines():
        list_item = re.match(r"^\s+-\s+(.+?)\s*$", line)
        if list_item and current_list:
            metadata[current_list].append(str(parse_value(list_item.group(1))))
            continue
        key_value = re.match(r"^([A-Za-z_][\w-]*):\s*(.*?)\s*$", line)
        if not key_value:
            current_list = None
            continue
        key, raw_value = key_value.groups()
        key = key.lower().replace("-", "_")
        if key == "tags" and not raw_value:
            metadata[key] = []
            current_list = key
        else:
            metadata[key] = parse_value(raw_value)
            current_list = None
    body = text[match.end():].lstrip("\r\n")
    return metadata, body


def load_sidecar(file_path: Path) -> dict[str, Any]:
    candidates = (file_path.with_name(file_path.name + ".json"), file_path.with_suffix(".json"))
    for candidate in candidates:
        if candidate == file_path or not candidate.is_file():
            continue
        try:
            value = json.loads(candidate.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError) as error:
            relative_path = candidate.relative_to(ROOT)
            raise ValueError(f"Unable to read metadata sidecar {relative_path}: {error}") from error
        if not isinstance(value, dict):
            relative_path = candidate.relative_to(ROOT)
            raise ValueError(f"Metadata sidecar must contain a JSON object: {relative_path}")
        return value
    return {}


def normalized_tags(value: Any) -> list[str]:
    if value is None:
        return []
    values = value if isinstance(value, list) else re.split(r"[,;]", str(value))
    return [str(tag).strip() for tag in values if str(tag).strip()]


def item_date(metadata: dict[str, Any], path: Path) -> str:
    value = metadata.get("date")
    if value:
        match = re.match(r"^(\d{4}-\d{2}-\d{2})", str(value).strip())
        if match:
            try:
                datetime.strptime(match.group(1), "%Y-%m-%d")
            except ValueError as error:
                raise ValueError(f"Invalid date {value!r} in {path.relative_to(ROOT)}") from error
            return match.group(1)
        raise ValueError(f"Date must use YYYY-MM-DD format in {path.relative_to(ROOT)}")
    stat = path.stat()
    timestamp = getattr(stat, "st_birthtime", None)
    if timestamp is None:
        timestamp = stat.st_ctime if os.name == "nt" else stat.st_mtime
    return datetime.fromtimestamp(timestamp, timezone.utc).date().isoformat()


def build_item(path: Path, category: str) -> dict[str, Any]:
    relative_path = path.relative_to(ROOT).as_posix()
    markdown_body = ""
    frontmatter: dict[str, Any] = {}
    if path.suffix.lower() in TEXT_EXTENSIONS:
        raw_text = path.read_text(encoding="utf-8-sig")
        frontmatter, markdown_body = parse_markdown(raw_text)
    sidecar = load_sidecar(path)
    metadata = {**frontmatter, **sidecar}
    stem_title = path.stem.replace("-", " ").replace("_", " ").strip().title()
    return {
        "id": relative_path,
        "category": category,
        "title": str(metadata.get("title") or stem_title),
        "date": item_date(metadata, path),
        "tags": normalized_tags(metadata.get("tags")),
        "description": str(metadata.get("description") or ""),
        "path": relative_path,
        "text": markdown_body if path.suffix.lower() in {".md", ".markdown"} else (
            raw_text if path.suffix.lower() in TEXT_EXTENSIONS else ""
        ),
    }


def is_sidecar(path: Path) -> bool:
    if path.suffix.lower() != ".json":
        return False
    unwrapped = path.with_suffix("")
    if unwrapped.is_file():
        return True
    return any(sibling != path for sibling in path.parent.glob(path.stem + ".*"))


def main() -> None:
    items: list[dict[str, Any]] = []
    for category in FOLDERS:
        folder = CONTENT_DIR / category
        folder.mkdir(parents=True, exist_ok=True)
        paths = sorted(
            (
                path for path in folder.rglob("*")
                if path.is_file() and path.name not in IGNORE_NAMES and not is_sidecar(path)
            ),
            key=lambda path: path.relative_to(folder).as_posix().lower(),
        )
        for path in paths:
            items.append(build_item(path, category))
    items.sort(key=lambda item: (item["date"], item["title"].casefold()), reverse=True)
    manifest = {"version": 1, "generatedAt": datetime.now(timezone.utc).isoformat(), "items": items}
    manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2)
    MANIFEST_PATH.write_text(manifest_json + "\n", encoding="utf-8")
    serialized = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
    fallback = "/* Generated by scripts/generate_manifest.py. */\n"
    fallback += f"window.ARCHIVE_MANIFEST = {serialized};\n"
    FALLBACK_PATH.write_text(fallback, encoding="utf-8")
    print(
        f"Wrote {len(items)} archive item(s) to {MANIFEST_PATH.relative_to(ROOT)} "
        f"and {FALLBACK_PATH.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
