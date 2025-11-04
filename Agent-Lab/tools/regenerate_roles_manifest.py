#!/usr/bin/env python3
"""
Regenerate roles_manifest.jsonl from JSON cards in 00_Canonical/roles.
Usage:
  python tools/regenerate_roles_manifest.py
"""
import os
import json
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
ROLES_DIR = ROOT / "00_Canonical" / "roles"
MANIFEST = ROLES_DIR / "roles_manifest.jsonl"

def is_role_file(p: pathlib.Path) -> bool:
    return p.suffix == ".json" and p.name not in {"roles_manifest.jsonl"}

def main():
    if not ROLES_DIR.exists():
        print(f"Roles dir not found: {ROLES_DIR}", file=sys.stderr)
        sys.exit(2)

    entries = []
    for p in sorted(ROLES_DIR.glob("*.json")):
        if not is_role_file(p): 
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"Skip {p.name}: JSON load error: {e}", file=sys.stderr)
            continue

        entry = {
            "key": data.get("key"),
            "title": data.get("title"),
            "short_title": data.get("short_title"),
            "autonomy_level": data.get("autonomy_level"),
            "path": f"/Agent-Lab/00_Canonical/roles/{p.name}",
            "effective_date": data.get("effective_date"),
        }
        if not entry["key"] or not entry["title"]:
            print(f"Skip {p.name}: missing key/title", file=sys.stderr)
            continue
        entries.append(entry)

    with open(MANIFEST, "w", encoding="utf-8") as mf:
        for e in entries:
            mf.write(json.dumps(e, ensure_ascii=False) + "\n")

    print(f"Wrote {len(entries)} entries to {MANIFEST}")

if __name__ == "__main__":
    main()
