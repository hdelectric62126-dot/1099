#!/usr/bin/env python3
"""Prepare the 1099 Field Ledger locally on Windows without an AI coding session."""

from __future__ import annotations
import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {".git", "node_modules", ".next", "dist", ".wrangler", ".sites-runtime", "__pycache__"}
EXCLUDE_FILES = {"1099-field-ledger-ready.zip"}

def run(cmd: list[str]) -> None:
    print("\n>", " ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)

def command(name: str) -> str | None:
    return shutil.which(name)

def node_version() -> tuple[int, int, int]:
    if not command("node"):
        raise SystemExit("Node.js is not installed. Install Node.js 22.13 or newer first.")
    raw = subprocess.check_output(["node", "--version"], text=True).strip().lstrip("v")
    parts = raw.split(".")
    try:
        return tuple(int(x) for x in parts[:3])  # type: ignore[return-value]
    except ValueError as exc:
        raise SystemExit(f"Could not read Node.js version: {raw}") from exc

def pnpm_prefix() -> list[str]:
    if command("pnpm"):
        return ["pnpm"]
    if command("corepack"):
        return ["corepack", "pnpm"]
    if command("npx"):
        return ["npx", "--yes", "pnpm@11.25.0"]
    raise SystemExit("Could not find pnpm, corepack, or npx.")

def make_zip() -> Path:
    output = ROOT.parent / "1099-field-ledger-ready.zip"
    if output.exists():
        output.unlink()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in ROOT.rglob("*"):
            if not path.is_file():
                continue
            relative = path.relative_to(ROOT)
            if any(part in EXCLUDE_DIRS for part in relative.parts) or relative.name in EXCLUDE_FILES:
                continue
            archive.write(path, relative)
    return output

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-install", action="store_true", help="Skip dependency installation.")
    parser.add_argument("--zip", action="store_true", help="Create a clean source ZIP after checks pass.")
    args = parser.parse_args()

    version = node_version()
    if version < (22, 13, 0):
        raise SystemExit(f"Node.js {version[0]}.{version[1]}.{version[2]} is too old; use 22.13 or newer.")

    pnpm = pnpm_prefix()
    print(f"1099 Field Ledger: {ROOT}")
    print(f"Node.js: {'.'.join(map(str, version))}")
    print(f"Package runner: {' '.join(pnpm)}")

    if not args.skip_install:
        run(pnpm + ["install", "--frozen-lockfile"])
    run(pnpm + ["test"])
    run(pnpm + ["build"])

    if args.zip:
        output = make_zip()
        print(f"\nREADY: {output}")
    else:
        print("\nREADY: tests and build passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
