import {
  OverviewData, WarningItem, WarningDetail, AssetItem,
  AuditResponse, SmtpStatusResponse, SendEmailPayload, SendEmailResponse,
  UserProfile, AuthResponse, DemoAccountInfo, AttackResponse, AiRecommendationsAdvice,
  AdvisoryAnalysisResponse
} from './types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';

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

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseHeaders = getAuthHeaders();
  const headers = {
    ...baseHeaders,
    ...(options.headers as Record<string, string> || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText || 'Request failed' }));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return (await res.text()) as unknown as T;
}

export const api = {
  getApiBase(): string {
    return API_BASE;
  },

  async getOverview(): Promise<OverviewData> {
    return await apiFetch<OverviewData>('/overview');
  },

  async getWarnings(): Promise<WarningItem[]> {
    return await apiFetch<WarningItem[]>('/warnings');
  },

  async getWarningDetail(id: string): Promise<WarningDetail> {
    return await apiFetch<WarningDetail>(`/warnings/${encodeURIComponent(id)}`);
  },

  getWarningPdfUrl(warningId: string): string {
    return `${API_BASE}/warnings/${encodeURIComponent(warningId)}/pdf`;
  },

  async getAiBrief(id: string): Promise<any> {
    return await apiFetch<any>(`/warnings/${encodeURIComponent(id)}/ai-brief`);
  },

  async getAiRecommendations(id: string): Promise<AiRecommendationsAdvice> {
    return await apiFetch<AiRecommendationsAdvice>(`/warnings/${encodeURIComponent(id)}/ai-recommendations`);
  },

  async blockWarningIndicator(id: string): Promise<any> {
    return await apiFetch<any>(`/warnings/${encodeURIComponent(id)}/block-indicator`, { method: 'POST' });
  },

  async toggleInvestigationStep(id: string, stepId: string, stepTitle: string, completed: boolean): Promise<{ status: string; warning_id: string; completed_steps: string[] }> {
    return await apiFetch<{ status: string; warning_id: string; completed_steps: string[] }>(
      `/warnings/${encodeURIComponent(id)}/investigate-step`,
      {
        method: 'POST',
        body: JSON.stringify({ step_id: stepId, step_title: stepTitle, completed })
      }
    );
  },

  async getAssets(): Promise<AssetItem[]> {
    return await apiFetch<AssetItem[]>('/assets');
  },

  async injectScenario(scenarioId: string): Promise<any> {
    return await apiFetch<any>(`/demo/inject/${encodeURIComponent(scenarioId)}`, { method: 'POST' });
  },

  async escalateKev(cveId: string): Promise<any> {
    return await apiFetch<any>(`/demo/kev/${encodeURIComponent(cveId)}`, { method: 'POST' });
  },

  async triggerAttack(attackType: string, targetHostname?: string): Promise<AttackResponse> {
    const query = targetHostname ? `?target_hostname=${encodeURIComponent(targetHostname)}` : '';
    return await apiFetch<AttackResponse>(`/demo/attack/${encodeURIComponent(attackType)}${query}`, {
      method: 'POST'
    });
  },

  async blockIp(ip: string): Promise<any> {
    return await apiFetch<any>(`/demo/block-ip/${encodeURIComponent(ip)}`, { method: 'POST' });
  },

  async approveWarning(id: string): Promise<any> {
    return await apiFetch<any>(`/warnings/${encodeURIComponent(id)}/approve`, { method: 'POST' });
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
      return await apiFetch<any>('/upload/csv', {
        method: 'POST',
        body: JSON.stringify(rawContent || '')
      });
    }
  },

  async getSampleCsv(name: string): Promise<string> {
    return await apiFetch<string>(`/sample-csv/${encodeURIComponent(name)}`);
  },

  async resetDemo(): Promise<any> {
    return await apiFetch<any>('/demo/reset', { method: 'POST' });
  },

  async analyzeAdvisory(advisoryText: string): Promise<AdvisoryAnalysisResponse> {
    return await apiFetch<AdvisoryAnalysisResponse>('/analyze-advisory', {
      method: 'POST',
      body: JSON.stringify({ advisory_text: advisoryText })
    });
  },

  async getAuditTrail(): Promise<AuditResponse> {
    return await apiFetch<AuditResponse>('/audit');
  },

  async verifyAuditTrail(): Promise<any> {
    return await apiFetch<any>('/audit/verify');
  },

  async simulateAuditTamper(recordId?: string | number): Promise<AuditResponse> {
    return await apiFetch<AuditResponse>('/audit/simulate-tamper', {
      method: 'POST',
      body: JSON.stringify(recordId !== undefined ? { record_id: recordId } : {})
    });
  },

  async getSmtpStatus(): Promise<SmtpStatusResponse> {
    return await apiFetch<SmtpStatusResponse>('/alerts/smtp-status');
  },

  async sendRealEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
    return await apiFetch<SendEmailResponse>('/alerts/send-email', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getWhatsappLink(payload: any): Promise<any> {
    return await apiFetch<any>('/alerts/whatsapp-link', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Real Authentication Methods
  async getDemoAccounts(): Promise<DemoAccountInfo[]> {
    return await apiFetch<DemoAccountInfo[]>('/auth/demo-accounts');
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
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
    const data = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authStorage.setSession(data.access_token, data.user);
    return data;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const user = await apiFetch<UserProfile>('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      authStorage.clearSession();
      return null;
    }
  },

  logout() {
    authStorage.clearSession();
  }
};
