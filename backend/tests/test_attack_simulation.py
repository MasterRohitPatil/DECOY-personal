import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.services.attacks import simulate_attack
from app.models.schema import AuditLog, SecurityEvent

client = TestClient(app)

def test_attack_scoring_sensitivity_to_inventory():
    """Verify Section 3.4 formula produces distinct scores based on actual asset inventory reality."""
    db = SessionLocal()
    try:
        # 1. Attack against internet-facing, vulnerable prod server
        res_exposed = simulate_attack(db, "brute-force", target_hostname="auth-srv-01.prod.sentinel")
        assert res_exposed["score"] >= 80.0
        assert res_exposed["severity"] in ["CRITICAL", "HIGH"]
        assert res_exposed["target_asset"]["internet_facing"] is True
        assert len(res_exposed["kill_chain"]) == 4
        assert res_exposed["kill_chain"][0]["phase"] == "Reconnaissance & Ingress"

        # 2. Same attack against an isolated, internal database server with no SSH exposure
        res_isolated = simulate_attack(db, "brute-force", target_hostname="isolated-backup-san.sentinel")
        assert res_isolated["score"] <= 65.0
        assert res_isolated["severity"] in ["MEDIUM", "LOW"]
        assert res_isolated["target_asset"]["internet_facing"] is False
        assert res_isolated["is_software_applicable"] is False

        # Mathematical delta verification
        assert res_exposed["score"] > res_isolated["score"] + 20.0
    finally:
        db.close()

def test_attack_api_endpoint_with_custom_target():
    """Verify POST /api/demo/attack/{attack_type} supports target_hostname and returns dynamic kill chain."""
    response = client.post("/api/demo/attack/dos?target_hostname=edge-proxy-01.prod.sentinel")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ATTACK_CORRELATED"
    res = data["result"]
    assert res["target_hostname"] == "edge-proxy-01.prod.sentinel"
    assert res["attack_type"] == "dos"
    assert res["dimensions"]["S"] > 0
    assert "alerts" in data
    assert "whatsapp" in data["alerts"]
    assert "email" in data["alerts"]

def test_audit_trail_and_event_persistence():
    """Verify security event and cryptographic audit log entries are persisted."""
    db = SessionLocal()
    try:
        res = simulate_attack(db, "phishing", target_hostname="web-portal-01.prod.sentinel")
        
        # Check SecurityEvent in DB
        event = db.query(SecurityEvent).filter(SecurityEvent.id == res["event_id"]).first()
        assert event is not None
        assert event.event_type == "PHISHING"
        assert event.source_ip == res["source_ip"]
        assert res["target_hostname"] in event.payload

        # Check AuditLog in DB
        audit = db.query(AuditLog).filter(AuditLog.object == res["warning_id"]).first()
        assert audit is not None
        assert audit.action == "ATTACK_CORRELATED_AND_SCORED"
        assert "dimensions" in audit.after_state
    finally:
        db.close()
