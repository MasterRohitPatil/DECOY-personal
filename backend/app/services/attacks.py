import uuid
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.schema import SecurityEvent, Warning, Asset, Threat, Exposure, AuditLog, RelationshipEdges
from app.services.scorer import calculate_priority_score

def current_time():
    return datetime.now(timezone.utc)

ATTACK_DEFINITIONS = {
    "brute-force": {
        "event_type": "BRUTE_FORCE",
        "title": "SSH / Auth Credential Brute Force Flood",
        "default_target": "auth-srv-01.prod.sentinel",
        "applicable_software": ["ssh", "openssh", "nginx", "openvpn", "xz-utils"],
        "default_source_ip": "198.51.100.23",
        "protocol": "SSH (Port 22)",
        "cvss_base": 8.5,
        "mitre_tactic": "T1110.001 - Brute Force: Password Guessing",
        "scanner_label": "Known Shodan / Masscan Scanner Origin",
        "payload_generator": lambda host, ip, attempts: f"{attempts} rapid failed authentication attempts for root/admin on {host} from {ip} within 3.8s. High failure frequency matches automated scanner behavior."
    },
    "dos": {
        "event_type": "DOS_BURST",
        "title": "Layer 7 HTTP/2 Rapid Reset Flood",
        "default_target": "edge-proxy-01.prod.sentinel",
        "applicable_software": ["nginx", "ingress-nginx", "envoy", "apache", "http"],
        "default_source_ip": "203.0.113.88",
        "protocol": "HTTP/2 (Port 443)",
        "cvss_base": 7.8,
        "mitre_tactic": "T1498.001 - Network Denial of Service: Direct Flood",
        "scanner_label": "Distributed Mirai / Tor Exit Node Node Pool",
        "payload_generator": lambda host, ip, attempts: f"Multiplexed stream cancellation spike: {attempts * 65} requests/sec flooding /login and /api/v1/auth on {host}. Gateway buffer saturation reached 92%."
    },
    "malicious-ip": {
        "event_type": "MALICIOUS_IP",
        "title": "Correlated C2 Botnet Communication Beacon",
        "default_target": "vpn-gw-01.prod.sentinel",
        "applicable_software": ["openvpn", "vpn", "nginx", "router", "gateway"],
        "default_source_ip": "45.33.32.156",
        "protocol": "TLS Reverse Shell (Port 4444)",
        "cvss_base": 9.2,
        "mitre_tactic": "T1071.001 - Command and Control: Web Protocols",
        "scanner_label": "abuse.ch Feodo Tracker / Mirai C2 Match",
        "payload_generator": lambda host, ip, attempts: f"Outbound periodic beaconing detected from {host} to verified C2 controller {ip}. TLS handshake matches known malware family signature."
    },
    "phishing": {
        "event_type": "PHISHING",
        "title": "Targeted Spear-Phishing Credential Harvester",
        "default_target": "web-portal-01.prod.sentinel",
        "applicable_software": ["web-portal", "react-web", "portal", "email", "auth"],
        "default_source_ip": "185.220.101.5",
        "protocol": "HTTPS (Port 443) / SMTP",
        "cvss_base": 7.5,
        "mitre_tactic": "T1566.002 - Phishing: Spearphishing Link",
        "scanner_label": "Spoofed National Cyber Alert Domain",
        "payload_generator": lambda host, ip, attempts: f"Target host {host}: Deceptive credential harvester lure directing users to 'paypa1-secure-auth[.]com'. {attempts} login attempts submitted from corporate workstation pool."
    },
    "ransomware": {
        "event_type": "RANSOMWARE_BACKDOOR",
        "title": "Supply Chain Backdoor & Memory Injection",
        "default_target": "auth-srv-01.prod.sentinel",
        "applicable_software": ["xz-utils", "sshd", "serv-u", "log4j-core"],
        "default_source_ip": "185.220.101.5",
        "protocol": "Raw Memory Hook (SSHD Daemon)",
        "cvss_base": 9.8,
        "mitre_tactic": "T1055 - Process Injection: Shared Module Injection",
        "scanner_label": "Nation-State Supply Chain Backdoor Artifact",
        "payload_generator": lambda host, ip, attempts: f"Unauthorized hook inside sshd process memory space matching upstream backdoor pattern (CVE-2024-3094). Stage-1 payload extraction confirmed."
    }
}

def simulate_attack(
    db: Session,
    attack_type: str,
    target_hostname: Optional[str] = None
) -> Dict[str, Any]:
    """Execute raw synthetic event generation and run Section 3.4 SEXVI scoring dynamically against actual asset inventory."""
    scenario = ATTACK_DEFINITIONS.get(attack_type)
    if not scenario:
        scenario = ATTACK_DEFINITIONS["brute-force"]

    # 1. Resolve Target Asset from actual inventory
    target_host = target_hostname or scenario["default_target"]
    asset = db.query(Asset).filter(Asset.hostname == target_host).first()
    
    # Fallback to first asset if requested hostname not found
    if not asset:
        asset = db.query(Asset).first()
        target_host = asset.hostname if asset else scenario["default_target"]

    asset_id = asset.id if asset else None
    product_name = (asset.product.lower() if asset and asset.product else "generic")
    asset_version = (asset.version if asset else "1.0.0")
    is_internet_facing = bool(asset.internet_facing if asset else False)
    asset_environment = (asset.environment if asset else "PROD")
    asset_criticality = (asset.criticality if asset else 3)

    # 2. Generate Realistic Raw Telemetry Event
    source_ip = scenario["default_source_ip"]
    attempts_count = random.randint(14, 38)
    raw_payload = scenario["payload_generator"](target_host, source_ip, attempts_count)
    event_ts = current_time()

    event = SecurityEvent(
        event_type=scenario["event_type"],
        source_ip=source_ip,
        target_asset_id=asset_id,
        payload=raw_payload,
        severity="HIGH",
        timestamp=event_ts,
        simulated=True
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 3. Dynamic Exposure Evaluation (Section 3.4 Formula)
    # Check if target asset actually runs software vulnerable to this attack vector
    is_software_applicable = any(app in product_name for app in scenario["applicable_software"])
    
    # Look for active CVE match on this product in DB
    active_threat = None
    all_threats = db.query(Threat).all()
    for th in all_threats:
        for p in th.products:
            p_str = p.get("product", "") if isinstance(p, dict) else str(p)
            if p_str.lower() in product_name:
                active_threat = th
                break
        if active_threat:
            break

    # Determine real exposure status based on inventory reality
    if is_internet_facing and is_software_applicable and active_threat:
        exposure_status = "CONFIRMED_EXPOSED"
        is_kev = active_threat.kev_flag or (scenario["cvss_base"] >= 9.0)
        cvss = max(scenario["cvss_base"], 9.0)
        exploit_level = 5  # Active verified in-progress attack
    elif is_internet_facing and is_software_applicable:
        exposure_status = "CONFIRMED_EXPOSED"
        is_kev = False
        cvss = scenario["cvss_base"]
        exploit_level = 4
    elif is_internet_facing:
        # Host is on public internet, but software doesn't match vector
        exposure_status = "POSSIBLE"
        is_kev = False
        cvss = scenario["cvss_base"] * 0.8
        exploit_level = 2
    elif asset_environment == "ISOLATED":
        # Airgapped host with no external routing
        exposure_status = "NOT_AFFECTED"
        is_kev = False
        cvss = scenario["cvss_base"] * 0.5
        exploit_level = 1
    else:
        # Internal network tier (not internet-facing)
        exposure_status = "POSSIBLE"
        is_kev = False
        cvss = scenario["cvss_base"] * 0.7
        exploit_level = 2

    # Run Section 3.4 SEXVI Priority Formula!
    score_res = calculate_priority_score(
        cvss=cvss,
        exploitation_level=exploit_level,
        is_kev=is_kev,
        epss=0.92 if is_kev else 0.45,
        exposure_status=exposure_status,
        is_internet_facing=is_internet_facing,
        environment=asset_environment,
        asset_criticality=asset_criticality,
        origins_count=3,
        has_compensating_control=False
    )

    final_score = score_res["score"]
    final_band = score_res["band"]
    dimensions = score_res["dimensions"]
    rules_fired = score_res["rules_fired"] + ["LIVE_ATTACK_TELEMETRY_MATCH"]

    # 4. Save or Update Real Warning in PostgreSQL
    warning_id = f"W-ATK-{uuid.uuid4().hex[:8].upper()}"
    warning = Warning(
        id=warning_id,
        security_event_id=event.id,
        asset_id=asset_id,
        threat_id=active_threat.id if active_threat else None,
        title=f"{scenario['title']} on {target_host}",
        dimensions_json=dimensions,
        confidence=score_res.get("confidence", 0.92),
        band=final_band,
        risk_score=final_score,
        rules_fired=rules_fired,
        status="TRIAGED",
        brief_summary=f"LIVE ATTACK: {raw_payload} [Target: {target_host} ({product_name} {asset_version}), Priority Score: {final_score} ({final_band})]."
    )
    db.add(warning)

    # 5. Add Relationship Edge for React Flow Topology
    db.add(RelationshipEdges(
        source_type="IOC",
        source_id=source_ip,
        target_type="ASSET",
        target_id=target_host,
        relationship_type="ATTACKS",
        confidence=0.98
    ))

    # 6. Cryptographic Audit Trail Entry
    db.add(AuditLog(
        actor="SENTINEL_ATTACK_CORRELATOR",
        action="ATTACK_CORRELATED_AND_SCORED",
        object=warning_id,
        before_state={"event": scenario["event_type"], "source_ip": source_ip},
        after_state={
            "target_host": target_host,
            "product": product_name,
            "exposure_status": exposure_status,
            "score": final_score,
            "band": final_band,
            "dimensions": dimensions
        },
        reason=f"Calculated SEXVI priority score ({final_score}) for {scenario['event_type']} based on {target_host} inventory reality.",
        simulated=True
    ))
    db.commit()

    # 7. Construct Dynamic MITRE ATT&CK Kill Chain from Real Event Data
    kill_chain = [
        {
            "step": 1,
            "phase": "Reconnaissance & Ingress",
            "node": "Threat Origin",
            "entity": f"{source_ip} ({scenario['scanner_label']})",
            "detail": f"Inbound {scenario['protocol']} traffic flagged from threat intelligence IOC list.",
            "status": "COMPROMISED",
            "mitre_id": "TA0043 / T1595"
        },
        {
            "step": 2,
            "phase": "Initial Access",
            "node": "Target Perimeter",
            "entity": f"{target_host} ({asset_environment} Tier)",
            "detail": f"Internet-facing: {str(is_internet_facing).upper()} • Criticality Level: {asset_criticality}/5.",
            "status": "ATTACKED" if is_internet_facing else "PROBED_SHIELDED",
            "mitre_id": "TA0001 / " + scenario["mitre_tactic"].split(" - ")[0]
        },
        {
            "step": 3,
            "phase": "Execution & Exposure",
            "node": "Installed Software",
            "entity": f"{product_name.upper()} {asset_version}",
            "detail": f"Inventory Status: {exposure_status} ({'Matching vulnerability active: ' + (active_threat.cve_ids[0] if active_threat and active_threat.cve_ids else 'Yes') if is_software_applicable else 'Non-applicable vector / port blocked'}).",
            "status": "EXPOSED" if exposure_status in ["CONFIRMED_EXPOSED", "LIKELY_EXPOSED"] else "SAFE",
            "mitre_id": "TA0002 / T1059"
        },
        {
            "step": 4,
            "phase": "Potential Impact & Lateral Movement",
            "node": "Downstream Enterprise",
            "entity": f"Downstream Tier ({'Production Core DB' if asset_environment == 'PROD' else 'Non-Prod Cluster'})",
            "detail": f"Calculated SEXVI Score: {final_score} ({final_band}) • Containment: {rules_fired[0]}.",
            "status": "AT_RISK" if final_band in ["CRITICAL", "HIGH"] else "CONTAINED_LOW_RISK",
            "mitre_id": "TA0040 / Impact"
        }
    ]

    return {
        "event_id": event.id,
        "warning_id": warning_id,
        "attack_type": attack_type,
        "source_ip": source_ip,
        "target_hostname": target_host,
        "target_asset": {
            "id": asset_id,
            "hostname": target_host,
            "product": product_name,
            "version": asset_version,
            "environment": asset_environment,
            "internet_facing": is_internet_facing,
            "criticality": asset_criticality
        },
        "exposure_status": exposure_status,
        "is_software_applicable": is_software_applicable,
        "active_threat_cve": active_threat.cve_ids[0] if active_threat and active_threat.cve_ids else None,
        "severity": final_band,
        "score": final_score,
        "dimensions": dimensions,
        "rules_fired": rules_fired,
        "kill_chain": kill_chain,
        "raw_payload": raw_payload
    }
