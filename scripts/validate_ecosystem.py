#!/usr/bin/env python3
"""Validate the curated ecosystem directory without third-party packages."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "ecosystem.json"
ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TAG_PATTERN = re.compile(r"^[A-Z0-9][A-Z0-9 .+/-]*$")
SOURCES = {"open", "closed", "not-applicable"}
PROJECT_FIELDS = {
    "id",
    "category",
    "name",
    "description",
    "maintainer",
    "url",
    "supportUrl",
    "source",
    "tags",
}


def fail(message: str) -> None:
    raise ValueError(message)


def text(value: object, field: str, minimum: int, maximum: int) -> str:
    if not isinstance(value, str):
        fail(f"{field} must be a string")
    if value != value.strip():
        fail(f"{field} must not have leading or trailing whitespace")
    if not minimum <= len(value) <= maximum:
        fail(f"{field} must contain {minimum}..{maximum} characters")
    return value


def identifier(value: object, field: str, maximum: int) -> str:
    result = text(value, field, 1, maximum)
    if not ID_PATTERN.fullmatch(result):
        fail(f"{field} must be a lowercase kebab-case identifier")
    return result


def https_url(value: object, field: str) -> str:
    result = text(value, field, 8, 320)
    parsed = urlsplit(result)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        fail(f"{field} must be a public HTTPS URL without credentials")
    return result


def validate() -> tuple[int, int]:
    try:
        data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        fail(f"cannot read {DATA_PATH.name}: {error}")

    if not isinstance(data, dict) or set(data) != {"version", "categories", "projects"}:
        fail("root must contain only version, categories and projects")
    if data["version"] != 1:
        fail("version must be 1")

    categories = data["categories"]
    projects = data["projects"]
    if not isinstance(categories, list) or not categories:
        fail("categories must be a non-empty array")
    if not isinstance(projects, list):
        fail("projects must be an array")

    category_ids: set[str] = set()
    for index, category in enumerate(categories):
        prefix = f"categories[{index}]"
        if not isinstance(category, dict) or set(category) != {"id", "label", "description"}:
            fail(f"{prefix} contains unexpected or missing fields")
        category_id = identifier(category["id"], f"{prefix}.id", 40)
        if category_id in category_ids:
            fail(f"duplicate category id: {category_id}")
        category_ids.add(category_id)
        text(category["label"], f"{prefix}.label", 2, 48)
        text(category["description"], f"{prefix}.description", 10, 180)

    project_ids: set[str] = set()
    project_urls: set[str] = set()
    for index, project in enumerate(projects):
        prefix = f"projects[{index}]"
        if not isinstance(project, dict):
            fail(f"{prefix} must be an object")
        unknown = set(project) - PROJECT_FIELDS
        required = PROJECT_FIELDS - {"supportUrl"}
        missing = required - set(project)
        if unknown or missing:
            fail(f"{prefix} has unknown fields {sorted(unknown)} or missing fields {sorted(missing)}")

        project_id = identifier(project["id"], f"{prefix}.id", 64)
        if project_id in project_ids:
            fail(f"duplicate project id: {project_id}")
        project_ids.add(project_id)

        category_id = identifier(project["category"], f"{prefix}.category", 40)
        if category_id not in category_ids:
            fail(f"{prefix}.category refers to unknown category: {category_id}")
        text(project["name"], f"{prefix}.name", 2, 72)
        text(project["description"], f"{prefix}.description", 10, 220)
        text(project["maintainer"], f"{prefix}.maintainer", 2, 72)

        primary_url = https_url(project["url"], f"{prefix}.url")
        if primary_url in project_urls:
            fail(f"duplicate primary project URL: {primary_url}")
        project_urls.add(primary_url)
        if "supportUrl" in project:
            https_url(project["supportUrl"], f"{prefix}.supportUrl")

        if project["source"] not in SOURCES:
            fail(f"{prefix}.source must be one of {sorted(SOURCES)}")
        tags = project["tags"]
        if not isinstance(tags, list) or not 1 <= len(tags) <= 5:
            fail(f"{prefix}.tags must contain 1..5 entries")
        if len(tags) != len(set(tags)):
            fail(f"{prefix}.tags contains duplicates")
        for tag_index, tag in enumerate(tags):
            tag_value = text(tag, f"{prefix}.tags[{tag_index}]", 1, 24)
            if not TAG_PATTERN.fullmatch(tag_value):
                fail(f"{prefix}.tags[{tag_index}] must use uppercase display text")

    return len(categories), len(projects)


if __name__ == "__main__":
    try:
        category_count, project_count = validate()
    except ValueError as error:
        print(f"ecosystem validation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
    print(f"ecosystem.json is valid: {category_count} categories, {project_count} entries")
