import pytest
from app.services.alerting import generate_whatsapp_alert, generate_email_alert

def test_whatsapp_no_api_alert():
    alert = generate_whatsapp_alert(
        warning_id="W-2026-001",
        title="Active SSH Brute Force",
        target_hostname="auth-srv-01",
        source_ip="198.51.100.23",
        risk_score=91.2,
        band="CRITICAL",
        recommended_action="Block IP in firewall"
    )
    assert alert["channel"] == "WHATSAPP_NO_API"
    assert "https://wa.me/?text=" in alert["wa_deep_link"]
    assert "198.51.100.23" in alert["formatted_text"]
    assert "CRITICAL" in alert["formatted_text"]

def test_email_alert_generation():
    alert = generate_email_alert(
        warning_id="W-2026-001",
        title="Active SSH Brute Force",
        target_hostname="auth-srv-01",
        source_ip="198.51.100.23",
        risk_score=91.2,
        band="CRITICAL",
        recommended_action="Block IP in firewall"
    )
    assert alert["channel"] == "EMAIL"
    assert "CRITICAL" in alert["subject"]
    assert "auth-srv-01" in alert["html_body"]
    assert "#EF4444" in alert["html_body"]  # Red badge for Critical

