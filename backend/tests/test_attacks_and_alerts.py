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
    assert "#DC2626" in alert["html_body"]  # High-contrast red badge for Critical

def test_pdf_report_generation():
    from app.services.pdf_service import generate_incident_pdf_bytes
    pdf_bytes = generate_incident_pdf_bytes(
        warning_id="W-2026-TEST",
        title="Apache Log4j RCE",
        target_hostname="pay-gateway-01.prod.sentinel",
        source_ip="185.220.101.5",
        risk_score=93.4,
        band="CRITICAL",
        recommended_action="Isolate host and deploy patch",
        product="log4j-core",
        version="2.14.1",
        cve_id="CVE-2021-44228"
    )
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF")

