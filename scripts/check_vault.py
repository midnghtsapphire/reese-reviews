#!/usr/bin/env python3
"""Verify Vault connectivity and secret paths for Reese Reviews."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.clients.vault import get_secret_safe

SERVICES = ["supabase", "elevenlabs", "openrouter", "leonardo", "heygen", "telegram", "spaces"]


def main():
    print("Checking Vault secret paths for Reese Reviews...")
    all_ok = True
    for service in SERVICES:
        try:
            data = get_secret_safe(service)
            keys = list(data.keys()) if data else []
            print(f"  ✓ secret/reese-reviews/{service} — keys: {keys or '(empty/unavailable)'}")
        except Exception as exc:
            print(f"  ✗ secret/reese-reviews/{service} — ERROR: {exc}")
            all_ok = False

    if all_ok:
        print("\nAll Vault paths accessible.")
    else:
        print("\nSome paths failed. Check Vault connectivity and token.")
        sys.exit(1)


if __name__ == "__main__":
    main()
