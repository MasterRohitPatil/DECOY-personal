# SENTINEL GRID — Visual UI Component & Presentation Guide
*A complete walkthrough of every element appearing on the frontend, why it is there, and how to present it.*

---

## 1. Top Header & Live Health Strip

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🛡️] SENTINEL GRID  [D3COY 1.0 PS 01] [Supabase PostgreSQL]                                 │
│ [📖 Judge & Operator Guide]  [🟢 SYNTHETIC DATA]  [🔥 Attack Simulator]  [🔄 Reset Demo]    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ FEEDS: 🟢 NVD (42ms)  🟢 CISA KEV (38ms)  🟢 FIRST EPSS (65ms)  🟢 CERT-In  🟢 abuse.ch     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### What You See:
* **System Identifiers**: Displays the project name, hackathon problem statement tag (`D3COY 1.0 PS 01`), and **`Supabase PostgreSQL`** cloud database indicator.
* **Badges**: `SYNTHETIC DATA` and `SIMULATED ACTIONS` tags.
* **Live Feed Strip**: Green status dots for 5 national and public threat feeds (NVD, CISA KEV, FIRST EPSS, CERT-In, and abuse.ch).

### Why It Is Appearing:
1. **Honesty & Compliance**: Hackathon rules reward teams that clearly label test/synthetic data. It proves you understand real production compliance.
2. **Resilience & Reliability**: Shows judges that external intelligence sources are active and cached locally, proving the demo will not crash if Wi-Fi drops.

### What to Say to the Judges:
> *"At the top of our SOC dashboard, we display live health telemetry across five major public feeds. All data is scoped to an enterprise inventory stored in Supabase PostgreSQL."*

---

## 2. Real-Time Deterministic Pipeline Stepper

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🟢 Deterministic Threat Pipeline                               [Stage 3: Version Matching]  │
│                                                                                             │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐     │
│  │  1. Ingest │ ──►│ 2. Extract │ ──►│  3. Match  │ ──►│  4. Score  │ ──►│  5. Warn   │     │
│  │ Cached NVD │    │ CVE/SemVer │    │ Asset Host │    │  S,E,X,V,I │    │ Brief Card │     │
│  └────────────┘    └────────────┘    └────────────┘    └────────────┘    └────────────┘     │
│     (Done)            (Done)            (ACTIVE)          (Waiting)         (Waiting)       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### What You See:
A 5-node animated stepper that illuminates in sequence when you inject a threat advisory (Hotkey `2`):
1. `Feed Ingest`: Loads the advisory from cached threat intelligence.
2. `Entity Extract`: Uses regex and NLP to extract CVE IDs, defanged IOCs, and version constraints.
3. `Version Match`: Compares the constraints against your internal server inventory.
4. `SEXVI Score`: Calculates the transparent multi-dimensional score.
5. `Early Warning`: Generates the structured warning card and playbook recommendations.

### Why It Is Appearing:
Competitor tools display alerts with zero explanation of how the data arrived. This animated stepper proves that SENTINEL GRID executes a **deterministic, sequential pipeline** that can be inspected at every stage.

### What to Say to the Judges:
> *"When a threat advisory arrives, our system does not jump straight to an alert. Watch the pipeline: it ingests, extracts CVE constraints, matches against asset inventory, computes the mathematical score, and dispatches the warning in under two seconds."*

---

## 3. Dynamic Semi-Circle Risk Gauge & KEV Escalation

```
                  ┌──────────────────────┐
                  │       /\  /\         │
                  │      /  82.0 \  (High)
                  │     /          \     │
                  └──────────────────────┘
                     [ Add to CISA KEV ]
                              │
                              ▼ (Dynamic Tween with Red Pulse)
                  ┌──────────────────────┐
                  │       /\  /\         │
                  │      /  93.4 \ (CRITICAL)
                  │     /          \     │
                  └──────────────────────┘
```

### What You See:
Inside the Warning Detail modal (Hotkey `3` / `4`), a semi-circle gauge counts up to the risk score:
* Green ($< 40$) $\rightarrow$ Low
* Yellow ($40 - 69$) $\rightarrow$ Medium
* Orange ($70 - 84$) $\rightarrow$ High
* Red ($85 - 100$) $\rightarrow$ Critical
* Clicking **"Simulate: Add to CISA KEV"** animates the gauge from **82.0 to 93.4 Critical** with a red pulse.

### Why It Is Appearing:
Security teams need immediate visual urgency. The dynamic jump to 93.4 demonstrates that SENTINEL GRID actively responds when a vulnerability is confirmed to be weaponized in the wild.

### What to Say to the Judges:
> *"Here is the core differentiator: An exploit with vendor confirmation starts at 82.0 High. When CISA confirms active exploitation in the wild, Rule R2 fires and the score dynamically escalates to 93.4 Critical without refreshing the screen."*

---

## 4. 5-Dimension Transparent Scoring Bars ($S, E, X, V, I$)

```
[S] Severity (CVSS 8.8)        [████████████████████░░░░░] 0.88  (Weight: 30%)
[E] Exploitation (Vendor L3)   [████████████████░░░░░░░░░] 0.80  (Weight: 30%)
[X] Exposure (Public Internet) [█████████████████████████] 1.00  (Weight: 20%)
[V] Velocity (Report Origins)  [██████████░░░░░░░░░░░░░░░] 0.50  (Weight: 10%)
[I] Asset Impact (Criticality) [████████████████░░░░░░░░░] 0.80  (Weight: 10%)
──────────────────────────────────────────────────────────────────────────────
Formula: 100 × (0.30·S + 0.30·E + 0.20·X + 0.10·V + 0.10·I) = 82.0 (HIGH)
Confidence: 88% (Displayed beside priority, never hidden)
```

### What You See:
Five horizontal bars with explicit formula weights, showing the exact contribution of each parameter.

### Why It Is Appearing:
Judges punish unexplainable "AI hallucinated numbers". By showing the exact formula, you prove that the platform is completely auditable and enterprise-ready.

### What to Say to the Judges:
> *"Every single number has a reason and a source. We do not use black-box AI for scoring. Our formula takes CVSS severity, the L0 to L5 exploit ladder, network exposure, reporting velocity, and asset criticality."*

---

## 5. Visual Blast-Radius Topology Graph

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Attacker IP │────►│   CVE Flaw   │────►│   Product    │────►│ Target Host  │
│198.51.100.23 │     │CVE-2026-4421 │     │ nginx 1.24.0 │     │ auth-srv-01  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
  (Threat Origin)      (Buffer Overflow)   (Software Spec)      (Public Gateway)
```

### What You See:
An interactive topology canvas tracing the attack chain from the external threat origin to the internal physical server. Active paths glow cyan and red, while unrelated nodes dim out.

### Why It Is Appearing:
Incident responders need spatial awareness. In seconds, an analyst can see what port is targeted, which package is vulnerable, and which server is at risk.

### What to Say to the Judges:
> *"This graph reveals the blast radius in one click: tracing from the external threat origin, through the CVE flaw, into the software package, and down to the specific server running in production."*

---

## 6. Attack Simulator & No-API WhatsApp Alerting

```
┌────────────────────────────────────────────────────────┐
│ 📱 WhatsApp Incident Broadcast        SecOps On-Call   │
│                                                        │
│ 🚨 *SENTINEL GRID SECURITY ALERT*                      │
│ • Incident: Active SSH Brute Force Flood               │
│ • Target Asset: `auth-srv-01.prod.sentinel`            │
│ • Attacker Origin: `198.51.100.23` (abuse.ch match)    │
│ • Risk Priority: *91.2* (CRITICAL)                     │
│ • Action: Block IP in Firewall & Contain               │
│                                                        │
│ [ Open WhatsApp Web (wa.me) ]    [ Copy Alert Text ]   │
└────────────────────────────────────────────────────────┘
```

### What You See:
* **Attack Simulator Panel**: Buttons to launch **SSH Brute Force**, **Layer 7 DoS**, **Unauthorized Key Probe**, **Malicious C2 IP**, and **Phishing**.
* **Alert Drawer**: A phone mockup previewing the pre-formatted WhatsApp message and a direct `wa.me` deep-link button, alongside an HTML Email inbox tab.
* **Closed-Loop Mitigation**: Clicking **"Approve Perimeter Firewall IP Block"** applies Rule R7, drops the attacker's packets, and reduces the risk score by 20%.

### Why It Is Appearing:
Directly fulfills your mentor's feedback! It demonstrates active attack detection and instant alerting without needing paid Twilio or Meta Business API keys.

### What to Say to the Judges:
> *"Beyond CVE advisories, we ingest live telemetry. When an active brute force attack hits our identity gateway, our system correlates it against abuse.ch feeds and dispatches a formatted WhatsApp alert directly to on-call engineers via official deep links—zero API fees required."*

---

## 7. AI Guardrail Shield

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ SHIELD GUARDRAIL TRIGGERED                                              │
│ Intercepted prompt injection ('SYSTEM: OVERRIDE INSTRUCTIONS') & blocked    │
│ fabricated identifier 'CVE-9999-99999'. Malicious instruction neutralized.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What You See:
A flashing red banner displayed when an injected advisory contains prompt injection attempts or fabricated CVE numbers.

### Why It Is Appearing:
Demonstrates responsible, enterprise-grade AI safety. Adversaries can attempt to poison threat feeds to fool automated AI scanners into downgrading critical vulnerabilities.

### What to Say to the Judges:
> *"AI is never trusted blindly. We tested our system with a poisoned advisory containing a prompt injection override. Our Guardrail Shield detected the attack string, blocked the fake CVE ID, and fell back to our deterministic template brief."*

---

## 8. The Floating Demo Controller (Hotkeys 1 to 7)

```
┌──────────────────────────────────────────────┐
│ 🟢 Demo Controller (Hotkeys 1–7)          ▲ │
├──────────────────────────────────────────────┤
│ [1] Overview & Telemetry       (0:00 - 0:20) │
│ [2] Inject Advisory (SSE)      (0:20 - 0:50) │
│ [3] Warning Detail (82.0)      (0:50 - 1:20) │
│ [4] Escalate KEV (93.4)        (1:20 - 1:45) │
│ [5] Poisoned Report Shield     (1:45 - 2:05) │
│ [6] Mentor: Attack & WhatsApp  (2:05 - 2:35) │
│ [7] Unmatched CVE (No Alert)   (2:35 - 3:00) │
├──────────────────────────────────────────────┤
│ [ 🔄 Reset Demo State (< 3s) ]               │
└──────────────────────────────────────────────┘
```

### What You See:
A compact dock in the bottom-right corner with buttons and keyboard shortcuts `1` to `7`.

### Why It Is Appearing:
Allows you to run the entire 3-minute hackathon pitch with zero fumbling. Pressing `1` through `7` triggers each milestone smoothly.

