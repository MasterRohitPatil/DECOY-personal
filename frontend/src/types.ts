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
  created_at: string;
  rules_fired: string[];
  brief_summary: string;
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
    kev_flag: boolean;
    epss: number;
  };
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
  ts: string;
  actor: string;
  action: string;
  object: string;
  before_state?: any;
  after_state?: any;
  reason?: string;
  simulated?: boolean;
  hash: string;
}

export interface AuditResponse {
  count: number;
  merkle_root: string;
  verified: boolean;
  records: AuditRecord[];
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



