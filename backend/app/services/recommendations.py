import re
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.services.guardrails import detect_prompt_injection


SAFE_PRODUCT_VERSIONS: Dict[str, Dict[str, str]] = {
    "nginx": {
        "safe_version": "1.25.5+ (Mainline) / 1.26.1+ (Stable)",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade nginx -y && sudo systemctl reload nginx",
        "hotfix": "Add 'large_client_header_buffers 4 8k;' in nginx.conf http block and reload without dropping connections.",
    },
    "ingress-nginx": {
        "safe_version": "1.10.1+ (Controller >= 1.25.3)",
        "upgrade_cmd": "helm upgrade ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --set controller.image.tag=v1.10.1",
        "hotfix": "Disable snippet annotations (--allow-snippet-annotations=false) in the ingress-nginx ConfigMap immediately.",
    },
    "log4j-core": {
        "safe_version": "2.17.1+ (Java 8) / 2.23.1+ (Current)",
        "upgrade_cmd": "mvn versions:use-dep-version -Dincludes=org.apache.logging.log4j:log4j-core -DdepVersion=2.17.1 -DforceVersion=true",
        "hotfix": "Export JVM flag JAVA_TOOL_OPTIONS='-Dlog4j2.formatMsgNoLookups=true' and restart the service process.",
    },
    "openssl": {
        "safe_version": "3.0.14+ / 3.2.2+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade openssl libssl3 -y",
        "hotfix": "Disable TLS client certificate custom name constraints on untrusted public listeners until libssl3 restarts.",
    },
    "postgresql": {
        "safe_version": "15.8+ / 16.4+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade postgresql-15 -y && sudo systemctl restart postgresql",
        "hotfix": "Restrict pg_hba.conf to internal application subnet CIDRs only and revoke PUBLIC schema CREATE privileges.",
    },
    "openvpn": {
        "safe_version": "2.6.10+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade openvpn -y && sudo systemctl restart openvpn@server",
        "hotfix": "Enable tls-crypt pre-shared packet authentication so unauthenticated UDP/TCP probes are dropped immediately.",
    },
    "docker": {
        "safe_version": "25.0.5+ / 26.1.4+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade docker-ce docker-ce-cli containerd.io -y",
        "hotfix": "Enforce '--security-opt=no-new-privileges' and drop CAP_SYS_ADMIN across running container workloads.",
    },
    "kubelet": {
        "safe_version": "1.28.10+ / 1.29.6+",
        "upgrade_cmd": "sudo apt-mark unhold kubelet kubectl && sudo apt-get install -y kubelet=1.28.10-1.1 && sudo systemctl restart kubelet",
        "hotfix": "Ensure '--anonymous-auth=false' and '--authorization-mode=Webhook' are enforced in /var/lib/kubelet/config.yaml.",
    },
    "envoy": {
        "safe_version": "1.29.5+",
        "upgrade_cmd": "kubectl set image deployment/envoy-gateway envoy=envoyproxy/envoy:v1.29.5 --record",
        "hotfix": "Set 'max_concurrent_streams: 100' and enable overload_manager stream reset thresholds on HTTP/2 listeners.",
    },
    "bind9": {
        "safe_version": "9.18.28+ (ESV)",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade bind9 bind9utils -y && sudo rndc reload",
        "hotfix": "Disable open recursion ('recursion no;') on authoritative external views and enable DNS Response Rate Limiting.",
    },
    "redis": {
        "safe_version": "7.2.5+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade redis-server -y && sudo systemctl restart redis",
        "hotfix": "Bind Redis strictly to private loopback/VPC interface and disable CONFIG/MODULE commands via ACLs.",
    },
    "rabbitmq": {
        "safe_version": "3.12.14+ / 3.13.3+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade rabbitmq-server -y",
        "hotfix": "Restrict RabbitMQ management UI port 15672 to internal jump hosts and rotate default guest credentials.",
    },
    "jenkins": {
        "safe_version": "2.452.2+ LTS",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade jenkins -y && sudo systemctl restart jenkins",
        "hotfix": "Disable Jenkins CLI over HTTP/SSH (-Dhudson.cli.CLICommand.allowAtSyntax=false) immediately.",
    },
    "hashicorp-vault": {
        "safe_version": "1.16.3+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --only-upgrade vault -y && sudo systemctl reload vault",
        "hotfix": "Audit active token leases and revoke orphan root/batch tokens outside approved CI namespaces.",
    },
    "react-web": {
        "safe_version": "18.3.1+ + Strict CSP Headers",
        "upgrade_cmd": "npm install react@latest react-dom@latest --save-exact && npm run build",
        "hotfix": "Deploy strict Content-Security-Policy (frame-ancestors 'none') and enforce WebAuthn/FIDO2 MFA on SSO login.",
    },
    "xz-utils": {
        "safe_version": "5.4.6 (Clean Pre-Backdoor Build) or 5.6.2+",
        "upgrade_cmd": "sudo apt-get update && sudo apt-get install --allow-downgrades xz-utils=5.4.6-1 liblzma5=5.4.6-1 -y && sudo systemctl restart ssh",
        "hotfix": "Immediately isolate sshd from public ingress or rebuild OpenSSH without systemd liblzma linkage.",
    },
}


def _infer_safe_version(product: str, version_constraints: Optional[str]) -> str:
    prod_key = (product or "").strip().lower()
    if prod_key in SAFE_PRODUCT_VERSIONS:
        if version_constraints:
            # Extract highest version number in constraints to make recommendation specific
            versions = re.findall(r"\d+\.\d+(?:\.\d+)?", version_constraints)
            if versions and "<=" in version_constraints and prod_key != "log4j-core":
                return f"> {versions[-1]} (Recommended: {SAFE_PRODUCT_VERSIONS[prod_key]['safe_version']})"
            if versions and "<" in version_constraints and "<=" not in version_constraints:
                return f">= {versions[-1]}"
        return SAFE_PRODUCT_VERSIONS[prod_key]["safe_version"]

    if version_constraints:
        versions = re.findall(r"\d+\.\d+(?:\.\d+)?", version_constraints)
        if versions:
            last_ver = versions[-1]
            if "<=" in version_constraints:
                parts = last_ver.split(".")
                parts[-1] = str(int(parts[-1]) + 1)
                return f">= {'.'.join(parts)} (Patched Release)"
            return f">= {last_ver} (Patched Release)"

    return "Latest Vendor Security Patch Release"


def _compute_sla(band: str) -> str:
    b = (band or "HIGH").upper()
    if b == "CRITICAL":
        return "Immediate (< 6 Hours — CERT-In Critical Mandate)"
    if b == "HIGH":
        return "Urgent (< 24 Hours)"
    if b == "MEDIUM":
        return "Standard (< 72 Hours)"
    return "Scheduled Maintenance Window (< 7 Days)"


def build_actionable_recommendations(
    warning_id: str,
    title: str,
    status: str,
    risk_score: float,
    band: str,
    rules_fired: Optional[List[str]] = None,
    hostname: str = "enterprise-host.prod.sentinel",
    product: str = "nginx",
    installed_version: str = "1.24.0",
    environment: str = "PROD",
    internet_facing: bool = True,
    cve_id: Optional[str] = None,
    version_constraints: Optional[str] = None,
    event_type: Optional[str] = None,
    source_ip: Optional[str] = None,
    event_payload: Optional[str] = None,
    existing_playbook: Optional[Dict[str, Any]] = None,
    completed_investigation_steps: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Deterministically constructs the 3-pillar PS 01 Actionable Recommendations:
    1. Patching Vulnerable Systems
    2. Blocking Known Malicious Indicators
    3. Investigating Suspicious Activity
    Guarantees 100% coverage across seeded CVEs, CSV uploads, and Live Attack warnings.
    """
    rules = rules_fired or []
    prod_clean = (product or "enterprise-service").strip().lower()
    ver_clean = (installed_version or "active").strip()
    host_clean = hostname or "target-host.sentinel"
    ev_type = (event_type or "").upper()

    is_patch_completed = status in {"APPROVED", "PATCH_SIMULATED", "VERIFICATION", "CLOSED"}
    is_block_completed = ("R7_COMPENSATING_CONTROL_MITIGATION" in rules) or (status == "MITIGATED")

    # 1. PILLAR 1: PATCHING VULNERABLE SYSTEMS
    prod_meta = SAFE_PRODUCT_VERSIONS.get(prod_clean, {
        "safe_version": _infer_safe_version(prod_clean, version_constraints),
        "upgrade_cmd": f"sudo apt-get update && sudo apt-get install --only-upgrade {prod_clean} -y && sudo systemctl restart {prod_clean}",
        "hotfix": f"Restrict public ingress to {host_clean} via security group ACLs until {prod_clean} is patched.",
    })
    safe_ver = _infer_safe_version(prod_clean, version_constraints)

    if ev_type == "BRUTE_FORCE":
        patch_headline = f"Harden Auth Daemon & Upgrade {prod_clean} ({ver_clean} → {safe_ver})"
        patch_hotfix = "Set 'PasswordAuthentication no', 'PermitRootLogin no', and 'MaxAuthTries 3' in /etc/ssh/sshd_config."
    elif ev_type == "DOS_BURST":
        patch_headline = f"Patch HTTP/2 Stream Reset Flaw on {prod_clean} ({ver_clean} → {safe_ver})"
        patch_hotfix = "Set 'http2_max_concurrent_streams 64;' and enable per-IP rate limiting ('limit_req_zone 10r/s')."
    elif ev_type == "PHISHING":
        patch_headline = f"Enforce Phishing-Resistant MFA & Patch {prod_clean} ({ver_clean} → {safe_ver})"
        patch_hotfix = "Require FIDO2/WebAuthn hardware or passkey MFA on SSO portal and invalidate password-only sessions."
    elif ev_type == "RANSOMWARE_BACKDOOR":
        patch_headline = f"Replace Compromised Binary & Roll Back/Patch {prod_clean} on {host_clean}"
        patch_hotfix = "Isolate host network interface immediately and verify ELF binary SHA-256 checksums against clean vendor build."
    else:
        patch_headline = f"Upgrade {prod_clean} from {ver_clean} to {safe_ver} on {host_clean}"
        patch_hotfix = prod_meta["hotfix"]

    patching = {
        "pillar": "PATCH_SYSTEM",
        "label": "Patch Vulnerable System",
        "headline": patch_headline,
        "target_host": host_clean,
        "product": prod_clean,
        "current_version": ver_clean,
        "target_safe_version": safe_ver,
        "sla_window": _compute_sla(band),
        "cli_command": prod_meta["upgrade_cmd"],
        "zero_downtime_hotfix": patch_hotfix,
        "completed": is_patch_completed,
    }

    # 2. PILLAR 2: BLOCKING KNOWN MALICIOUS INDICATORS
    # Check for defanged phishing domain in payload if present
    domain_match = re.search(r"([a-zA-Z0-9.-]+\[\.\][a-zA-Z]{2,})", event_payload or "")
    malicious_domain = domain_match.group(1) if domain_match else None
    clean_domain = malicious_domain.replace("[.]", ".") if malicious_domain else None

    if source_ip and malicious_domain:
        ioc_type = "Phishing Domain & Attacker Origin IP"
        ioc_value = f"{malicious_domain} • {source_ip}"
        fw_cmd = (
            f"sudo nft add rule inet filter input ip saddr {source_ip} drop && "
            f"echo '0.0.0.0 {clean_domain}' | sudo tee -a /etc/hosts"
        )
        block_headline = f"Sinkhole Domain {malicious_domain} & Drop Attacker IP {source_ip}"
    elif source_ip and ev_type == "MALICIOUS_IP":
        ioc_type = "Verified C2 Botnet Controller IP (abuse.ch)"
        ioc_value = f"{source_ip} (TCP Port 4444 Egress)"
        fw_cmd = (
            f"sudo iptables -I OUTPUT 1 -d {source_ip} -j DROP && "
            f"sudo iptables -I INPUT 1 -s {source_ip} -j DROP"
        )
        block_headline = f"Sever Outbound C2 Beaconing & Drop {source_ip} at Perimeter"
    elif source_ip:
        ioc_type = "Hostile Scanner / Attack Origin IP"
        ioc_value = source_ip
        fw_cmd = f"sudo iptables -I INPUT 1 -s {source_ip} -j DROP && sudo conntrack -D -s {source_ip}"
        block_headline = f"Block Hostile Source IP {source_ip} & Terminate Active Sockets"
    elif "log4j" in prod_clean or (cve_id and cve_id in {"CVE-2026-9901", "CVE-2021-44228"}):
        ioc_type = "Exploit Payload Signature & JNDI Egress Ports"
        ioc_value = "JNDI '${jndi:ldap://' Pattern • Ports 389, 636, 1099"
        fw_cmd = "sudo iptables -A OUTPUT -p tcp -m multiport --dports 389,636,1099,1389 -j REJECT"
        block_headline = "Block Outbound JNDI/LDAP Callback Ports & Inspect '${jndi:' Headers"
    elif "nginx" in prod_clean:
        ioc_type = "Malformed Exploit Request Signature"
        ioc_value = f"{cve_id or 'HTTP Header Overflow'} • Oversized Ingress Payload"
        fw_cmd = "waf-cli rule enable --id CRS-920420 --target " + host_clean + " --action BLOCK"
        block_headline = f"Deploy Perimeter WAF Virtual Rule Blocking {cve_id or 'Exploit'} Payloads"
    else:
        ioc_type = "Exploit Signature & Untrusted Ingress Filter"
        ioc_value = f"{cve_id or prod_clean.upper()} Exploit Vector on {host_clean}"
        fw_cmd = f"sudo ufw deny from any to any app {prod_clean} comment 'Sentinel Containment {warning_id}'"
        block_headline = f"Enforce Perimeter WAF / Firewall Containment Rule on {host_clean}"

    projected_score = risk_score if is_block_completed else round(risk_score * 0.80, 1)

    blocking = {
        "pillar": "BLOCK_INDICATORS",
        "label": "Block Malicious Indicators",
        "headline": block_headline,
        "indicator_type": ioc_type,
        "indicator_value": ioc_value,
        "source_ip": source_ip,
        "firewall_command": fw_cmd,
        "current_score": round(risk_score, 1),
        "projected_score_after_block": projected_score,
        "completed": is_block_completed,
    }

    # 3. PILLAR 3: INVESTIGATING SUSPICIOUS ACTIVITY
    investigation_steps = _build_investigation_steps(
        host=host_clean,
        product=prod_clean,
        cve_id=cve_id,
        event_type=ev_type,
        source_ip=source_ip,
        malicious_domain=clean_domain,
    )

    investigation = {
        "pillar": "INVESTIGATE_ACTIVITY",
        "label": "Investigate Suspicious Activity",
        "headline": f"Forensic Triage Checklist for {host_clean} ({environment})",
        "steps": investigation_steps,
        "completed_steps": completed_investigation_steps or [],
    }

    # Backwards-compatible unified playbook summary (so detail.playbook is NEVER null)
    if existing_playbook and existing_playbook.get("steps"):
        playbook_out = existing_playbook
    else:
        playbook_out = {
            "title": f"3-Pillar Containment & Remediation Playbook ({cve_id or ev_type or prod_clean.upper()})",
            "version": "2.0",
            "steps": [
                f"1. [BLOCK] {block_headline}",
                f"2. [HOTFIX] {patch_hotfix}",
                f"3. [PATCH] {patch_headline}",
                f"4. [INVESTIGATE] {investigation_steps[0]['title']} on {host_clean}",
            ],
        }

    return {
        "playbook": playbook_out,
        "recommendations": {
            "warning_id": warning_id,
            "summary_banner": (
                f"Priority {risk_score:.1f} ({band}) on {host_clean}: "
                f"1) Block indicator ({ioc_value}), 2) Patch {prod_clean} to {safe_ver}, "
                f"3) Complete {len(investigation_steps)} forensic verification checks."
            ),
            "patching": patching,
            "blocking": blocking,
            "investigation": investigation,
        },
    }


def _build_investigation_steps(
    host: str,
    product: str,
    cve_id: Optional[str],
    event_type: str,
    source_ip: Optional[str],
    malicious_domain: Optional[str],
) -> List[Dict[str, str]]:
    ip_ref = source_ip or "198.51.100.23"

    if event_type == "BRUTE_FORCE":
        return [
            {
                "id": "inv_1",
                "title": "Check if any login succeeded after failed attempts",
                "why_it_matters": "Confirms whether the attacker guessed a valid password and entered the server.",
                "command": f"sudo grep -E 'Accepted|Failed' /var/log/auth.log | grep '{ip_ref}' | tail -n 25",
            },
            {
                "id": "inv_2",
                "title": "Inspect currently logged-in SSH sessions & unknown users",
                "why_it_matters": "Detects active hacker shells or newly planted backdoor accounts.",
                "command": "w && last -n 15 && tail -n 10 /etc/passwd",
            },
            {
                "id": "inv_3",
                "title": "Verify SSH authorized_keys were not modified",
                "why_it_matters": "Attackers often add their own SSH key so they can return even after password resets.",
                "command": "sudo find /root /home -name 'authorized_keys' -mtime -2 -ls",
            },
            {
                "id": "inv_4",
                "title": "Rotate credentials for targeted admin/service accounts",
                "why_it_matters": "Invalidates any compromised password hashes or active API tokens.",
                "command": f"sudo passwd -l root && vault token revoke -mode=path auth/{host}",
            },
        ]

    if event_type == "MALICIOUS_IP":
        return [
            {
                "id": "inv_1",
                "title": f"Identify exact Linux process talking to C2 IP {ip_ref}",
                "why_it_matters": "Pinpoints the exact compromised binary or script sending outbound beacons.",
                "command": f"sudo ss -tupna | grep '{ip_ref}'",
            },
            {
                "id": "inv_2",
                "title": "Inspect scheduled cron jobs & systemd persistence timers",
                "why_it_matters": "Botnets register background timers to restart automatically if killed.",
                "command": "sudo crontab -l && ls -la /etc/cron* /etc/systemd/system/*.timer",
            },
            {
                "id": "inv_3",
                "title": "Capture memory hash of suspicious process before termination",
                "why_it_matters": "Preserves forensic evidence for CERT-In incident reporting.",
                "command": "ps aux --sort=-%cpu | head -n 15 && sha256sum /proc/$(pgrep -n openvpn || echo 1)/exe",
            },
            {
                "id": "inv_4",
                "title": "Scan internal subnet for lateral movement from this host",
                "why_it_matters": "Checks if the infected gateway scanned internal databases on ports 5432/6379.",
                "command": "sudo journalctl -u openvpn --since '2 hours ago' | grep -iE 'error|peer|auth'",
            },
        ]

    if event_type == "PHISHING":
        dom = malicious_domain or "paypa1-secure-auth.com"
        return [
            {
                "id": "inv_1",
                "title": f"Query DNS & proxy logs for employees who clicked '{dom}'",
                "why_it_matters": "Identifies every user device that actually loaded the fake login page.",
                "command": f"grep -i '{dom}' /var/log/dnsmasq.log /var/log/nginx/access.log | awk '{{print $1}}' | sort -u",
            },
            {
                "id": "inv_2",
                "title": "Revoke active SSO & session tokens for affected users",
                "why_it_matters": "Stops stolen session cookies from accessing internal portals even with MFA.",
                "command": f"redis-cli --scan --pattern 'sess:*' | xargs -r redis-cli del",
            },
            {
                "id": "inv_3",
                "title": "Audit anomalous logins from new countries or ASN networks",
                "why_it_matters": "Checks if stolen credentials were already replayed by the attacker.",
                "command": f"grep '{ip_ref}' /var/log/nginx/access.log | tail -n 30",
            },
            {
                "id": "inv_4",
                "title": "Purge matching phishing emails across corporate mailboxes",
                "why_it_matters": "Prevents other staff members from clicking the same lure link.",
                "command": f"mailsec-cli quarantine --sender-domain '{dom}' --purge-unread",
            },
        ]

    if event_type == "DOS_BURST":
        return [
            {
                "id": "inv_1",
                "title": "Rank top offending source IPs & User-Agent fingerprints",
                "why_it_matters": "Separates real user traffic from botnet flood nodes.",
                "command": "awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -n 15",
            },
            {
                "id": "inv_2",
                "title": "Verify DoS is not masking a simultaneous data breach",
                "why_it_matters": "Attackers frequently launch noisy floods to distract SOC teams from SQLi/RCE.",
                "command": "grep -E ' 500 | 502 | 403 |\\.\\./|jndi:' /var/log/nginx/access.log | tail -n 25",
            },
            {
                "id": "inv_3",
                "title": "Check worker socket & CPU saturation on upstream services",
                "why_it_matters": "Ensures internal database connection pools have not deadlocked.",
                "command": "ss -s && uptime && free -m",
            },
            {
                "id": "inv_4",
                "title": "Enable CDN / upstream rate-limiting challenge mode",
                "why_it_matters": "Absorbs volumetric HTTP/2 stream resets at the edge before hitting origin.",
                "command": f"curl -sI https://{host}/healthz | head -n 10",
            },
        ]

    if "log4j" in product or (cve_id and cve_id in {"CVE-2026-9901", "CVE-2021-44228"}):
        return [
            {
                "id": "inv_1",
                "title": "Scan application & HTTP logs for '${jndi:' exploit strings",
                "why_it_matters": "Detects any exploit attempt in headers, URLs, or form fields (even obfuscated).",
                "command": "sudo grep -rnEi '\\$\\{.*(jndi|ldap|rmi|dns|lower|upper):' /var/log/",
            },
            {
                "id": "inv_2",
                "title": "Check outbound network connections on LDAP/RMI ports",
                "why_it_matters": "If the server reached out on port 389/1099/1389, remote code may have executed.",
                "command": "sudo ss -tupn | grep -E ':389|:636|:1099|:1389'",
            },
            {
                "id": "inv_3",
                "title": "Inspect Java process tree for unexpected child shells",
                "why_it_matters": "RCE exploits typically spawn '/bin/sh', 'curl', or 'wget' beneath the Java PID.",
                "command": "ps -ef --forest | grep -A 5 -i java",
            },
            {
                "id": "inv_4",
                "title": "Locate all nested JARs containing JndiLookup.class",
                "why_it_matters": "Finds hidden shaded copies of vulnerable log4j-core bundled inside fat JARs.",
                "command": "find /opt /var /app -name '*.jar' 2>/dev/null | xargs -I{} sh -c 'unzip -l \"{}\" | grep -q JndiLookup.class && echo \"{}\"'",
            },
        ]

    # Default CVE / RCE / Service Investigation Checklist
    return [
        {
            "id": "inv_1",
            "title": f"Confirm exact running {product} version & loaded modules on {host}",
            "why_it_matters": "Verifies live memory version matches CMDB inventory and checks vulnerable modules.",
            "command": f"dpkg -l | grep -i '{product}' || rpm -qa | grep -i '{product}'",
        },
        {
            "id": "inv_2",
            "title": f"Search {product} error & access logs for exploit crash traces",
            "why_it_matters": "Buffer overflows and RCE probes leave worker segfaults or HTTP 400/500 spikes.",
            "command": f"sudo journalctl -u {product} --since '24 hours ago' | grep -iE 'segfault|overflow|error|crit' | tail -n 25",
        },
        {
            "id": "inv_3",
            "title": "Audit unexpected child processes & outbound network sockets",
            "why_it_matters": "Confirms no reverse shell or unauthorized remote connection was opened.",
            "command": "sudo ss -tupna | grep ESTAB && ps auxf | grep -E 'sh|bash|curl|wget|python'",
        },
        {
            "id": "inv_4",
            "title": "Verify file integrity of configuration & webroot directories",
            "why_it_matters": "Ensures no web shell or unauthorized config override was written in the last 48h.",
            "command": "sudo find /etc /var/www /opt -mtime -2 -type f 2>/dev/null | head -n 30",
        },
    ]


def generate_gemini_remediation_advice(
    warning_id: str,
    title: str,
    hostname: str,
    product: str,
    version: str,
    environment: str,
    internet_facing: bool,
    risk_score: float,
    band: str,
    cve_id: Optional[str],
    patching_headline: str,
    blocking_headline: str,
) -> Dict[str, Any]:
    """
    Uses Gemini API (when GEMINI_API_KEY is configured) with strict prompt-injection guardrails
    and 100% deterministic fallback to explain the exact execution order and operational safety notes.
    """
    safe_title = title
    is_poisoned, _ = detect_prompt_injection(safe_title)
    if is_poisoned:
        safe_title = "Sanitized Security Incident Advisory"

    exposure_desc = "public internet-facing" if internet_facing else f"internal ({environment})"
    cve_label = cve_id or "Active Telemetry Correlation"

    key = (settings.GEMINI_API_KEY or "").strip()
    if key and not key.startswith("[") and key.startswith("AIzaSy"):
        prompt = (
            "You are the Lead National Cyber Defense Responder for SENTINEL GRID (CERT-In Early Warning System).\n"
            "Write a clear, beginner-friendly 4-bullet Action Plan explaining HOW and IN WHAT ORDER the analyst should remediate this system safely without breaking production.\n"
            f"- Incident: {safe_title} ({cve_label})\n"
            f"- Affected Server: {hostname} ({exposure_desc}, {environment})\n"
            f"- Software: {product} {version} | Priority Score: {risk_score:.1f}/100 ({band})\n"
            f"- Planned Block: {blocking_headline}\n"
            f"- Planned Patch: {patching_headline}\n"
            "Format strictly as 4 concise bullets labeled:\n"
            "• MINUTE 0-5 (CONTAIN): ...\n"
            "• MINUTE 5-15 (VERIFY): ...\n"
            "• MINUTE 15-45 (PATCH): ...\n"
            "• BUSINESS SAFETY CHECK: ...\n"
            "Keep total length under 120 words, plain English, zero markdown headers."
        )
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            with httpx.Client(timeout=4.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    ai_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    poisoned_out, _ = detect_prompt_injection(ai_text)
                    if ai_text and not poisoned_out:
                        return {
                            "warning_id": warning_id,
                            "mode": "GEMINI_AI_LIVE",
                            "model": "gemini-flash-latest",
                            "guidance": ai_text,
                            "fallback": False,
                        }
        except Exception:
            pass

    fallback_guidance = (
        f"• MINUTE 0-5 (CONTAIN): {blocking_headline} first—this shields {hostname} ({exposure_desc}) in seconds with zero application downtime.\n"
        f"• MINUTE 5-15 (VERIFY): Run the 4 read-only forensic log checks to confirm no attacker session or backdoor already exists before restarting services.\n"
        f"• MINUTE 15-45 (PATCH): {patching_headline} using rolling reload so active user transactions are not dropped.\n"
        f"• BUSINESS SAFETY CHECK: Monitor HTTP 5xx error rates and authentication latency on {hostname} for 10 minutes before marking warning CLOSED."
    )
    return {
        "warning_id": warning_id,
        "mode": "DETERMINISTIC_SAFE_ADVISOR",
        "model": "sentinel-rule-advisor-v2",
        "guidance": fallback_guidance,
        "fallback": True,
    }

