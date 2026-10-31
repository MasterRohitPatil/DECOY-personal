from typing import Dict, Any, List, Tuple

EXPLOITATION_LADDER = {
    0: 0.10,  # L0: None
    1: 0.40,  # L1: EPSS band
    2: 0.65,  # L2: Public PoC
    3: 0.80,  # L3: Vendor says exploited
    4: 0.90,  # L4: Corroborated by independent origins
    5: 1.00,  # L5: CISA KEV listing
}

def calculate_priority_score(
    cvss: float,
    exploitation_level: int,
    is_kev: bool,
    epss: float,
    exposure_status: str,
    is_internet_facing: bool,
    environment: str,
    asset_criticality: int,
    origins_count: int = 1,
    has_compensating_control: bool = False
) -> Dict[str, Any]:
    rules_fired: List[str] = []

    # 1. Dimension S (Severity: 0.0 - 1.0)
    S = min(max(cvss / 10.0, 0.0), 1.0)

    # 2. Dimension E (Exploitation: 0.1 - 1.0)
    if is_kev:
        E = 1.00
        exploitation_level = 5
    else:
        E = EXPLOITATION_LADDER.get(exploitation_level, 0.10)
        # EPSS adjustment if higher
        if epss > 0.70 and E < 0.60:
            E = 0.60

    # 3. Dimension X (Exposure Factor: 0.0 - 1.0)
    if exposure_status in ["CONFIRMED_EXPOSED", "LIKELY_EXPOSED"]:
        match_mult = 1.0
    elif exposure_status == "POSSIBLE":
        match_mult = 0.6
    elif exposure_status == "MITIGATED":
        match_mult = 0.3
    else:
        match_mult = 0.0

    if is_internet_facing:
        env_factor = 1.0
    elif environment == "ISOLATED":
        env_factor = 0.1
    else:
        env_factor = 0.4  # internal network
    
    X = match_mult * env_factor

    # 4. Dimension V (Velocity / Corroboration: 0.0 - 1.0)
    if is_kev:
        V = 0.90
    else:
        V = min(0.36 + (origins_count - 1) * 0.15, 1.0)

    # 5. Dimension I (Impact / Criticality: 0.2 - 1.0)
    I = min(max(asset_criticality / 5.0, 0.2), 1.0)

    # Base Priority Formula
    raw_score = 100.0 * (0.30 * S + 0.30 * E + 0.20 * X + 0.10 * V + 0.10 * I)

    # Rule R1: No eligible exposure gate
    if exposure_status == "NOT_AFFECTED":
        rules_fired.append("R1_NO_ELIGIBLE_EXPOSURE")
        return {
            "score": 0.0,
            "band": "LOW",
            "confidence": 1.0,
            "rules_fired": rules_fired,
            "dimensions": {"S": round(S, 2), "E": round(E, 2), "X": 0.0, "V": round(V, 2), "I": round(I, 2)},
            "explanation": "No warning generated: installed software is not affected by this vulnerability."
        }

    # Rule R7: Compensating controls adjustment
    if has_compensating_control or exposure_status == "MITIGATED":
        raw_score *= 0.80
        rules_fired.append("R7_COMPENSATING_CONTROL_MITIGATION")

    # Determine Base Band
    score = round(raw_score, 1)

    # Confidence calculation
    base_confidence = 0.88
    if exposure_status == "POSSIBLE":
        base_confidence = 0.45
    if is_kev:
        base_confidence = 0.95
    confidence = round(base_confidence, 2)

    # Determine band based on thresholds
    if score >= 85.0:
        band = "CRITICAL"
    elif score >= 70.0:
        band = "HIGH"
    elif score >= 40.0:
        band = "MEDIUM"
    else:
        band = "LOW"

    # Rule R2: KEV + confirmed exposure + internet-facing -> At least Critical (>= 85)
    if is_kev and exposure_status == "CONFIRMED_EXPOSED" and is_internet_facing:
        rules_fired.append("R2_KEV_CONFIRMED_INTERNET_FACING")
        if score < 85.0:
            score = 93.4
            band = "CRITICAL"
    
    # Rule R3: KEV + confirmed/likely exposure -> At least High (>= 70)
    elif is_kev and exposure_status in ["CONFIRMED_EXPOSED", "LIKELY_EXPOSED"]:
        rules_fired.append("R3_KEV_CONFIRMED_OR_LIKELY")
        if score < 70.0:
            score = 75.0
            band = "HIGH"

    # Rule R4: Possible exposure cap -> Band at most Medium (<= 69)
    if exposure_status == "POSSIBLE":
        rules_fired.append("R4_POSSIBLE_EXPOSURE_CAP")
        if score > 69.0:
            score = 69.0
            band = "MEDIUM"

    # Rule R5: Low confidence cap -> Band at most Medium
    if confidence < 0.40:
        rules_fired.append("R5_LOW_CONFIDENCE_CAP")
        if score > 69.0:
            score = 65.0
            band = "MEDIUM"

    # Rule R6: Non-production isolated asset -> Band at most High (<= 84)
    if environment in ["DEV", "STAGE", "ISOLATED"] and not is_internet_facing:
        rules_fired.append("R6_NON_PROD_ISOLATED_CAP")
        if score > 84.0:
            score = 84.0
            band = "HIGH"

    return {
        "score": score,
        "band": band,
        "confidence": confidence,
        "rules_fired": rules_fired,
        "dimensions": {
            "S": round(S, 2),
            "E": round(E, 2),
            "X": round(X, 2),
            "V": round(V, 2),
            "I": round(I, 2)
        },
        "explanation": f"Score {score} ({band}) calculated via 5-dimension engine. Ladder L{exploitation_level} applied."
    }

