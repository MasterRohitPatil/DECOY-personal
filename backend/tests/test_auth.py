import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_demo_accounts_endpoint():
    res = client.get("/api/auth/demo-accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) >= 3
    emails = [a["email"] for a in accounts]
    assert "ciso@sentinelgrid.gov.in" in emails
    assert "analyst@sentinelgrid.gov.in" in emails

def test_demo_account_login():
    res = client.post("/api/auth/login", json={
        "email": "ciso@sentinelgrid.gov.in",
        "password": "Sentinel@2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "ciso@sentinelgrid.gov.in"
    assert data["user"]["role"] == "CISO_ADMIN"

def test_login_invalid_password():
    res = client.post("/api/auth/login", json={
        "email": "ciso@sentinelgrid.gov.in",
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_login_nonexistent_user():
    res = client.post("/api/auth/login", json={
        "email": "ghost@nonexistent.domain",
        "password": "SomePassword!"
    })
    assert res.status_code == 401

def test_auth_me_with_bearer_token():
    # 1. Login to obtain real token
    login_res = client.post("/api/auth/login", json={
        "email": "analyst@sentinelgrid.gov.in",
        "password": "Sentinel@2026!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 2. Call /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == "analyst@sentinelgrid.gov.in"
    assert user["role"] == "SECOPS_ANALYST"

def test_auth_me_unauthorized_without_token():
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_user_registration_flow():
    unique_email = f"judge_{uuid.uuid4().hex[:6]}@sentinelgrid.gov.in"
    res = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "JudgeDemoPass@2026",
        "full_name": "Judge Evaluator",
        "role": "CISO_ADMIN",
        "organization": "D3COY Evaluation Panel"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["full_name"] == "Judge Evaluator"

    # Attempting to register again with same email must fail with 409
    dup_res = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "JudgeDemoPass@2026",
        "full_name": "Judge Evaluator Duplicate",
        "role": "CISO_ADMIN",
        "organization": "D3COY Evaluation Panel"
    })
    assert dup_res.status_code == 409

