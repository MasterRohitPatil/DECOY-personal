from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_seeded_warning_has_three_pillar_recommendations():
    client.post("/api/demo/reset")
    res = client.get("/api/warnings/W-2026-001")
    assert res.status_code == 200
    data = res.json()

    assert data["playbook"] is not None
    assert len(data["playbook"]["steps"]) >= 3

    recs = data["recommendations"]
    assert recs["warning_id"] == "W-2026-001"
    assert recs["patching"]["pillar"] == "PATCH_SYSTEM"
    assert "1.25.3" in recs["patching"]["target_safe_version"]
    assert recs["blocking"]["pillar"] == "BLOCK_INDICATORS"
    assert recs["investigation"]["pillar"] == "INVESTIGATE_ACTIVITY"
    assert len(recs["investigation"]["steps"]) == 4


def test_live_attack_warning_receives_recommendations_and_interactive_actions():
    atk_res = client.post("/api/demo/attack/phishing")
    assert atk_res.status_code == 200
    warning_id = atk_res.json()["result"]["warning_id"]

    # 1. Verify 3-pillar recommendations are generated even for live attack warnings
    det_res = client.get(f"/api/warnings/{warning_id}")
    assert det_res.status_code == 200
    detail = det_res.json()
    assert detail["playbook"] is not None
    recs = detail["recommendations"]
    assert "paypa1-secure-auth[.]com" in recs["blocking"]["indicator_value"]
    assert recs["blocking"]["completed"] is False

    # 2. Toggle forensic investigation step and verify persistence
    inv_res = client.post(
        f"/api/warnings/{warning_id}/investigate-step",
        json={"step_id": "inv_1", "step_title": "Query DNS & proxy logs", "completed": True},
    )
    assert inv_res.status_code == 200
    assert "inv_1" in inv_res.json()["completed_steps"]

    # 3. Execute Rule R7 indicator block directly on the warning
    old_score = detail["risk_score"]
    blk_res = client.post(f"/api/warnings/{warning_id}/block-indicator")
    assert blk_res.status_code == 200
    blk_data = blk_res.json()
    assert blk_data["status"] == "INDICATOR_BLOCKED"
    assert blk_data["new_score"] == round(old_score * 0.80, 1)

    # 4. Reload detail and confirm both block & investigation step persisted
    reloaded = client.get(f"/api/warnings/{warning_id}").json()
    assert reloaded["recommendations"]["blocking"]["completed"] is True
    assert "inv_1" in reloaded["recommendations"]["investigation"]["completed_steps"]

    # 5. Test AI tactical remediation advisor endpoint
    ai_res = client.get(f"/api/warnings/{warning_id}/ai-recommendations")
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert ai_data["mode"] in {"GEMINI_AI_LIVE", "DETERMINISTIC_SAFE_ADVISOR"}
    assert "CONTAIN" in ai_data["guidance"]

    # Reset back to clean baseline after test
    client.post("/api/demo/reset")

