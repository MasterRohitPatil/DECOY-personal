import os
import httpx
from typing import Dict, Any, Optional
from app.config import settings

def generate_executive_ai_brief(
    advisory_title: str,
    target_hostname: str,
    product: str,
    version: str,
    risk_score: float,
    band: str,
    cve_id: str,
    playbook_steps: list[str]
) -> Dict[str, Any]:
    """Generates an executive CISO briefing using Gemini if key available, with 100% deterministic template fallback."""
    key = settings.GEMINI_API_KEY.strip()

    prompt = (
        f"You are a Senior Cyber Threat Intelligence Analyst for SENTINEL GRID.\n"
        f"Generate a concise 3-bullet Executive Threat Briefing for the CISO.\n"
        f"Incident: {advisory_title} ({cve_id})\n"
        f"Affected Host: {target_hostname}\n"
        f"Software: {product} v{version}\n"
        f"Calculated Priority: {risk_score:.1f} ({band})\n"
        f"Keep it professional, high-impact, and under 90 words total."
    )

    if key and not key.startswith("["):
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            
            with httpx.Client(timeout=4.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    ai_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    return {
                        "mode": "GEMINI_AI_LIVE",
                        "model": "gemini-flash-latest",
                        "summary": ai_text,
                        "fallback": False
                    }
        except Exception:
            pass  # Fall through to deterministic template fallback

    # Guaranteed Deterministic Fallback Template
    action = playbook_steps[0] if playbook_steps else "Apply emergency perimeter inspection and vendor upgrade."
    deterministic_summary = (
        f"• CRITICAL THREAT: {advisory_title} ({cve_id}) verified with active exploit probability.\n"
        f"• ENTERPRISE EXPOSURE: Internet-facing host '{target_hostname}' runs vulnerable {product} v{version}.\n"
        f"• RECOMMENDED ACTION: {action} Risk score prioritized at {risk_score:.1f} ({band})."
    )

    return {
        "mode": "DETERMINISTIC_SAFE_BRIEF",
        "model": "rule-based-template-v1",
        "summary": deterministic_summary,
        "fallback": True
    }

