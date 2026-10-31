import pytest
from app.services.scorer import calculate_priority_score

def test_worked_example_baseline_82_high():
    # NGINX Ingress RCE Baseline:
    # CVSS=8.8 (S=0.88), L3 Vendor (E=0.80), Internet-facing (X=1.0), V=0.36, I=0.80
    res = calculate_priority_score(
        cvss=8.8,
        exploitation_level=3,
        is_kev=False,
        epss=0.85,
        exposure_status="CONFIRMED_EXPOSED",
        is_internet_facing=True,
        environment="PROD",
        asset_criticality=4
    )
    assert res["score"] == 82.0
    assert res["band"] == "HIGH"

def test_worked_example_kev_escalation_93_critical():
    # When added to CISA KEV:
    # E jumps to 1.0, V jumps to 0.90 -> 93.4 Critical!
    res = calculate_priority_score(
        cvss=8.8,
        exploitation_level=5,
        is_kev=True,
        epss=0.98,
        exposure_status="CONFIRMED_EXPOSED",
        is_internet_facing=True,
        environment="PROD",
        asset_criticality=4
    )
    assert res["score"] == 93.4
    assert res["band"] == "CRITICAL"
    assert "R2_KEV_CONFIRMED_INTERNET_FACING" in res["rules_fired"]

def test_rule_r1_no_eligible_exposure():
    # Critical CVSS 10.0, but NOT_AFFECTED -> Score = 0.0, no warning
    res = calculate_priority_score(
        cvss=10.0,
        exploitation_level=5,
        is_kev=True,
        epss=0.99,
        exposure_status="NOT_AFFECTED",
        is_internet_facing=True,
        environment="PROD",
        asset_criticality=5
    )
    assert res["score"] == 0.0
    assert res["band"] == "LOW"
    assert "R1_NO_ELIGIBLE_EXPOSURE" in res["rules_fired"]

def test_rule_r7_compensating_control():
    # Score gets 20% reduction when MITIGATED or compensating control active
    res = calculate_priority_score(
        cvss=8.8,
        exploitation_level=3,
        is_kev=False,
        epss=0.85,
        exposure_status="MITIGATED",
        is_internet_facing=True,
        environment="PROD",
        asset_criticality=4,
        has_compensating_control=True
    )
    assert "R7_COMPENSATING_CONTROL_MITIGATION" in res["rules_fired"]
    assert res["score"] < 82.0

