/**
 * TruthLens — API Client
 * All calls to the FastAPI backend go through this module.
 * Base URL is set via NEXT_PUBLIC_API_URL in .env.local
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Read JWT from localStorage (client-side only) */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tl_token");
}

/** Standard headers — adds Bearer token when available */
function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Generic fetch wrapper with error normalisation */
async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: headers(options.headers as Record<string, string> ?? {}),
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AnalysisResult {
  id: number;
  content: string;
  source_url: string | null;
  verdict: "FAKE" | "MISLEADING" | "UNCERTAIN" | "REAL";
  confidence: number;
  credibility_score: number;
  explanation: string;
  keywords: string[];
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  bias_indicators: string[];
  created_at: string;
  /**
   * Optional field set by the backend predictor.
   * true  = GPT-4o-mini enriched (Stage 2 ran successfully)
   * false = local heuristic only (Stage 1 fallback)
   * undefined = older backend that doesn't return this field
   *
   * Backend note: ensure predictor.py returns ai_enhanced in both
   * _run_stage1() and _run_stage2_openai() result dicts.
   */
  ai_enhanced?: boolean;
}

export interface DashboardStats {
  total: number;
  verdict_counts: Record<string, number>;
  avg_confidence: number;
  avg_credibility: number;
  sentiment_distribution: Record<string, number>;
  recent_trend: Array<{ date: string; credibility: number; confidence: number; verdict: string }>;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    req<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    }),

  login: (email: string, password: string) =>
    req<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => req<User>("/auth/me"),
};

// ─── Analysis API ──────────────────────────────────────────────────────────────

export const analyzeApi = {
  run: (content: string, source_url?: string) =>
    req<AnalysisResult>("/analyze", {
      method: "POST",
      body: JSON.stringify({ content, source_url: source_url || undefined }),
    }),

  history: (skip = 0, limit = 20) =>
    req<AnalysisResult[]>(`/analyze/history?skip=${skip}&limit=${limit}`),

  getOne: (id: number) => req<AnalysisResult>(`/analyze/${id}`),

  delete: (id: number) =>
    req<void>(`/analyze/${id}`, { method: "DELETE" }),
};

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => req<DashboardStats>("/dashboard/stats"),
};
