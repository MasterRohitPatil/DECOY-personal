import csv
import io
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.schema import Asset, Threat, Exposure, Warning as WarningModel, EvidenceLink, AuditLog
from app.services.matcher import match_version_to_constraints
from app.services.scorer import calculate_priority_score

logger = logging.getLogger("sentinel.csv_importer")
logger.setLevel(logging.INFO)

# Column Aliases
ASSET_ALIASES = {
    "hostname": ["hostname", "host", "device_name", "asset_name", "endpoint", "node", "server", "system_name", "system"],
    "product": ["product", "software", "package", "application", "app", "component", "technology", "service"],
    "vendor": ["vendor", "publisher", "org", "maker", "provider", "manufacturer"],
    "version": ["version", "ver", "release", "installed_version", "pkg_ver", "sw_version", "build"],
    "environment": ["environment", "env", "tier", "stage", "lifecycle", "zone"],
    "internet_facing": ["internet_facing", "public", "exposed", "external", "is_public", "public_facing", "dmz", "public_ip"],
    "criticality": ["criticality", "priority", "crit", "asset_value", "importance", "severity_tier", "tier_level"],
    "owner": ["owner", "team", "department", "custodian", "contact", "operator", "group"]
}

THREAT_ALIASES = {
    "cve_id": ["cve_id", "cve", "vulnerability_id", "vuln_id", "advisory_id", "cve_number", "id"],
    "title": ["title", "name", "vulnerability_name", "headline", "summary", "vuln_title"],
    "product": ["product", "affected_product", "software", "target_software", "package", "component"],
    "version_constraints": ["version_constraints", "vulnerable_versions", "affected_versions", "constraints", "version_range", "range"],
    "cvss": ["cvss", "cvss_score", "base_score", "score", "cvss_v3", "severity_score"],
    "exploitation_level": ["exploitation_level", "exploit_level", "exploitability", "exploit_maturity", "weaponization"],
    "epss": ["epss", "epss_score", "probability", "epss_prob"],
    "kev_flag": ["kev_flag", "cisa_kev", "known_exploited", "in_kev", "is_kev", "actively_exploited"],
    "description": ["description", "details", "desc", "advisory_text", "notes"]
}

CVE_REGEX = re.compile(r"CVE-\d{4}-\d{4,7}", re.IGNORECASE)

def normalize_boolean(val: Any) -> bool:
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    s = str(val).strip().lower()
    return s in ["true", "1", "yes", "y", "public", "external", "t", "exposed"]

def normalize_criticality(val: Any) -> int:
    if val is None:
        return 3
    s = str(val).strip().lower()
    if s in ["5", "critical", "p1", "highest", "tier-1"]:
        return 5
    if s in ["4", "high", "p2", "tier-2"]:
        return 4
    if s in ["3", "medium", "med", "p3", "tier-3"]:
        return 3
    if s in ["2", "low", "p4", "tier-4"]:
        return 2
    if s in ["1", "info", "p5", "tier-5"]:
        return 1
    try:
        n = int(s)
        return max(1, min(5, n))
    except (ValueError, TypeError):
        return 3

def normalize_environment(val: Any) -> str:
    if not val:
        return "PROD"
    s = str(val).strip().upper()
    if any(k in s for k in ["PROD", "PRD", "LIVE"]):
        return "PROD"
    if any(k in s for k in ["STAGE", "STG", "UAT", "PREPROD", "QA"]):
        return "STAGE"
    if any(k in s for k in ["DEV", "TEST", "LOCAL", "SANDBOX"]):
        return "DEV"
    if any(k in s for k in ["ISO", "AIRGAP", "OFFLINE"]):
        return "ISOLATED"
    return "PROD"

def resolve_header_mapping(headers: List[str], alias_map: Dict[str, List[str]]) -> Dict[str, str]:
    """Map canonical fields to actual CSV header names using case-insensitive variants."""
    mapping: Dict[str, str] = {}
    cleaned_headers = {h.strip().lower(): h for h in headers if h}
    
    for canonical, variants in alias_map.items():
        for v in variants:
            v_clean = v.strip().lower()
            if v_clean in cleaned_headers:
                mapping[canonical] = cleaned_headers[v_clean]
                break
    return mapping

def detect_csv_schema(headers: List[str]) -> Tuple[str, Dict[str, str]]:
    """Determine whether the CSV is Asset Inventory or Threat Advisories."""
    asset_mapping = resolve_header_mapping(headers, ASSET_ALIASES)
    threat_mapping = resolve_header_mapping(headers, THREAT_ALIASES)
    
    if "cve_id" in threat_mapping:
        return "THREATS", threat_mapping
    if "hostname" in asset_mapping:
        return "ASSETS", asset_mapping
    
    # Secondary check by product presence
    if "version_constraints" in threat_mapping or "cvss" in threat_mapping:
        return "THREATS", threat_mapping
    if "version" in asset_mapping or "environment" in asset_mapping:
        return "ASSETS", asset_mapping
        
    return "UNKNOWN", {}

def ingest_csv_data(
    content_str: str,
    db: Session,
    actor: str = "SecOps Lead Analyst"
) -> Dict[str, Any]:
    """Schema-tolerant CSV ingestion pipeline with detailed diagnostics and structured audit logging."""
    if not content_str or not content_str.strip():
        return {
            "status": "ERROR",
            "message": "CSV content is empty.",
            "rows_processed": 0,
            "rows_imported": 0,
            "rows_skipped": 0,
            "diagnostics": []
        }

    # Handle BOM and carriage returns
    clean_content = content_str.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    reader = csv.DictReader(io.StringIO(clean_content))
    
    if not reader.fieldnames:
        return {
            "status": "ERROR",
            "message": "Failed to parse CSV headers. Please ensure delimiter is comma (,).",
            "rows_processed": 0,
            "rows_imported": 0,
            "rows_skipped": 0,
            "diagnostics": []
        }

    schema_type, col_map = detect_csv_schema(reader.fieldnames)
    logger.info(f"[CSV Ingestion] Detected schema: {schema_type} with mapping: {col_map}")

    if schema_type == "UNKNOWN":
        return {
            "status": "ERROR",
            "message": f"Unrecognized CSV format. Headers found: {', '.join(reader.fieldnames)}. Expected either asset columns (e.g. hostname/device_name, product, version) or threat columns (e.g. cve_id, title, product).",
            "rows_processed": 0,
            "rows_imported": 0,
            "rows_skipped": 0,
            "diagnostics": []
        }

    rows = list(reader)
    rows_processed = len(rows)
    rows_imported = 0
    rows_skipped = 0
    diagnostics = []
    
    assets_added = 0
    threats_added = 0
    warnings_generated = 0

    if schema_type == "ASSETS":
        host_col = col_map.get("hostname")
        prod_col = col_map.get("product")
        ver_col = col_map.get("version")
        vend_col = col_map.get("vendor")
        env_col = col_map.get("environment")
        pub_col = col_map.get("internet_facing")
        crit_col = col_map.get("criticality")
        owner_col = col_map.get("owner")

        for idx, row in enumerate(rows, start=1):
            hostname = (row.get(host_col) or "").strip() if host_col else ""
            product = (row.get(prod_col) or "").strip().lower() if prod_col else ""
            version = (row.get(ver_col) or "").strip() if ver_col else ""

            if not hostname:
                rows_skipped += 1
                diagnostics.append({
                    "row": idx,
                    "status": "SKIPPED",
                    "identifier": f"Row #{idx}",
                    "reason": "Missing required hostname/device_name column value."
                })
                continue

            if not product:
                rows_skipped += 1
                diagnostics.append({
                    "row": idx,
                    "status": "SKIPPED",
                    "identifier": hostname,
                    "reason": "Missing required software/product name column value."
                })
                continue

            if not version:
                version = "1.0.0"

            vendor = (row.get(vend_col) or "generic").strip() if vend_col else "generic"
            environment = normalize_environment(row.get(env_col) if env_col else None)
            internet_facing = normalize_boolean(row.get(pub_col) if pub_col else False)
            criticality = normalize_criticality(row.get(crit_col) if crit_col else None)
            owner = (row.get(owner_col) or "Enterprise Infrastructure").strip() if owner_col else "Enterprise Infrastructure"

            # Create or update Asset
            ast_id = f"ast_{re.sub(r'[^a-zA-Z0-9_]', '_', hostname.lower())}"
            existing_a = db.query(Asset).filter(Asset.id == ast_id).first()
            if not existing_a:
                ast = Asset(
                    id=ast_id,
                    hostname=hostname,
                    product=product,
                    vendor=vendor,
                    version=version,
                    environment=environment,
                    internet_facing=internet_facing,
                    criticality=criticality,
                    owner=owner,
                    synthetic=False
                )
                db.add(ast)
                assets_added += 1
            else:
                existing_a.product = product
                existing_a.version = version
                existing_a.environment = environment
                existing_a.internet_facing = internet_facing
                existing_a.criticality = criticality
                existing_a.owner = owner
                ast = existing_a

            rows_imported += 1
            diagnostics.append({
                "row": idx,
                "status": "SUCCESS",
                "identifier": hostname,
                "reason": f"Ingested asset {product} {version} ({environment})"
            })

            # Real-time Exposure Matching against all existing threats
            all_threats = db.query(Threat).all()
            for th in all_threats:
                th_prod = ""
                if th.products:
                    first_p = th.products[0]
                    if isinstance(first_p, dict):
                        th_prod = first_p.get("product", "")
                    else:
                        th_prod = str(first_p)

                match_res = match_version_to_constraints(ast.product, ast.version, th_prod, th.version_constraints or "*")
                if match_res["status"] in ["CONFIRMED_EXPOSED", "LIKELY_EXPOSED", "POSSIBLE"]:
                    score_res = calculate_priority_score(
                        cvss=8.5,
                        exploitation_level=th.exploitation_level,
                        is_kev=th.kev_flag,
                        epss=th.epss,
                        exposure_status=match_res["status"],
                        is_internet_facing=ast.internet_facing,
                        environment=ast.environment,
                        asset_criticality=ast.criticality,
                        origins_count=2,
                        has_compensating_control=False
                    )
                    cve_part = th.cve_ids[0] if th.cve_ids else 'TH'
                    warn_id = f"W-{cve_part}-{re.sub(r'[^a-zA-Z0-9_]', '_', ast.hostname.split('.')[0])}"
                    if not db.query(WarningModel).filter(WarningModel.id == warn_id).first():
                        exp_id = f"exp_{warn_id}"
                        exp = Exposure(
                            id=exp_id,
                            threat_id=th.id,
                            asset_id=ast.id,
                            status=match_res["status"],
                            matched_range=th.version_constraints or "*",
                            alias_used=th_prod,
                            evidence=f"Matched asset {ast.product} {ast.version} to constraint {th.version_constraints}"
                        )
                        db.add(exp)

                        w = WarningModel(
                            id=warn_id,
                            threat_id=th.id,
                            asset_id=ast.id,
                            exposure_id=exp_id,
                            title=f"{th.title} on {ast.hostname}"[:255],
                            brief_summary=f"{score_res['band']} Risk: {ast.hostname} running {ast.product} {ast.version} matches {th.title}."[:500],
                            dimensions_json=score_res["dimensions"],
                            confidence=0.88,
                            band=score_res["band"],
                            risk_score=score_res["score"],
                            rules_fired=score_res["rules_fired"],
                            status="TRIAGED"
                        )
                        db.add(w)
                        warnings_generated += 1

        db.commit()

    elif schema_type == "THREATS":
        cve_col = col_map.get("cve_id")
        title_col = col_map.get("title")
        prod_col = col_map.get("product")
        constr_col = col_map.get("version_constraints")
        cvss_col = col_map.get("cvss")
        exploit_col = col_map.get("exploitation_level")
        epss_col = col_map.get("epss")
        kev_col = col_map.get("kev_flag")
        desc_col = col_map.get("description")

        for idx, row in enumerate(rows, start=1):
            raw_cve = (row.get(cve_col) or "").strip() if cve_col else ""
            cve_match = CVE_REGEX.search(raw_cve)
            cve_id = cve_match.group(0).upper() if cve_match else raw_cve.upper()

            if not cve_id:
                rows_skipped += 1
                diagnostics.append({
                    "row": idx,
                    "status": "SKIPPED",
                    "identifier": f"Row #{idx}",
                    "reason": "Missing valid CVE identifier."
                })
                continue

            product = (row.get(prod_col) or "").strip().lower() if prod_col else ""
            if not product:
                rows_skipped += 1
                diagnostics.append({
                    "row": idx,
                    "status": "SKIPPED",
                    "identifier": cve_id,
                    "reason": "Missing affected software/product name."
                })
                continue

            title = (row.get(title_col) or f"National Threat Advisory for {cve_id}").strip() if title_col else f"Advisory for {cve_id}"
            constraints = (row.get(constr_col) or ">=1.0.0").strip() if constr_col else ">=1.0.0"

            try:
                cvss = float(row.get(cvss_col) or 7.5) if cvss_col else 7.5
            except (ValueError, TypeError):
                cvss = 7.5

            try:
                exploit_level = int(row.get(exploit_col) or 3) if exploit_col else 3
            except (ValueError, TypeError):
                exploit_level = 3

            try:
                epss = float(row.get(epss_col) or 0.65) if epss_col else 0.65
            except (ValueError, TypeError):
                epss = 0.65

            kev_flag = normalize_boolean(row.get(kev_col) if kev_col else False)
            desc = (row.get(desc_col) or f"Threat intelligence for {cve_id} affecting {product}.").strip() if desc_col else f"Advisory {cve_id}"

            th_id = f"th_{cve_id.lower().replace('-', '_')}"
            existing = db.query(Threat).filter(Threat.id == th_id).first()
            if not existing:
                threat = Threat(
                    id=th_id,
                    cve_ids=[cve_id],
                    title=title,
                    products=[product],
                    version_constraints=constraints,
                    exploitation_level=exploit_level,
                    epss=epss,
                    kev_flag=kev_flag,
                    description=desc
                )
                db.add(threat)
                threats_added += 1
            else:
                existing.title = title
                existing.products = [product]
                existing.version_constraints = constraints
                existing.exploitation_level = exploit_level
                existing.epss = epss
                existing.kev_flag = kev_flag
                threat = existing

            rows_imported += 1
            diagnostics.append({
                "row": idx,
                "status": "SUCCESS",
                "identifier": cve_id,
                "reason": f"Ingested threat advisory ({product} {constraints})"
            })

            # Real-time Exposure Matching against all installed inventory
            all_assets = db.query(Asset).all()
            for ast in all_assets:
                match_res = match_version_to_constraints(ast.product, ast.version, product, constraints)
                if match_res["status"] in ["CONFIRMED_EXPOSED", "LIKELY_EXPOSED", "POSSIBLE"]:
                    score_res = calculate_priority_score(
                        cvss=cvss,
                        exploitation_level=exploit_level,
                        is_kev=kev_flag,
                        epss=epss,
                        exposure_status=match_res["status"],
                        is_internet_facing=ast.internet_facing,
                        environment=ast.environment,
                        asset_criticality=ast.criticality,
                        origins_count=3,
                        has_compensating_control=False
                    )

                    warn_id = f"W-{cve_id}-{re.sub(r'[^a-zA-Z0-9_]', '_', ast.hostname.split('.')[0])}"
                    if not db.query(WarningModel).filter(WarningModel.id == warn_id).first():
                        exp_id = f"exp_{warn_id}"
                        exp = Exposure(
                            id=exp_id,
                            threat_id=threat.id,
                            asset_id=ast.id,
                            status=match_res["status"],
                            matched_range=constraints,
                            alias_used=product,
                            evidence=f"Matched version {ast.version} to {constraints}"
                        )
                        db.add(exp)

                        w = WarningModel(
                            id=warn_id,
                            threat_id=threat.id,
                            asset_id=ast.id,
                            exposure_id=exp_id,
                            title=f"{title} on {ast.hostname}"[:255],
                            brief_summary=f"{score_res['band']} Risk: {ast.hostname} running {ast.product} {ast.version} matches {title}."[:500],
                            dimensions_json=score_res["dimensions"],
                            confidence=0.91,
                            band=score_res["band"],
                            risk_score=score_res["score"],
                            rules_fired=score_res["rules_fired"],
                            status="TRIAGED"
                        )
                        db.add(w)
                        warnings_generated += 1

                        ev = EvidenceLink(
                            id=f"ev_{warn_id}",
                            warning_id=warn_id,
                            citation_key="[CSV-INGEST]",
                            citation_text=f"CSV Advisory {cve_id}: {title} (CVSS {cvss})",
                            url_or_ref=f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                            confidence=0.92
                        )
                        db.add(ev)

        db.commit()

    # Log structured event to AuditLog
    db.add(AuditLog(
        actor=actor,
        action="CSV_DATASET_INGESTED",
        object=f"Batch:{schema_type}",
        before_state={"rows_submitted": rows_processed},
        after_state={
            "schema_type": schema_type,
            "rows_imported": rows_imported,
            "rows_skipped": rows_skipped,
            "assets_added": assets_added,
            "threats_added": threats_added,
            "warnings_generated": warnings_generated
        },
        reason=f"Schema-tolerant ingestion of {schema_type} dataset with {rows_imported} entries.",
        simulated=False
    ))
    db.commit()

    return {
        "status": "SUCCESS",
        "schema_type": schema_type,
        "rows_processed": rows_processed,
        "rows_imported": rows_imported,
        "rows_skipped": rows_skipped,
        "assets_added": assets_added,
        "threats_added": threats_added,
        "warnings_generated": warnings_generated,
        "diagnostics": diagnostics
    }
