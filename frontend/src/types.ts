export interface Dimensions {
  S: number;
  E: number;
  X: number;
  V: number;
  I: number;
}

export interface WarningItem {
  id: string;
  title: string;
  risk_score: number;
  band: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  status: string;
  target_hostname: string;
  product?: string;
  version?: string;
  environment?: string;
  internet_facing?: boolean;
  cve_id?: string | null;
  source_ip?: string | null;
  created_at: string;
  rules_fired: string[];
  brief_summary: string;
}

export interface InvestigationStep {
  id: string;
  title: string;
  why_it_matters: string;
  command: string;
}

export interface ActionableRecommendations {
  warning_id: string;
  summary_banner: string;
  patching: {
    pillar: string;
    label: string;
    headline: string;
    target_host: string;
    product: string;
    current_version: string;
    target_safe_version: string;
    sla_window: string;
    cli_command: string;
    zero_downtime_hotfix: string;
    completed: boolean;
  };
  blocking: {
    pillar: string;
    label: string;
    headline: string;
    indicator_type: string;
    indicator_value: string;
    source_ip?: string | null;
    firewall_command: string;
    current_score: number;
    projected_score_after_block: number;
    completed: boolean;
  };
  investigation: {
    pillar: string;
    label: string;
    headline: string;
    steps: InvestigationStep[];
    completed_steps: string[];
  };
}

export interface AiRecommendationsAdvice {
  warning_id: string;
  mode: string;
  model: string;
  guidance: string;
  fallback: boolean;
}

export interface WarningDetail extends WarningItem {
  dimensions: Dimensions;
  asset?: {
    id: string;
    hostname: string;
    product: string;
    version: string;
    environment: string;
    internet_facing: boolean;
    criticality: number;
  };
  threat?: {
    cve_ids: string[];
    title: string;
    description: string;
    version_constraints?: string;
    kev_flag: boolean;
    epss: number;
  };
  security_event?: {
    event_type: string;
    source_ip: string;
    payload: string;
  } | null;
  evidence: Array<{
    citation_key: string;
    citation_text: string;
    url_or_ref: string;
    confidence: number;
  }>;
  playbook?: {
    title: string;
    version: string;
    steps: string[];
  };
  recommendations?: ActionableRecommendations;
  audit_history: Array<{
    actor: string;
    action: string;
    reason: string;
    timestamp: string;
    before?: any;
    after?: any;
  }>;
}

export interface AssetItem {
  id: string;
  hostname: string;
  product: string;
  vendor: string;
  version: string;
  environment: string;
  internet_facing: boolean;
  criticality: number;
  owner: string;
  exposure_status: string;
  active_warning_id?: string | null;
  matched_cve?: string | null;
  risk_score?: number | null;
  warning_status?: string | null;
  synthetic: boolean;
}

export interface OverviewData {
  status: string;
  total_assets: number;
  active_warnings: number;
  bands: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  threats_ingested: number;
  security_events_logged: number;
  noise_reduction_ratio?: number;
  total_feed_records?: number;
  source_health: Array<{
    source: string;
    status: string;
    latency_ms: number;
    cached_records: number;
  }>;
  flags: {
    synthetic_data: boolean;
    simulated_actions: boolean;
    offline_profile: boolean;
  };
}

export interface AuditRecord {
  id: string;
  block_number?: number;
  ts: string;
  actor: string;
  action: string;
  object: string;
  before_state?: any;
  after_state?: any;
  reason?: string;
  simulated?: boolean;
  prev_hash?: string;
  hash: string;
  expected_hash?: string;
  integrity_status?: 'VERIFIED' | 'TAMPERED_ORIGIN' | 'CASCADE_BROKEN';
}

export interface AuditTamperReport {
  compromised_record_id: string | number;
  compromised_block_number: number;
  target_object: string;
  target_action: string;
  original_after_state: any;
  tampered_after_state: any;
  expected_hash: string;
  tampered_hash: string;
  cascade_broken_blocks: number;
  expected_merkle_root: string;
  tampered_merkle_root: string;
}

export interface AuditResponse {
  count: number;
  merkle_root: string;
  expected_merkle_root?: string;
  verified: boolean;
  tamper_detected?: boolean;
  tamper_report?: AuditTamperReport;
  records: AuditRecord[];
}

export interface AdvisoryAnalysisResponse {
  status: 'WARNING_GENERATED' | 'SUPPRESSED_NO_EXPOSURE' | 'BLOCKED_BY_GUARDRAIL';
  verdict_badge: string;
  headline: string;
  plain_explanation: string;
  ai_mode?: string;
  warning_id?: string;
  risk_score?: number;
  band?: string;
  guardrail_triggers: string[];
  cve_validations: Array<{ cve: string; valid: boolean; detail: string }>;
  extracted: {
    cves: string[];
    vendor: string;
    product: string;
    version_constraints: string;
    cvss: number;
    is_kev: boolean;
    iocs: string[];
  };
  assets_scanned: number;
  safe_assets_note?: string[];
  matched_assets: Array<{
    hostname: string;
    product: string;
    version: string;
    environment: string;
    internet_facing: boolean;
    status: string;
  }>;
}

export interface SmtpStatusResponse {
  configured: boolean;
  host: string;
  port: number;
  from_address: string;
}

export interface SendEmailPayload {
  to_email: string;
  warning_id: string;
  title: string;
  target_hostname: string;
  source_ip: string;
  risk_score: number;
  band: string;
  recommended_action: string;
}

export interface SendEmailResponse {
  status: string;
  recipient: string;
  smtp_server: string;
  subject: string;
  pdf_attached?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'CISO_ADMIN' | 'SECOPS_ANALYST' | 'THREAT_RESEARCHER' | string;
  organization: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface DemoAccountInfo {
  email: string;
  password: string;
  full_name: string;
  role: string;
  role_label: string;
  organization: string;
  description: string;
}

export interface KillChainStep {
  step: number;
  phase: string;
  node: string;
  entity: string;
  detail: string;
  status: string;
  mitre_id: string;
}

export interface AttackResult {
  event_id: string;
  warning_id: string;
  attack_type: string;
  source_ip: string;
  target_hostname: string;
  target_asset: {
    id: string;
    hostname: string;
    product: string;
    version: string;
    environment: string;
    internet_facing: boolean;
    criticality: number;
  };
  exposure_status: string;
  is_software_applicable: boolean;
  active_threat_cve: string | null;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  dimensions: Dimensions;
  rules_fired: string[];
  kill_chain: KillChainStep[];
  raw_payload: string;
}

export interface AttackResponse {
  status: string;
  result: AttackResult;
  alerts: {
    whatsapp: string;
    email: {
      subject: string;
      to: string;
      body: string;
    };
  };
}



