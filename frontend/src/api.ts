import {
  OverviewData, WarningItem, WarningDetail, AssetItem,
  AuditResponse, SmtpStatusResponse, SendEmailPayload, SendEmailResponse,
  UserProfile, AuthResponse, DemoAccountInfo, AttackResponse
} from './types';

const API_BASE = 'http://localhost:8000/api';

const TOKEN_KEY = 'sentinel_jwt_token';
const USER_KEY = 'sentinel_user';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setSession(token: string, user: UserProfile) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

function getAuthHeaders(): Record<string, string> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Fallback baseline data if API is loading or offline
const MOCK_OVERVIEW: OverviewData = {
  status: 'OPERATIONAL',
  total_assets: 26,
  active_warnings: 1,
  bands: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, LOW: 0 },
  threats_ingested: 4,
  security_events_logged: 0,
  source_health: [
    { source: 'NVD (NIST)', status: 'ONLINE', latency_ms: 42, cached_records: 1840 },
    { source: 'CISA KEV', status: 'ONLINE', latency_ms: 38, cached_records: 1120 },
    { source: 'FIRST EPSS', status: 'ONLINE', latency_ms: 65, cached_records: 45000 },
    { source: 'CERT-In Advisories', status: 'ONLINE', latency_ms: 110, cached_records: 312 },
    { source: 'abuse.ch Feodo/Mirai', status: 'ONLINE', latency_ms: 55, cached_records: 8900 }
  ],
  flags: {
    synthetic_data: true,
    simulated_actions: true,
    offline_profile: true
  }
};

const MOCK_WARNING_DETAIL: WarningDetail = {
  id: 'W-2026-001',
  title: 'CRITICAL RCE in NGINX Ingress on Public Auth Gateway',
  risk_score: 82.0,
  band: 'HIGH',
  confidence: 0.88,
  status: 'TRIAGED',
  target_hostname: 'auth-srv-01.prod.sentinel',
  created_at: new Date().toISOString(),
  rules_fired: ['R3_KEV_OR_LIKELY_EXPOSURE', 'R7_NO_COMPENSATING_CONTROL'],
  brief_summary: 'CRITICAL: Vulnerable NGINX 1.24.0 exposed on internet-facing auth-srv-01. Remote Code Execution verified by vendor advisory. Immediate upgrade to >=1.25.3 required.',
  dimensions: { S: 0.88, E: 0.80, X: 1.0, V: 0.50, I: 0.80 },
  asset: {
    id: 'ast-01',
    hostname: 'auth-srv-01.prod.sentinel',
    product: 'nginx',
    version: '1.24.0',
    environment: 'PROD',
    internet_facing: true,
    criticality: 5
  },
  threat: {
    cve_ids: ['CVE-2026-4421'],
    title: 'NGINX Ingress Controller Remote Code Execution',
    description: 'Buffer overflow in HTTP header parsing allows unauthenticated RCE via crafted request.',
    kev_flag: false,
    epss: 0.85
  },
  evidence: [
    {
      citation_key: '[REF-1]',
      citation_text: 'NVD CVE-2026-4421: Ingress-NGINX Buffer Overflow RCE advisory published 2026-10-28.',
      url_or_ref: 'https://nvd.nist.gov/vuln/detail/CVE-2026-4421',
      confidence: 0.95
    }
  ],
  playbook: {
    title: 'NGINX Ingress Rapid Containment & Patch',
    version: '1.0',
    steps: [
      '1. Deploy WAF header inspection rule BLOCK_OVERSIZED_HTTP_HEADERS.',
      '2. Upgrade NGINX ingress controller deployment to version >= 1.25.3.',
      '3. Restart ingress pods in rolling update.',
      '4. Verify zero 500 error spikes in Prometheus gateway metrics.'
    ]
  },
  audit_history: [
    {
      actor: 'SENTINEL_ENGINE',
      action: 'INVENTORY_MATCH',
      reason: 'Automated version correlation matched CVE-2026-4421 to auth-srv-01',
      timestamp: new Date().toISOString()
    }
  ]
};

export const api = {
  async getOverview(): Promise<OverviewData> {
    try {
      const res = await fetch(`${API_BASE}/overview`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return MOCK_OVERVIEW;
    }
  },

  async getWarnings(): Promise<WarningItem[]> {
    try {
      const res = await fetch(`${API_BASE}/warnings`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return [
        {
          id: 'W-2026-001',
          title: 'CRITICAL RCE in NGINX Ingress on Public Auth Gateway',
          risk_score: 82.0,
          band: 'HIGH',
          confidence: 0.88,
          status: 'TRIAGED',
          target_hostname: 'auth-srv-01.prod.sentinel',
          created_at: new Date().toISOString(),
          rules_fired: ['R3_KEV_OR_LIKELY_EXPOSURE'],
          brief_summary: 'CRITICAL: Vulnerable NGINX 1.24.0 on auth-srv-01. Vendor advisory verified.'
        }
      ];
    }
  },

  async getWarningDetail(id: string): Promise<WarningDetail> {
    try {
      const res = await fetch(`${API_BASE}/warnings/${id}`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return MOCK_WARNING_DETAIL;
    }
  },

  async getAiBrief(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/warnings/${id}/ai-brief`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return {
        mode: 'DETERMINISTIC_SAFE_BRIEF',
        model: 'rule-based-template-v1',
        summary: '• CRITICAL THREAT: NGINX Ingress RCE (CVE-2026-4421) verified.\n• EXPOSURE: Internet-facing host auth-srv-01 runs vulnerable nginx 1.24.0.\n• RECOMMENDED ACTION: Deploy WAF header rule & upgrade to >= 1.25.3 immediately.',
        fallback: true
      };
    }
  },

  async getAssets(): Promise<AssetItem[]> {
    try {
      const res = await fetch(`${API_BASE}/assets`);
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return [
        {
          id: 'ast-01',
          hostname: 'auth-srv-01.prod.sentinel',
          product: 'nginx',
          vendor: 'f5',
          version: '1.24.0',
          environment: 'PROD',
          internet_facing: true,
          criticality: 5,
          owner: 'Identity Team',
          exposure_status: 'CONFIRMED_EXPOSED',
          synthetic: true
        },
        {
          id: 'ast-02',
          hostname: 'pay-gateway-01.prod.sentinel',
          product: 'log4j-core',
          vendor: 'apache',
          version: '2.14.1',
          environment: 'PROD',
          internet_facing: true,
          criticality: 5,
          owner: 'Payments Core',
          exposure_status: 'CONFIRMED_EXPOSED',
          synthetic: true
        }
      ];
    }
  },

  async injectScenario(scenarioId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/inject/${scenarioId}`, { method: 'POST' });
      return await res.json();
    } catch {
      return { status: 'DISPATCHED', warning_id: 'W-2026-002', score: 82.0, band: 'HIGH' };
    }
  },

  async escalateKev(cveId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/kev/${cveId}`, { method: 'POST' });
      return await res.json();
    } catch {
      return { status: 'ESCALATED', old_score: 82.0, new_score: 93.4, band: 'CRITICAL' };
    }
  },

  async triggerAttack(attackType: string, targetHostname?: string): Promise<AttackResponse> {
    const url = targetHostname
      ? `${API_BASE}/demo/attack/${attackType}?target_hostname=${encodeURIComponent(targetHostname)}`
      : `${API_BASE}/demo/attack/${attackType}`;
    const res = await fetch(url, { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Attack simulation failed with status ${res.status}`);
    }
    return await res.json();
  },

  async blockIp(ip: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/block-ip/${ip}`, { method: 'POST' });
      return await res.json();
    } catch {
      return { status: 'IP_BLOCKED', ip, new_score: 72.9, new_band: 'HIGH' };
    }
  },

  async approveWarning(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/warnings/${id}/approve`, { method: 'POST' });
      return await res.json();
    } catch {
      return { status: 'ACTION_APPROVED_AND_SIMULATED' };
    }
  },

  async uploadCsv(file?: File, rawContent?: string): Promise<any> {
    const token = authStorage.getToken();
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/upload/csv`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'CSV upload failed' }));
        throw new Error(err.detail || 'CSV upload failed');
      }
      return await res.json();
    } else {
      const res = await fetch(`${API_BASE}/upload/csv`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(rawContent || '')
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'CSV upload failed' }));
        throw new Error(err.detail || 'CSV upload failed');
      }
      return await res.json();
    }
  },

  async getSampleCsv(name: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/sample-csv/${name}`);
      if (!res.ok) throw new Error('Failed to fetch sample');
      return await res.text();
    } catch {
      return `cve_id,title,product,version_constraints,cvss,exploitation_level,epss,kev_flag,description
CVE-2024-3094,XZ Utils Malicious Backdoor RCE,xz-utils,>=5.6.0 <=5.6.1,10.0,5,0.95,true,Malicious code injected into xz upstream tarballs.`;
    }
  },

  async resetDemo(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
      return await res.json();
    } catch {
      return { status: 'success', elapsed_seconds: 0.85 };
    }
  },

  async getAuditTrail(): Promise<AuditResponse> {
    try {
      const res = await fetch(`${API_BASE}/audit`);
      if (!res.ok) throw new Error('Failed to fetch audit log');
      return await res.json();
    } catch {
      return {
        count: 5,
        merkle_root: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        verified: true,
        records: [
          {
            id: 'audit-01',
            ts: new Date().toISOString(),
            actor: 'SecOps Automated Engine',
            action: 'FIREWALL_IP_BLOCK',
            object: '185.220.101.5',
            before_state: { status: 'ACTIVE_BREACH', score: 98.2 },
            after_state: { status: 'CONTAINED', score: 64.0 },
            reason: 'Emergency isolation of C2 beacon',
            hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
          },
          {
            id: 'audit-02',
            ts: new Date(Date.now() - 300000).toISOString(),
            actor: 'National Threat Ingestion Pipeline',
            action: 'CVSS_TRIAGE_VERIFIED',
            object: 'CVE-2024-3094',
            before_state: { status: 'NEW' },
            after_state: { status: 'TRIAGED' },
            reason: 'Verified in CISA KEV repository',
            hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
          }
        ]
      };
    }
  },

  async getSmtpStatus(): Promise<SmtpStatusResponse> {
    const res = await fetch(`${API_BASE}/alerts/smtp-status`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to query SMTP status');
    return await res.json();
  },

  async sendRealEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
    const res = await fetch(`${API_BASE}/alerts/send-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send email' }));
      throw new Error(err.detail || 'Email dispatch failed');
    }
    return await res.json();
  },

  async getWhatsappLink(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/whatsapp-link`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate WhatsApp link');
    return await res.json();
  },

  // Real Authentication Methods
  async getDemoAccounts(): Promise<DemoAccountInfo[]> {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    if (!res.ok) throw new Error('Failed to load demo accounts');
    return await res.json();
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Invalid email or password');
    }
    const data: AuthResponse = await res.json();
    authStorage.setSession(data.access_token, data.user);
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    organization?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Failed to register account');
    }
    const data: AuthResponse = await res.json();
    authStorage.setSession(data.access_token, data.user);
    return data;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        authStorage.clearSession();
        return null;
      }
      const user: UserProfile = await res.json();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      return authStorage.getUser();
    }
  },

  logout() {
    authStorage.clearSession();
  }
};

