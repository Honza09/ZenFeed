import importlib


def test_app_package_is_importable() -> None:
    assert importlib.import_module("app") is not None
