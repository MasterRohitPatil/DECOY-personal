# SENTINEL GRID
**AI-Based National Cyber Threat Early Warning & Exposure Management System**  
*Hackathon Track: D3COY 1.0 | Problem Statement PS 01*

---

## 1. The Core Winning Thesis
> *"Intelligence only becomes a warning after it is matched to what you actually run. A critical CVE you do not run is information, not an alert. Every number shows its reason; every action needs a human; the demo never depends on the internet."*

### Why SENTINEL GRID Wins:
1. **Eliminating Alert Fatigue**: If an organization does not run the software named in a critical CVE, the system automatically marks it as informational and suppresses the alert (*"Zero Alert Fatigue"*).
2. **Deterministic-First AI Architecture**: Version matching, multi-dimensional scoring, and guardrails are computed by 100% testable Python code. Optional LLMs are strictly bounded by deterministic brief fallback templates.
3. **Enterprise Cloud Scalability**: Built natively on **Supabase PostgreSQL** with connection pooling and a `< 3`-second transactional reset.
4. **Live Attack Telemetry & Multi-Channel Alerting**: Built-in simulator for real-time attacks (Brute Force, DoS, Unauthorized Access, Malicious IP, Phishing) with **No-API WhatsApp Web** (`wa.me`) and HTML Email dispatch.
5. **Closed-Loop Governance**: Full 14-status state machine with role enforcement (`Analyst` vs. `Approver`) and an append-only audit trail.

---

## 2. System Architecture

```
[Threat Feeds / Advisories]     [Simulated Live Attacks]
  (NVD, KEV, EPSS, CERT-In)       (Brute Force, DoS, Malicious IP)
             │                                   │
             ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 SENTINEL DETERMINISTIC CORE                 │
│  • Entity Extractor (Regex, defanged IOCs, SemVer)          │
│  • Guardrail Shield (Injection filter, fake CVE detection)  │
│  • Version-Aware Matcher (Canonical alias table)            │
│  • Transparent Scorer (S,E,X,V,I + Rules R1-R7)             │
│  • 14-Status State Machine (Analyst/Approver approval)      │
└─────────────────────────────────────────────────────────────┘
             │                                   │
             ▼                                   ▼
┌───────────────────────────────┐  ┌─────────────────────────┐
│     SUPABASE POSTGRESQL       │  │   MISSION-CONTROL UI    │
│  • 10 Relational Tables       │  │  • Pipeline Stepper     │
│  • Connection Pooling         │  │  • Risk Gauge (82→93.4) │
│  • <3s Reset Endpoint         │  │  • Blast-Radius Graph   │
│  • Append-Only Audit Log      │  │  • WhatsApp / Email     │
└───────────────────────────────┘  └─────────────────────────┘
```

---

## 3. The 3-Minute Demo Script (Hotkeys 1 to 7)

Use the floating **Demo Controller** in the bottom-right corner or press number keys `1` through `7`:

| Key / Time | Action on Screen | Spoken Pitch Line |
| :--- | :--- | :--- |
| **`1` (0:00–0:20)** | Overview counters tick up, source health strip displays all feeds green, `SYNTHETIC DATA` badge visible. | *"Intelligence in, exposure-aware warnings out."* |
| **`2` (0:20–0:50)** | Click **Inject Advisory**. Animated pipeline illuminates 5 stages live via SSE (`Ingest` → `Extract` → `Match` → `Score` → `Warn`). | *"From advisory to your asset in seconds."* |
| **`3` (0:50–1:20)** | Click Warning Card. Semi-circle gauge counts up to **82.0 (High)**. 5 dimension bars slide in with evidence citations (`[REF-1]`). | *"Every number has a reason and a source."* |
| **`4` (1:20–1:45)** | Click **Simulate: Add to CISA KEV**. Gauge dynamically morphs to **93.4 (Critical)** with an animated red pulse. | *"It reacts when the world changes."* |
| **`5` (1:45–2:05)** | Open Poisoned Report. Guardrail Shield flashes red, intercepting prompt injection and blocking fabricated CVE ID. | *"AI helps, but is never trusted blindly."* |
| **`6` (2:05–2:35)** | Open **Attack Simulator**. Launch SSH Brute Force → Real-time alert card pops up → Click **Dispatch WhatsApp Alert** (demonstrates No-API `wa.me` message and email). | *"Active attacks detected and dispatched to on-call teams instantly without API fees."* |
| **`7` (2:35–3:00)** | Show Critical CVE (Apache Struts) unmatched to assets. Card dims: *"No warning: you do not run this"*. | *"Fewer, better alerts. Zero alert fatigue."* |
| **Reset** | Click **Reset Demo State**. Clean baseline restored in **< 3 seconds**. | *"Ready for the next rehearsal or judging round."* |

---

## 4. Transparent 5-Dimension Scoring Formula

$$\text{Priority} = 100 \times (0.30 \cdot S + 0.30 \cdot E + 0.20 \cdot X + 0.10 \cdot V + 0.10 \cdot I)$$

- **$S$ (Severity)**: $\text{CVSS} / 10$ ($0.0 - 1.0$)
- **$E$ (Exploitation Ladder)**: $L_0$ None (0.10) $\rightarrow$ $L_1$ EPSS (0.40) $\rightarrow$ $L_2$ PoC (0.65) $\rightarrow$ $L_3$ Vendor (0.80) $\rightarrow$ $L_4$ Corroborated (0.90) $\rightarrow$ $L_5$ CISA KEV (1.00)
- **$X$ (Exposure)**: Match strength $\times$ Exposure factor ($1.0$ internet-facing, $0.4$ internal, $0.1$ isolated)
- **$V$ (Velocity)**: Acceleration across independent source origins ($0.0 - 1.0$)
- **$I$ (Impact)**: Asset criticality tier ($1 - 5 \rightarrow 0.2 - 1.0$)
- **Confidence ($0.0 - 1.0$)**: Displayed *beside* priority, never hidden inside it.

### Rules Engine:
- **`R1`**: Unmatched CVE $\rightarrow$ No warning generated.
- **`R2`**: KEV + confirmed exposure + internet-facing $\rightarrow$ Escalated to $\ge 85$ (**Critical**).
- **`R3`**: KEV + confirmed/likely exposure $\rightarrow$ Band at least **High** ($\ge 70$).
- **`R4`**: Possible exposure status $\rightarrow$ Band capped at **Medium** ($\le 69$).
- **`R5`**: Low confidence ($< 0.40$) $\rightarrow$ Band capped at **Medium**.
- **`R6`**: Non-production isolated asset $\rightarrow$ Band capped at **High** ($\le 84$).
- **`R7`**: Active compensating control (firewall IP block / WAF) $\rightarrow$ Score reduced by $20\%$, marked `MITIGATED`.

---

## 5. Quickstart & Verification

### One-Click Launch (Windows)
Double-click `start.bat` or run:
```powershell
.\start.bat
```

### Manual Execution

#### 1. Backend:
```powershell
cd backend
# Optional: Set SUPABASE_DB_URL in .env
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Run Automated Test Suite:
```powershell
$env:PYTHONPATH="backend"
py -m pytest backend/tests -v -p no:asyncio
```
*(All 18 tests for matcher, scoring math, guardrails, and alerting pass in 0.08s)*

#### 3. Frontend:
```powershell
cd frontend
npm run dev
```
Dashboard: [http://localhost:5173](http://localhost:5173)

