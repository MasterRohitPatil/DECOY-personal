from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.schema import SecurityEvent, Warning, Asset, AuditLog, RelationshipEdges

def current_time():
    return datetime.now(timezone.utc)

ATTACK_SCENARIOS = {
    "brute-force": {
        "event_type": "BRUTE_FORCE",
        "title": "SSH Credential Brute Force Flood Detected",
        "target_hostname": "auth-srv-01.prod.sentinel",
        "source_ip": "198.51.100.23",
        "severity": "CRITICAL",
        "payload": "18 failed SSH password attempts for root/admin within 4.2 seconds. Origin matches known scanner network.",
        "cvss": 8.5,
        "exploitation_level": 4,
        "is_kev": False,
        "playbook_key": "pb_brute_force"
    },
    "dos": {
        "event_type": "DOS_BURST",
        "title": "High-Volume Layer 7 HTTP Request Flood",
        "target_hostname": "edge-proxy-01.prod.sentinel",
        "source_ip": "203.0.113.88",
        "severity": "CRITICAL",
        "payload": "120 rapid requests/sec targeting /login. Rate-limit threshold exceeded by 400%. Service latency degradation observed.",
        "cvss": 7.8,
        "exploitation_level": 3,
        "is_kev": False,
        "playbook_key": "pb_brute_force"
    },
    "unauthorized-access": {
        "event_type": "UNAUTHORIZED_ACCESS",
        "title": "Unauthorized Privilege Escalation & Key Probe",
        "target_hostname": "sec-vault-01.prod.sentinel",
        "source_ip": "192.0.2.45",
        "severity": "HIGH",
        "payload": "Direct API probe on /v1/sys/raw/keys using expired bearer token from internal DMZ subnet.",
        "cvss": 7.5,
        "exploitation_level": 2,
        "is_kev": False,
        "playbook_key": "pb_brute_force"
    },
    "malicious-ip": {
        "event_type": "MALICIOUS_IP",
        "title": "Correlated C2 Botnet Communication Observed",
        "target_hostname": "vpn-gw-01.prod.sentinel",
        "source_ip": "45.33.32.156",
        "severity": "CRITICAL",
        "payload": "Inbound connection handshake from IP listed in abuse.ch Feodo Tracker / Mirai C2 blocklist.",
        "cvss": 9.2,
        "exploitation_level": 5,
        "is_kev": True,
        "playbook_key": "pb_brute_force"
    },
    "phishing": {
        "event_type": "PHISHING",
        "title": "Credential Harvester Phishing Lure Flagged",
        "target_hostname": "web-portal-01.prod.sentinel",
        "source_ip": "185.220.101.5",
        "severity": "HIGH",
        "payload": "Employee report: Spoofed notification email directing users to deceptive domain 'paypa1-secure-auth[.]com'.",
        "cvss": 7.0,
        "exploitation_level": 3,
        "is_kev": False,
        "playbook_key": "pb_brute_force"
    },
    "ransomware": {
        "event_type": "RANSOMWARE_BACKDOOR",
        "title": "Supply Chain Backdoor & Memory Injection Payload",
        "target_hostname": "auth-srv-01.prod.sentinel",
        "source_ip": "185.220.101.5",
        "severity": "CRITICAL",
        "payload": "Suspicious process injection in sshd daemon matching CVE-2024-3094 upstream backdoor signature. Stage-1 staging detected.",
        "cvss": 9.8,
        "exploitation_level": 5,
        "is_kev": True,
        "playbook_key": "pb_brute_force"
    }
}

def simulate_attack(db: Session, attack_type: str) -> Dict[str, Any]:
    scenario = ATTACK_SCENARIOS.get(attack_type)
    if not scenario:
        raise ValueError(f"Unknown attack scenario: {attack_type}")

    # 1. Locate target asset
    asset = db.query(Asset).filter(Asset.hostname == scenario["target_hostname"]).first()
    asset_id = asset.id if asset else None

    # 2. Record Security Event
    event = SecurityEvent(
        event_type=scenario["event_type"],
        source_ip=scenario["source_ip"],
        target_asset_id=asset_id,
        payload=scenario["payload"],
        severity=scenario["severity"],
        simulated=True
    )
    db.add(event)
    db.commit()

    # 3. Create active warning
    warning_id = f"W-ATK-{int(datetime.now().timestamp()) % 10000:04d}"
    dimensions = {"S": scenario["cvss"] / 10.0, "E": 0.90, "X": 1.0, "V": 0.80, "I": 0.90}
    score = 91.2 if scenario["severity"] == "CRITICAL" else 76.5
    band = scenario["severity"]

    warning = Warning(
        id=warning_id,
        security_event_id=event.id,
        asset_id=asset_id,
        title=scenario["title"],
        dimensions_json=dimensions,
        confidence=0.96,
        band=band,
        risk_score=score,
        rules_fired=["LIVE_ATTACK_TELEMETRY_MATCH", "R2_KEV_CONFIRMED_INTERNET_FACING" if scenario["is_kev"] else "R3_KEV_CONFIRMED_OR_LIKELY"],
        status="TRIAGED",
        brief_summary=f"LIVE ATTACK: {scenario['payload']} Target: {scenario['target_hostname']} from Attacker IP: {scenario['source_ip']}."
    )
    db.add(warning)

    # 4. Add relationship edge
    db.add(RelationshipEdges(
        source_type="IOC",
        source_id=scenario["source_ip"],
        target_type="ASSET",
        target_id=scenario["target_hostname"],
        relationship_type="ATTACKS",
        confidence=0.98
    ))

    # 5. Audit log
    db.add(AuditLog(
        actor="ATTACK_CORRELATOR",
        action="ATTACK_DETECTED",
        object=warning_id,
        before_state={"event": scenario["event_type"]},
        after_state={"status": "TRIAGED", "score": score, "band": band},
        reason=f"Correlated attack stream on {scenario['target_hostname']}",
        simulated=True
    ))
    db.commit()

    return {
        "event_id": event.id,
        "warning_id": warning_id,
        "attack_type": attack_type,
        "source_ip": scenario["source_ip"],
        "target_hostname": scenario["target_hostname"],
        "severity": scenario["severity"],
        "score": score
    }

