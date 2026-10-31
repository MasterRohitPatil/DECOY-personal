# SENTINEL GRID — Team Todo List

Based on `SENTINEL_GRID_PRD_v2.0_FINAL.pdf` and the 14-hour winning plan.

## Team ownership

| Person | Ownership | Primary deliverable |
|---|---|---|
| Person 1 | Backend, database, ingestion, API | Reliable offline pipeline and API |
| Person 2 | Extraction, matching, scoring, AI guardrails | Deterministic threat-analysis engine |
| Person 3 | Frontend, UX, dashboard, graph | Judge-ready operational interface |
| Person 4 | Data, QA, integration, demo, documentation | Seed scenarios, validation, demo readiness |

## Shared gates

- [ ] **H1:** Agree JSON contracts for assets, warnings, events, evidence, and API errors.
- [ ] **H4:** One advisory completes ingest → extract → match → score → warning card.
- [ ] **H8:** All P0 acceptance tests pass; cut P1 work if not.
- [ ] **H11:** Feature freeze; only bug fixes and polish.
- [ ] **H12:** Clean-checkout build and complete scenario run pass.
- [ ] **H14:** Five rehearsals completed and offline fallback ready.

---

# Person 1 — Backend, database, ingestion, and API

## P1.1 Scope and architecture

- [ ] Freeze the P0 cut line with the team:
  - Matcher
  - Score breakdown
  - Evidence citations
  - ID verification
  - Approval gate
  - Audit log
  - Offline seed data
- [ ] Define backend module boundaries and error-handling conventions.
- [ ] Document non-goals: no scanning, autonomous blocking, attacker attribution, or calibrated-ML claims.
- [ ] Define Pydantic contracts for intelligence items, threats, assets, exposures, warnings, evidence, playbooks, tasks, relationships, and audit entries.

## P1.2 Persistence

- [ ] Add PostgreSQL 16 Docker Compose profile.
- [ ] Add SQLite offline fallback.
- [ ] Create portable migrations.
- [ ] Add indexes for CVEs, assets, warnings, status, source, and timestamps.
- [ ] Store raw JSON payloads portably.
- [ ] Add deterministic seed and reset commands.
- [ ] Enforce append-only audit records.
- [ ] Add a relational `relationship_edges` table for CVE/product/asset/IOC/technique/origin links.
- [ ] Add immutable closure snapshot storage.

## P1.3 Intelligence connectors and ingestion

- [ ] Create a common connector interface.
- [ ] Implement cached connectors for NVD, CISA KEV, FIRST EPSS, CERT-In, and one abuse.ch feed.
- [ ] Store raw payload, URL, published time, collection time, and content hash.
- [ ] Add manual ingestion.
- [ ] Add scheduled ingestion.
- [ ] Add retries, timeouts, and exponential backoff.
- [ ] Isolate source failures.
- [ ] Track source health, freshness, reliability, last success, last failure, and error count.
- [ ] Deduplicate by source ID and content hash.
- [ ] Group duplicate records into origin clusters.
- [ ] Ensure duplicate reports from one origin count once toward corroboration.
- [ ] Add source timeline and first-seen calculation.

## P1.4 API and orchestration

- [ ] Add endpoints for health, overview, feed, warnings, warning details, assets, exposures, evidence, approvals, audit, and source status.
- [ ] Add `POST /demo/inject/{scenario}`.
- [ ] Add `POST /demo/kev/{cve}` for re-evaluation.
- [ ] Add `POST /warnings/{id}/transition`.
- [ ] Add approver-only approval endpoint for simulated actions.
- [ ] Add SSE pipeline events for ingest, extract, match, score, and warn.
- [ ] Add `POST /demo/reset`.
- [ ] Add explicit validation and authorization errors.
- [ ] Wire ingest → extract → enrich → correlate → match → score → warning.
- [ ] Add API integration tests.

## P1.5 Audit, lifecycle, and response backend

- [ ] Implement the 14-status state machine.
- [ ] Reject illegal transitions.
- [ ] Require actor, timestamp, reason, and score snapshot.
- [ ] Log ingestion, decisions, approvals, simulated actions, tool calls, LLM calls, blocked IDs, and injection events.
- [ ] Add analyst, approver, and viewer authorization.
- [ ] Prevent requesters from approving their own actions.
- [ ] Implement simulated patch task, blocklist export, and owner assignment.
- [ ] Mark every simulated result `SIMULATED`.
- [ ] Implement verification through updated-inventory re-matching.
- [ ] Permit closure only after verification.

---

# Person 2 — Extraction, matching, scoring, and AI guardrails

## P2.1 Deterministic extraction

- [ ] Extract and validate CVE IDs.
- [ ] Extract defanged IPs, domains, URLs, and hashes.
- [ ] Extract products, versions, affected ranges, and fixed versions.
- [ ] Validate CVE and ATT&CK IDs against trusted local data.
- [ ] Reject fabricated IDs.
- [ ] Create a 30–50 item extraction gold set.
- [ ] Measure at least 0.95 ID precision and 0.85 version-range recall.

## P2.2 Enrichment and correlation

- [ ] Implement the L0–L5 exploitation ladder.
- [ ] Store evidence for the selected ladder level.
- [ ] Add KEV enrichment.
- [ ] Add EPSS enrichment.
- [ ] Detect conflicting severity and version claims.
- [ ] Reduce confidence for conflicts.
- [ ] Create relationship edges with source and confidence.
- [ ] Add candidate campaign clustering only after P0 is stable.
- [ ] Add ATT&CK mapping as P1.

## P2.3 Exposure matcher

- [ ] Map legacy statuses to:
  - `CONFIRMED_EXPOSED`
  - `LIKELY_EXPOSED`
  - `POSSIBLE`
  - `MITIGATED`
  - `NOT_AFFECTED`
  - `UNKNOWN_INVENTORY_GAP`
- [ ] Complete canonical alias resolution.
- [ ] Preserve Linux/distro backport handling.
- [ ] Prevent product-family matches from being reported as vulnerable.
- [ ] Implement before, through, between, greater-than, fixed, and unknown-version rules.
- [ ] Treat stale inventory as lower confidence.
- [ ] Store matched range, alias, evidence, confidence, and rationale.
- [ ] Ensure unknown inventory is never presented as safe.
- [ ] Add tests for all statuses and range boundaries.

## P2.4 Transparent scoring

- [ ] Implement dimensions `S`, `E`, `X`, `V`, and `I`.
- [ ] Implement:

```text
Priority = 100 × (0.30S + 0.30E + 0.20X + 0.10V + 0.10I)
```

- [ ] Implement rules R1–R7:
  - R1: No eligible exposure gate
  - R2: KEV + confirmed internet-facing exposure
  - R3: KEV + confirmed/likely exposure
  - R4: Possible exposure cap
  - R5: Low-confidence cap
  - R6: Non-production/isolated asset cap
  - R7: Compensating-control adjustment
- [ ] Keep confidence separate from priority.
- [ ] Calculate source reliability, corroboration, freshness, and match certainty.
- [ ] Store fired rules and explanations.
- [ ] Label weights as uncalibrated.
- [ ] Reproduce the 82.0 High → 93.4 Critical worked example.
- [ ] Add non-mutating what-if scoring.

## P2.5 Warning and evidence logic

- [ ] Create warnings only for eligible exposures.
- [ ] Prevent warnings for unmatched CVEs.
- [ ] Attach score, band, dimensions, confidence, evidence, uncertainty, recommendations, history, and status.
- [ ] Implement deterministic brief rendering.
- [ ] Add versioned playbooks.
- [ ] Deduplicate by threat-and-asset set.
- [ ] Update existing warnings when new evidence arrives.
- [ ] Implement snooze and suppression with reason and expiry.
- [ ] Reopen on expiry or important new evidence.
- [ ] Define material-change notification conditions.

## P2.6 AI guardrails and optional RAG

- [ ] Treat feed text as untrusted data.
- [ ] Detect and flag prompt injection.
- [ ] Keep untrusted text outside system instructions and tool authority.
- [ ] Retrieve only stored evidence for LLM context.
- [ ] Redact/tokenize hostnames and IPs before external calls.
- [ ] Make LLM use opt-in.
- [ ] Validate citations for every generated claim.
- [ ] Reject unsupported claims and invalid IDs.
- [ ] Fall back to the deterministic brief on any failure.
- [ ] Log LLM calls and outbound data.
- [ ] Keep the demo fully functional with the LLM disabled.

---

# Person 3 — Frontend, UX, dashboard, and graph

## P3.1 Dashboard foundation

- [ ] Connect the existing React/Vite dashboard to the backend API.
- [ ] Replace static warning and asset data.
- [ ] Add loading, empty, degraded-source, and error states.
- [ ] Preserve persistent `SYNTHETIC` and `SIMULATED` labels.
- [ ] Ensure severity uses text labels/icons as well as color.
- [ ] Add accessible keyboard-reachable controls.
- [ ] Add projector-friendly contrast and reduced-motion support.

## P3.2 P0 screens

- [ ] Overview:
  - New threats
  - Active warnings by band
  - Affected technologies
  - Warning trend
  - Source health
  - Coverage gaps
- [ ] Warning queue:
  - Priority sorting
  - Status, band, asset, and source filters
  - Confidence and age
  - Acknowledge action
  - Snooze/suppress controls
- [ ] Warning detail:
  - Headline
  - Affected assets and exposure status
  - Score dimensions
  - Rules fired
  - Confidence components
  - Evidence citations
  - Conflicts
  - Recommendations
  - History
  - Action controls
- [ ] Asset inventory view.
- [ ] Exposure management view.
- [ ] Approval and response view.
- [ ] Audit and guardrail view.
- [ ] Replace hardcoded warning counts with API values.
- [ ] Ensure evidence is reachable from queue within two clicks.

## P3.3 Demo experience

- [ ] Add one-click advisory injection.
- [ ] Add animated ingest → extract → match → score → warn pipeline.
- [ ] Add KEV escalation animation from 82.0 to 93.4.
- [ ] Add lifecycle timeline from NEW to CLOSED.
- [ ] Add guardrail shield state for fake IDs and prompt injection.
- [ ] Add demo keyboard shortcuts for scenarios.
- [ ] Add demo reset control.
- [ ] Add clear “information only” treatment for no-match CVEs.

## P3.4 Graph and P1 views

- [ ] Add CVE → product → asset exposure graph.
- [ ] Use React Flow for the visual graph.
- [ ] Keep graph data sourced from the relational edge table.
- [ ] Add graph/timeline view after P0 is stable.
- [ ] Do not add Neo4j for the hackathon.
- [ ] Add what-if patch result display without mutating production data.
- [ ] Add synthetic log inspection view when P1 backend support is ready.
- [ ] Add approvals queue and notification UI as time permits.
- [ ] Add analyst Q&A UI with “insufficient evidence” responses.

## P3.5 Frontend validation

- [ ] Add component and routing tests.
- [ ] Run lint, type-check, unit tests, and production build.
- [ ] Test responsive layouts at 720p and 1080p.
- [ ] Test keyboard navigation and reduced motion.
- [ ] Test API errors and source degradation.
- [ ] Test offline seed mode.

---

# Person 4 — Data, QA, integration, demo, and documentation

## P4.1 Seed data

- [ ] Build 40–60 synthetic assets across 12–15 products.
- [ ] Include internet-facing, internal, stale, unknown-version, patched, and backported assets.
- [ ] Collect cached NVD, KEV, EPSS, CERT-In/vendor, and abuse.ch data.
- [ ] Create seven fictional scenario advisories.
- [ ] Add eight to ten versioned playbooks.
- [ ] Generate synthetic logs for 2–3 hosts over 7 days.
- [ ] Label all synthetic and fictional data clearly.

## P4.2 Scenario acceptance tests

- [ ] Fictional RCE produces a High warning.
- [ ] KEV addition escalates it to Critical.
- [ ] Critical CVE with no matching asset produces no warning.
- [ ] Unknown version becomes `POSSIBLE` and is capped at Medium.
- [ ] Patched version becomes `NOT_AFFECTED`.
- [ ] Conflicting reports reduce confidence and show a conflict panel.
- [ ] Malicious report text is neutralized and fake IDs are blocked.
- [ ] Source outage degrades one source while other sources continue.
- [ ] Re-ingestion does not create duplicate warnings.
- [ ] Closure writes an immutable snapshot.

## P4.3 Test matrix

- [ ] Run existing backend tests from `TESTING_GUIDE.md`.
- [ ] Add connector and failure-isolation tests.
- [ ] Add extraction gold-set tests.
- [ ] Add correlation and conflict tests.
- [ ] Add matcher boundary tests.
- [ ] Add exact scoring benchmark tests.
- [ ] Add warning deduplication tests.
- [ ] Add lifecycle legal/illegal transition tests.
- [ ] Add audit immutability tests.
- [ ] Add guardrail and injection tests.
- [ ] Add approval authorization tests.
- [ ] Add verification and closure tests.
- [ ] Add API integration tests.
- [ ] Run frontend lint, type-check, tests, and build.
- [ ] Test offline mode and LLM-disabled mode.

## P4.4 Non-functional validation

- [ ] Measure cached ingest-to-warning under 30 seconds.
- [ ] Measure dashboard load under 2 seconds for 60 assets and 200 threats.
- [ ] Verify one failed source does not block the UI.
- [ ] Verify no secrets are committed.
- [ ] Verify external LLM payload redaction.
- [ ] Verify deterministic score reproducibility.
- [ ] Verify source licences and attribution.
- [ ] Verify no real systems are scanned or probed.

## P4.5 Demo and documentation

- [ ] Rehearse the three-minute demo five times.
- [ ] Prepare the sequence:
  1. Overview
  2. Inject advisory
  3. Show extraction and matching
  4. Open warning detail
  5. Add KEV
  6. Show score escalation
  7. Block malicious/fake content
  8. Approve simulated action
  9. Verify remediation
  10. Close warning
  11. Show no-match suppression
- [ ] Prepare a recorded fallback.
- [ ] Test clean-checkout setup on a second machine.
- [ ] Update `README.md` with setup, architecture, scoring, limits, and API usage.
- [ ] Update `TESTING_GUIDE.md` with the final test matrix.
- [ ] Document environment variables and secret handling.
- [ ] Document synthetic, public, fictional, and simulated data boundaries.
- [ ] Document known limitations and future roadmap.
- [ ] Prepare pitch slides and technical Q&A.

## P4.6 P1/future tracking

- [ ] Track NetworkX graph traversal/clustering as P1.
- [ ] Track deterministic evidence retrieval as P0.
- [ ] Track optional LLM narrative as P1.
- [ ] Track embeddings, Neo4j, Celery/Redis, real connectors, multi-tenancy, and STIX export as future/P2.

---

## Recommended execution order

1. Person 1 defines schemas, persistence, and API contracts.
2. Person 2 completes matcher/scorer/extractor contracts against those schemas.
3. Person 4 prepares seed data and acceptance scenarios in parallel.
4. Person 3 builds the UI with mocks, then connects it to the API.
5. At H4, verify the complete vertical slice.
6. At H8, freeze P0 and cut unfinished P1 features.
7. At H11, freeze features and fix only integration defects.
8. At H12–H14, run the full scenario script, performance checks, and demo rehearsals.
