import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

def current_time() -> datetime:
    return datetime.now(timezone.utc)

class IntelItem(Base):
    __tablename__ = "intel_item"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    source = Column(String(64), nullable=False, index=True)  # NVD, CISA_KEV, EPSS, CERT_IN, ABUSE_CH
    url = Column(String(512), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    collected_at = Column(DateTime(timezone=True), default=current_time)
    content_hash = Column(String(128), nullable=False, index=True)
    origin_id = Column(String(128), nullable=True, index=True)
    raw_json = Column(JSON, nullable=True)

    evidence_links = relationship("EvidenceLink", back_populates="intel_item")

class Threat(Base):
    __tablename__ = "threat"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    cve_ids = Column(JSON, nullable=False)  # list of CVE strings
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    products = Column(JSON, nullable=False)  # list of {"vendor": str, "product": str}
    version_constraints = Column(String(256), nullable=True)
    exploitation_level = Column(Integer, default=0)  # 0 to 5
    epss = Column(Float, default=0.0)
    kev_flag = Column(Boolean, default=False, index=True)
    first_seen = Column(DateTime(timezone=True), default=current_time)

    exposures = relationship("Exposure", back_populates="threat")
    warnings = relationship("Warning", back_populates="threat")

class Asset(Base):
    __tablename__ = "asset"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    hostname = Column(String(128), nullable=False, index=True)
    product = Column(String(128), nullable=False, index=True)
    vendor = Column(String(128), nullable=True)
    version = Column(String(64), nullable=False)
    environment = Column(String(32), default="PROD", index=True)  # PROD, STAGE, DEV, ISOLATED
    internet_facing = Column(Boolean, default=False, index=True)
    criticality = Column(Integer, default=3)  # 1 to 5
    owner = Column(String(128), default="SecOps")
    last_verified = Column(DateTime(timezone=True), default=current_time)
    synthetic = Column(Boolean, default=True)

    exposures = relationship("Exposure", back_populates="asset")
    warnings = relationship("Warning", back_populates="asset")

class Exposure(Base):
    __tablename__ = "exposure"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    threat_id = Column(String(64), ForeignKey("threat.id"), nullable=False, index=True)
    asset_id = Column(String(64), ForeignKey("asset.id"), nullable=False, index=True)
    # CONFIRMED_EXPOSED, LIKELY_EXPOSED, POSSIBLE, MITIGATED, NOT_AFFECTED, UNKNOWN_INVENTORY_GAP
    status = Column(String(32), nullable=False, index=True)
    matched_range = Column(String(128), nullable=True)
    alias_used = Column(String(128), nullable=True)
    evidence = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=current_time)

    threat = relationship("Threat", back_populates="exposures")
    asset = relationship("Asset", back_populates="exposures")
    warnings = relationship("Warning", back_populates="exposure")

class SecurityEvent(Base):
    __tablename__ = "security_event"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    event_type = Column(String(64), nullable=False, index=True)  # BRUTE_FORCE, DOS_BURST, UNAUTHORIZED_ACCESS, MALICIOUS_IP, PHISHING
    source_ip = Column(String(64), nullable=False, index=True)
    target_asset_id = Column(String(64), ForeignKey("asset.id"), nullable=True)
    payload = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=current_time, index=True)
    severity = Column(String(32), default="HIGH")
    simulated = Column(Boolean, default=True)

    warnings = relationship("Warning", back_populates="security_event")

class Warning(Base):
    __tablename__ = "warning"

    id = Column(String(64), primary_key=True)  # e.g. W-2026-001
    threat_id = Column(String(64), ForeignKey("threat.id"), nullable=True, index=True)
    security_event_id = Column(String(64), ForeignKey("security_event.id"), nullable=True, index=True)
    asset_id = Column(String(64), ForeignKey("asset.id"), nullable=True, index=True)
    exposure_id = Column(String(64), ForeignKey("exposure.id"), nullable=True, index=True)
    title = Column(String(256), nullable=False)
    dimensions_json = Column(JSON, nullable=False)  # {"S": 0.9, "E": 0.8, "X": 1.0, "V": 0.5, "I": 0.8}
    confidence = Column(Float, default=0.85)  # 0.0 to 1.0
    band = Column(String(32), nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    risk_score = Column(Float, nullable=False, index=True)  # 0.0 to 100.0
    rules_fired = Column(JSON, nullable=False)  # list of rule strings
    # 14 statuses: NEW, TRIAGED, MATCHED, EVALUATED, PENDING_APPROVAL, APPROVED, REJECTED,
    # REMEDIATION_QUEUED, PATCH_SIMULATED, CHANGE_SCHEDULED, IN_PROGRESS, VERIFICATION, CLOSED, SUPPRESSED
    status = Column(String(32), default="NEW", index=True)
    brief_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=current_time, index=True)
    updated_at = Column(DateTime(timezone=True), default=current_time, onupdate=current_time)

    threat = relationship("Threat", back_populates="warnings")
    asset = relationship("Asset", back_populates="warnings")
    exposure = relationship("Exposure", back_populates="warnings")
    security_event = relationship("SecurityEvent", back_populates="warnings")
    evidence_links = relationship("EvidenceLink", back_populates="warning", cascade="all, delete-orphan")

class EvidenceLink(Base):
    __tablename__ = "evidence_link"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    warning_id = Column(String(64), ForeignKey("warning.id"), nullable=False, index=True)
    intel_item_id = Column(String(64), ForeignKey("intel_item.id"), nullable=True)
    citation_key = Column(String(32), nullable=False)  # e.g. [REF-1]
    citation_text = Column(Text, nullable=False)
    url_or_ref = Column(String(512), nullable=True)
    confidence = Column(Float, default=1.0)

    warning = relationship("Warning", back_populates="evidence_links")
    intel_item = relationship("IntelItem", back_populates="evidence_links")

class RelationshipEdges(Base):
    __tablename__ = "relationship_edges"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    source_type = Column(String(32), nullable=False)  # CVE, PRODUCT, ASSET, IOC, ORIGIN
    source_id = Column(String(128), nullable=False)
    target_type = Column(String(32), nullable=False)
    target_id = Column(String(128), nullable=False)
    relationship_type = Column(String(64), nullable=False)  # AFFECTS, RUNS_ON, EXPLOITED_BY, DETECTED_ON
    confidence = Column(Float, default=1.0)

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    ts = Column(DateTime(timezone=True), default=current_time, index=True)
    actor = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)
    object = Column(String(128), nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    simulated = Column(Boolean, default=True)

class ClosureSnapshot(Base):
    __tablename__ = "closure_snapshot"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    warning_id = Column(String(64), nullable=False, index=True)
    final_score = Column(Float, nullable=False)
    verified_at = Column(DateTime(timezone=True), default=current_time)
    remediated_by = Column(String(128), nullable=False)
    snapshot_json = Column(JSON, nullable=False)

class Playbook(Base):
    __tablename__ = "playbook"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    version = Column(String(32), default="1.0")
    condition = Column(String(128), nullable=False)
    title = Column(String(256), nullable=False)
    steps = Column(JSON, nullable=False)  # list of step strings

class UserAccount(Base):
    __tablename__ = "user_account"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(64), default="SECOPS_ANALYST")  # CISO_ADMIN, SECOPS_ANALYST, THREAT_RESEARCHER
    organization = Column(String(128), default="National Cyber Coordination Centre (NCCC)")
    created_at = Column(DateTime(timezone=True), default=current_time)


