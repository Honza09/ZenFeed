"""Validate the Chrome extension manifest (used by CI; standard library only)."""
import json
import sys

# Permissions the MVP is expected to need (docs/mvp.md section 5).
# Adding another one must be a deliberate change to this list.
ALLOWED_PERMISSIONS = {"activeTab", "scripting", "storage"}


def main(path: str) -> int:
    with open(path, encoding="utf-8") as handle:
        manifest = json.load(handle)

    errors = []
    if manifest.get("manifest_version") != 3:
        errors.append("manifest_version must be 3")
    unexpected = set(manifest.get("permissions", [])) - ALLOWED_PERMISSIONS
    if unexpected:
        errors.append(f"unexpected permissions: {sorted(unexpected)}")

    for error in errors:
        print(f"ERROR: {error}")
    if not errors:
        print("manifest OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
