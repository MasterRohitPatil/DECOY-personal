import re
from typing import Dict, Any, Tuple
from packaging.version import Version, InvalidVersion
from packaging.specifiers import SpecifierSet, InvalidSpecifier

# Canonical Product Alias Table
PRODUCT_ALIASES = {
    "nginx": "nginx",
    "nginx-ingress": "nginx",
    "ingress-nginx": "nginx",
    "nginx-ingress-controller": "nginx",
    "log4j": "log4j",
    "log4j-core": "log4j",
    "apache-log4j": "log4j",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "psql": "postgresql",
    "openssl": "openssl",
    "apache-struts": "apache-struts",
    "struts": "apache-struts",
    "struts2": "apache-struts",
    "redis": "redis",
    "redis-server": "redis",
    "docker": "docker",
    "docker-ce": "docker",
    "kubelet": "kubernetes",
    "kubernetes": "kubernetes",
    "k8s": "kubernetes",
    "envoy": "envoy",
    "envoyproxy": "envoy",
}

def normalize_product(name: str) -> str:
    cleaned = name.lower().strip().replace("_", "-")
    return PRODUCT_ALIASES.get(cleaned, cleaned)

def clean_version_string(ver_str: str) -> Tuple[str, bool]:
    """Cleans distro backport strings like 3.0.2-0ubuntu1.10 -> (3.0.2, True)"""
    is_backport = bool(re.search(r"(?:ubuntu|deb|el\d|redhat)", ver_str, re.IGNORECASE))
    cleaned = re.sub(r"-[a-zA-Z0-9\.]+$", "", ver_str.strip())
    # Strip any git commit or extra build metadata
    cleaned = re.sub(r"\+.*$", "", cleaned)
    return cleaned, is_backport

def match_version_to_constraints(
    asset_product: str,
    asset_version: str,
    target_product: str,
    constraints: str
) -> Dict[str, Any]:
    norm_asset = normalize_product(asset_product)
    norm_target = normalize_product(target_product)

    # 1. Product check
    if norm_asset != norm_target:
        return {
            "status": "NOT_AFFECTED",
            "matched": False,
            "reason": f"Product mismatch: {asset_product} does not match {target_product}",
            "confidence": 1.0,
            "alias_used": f"{asset_product} != {target_product}"
        }

    # 2. Unknown or missing inventory check
    if not asset_version or asset_version.upper() in ["UNKNOWN", "N/A", "NONE", ""]:
        return {
            "status": "POSSIBLE",
            "matched": True,
            "reason": "Asset product matched, but version is unknown/unverified in inventory gap.",
            "confidence": 0.40,
            "alias_used": f"{asset_product} -> {norm_asset}"
        }

    # 3. Clean version & detect backports
    clean_ver, is_backport = clean_version_string(asset_version)
    
    if is_backport:
        return {
            "status": "MITIGATED",
            "matched": False,
            "reason": f"Distro backport detected ({asset_version}). Security fix backported by maintainers.",
            "confidence": 0.85,
            "alias_used": f"{asset_product} -> {norm_asset}"
        }

    # 4. Check version against constraints
    try:
        parsed_ver = Version(clean_ver)
    except InvalidVersion:
        return {
            "status": "POSSIBLE",
            "matched": True,
            "reason": f"Non-standard version format ({asset_version}). Manual triage required.",
            "confidence": 0.50,
            "alias_used": f"{asset_product} -> {norm_asset}"
        }

    if not constraints or constraints.strip() in ["*", "all"]:
        return {
            "status": "CONFIRMED_EXPOSED",
            "matched": True,
            "reason": "All versions affected according to advisory.",
            "confidence": 0.95,
            "alias_used": f"{asset_product} -> {norm_asset}"
        }

    # Normalize constraint string (e.g. '< 1.25.3' or '>= 2.0.0, <= 2.14.1')
    try:
        spec = SpecifierSet(constraints)
        is_affected = parsed_ver in spec
    except InvalidSpecifier:
        # Fallback comparison if simple '< X.Y' syntax
        is_affected = False
        m = re.match(r"<\s*([0-9\.]+)", constraints)
        if m:
            try:
                is_affected = parsed_ver < Version(m.group(1))
            except Exception:
                is_affected = False

    if is_affected:
        return {
            "status": "CONFIRMED_EXPOSED",
            "matched": True,
            "reason": f"Installed version {asset_version} falls strictly within vulnerable range ({constraints}).",
            "confidence": 0.95,
            "alias_used": f"{asset_product} -> {norm_asset}"
        }
    else:
        return {
            "status": "NOT_AFFECTED",
            "matched": False,
            "reason": f"Installed version {asset_version} is outside vulnerable range ({constraints}).",
            "confidence": 0.95,
            "alias_used": f"{asset_product} -> {norm_asset}"
        }
