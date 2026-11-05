"""Validate the Chrome extension manifest (used by CI; standard library only)."""
import json
import sys

# Permissions the MVP is expected to need (docs/mvp.md section 5).
# Adding another one must be a deliberate change to this list.
ALLOWED_PERMISSIONS = {"activeTab", "scripting", "storage"}
# Host access only to the local backend (docs/rozhodnuti-zf-25.md); pages are
# reached through activeTab after a click, never through host permissions.
ALLOWED_HOST_PERMISSIONS = {"http://127.0.0.1:8000/*"}


def main(path: str) -> int:
    with open(path, encoding="utf-8") as handle:
        manifest = json.load(handle)

    errors = []
    if manifest.get("manifest_version") != 3:
        errors.append("manifest_version must be 3")
    unexpected = set(manifest.get("permissions", [])) - ALLOWED_PERMISSIONS
    if unexpected:
        errors.append(f"unexpected permissions: {sorted(unexpected)}")
    unexpected_hosts = set(manifest.get("host_permissions", [])) - ALLOWED_HOST_PERMISSIONS
    if unexpected_hosts:
        errors.append(f"unexpected host permissions: {sorted(unexpected_hosts)}")
    if manifest.get("content_scripts"):
        errors.append("content_scripts must not be declared; the popup injects them after a click (ZF-08)")

    for error in errors:
        print(f"ERROR: {error}")
    if not errors:
        print("manifest OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
