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

export interface Analyst {
  id: string;
  name: string;
  email: string;
  role: 'Senior Analyst' | 'Junior Analyst';
  specialization: string;
  status: 'ACTIVE' | 'AWAY' | 'ON_CALL';
  avatarUrl?: string;
}

export interface SocTeamResponse {
  senior_analysts: Analyst[];
  junior_analysts: Analyst[];
  max_junior_allowed: number;
  junior_slots_remaining: number;
  all: Analyst[];
}

export interface ChatMessage {
  id: string;
  channel: 'general' | 'dm';
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId?: string;
  timestamp: string;
  text: string;
  codeSnippet?: {
    language: string;
    description: string;
    code: string;
  };
  warningReference?: string;
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

export interface OtpRequestResponse {
  status: string;
  dispatched_to: string;
  preview_otp_for_hackathon: string;
  message: string;
}

export interface OtpVerifyResponse {
  status: string;
  token: string;
  officer: string;
  message: string;
}

export interface DispatchAlertResponse {
  status: string;
  whatsapp: {
    phone: string;
    deep_link: string;
    preview: string;
  };
  email: {
    recipient: string;
    status: string;
    relay: string;
    message_id: string;
  };
}

