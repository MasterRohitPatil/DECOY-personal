import pytest
from app.services.matcher import match_version_to_constraints, normalize_product

def test_product_normalization():
    assert normalize_product("nginx-ingress-controller") == "nginx"
    assert normalize_product("ingress-nginx") == "nginx"
    assert normalize_product("log4j-core") == "log4j"
    assert normalize_product("postgres") == "postgresql"

def test_matcher_confirmed_exposed():
    # Target: NGINX < 1.25.3, installed: 1.24.0 -> CONFIRMED_EXPOSED
    res = match_version_to_constraints("nginx", "1.24.0", "nginx", "< 1.25.3")
    assert res["status"] == "CONFIRMED_EXPOSED"
    assert res["matched"] is True

def test_matcher_not_affected_patched():
    # Installed 1.26.0 is outside < 1.25.3 -> NOT_AFFECTED
    res = match_version_to_constraints("nginx", "1.26.0", "nginx", "< 1.25.3")
    assert res["status"] == "NOT_AFFECTED"
    assert res["matched"] is False

def test_matcher_backport_detection():
    # Installed Ubuntu backported fix -> MITIGATED
    res = match_version_to_constraints("openssl", "3.0.2-0ubuntu1.10", "openssl", "< 3.0.7")
    assert res["status"] == "MITIGATED"
    assert res["matched"] is False

def test_matcher_unknown_inventory_gap():
    # Unknown version -> POSSIBLE
    res = match_version_to_constraints("nginx", "UNKNOWN", "nginx", "< 1.25.3")
    assert res["status"] == "POSSIBLE"
    assert res["matched"] is True
    assert res["confidence"] < 0.50

def test_matcher_unmatched_product():
    # Organization runs postgresql, advisory is for apache-struts -> NOT_AFFECTED
    res = match_version_to_constraints("postgresql", "15.2", "apache-struts", "< 2.5.30")
    assert res["status"] == "NOT_AFFECTED"
    assert res["matched"] is False

