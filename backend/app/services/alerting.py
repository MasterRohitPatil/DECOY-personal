import urllib.parse
from typing import Dict, Any

def generate_whatsapp_alert(
    warning_id: str,
    title: str,
    target_hostname: str,
    source_ip: str,
    risk_score: float,
    band: str,
    recommended_action: str
) -> Dict[str, Any]:
    """Generates a No-API WhatsApp Web deep-link and preview card."""
    
    msg_lines = [
        f"🚨 *SENTINEL GRID SECURITY ALERT*",
        f"━━━━━━━━━━━━━━━━━━━",
        f"• *Warning ID:* `{warning_id}`",
        f"• *Incident:* {title}",
        f"• *Target Asset:* `{target_hostname}`",
        f"• *Attacker/Source IP:* `{source_ip}`",
        f"• *Risk Priority:* *{risk_score:.1f}* ({band})",
        f"• *Action:* {recommended_action}",
        f"━━━━━━━━━━━━━━━━━━━",
        f"🔗 Review in SOC: http://localhost:5173/warnings/{warning_id}"
    ]
    formatted_text = "\n".join(msg_lines)
    encoded_url = f"https://wa.me/?text={urllib.parse.quote(formatted_text)}"

    return {
        "warning_id": warning_id,
        "channel": "WHATSAPP_NO_API",
        "formatted_text": formatted_text,
        "wa_deep_link": encoded_url,
        "preview_title": f"SENTINEL GRID Alert: {title}",
        "recipient": "On-Call Incident Response Team"
    }

def generate_email_alert(
    warning_id: str,
    title: str,
    target_hostname: str,
    source_ip: str,
    risk_score: float,
    band: str,
    recommended_action: str
) -> Dict[str, Any]:
    """Generates a rich HTML incident alert email."""
    
    badge_color = "#EF4444" if band == "CRITICAL" else "#F59E0B"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F19; color: #E2E8F0; margin: 0; padding: 20px; }}
        .card {{ background: #1E293B; border-radius: 8px; border: 1px solid #334155; padding: 24px; max-width: 600px; margin: 0 auto; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 16px; }}
        .badge {{ background: {badge_color}; color: #FFFFFF; font-weight: bold; padding: 4px 10px; border-radius: 4px; font-size: 12px; }}
        .metric-box {{ background: #0F172A; border-radius: 6px; padding: 12px; margin: 12px 0; border: 1px solid #1E293B; }}
        .btn {{ display: inline-block; background: #06B6D4; color: #0B0F19; font-weight: bold; padding: 10px 18px; border-radius: 6px; text-decoration: none; margin-top: 16px; }}
        .mono {{ font-family: monospace; color: #38BDF8; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 style="margin:0; color:#38BDF8;">SENTINEL GRID</h2>
          <span class="badge">{band} ({risk_score:.1f})</span>
        </div>
        <h3 style="margin-top:0;">{title}</h3>
        <p>A critical cyber threat has been matched to your organizational asset inventory.</p>
        
        <div class="metric-box">
          <p style="margin:4px 0;"><strong>Target Hostname:</strong> <span class="mono">{target_hostname}</span></p>
          <p style="margin:4px 0;"><strong>Attacker Origin / Source IP:</strong> <span class="mono">{source_ip}</span></p>
          <p style="margin:4px 0;"><strong>Warning Identifier:</strong> <span class="mono">{warning_id}</span></p>
          <p style="margin:4px 0;"><strong>Recommended Mitigation:</strong> {recommended_action}</p>
        </div>

        <a href="http://localhost:5173/warnings/{warning_id}" class="btn">View Forensic Breakdown</a>
      </div>
    </body>
    </html>
    """

    return {
        "warning_id": warning_id,
        "channel": "EMAIL",
        "subject": f"[{band}] SENTINEL GRID Alert: {title} on {target_hostname}",
        "sender": "soc-alerts@sentinel-grid.internal",
        "recipient": "security-leads@sentinel-grid.internal",
        "html_body": html_body
    }

