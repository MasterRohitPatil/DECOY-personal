from typing import Tuple, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.schema import Warning, AuditLog, ClosureSnapshot

def current_time():
    return datetime.now(timezone.utc)

ALLOWED_TRANSITIONS = {
    "NEW": ["TRIAGED", "SUPPRESSED", "NOT_AFFECTED"],
    "TRIAGED": ["MATCHED", "EVALUATED", "PENDING_APPROVAL", "SUPPRESSED"],
    "MATCHED": ["EVALUATED", "PENDING_APPROVAL", "SUPPRESSED"],
    "EVALUATED": ["PENDING_APPROVAL", "APPROVED", "SUPPRESSED"],
    "PENDING_APPROVAL": ["APPROVED", "REJECTED"],
    "APPROVED": ["REMEDIATION_QUEUED", "PATCH_SIMULATED", "IN_PROGRESS"],
    "REJECTED": ["TRIAGED", "CLOSED"],
    "REMEDIATION_QUEUED": ["PATCH_SIMULATED", "CHANGE_SCHEDULED", "IN_PROGRESS"],
    "PATCH_SIMULATED": ["CHANGE_SCHEDULED", "IN_PROGRESS", "VERIFICATION"],
    "CHANGE_SCHEDULED": ["IN_PROGRESS"],
    "IN_PROGRESS": ["VERIFICATION"],
    "VERIFICATION": ["CLOSED", "IN_PROGRESS"],
    "CLOSED": [],
    "SUPPRESSED": ["TRIAGED"]
}

def transition_warning_state(
    db: Session,
    warning_id: str,
    new_status: str,
    actor: str,
    role: str,
    reason: str
) -> Dict[str, Any]:
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if not warning:
        raise ValueError(f"Warning '{warning_id}' not found.")

    old_status = warning.status

    # 1. Check legal transitions
    valid_next = ALLOWED_TRANSITIONS.get(old_status, [])
    if new_status not in valid_next:
        raise ValueError(
            f"Illegal transition: Cannot move from '{old_status}' to '{new_status}'. Allowed: {valid_next}"
        )

    # 2. Check role authorization
    if new_status in ["APPROVED", "REJECTED"]:
        if role.lower() != "approver":
            raise PermissionError("Only users with role 'Approver' (e.g. CISO / SecOps Lead) can approve actions.")
        if actor == "Security Analyst":
            raise PermissionError("Self-approval prohibited: Requester cannot approve their own action.")

    if new_status == "CLOSED":
        if old_status != "VERIFICATION":
            raise ValueError("Warning can only be CLOSED after successful VERIFICATION stage.")

    # 3. Apply state transition
    warning.status = new_status
    warning.updated_at = current_time()

    # 4. If CLOSED, create immutable closure snapshot
    if new_status == "CLOSED":
        snapshot = ClosureSnapshot(
            warning_id=warning.id,
            final_score=warning.risk_score,
            verified_at=current_time(),
            remediated_by=actor,
            snapshot_json={
                "title": warning.title,
                "score": warning.risk_score,
                "band": warning.band,
                "rules_fired": warning.rules_fired,
                "dimensions": warning.dimensions_json
            }
        )
        db.add(snapshot)

    # 5. Append-only audit log
    audit_entry = AuditLog(
        actor=actor,
        action="LIFECYCLE_TRANSITION",
        object=warning.id,
        before_state={"status": old_status},
        after_state={"status": new_status},
        reason=reason,
        simulated=True
    )
    db.add(audit_entry)
    db.commit()

    return {
        "warning_id": warning.id,
        "old_status": old_status,
        "new_status": new_status,
        "actor": actor,
        "reason": reason,
        "timestamp": audit_entry.ts.isoformat()
    }

