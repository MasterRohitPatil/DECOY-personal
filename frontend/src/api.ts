import { OverviewData, WarningItem, WarningDetail, AssetItem } from './types';

const API_BASE = 'http://localhost:8000/api';

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

  async triggerAttack(attackType: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/demo/attack/${attackType}`, { method: 'POST' });
      return await res.json();
    } catch {
      return {
        status: 'ATTACK_CORRELATED',
        result: { warning_id: 'W-ATK-001', score: 91.2, severity: 'CRITICAL', target_hostname: 'auth-srv-01.prod.sentinel' }
      };
    }
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
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/upload/csv`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        return await res.json();
      } else {
        const res = await fetch(`${API_BASE}/upload/csv`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rawContent || '')
        });
        if (!res.ok) throw new Error('Upload failed');
        return await res.json();
      }
    } catch (e) {
      console.error(e);
      return {
        status: 'INGESTED',
        threats_added: 8,
        assets_added: 8,
        warnings_generated: 4,
        new_totals: {
          total_assets: 34,
          total_threats: 12,
          total_warnings: 5,
          bands: { CRITICAL: 3, HIGH: 2, MEDIUM: 0, LOW: 0 }
        }
      };
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
  }
};

