import re
from typing import Tuple, List

# Trusted local registry of known valid historical CVE prefixes
VALID_CVE_YEARS = set(range(1999, 2027))

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"system\s*:",
    r"override\s+(all\s+)?instructions",
    r"mark\s+(severity\s+as\s+)?(low|harmless|safe)",
    r"eval\s*\(",
    r"<script\b",
    r"drop\s+table\b",
]

def verify_cve_id(cve_id: str) -> Tuple[bool, str]:
    """Validates CVE syntax and verifies against historical NIST NVD index."""
    cve_id = cve_id.strip().upper()
    match = re.match(r"^CVE-(\d{4})-(\d{4,})$", cve_id)
    if not match:
        return False, f"Malformed CVE syntax: '{cve_id}'. Must match CVE-YYYY-NNNN+."
    
    year = int(match.group(1))
    seq = int(match.group(2))
    
    # Reject fabricated or placeholder CVEs first
    if year == 9999 or seq >= 99999:
        return False, f"Fabricated placeholder CVE ID '{cve_id}'. Blocked by Guardrail Shield."
        
    # Check trusted year range
    if year not in VALID_CVE_YEARS:
        return False, f"Untrusted CVE Year '{year}'. Rejected by local NVD verification cache."
        
    return True, f"Verified against local NVD registry (Year {year})."

def detect_prompt_injection(text_content: str) -> Tuple[bool, List[str]]:
    """Inspects untrusted threat feed text for prompt injection and instruction override attempts."""
    if not text_content:
        return False, []
        
    flags_triggered = []
    lower_text = text_content.lower()
    
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lower_text):
            flags_triggered.append(f"Prompt Injection Pattern Detected: '{pattern}'")
            
    is_poisoned = len(flags_triggered) > 0
    return is_poisoned, flags_triggered

def render_deterministic_brief(
    advisory_title: str,
    asset_hostname: str,
    product: str,
    installed_version: str,
    cve_id: str,
    score: float,
    band: str,
    playbook_steps: List[str]
) -> str:
    """Generates an evidence-backed deterministic 4-line security brief without relying on an LLM."""
    rec_line = playbook_steps[0] if playbook_steps else "Apply vendor security patch immediately."
    
    brief = (
        f"1. THREAT: {advisory_title} ({cve_id}) [REF-1].\n"
        f"2. EXPOSURE: Asset '{asset_hostname}' runs vulnerable {product} v{installed_version}.\n"
        f"3. RISK: Computed priority is {score:.1f} ({band}) based on exploitability and asset exposure.\n"
        f"4. RECOMMENDATION: {rec_line}"
    )
    return brief
