from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import re
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schema import UserAccount, AuditLog
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "SECOPS_ANALYST"
    organization: Optional[str] = "National Cyber Coordination Centre (NCCC)"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    organization: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DemoAccountInfo(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    role_label: str
    organization: str
    description: str

DEMO_ACCOUNTS_METADATA = [
    {
        "email": "ciso@sentinelgrid.gov.in",
        "password": "Sentinel@2026!",
        "full_name": "Dr. Arvind Rao",
        "role": "CISO_ADMIN",
        "role_label": "CISO / System Administrator",
        "organization": "National Cyber Security Coordinator",
        "description": "Full administrative authority to execute automated patch playbooks and dismiss warnings."
    },
    {
        "email": "analyst@sentinelgrid.gov.in",
        "password": "Sentinel@2026!",
        "full_name": "Vikram Malhotra",
        "role": "SECOPS_ANALYST",
        "role_label": "SecOps Lead Analyst",
        "organization": "CERT-In Sectoral Triage",
        "description": "Operational threat triage, exposure correlation analysis, and incident alerting."
    },
    {
        "email": "researcher@sentinelgrid.gov.in",
        "password": "Sentinel@2026!",
        "full_name": "Ananya Deshmukh",
        "role": "THREAT_RESEARCHER",
        "role_label": "Threat Intelligence Researcher",
        "organization": "Critical Tech Defense Labs",
        "description": "CVE feed monitoring, EPSS score modeling, and intelligence source verification."
    }
]

@router.get("/demo-accounts", response_model=List[DemoAccountInfo])
def get_demo_accounts():
    """Return pre-seeded demo accounts for quick-access evaluation by judges."""
    return DEMO_ACCOUNTS_METADATA

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account with bcrypt-hashed password and JWT token."""
    cleaned_email = req.email.lower().strip()
    
    if not EMAIL_REGEX.match(cleaned_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format. Please provide a valid email address (e.g. analyst@sentinelgrid.gov.in)."
        )

    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )

    existing = db.query(UserAccount).filter(UserAccount.email == cleaned_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{cleaned_email}' already exists. Please log in."
        )

    user = UserAccount(
        email=cleaned_email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name.strip(),
        role=req.role or "SECOPS_ANALYST",
        organization=req.organization or "National Cyber Coordination Centre (NCCC)"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Record registration in real audit log
    db.add(AuditLog(
        actor=user.email,
        action="USER_REGISTERED",
        object=f"User:{user.id}",
        before_state=None,
        after_state={"email": user.email, "role": user.role, "name": user.full_name},
        reason="Self-service registration into SENTINEL GRID",
        simulated=False
    ))
    db.commit()

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
        "org": user.organization
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=AuthResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning a signed JWT Bearer token."""
    cleaned_email = req.email.lower().strip()
    user = db.query(UserAccount).filter(UserAccount.email == cleaned_email).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials or select a demo account."
        )

    # Record login in real audit log
    db.add(AuditLog(
        actor=user.email,
        action="USER_LOGIN",
        object=f"User:{user.id}",
        before_state=None,
        after_state={"email": user.email, "role": user.role},
        reason="Successful authentication session established",
        simulated=False
    ))
    db.commit()

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
        "org": user.organization
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: UserAccount = Depends(get_current_user)):
    """Return the profile of the currently authenticated user from Bearer JWT."""
    return UserResponse.model_validate(user)
