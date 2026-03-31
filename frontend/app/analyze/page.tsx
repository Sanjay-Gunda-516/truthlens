"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzeApi, type AnalysisResult } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import {
  Search, Link2, AlertTriangle, CheckCircle, HelpCircle,
  AlertCircle, Tag, BarChart2, Shield, Zap, Clock, Trash2,
  Cpu, Sparkles, RefreshCcw, TrendingUp, Eye,
} from "lucide-react";

/* ── Palette helpers (consistent across all sub-components) ──────────────── */
const VERDICT_COLOR: Record<string, string> = {
  FAKE: "var(--coral)", REAL: "var(--cyan)",
  MISLEADING: "var(--amber)", UNCERTAIN: "var(--violet)",
};
const VERDICT_BG: Record<string, string> = {
  FAKE: "rgba(255,90,90,0.08)", REAL: "rgba(0,229,192,0.08)",
  MISLEADING: "rgba(255,184,51,0.08)", UNCERTAIN: "rgba(167,139,250,0.08)",
};
const VERDICT_BORDER: Record<string, string> = {
  FAKE: "rgba(255,90,90,0.22)", REAL: "rgba(0,229,192,0.22)",
  MISLEADING: "rgba(255,184,51,0.22)", UNCERTAIN: "rgba(167,139,250,0.22)",
};

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AnalyzePage() {
  const router  = useRouter();
  const [content,     setContent]     = useState("");
  const [sourceUrl,   setSourceUrl]   = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState<AnalysisResult | null>(null);
  const [history,     setHistory]     = useState<AnalysisResult[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  /* Protected route */
  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/auth/login"); return; }
    loadHistory();
  }, [router]);

  async function loadHistory() {
    try {
      const h = await analyzeApi.history(0, 8);
      setHistory(h);
    } catch {}
    finally { setHistLoading(false); }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const r = await analyzeApi.run(content, sourceUrl || undefined);
      setResult(r);
      setHistory((prev) => [r, ...prev.slice(0, 7)]);
      // Smooth scroll to result after paint
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await analyzeApi.delete(id);
      setHistory((prev) => prev.filter((a) => a.id !== id));
      if (result?.id === id) setResult(null);
    } catch {}
  }

  const charOk = content.length >= 20;

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div style={bgStyles.grid} />
      <Navbar active="analyze" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 48, position: "relative" }}>
          <div style={bgStyles.heroGlow} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, background: "rgba(0,229,192,0.08)", border: "1px solid rgba(0,229,192,0.2)", marginBottom: 20 }}>
            <Zap size={13} color="var(--cyan)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.06em", textTransform: "uppercase" }}>AI-Powered Fact Analysis</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16, color: "var(--white)" }}>
            Is it real, or is it <br />
            <span style={{ background: "linear-gradient(135deg, var(--cyan) 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>misinformation?</span>
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 540, margin: "0 auto" }}>
            Paste any news article, social media post, or claim. TruthLens analyses credibility signals, sentiment, and bias in real time.
          </p>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: "28px", marginBottom: 32 }}>
          <form onSubmit={handleAnalyze}>
            {/* Textarea */}
            <div style={{ marginBottom: 14 }}>
              <label style={formStyles.label}>
                <Search size={14} />
                Content to analyse
              </label>
              <textarea
                className="tl-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste a news article, tweet, claim, or any text you want to fact-check…"
                rows={6}
                required
                style={{ resize: "vertical", minHeight: 130, lineHeight: 1.6 }}
              />
              {/* Character counter */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {!charOk && content.length > 0 && (
                    <span style={{ color: "var(--coral)" }}>Need {20 - content.length} more characters</span>
                  )}
                </span>
                <span style={{ fontSize: 12, color: charOk ? "var(--muted)" : content.length > 0 ? "var(--coral)" : "var(--muted)", fontFamily: "var(--font-mono)" }}>
                  {content.length} / 20+
                </span>
              </div>
            </div>

            {/* URL */}
            <div style={{ marginBottom: 20 }}>
              <label style={formStyles.label}>
                <Link2 size={14} />
                Source URL <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                className="tl-input"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/article"
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(255,90,90,0.08)", border: "1px solid rgba(255,90,90,0.22)", color: "var(--coral)", fontSize: 13, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle size={15} />
                  {error}
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--coral)", padding: 2, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "var(--font-outfit)", fontWeight: 600 }}
                >
                  <RefreshCcw size={12} /> Retry
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !charOk}
              style={{ width: "100%", justifyContent: "center", padding: "14px 28px", fontSize: 16 }}
            >
              {loading ? (
                <><BtnSpinner />Analysing content…</>
              ) : (
                <><Shield size={17} />Analyse Credibility</>
              )}
            </button>
          </form>
        </div>

        {/* ── Scanning animation ────────────────────────────────────────── */}
        {loading && (
          <div className="glass-card" style={{ padding: 24, marginBottom: 32, position: "relative", overflow: "hidden" }}>
            <div className="scan-overlay" />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,229,192,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield size={20} color="var(--cyan)" style={{ animation: "pulse 1.2s ease-in-out infinite" }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "var(--white)", marginBottom: 4 }}>Running credibility analysis…</p>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Scanning for misinformation signals, sentiment patterns, and bias indicators</p>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              {["Tokenising text", "Scoring signals", "Detecting bias", "Computing verdict"].map((s, i) => (
                <div key={s} style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>{s}</div>
                  <div style={{ height: 4, borderRadius: 4, background: "rgba(0,229,192,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, animation: `shimmer 1.5s ${i * 0.3}s infinite`, backgroundImage: "linear-gradient(90deg, rgba(0,229,192,0.15), rgba(0,229,192,0.6), rgba(0,229,192,0.15))", backgroundSize: "200% 100%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Result ───────────────────────────────────────────────────── */}
        <div ref={resultRef}>
          {result && !loading && <ResultSection result={result} />}
        </div>

        {/* ── History ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: 56 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: "var(--white)" }}>
              <Clock size={18} style={{ display: "inline", marginRight: 8, color: "var(--muted)", verticalAlign: "middle" }} />
              Recent analyses
            </h2>
            {history.length > 0 && (
              <button onClick={() => router.push("/dashboard")} style={{ fontSize: 13, color: "var(--cyan)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-outfit)", fontWeight: 600 }}>
                View dashboard →
              </button>
            )}
          </div>

          {histLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {[1,2,3].map((i) => <div key={i} className="loading-shimmer" style={{ height: 108 }} />)}
            </div>
          ) : history.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px 24px", textAlign: "center" }}>
              <BarChart2 size={32} color="var(--muted)" style={{ margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No analyses yet. Submit your first one above!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {history.map((a) => (
                <HistoryCard key={a.id} item={a} onDelete={handleDelete} onClick={() => { setResult(a); resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ResultSection — full analysis display
══════════════════════════════════════════════════════════════════════════════ */
function ResultSection({ result }: { result: AnalysisResult }) {
  const v = result.verdict;
  const color  = VERDICT_COLOR[v] || "var(--white)";
  const VerdictIcon = { FAKE: AlertTriangle, REAL: CheckCircle, MISLEADING: AlertCircle, UNCERTAIN: HelpCircle }[v] || HelpCircle;
  const badgeClass = { FAKE: "badge-fake", REAL: "badge-real", MISLEADING: "badge-mislead", UNCERTAIN: "badge-uncert" }[v] || "badge-uncert";

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Analysis method banner ──────────────────────────────────────── */}
      <MethodBanner aiEnhanced={result.ai_enhanced} />

      {/* ── Verdict banner ──────────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: "24px 28px",
        border: `1px solid ${VERDICT_BORDER[v]}`,
        background: VERDICT_BG[v],
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          {/* Left: icon + verdict + confidence badge */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flex: 1, minWidth: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, border: `1px solid ${color}38`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <VerdictIcon size={24} color={color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", color, lineHeight: 1 }}>{v}</span>
                <span className={`badge ${badgeClass}`}>{result.confidence.toFixed(0)}% confident</span>
              </div>
              {/* Explanation paragraph */}
              <p style={{ fontSize: 14, color: "rgba(240,244,255,0.8)", lineHeight: 1.65, maxWidth: 620 }}>
                {result.explanation}
              </p>
            </div>
          </div>
          {/* Right: Score ring */}
          <ScoreRing score={result.credibility_score} color={color} />
        </div>
      </div>

      {/* ── Progress bars ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <ProgressCard
          label="Credibility Score"
          value={result.credibility_score}
          max={100}
          unit="/100"
          color={color}
          icon={<Shield size={14} color={color} />}
          description={scoreLabel(result.credibility_score)}
        />
        <ProgressCard
          label="Confidence"
          value={result.confidence}
          max={100}
          unit="%"
          color="var(--violet)"
          icon={<TrendingUp size={14} color="var(--violet)" />}
          description={result.confidence >= 80 ? "High certainty" : result.confidence >= 55 ? "Moderate certainty" : "Low certainty"}
        />
      </div>

      {/* ── Sentiment + metrics ────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Zap size={14} color="var(--muted)" />
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sentiment Analysis</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <SentimentBadge sentiment={result.sentiment} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <SentimentBar score={result.sentiment_score} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)" }}>
            score: <span style={{ color: "var(--white)", fontWeight: 600 }}>{result.sentiment_score.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* ── Keywords + Bias ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Suspicious phrases */}
        <div className="glass-card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Tag size={14} color="var(--coral)" />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--white)" }}>Suspicious Phrases</span>
            {result.keywords.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--font-mono)", background: "rgba(255,90,90,0.1)", color: "var(--coral)", padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(255,90,90,0.2)" }}>
                {result.keywords.length} found
              </span>
            )}
          </div>
          {result.keywords.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>✓ No suspicious phrases detected.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.keywords.map((kw) => (
                <span key={kw} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.2)", color: "var(--coral)", fontFamily: "var(--font-mono)" }}>
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bias indicators */}
        <div className="glass-card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={14} color="var(--amber)" />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--white)" }}>Bias Indicators</span>
            {result.bias_indicators.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--font-mono)", background: "rgba(255,184,51,0.1)", color: "var(--amber)", padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(255,184,51,0.2)" }}>
                {result.bias_indicators.length} found
              </span>
            )}
          </div>
          {result.bias_indicators.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>✓ No bias patterns detected.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.bias_indicators.map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />
                  <span style={{ color: "rgba(240,244,255,0.8)" }}>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Highlighted content preview ────────────────────────────────── */}
      {result.keywords.length > 0 && (
        <div className="glass-card animate-slide-up delay-200" style={{ padding: "20px 24px", opacity: 0, animationFillMode: "forwards" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Eye size={14} color="var(--muted)" />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--white)" }}>Content with Highlighted Phrases</span>
            <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>— suspicious phrases are underlined in red</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(240,244,255,0.7)", fontFamily: "var(--font-mono)", maxHeight: 180, overflowY: "auto" }}>
            <HighlightedText text={result.content} phrases={result.keywords} />
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
══════════════════════════════════════════════════════════════════════════════ */

/** Shows "AI Verified Analysis" or "Fallback Analysis" banner */
function MethodBanner({ aiEnhanced }: { aiEnhanced?: boolean }) {
  if (aiEnhanced === undefined) return null; // gracefully hidden for older backend versions

  if (aiEnhanced) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="method-badge-ai">
          <Sparkles size={12} color="var(--cyan)" />
          AI Verified Analysis
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>powered by GPT-4o-mini</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div className="method-badge-local">
        <Cpu size={12} />
        Fallback Analysis (No AI)
      </div>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>local heuristic scoring · add OpenAI key for richer analysis</span>
    </div>
  );
}

/** Animated horizontal progress bar card */
function ProgressCard({ label, value, max, unit, color, icon, description }: {
  label: string; value: number; max: number; unit: string;
  color: string; icon: React.ReactNode; description: string;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, [value]);

  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="glass-card" style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.04em", color, lineHeight: 1 }}>
          {value.toFixed(0)}
        </span>
        <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>{unit}</span>
        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>{description}</span>
      </div>
      <div className="tl-progress-track">
        <div
          className="tl-progress-fill"
          style={{
            width: animated ? `${pct}%` : "0%",
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: animated ? `0 0 10px ${color}60` : "none",
          }}
        />
      </div>
    </div>
  );
}

/** SVG score ring */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 84, r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.34,1.2,0.64,1)", filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div style={{ textAlign: "center", marginTop: -(size/2) - 4, position: "relative", zIndex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 19, color, lineHeight: 1 }}>{score.toFixed(0)}</div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>/ 100</div>
      </div>
    </div>
  );
}

/** Sentiment label pill */
function SentimentBadge({ sentiment }: { sentiment: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string }> = {
    positive: { color: "var(--cyan)",   bg: "rgba(0,229,192,0.1)",   border: "rgba(0,229,192,0.25)" },
    negative: { color: "var(--coral)",  bg: "rgba(255,90,90,0.1)",   border: "rgba(255,90,90,0.25)" },
    neutral:  { color: "var(--muted)",  bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
  };
  const s = cfg[sentiment] ?? cfg.neutral;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontWeight: 700, fontSize: 14, textTransform: "capitalize", flexShrink: 0 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
      {sentiment}
    </div>
  );
}

/** Horizontal sentiment bar (−1 to +1) */
function SentimentBar({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, [score]);

  const pct = ((score + 1) / 2) * 100; // convert -1..1 → 0..100%
  const isPos = score >= 0;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
        <span>Negative</span><span>Neutral</span><span>Positive</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden", position: "relative" }}>
        {/* Center marker */}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.12)", zIndex: 1 }} />
        {/* Fill */}
        <div style={{
          position: "absolute",
          height: "100%",
          borderRadius: 100,
          background: isPos ? "var(--cyan)" : "var(--coral)",
          left: isPos ? "50%" : `${pct}%`,
          width: animated ? `${Math.abs(score) * 50}%` : "0%",
          transition: "width 1s cubic-bezier(0.34,1.2,0.64,1)",
        }} />
      </div>
    </div>
  );
}

/** Highlights suspicious phrases within the content text */
function HighlightedText({ text, phrases }: { text: string; phrases: string[] }) {
  if (!phrases.length) return <>{text}</>;

  // escape regex special chars
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  let regex: RegExp;
  try {
    regex = new RegExp(`(${escaped.join("|")})`, "gi");
  } catch {
    return <>{text}</>;
  }

  const parts = text.split(regex);
  const phraseSet = new Set(phrases.map((p) => p.toLowerCase()));

  return (
    <>
      {parts.map((part, i) =>
        phraseSet.has(part.toLowerCase()) ? (
          <mark key={i} className="phrase-highlight" title="Suspicious phrase detected">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** History card */
function HistoryCard({ item, onDelete, onClick }: { item: AnalysisResult; onDelete: (id: number) => void; onClick: () => void }) {
  const color = VERDICT_COLOR[item.verdict] || "var(--white)";
  return (
    <div
      className="glass-card"
      onClick={onClick}
      style={{ padding: "16px 18px", cursor: "pointer", transition: "all 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}18`, padding: "3px 9px", borderRadius: 5, border: `1px solid ${color}35` }}>
          {item.verdict}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {item.ai_enhanced !== undefined && (
            <span title={item.ai_enhanced ? "AI analysis" : "Local heuristic"}>
              {item.ai_enhanced
                ? <Sparkles size={11} color="var(--cyan)" />
                : <Cpu size={11} color="var(--muted)" />}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "rgba(240,244,255,0.65)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 10, lineHeight: 1.5 }}>
        {item.content.slice(0, 100)}…
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
        <span>Score: {item.credibility_score.toFixed(0)}/100</span>
        <span>{new Date(item.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

/** Button spinner */
function BtnSpinner() {
  return <div style={{ width: 17, height: 17, border: "2px solid rgba(8,13,26,0.25)", borderTopColor: "#080d1a", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function scoreLabel(score: number): string {
  if (score >= 76) return "High credibility";
  if (score >= 51) return "Moderate — verify";
  if (score >= 26) return "Low credibility";
  return "Very low credibility";
}

/* ── Style objects ──────────────────────────────────────────────────────── */
const formStyles: Record<string, React.CSSProperties> = {
  label: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(240,244,255,0.65)", marginBottom: 6 },
};
const bgStyles: Record<string, React.CSSProperties> = {
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,229,192,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,192,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  heroGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", width: "80%", height: "200%", background: "radial-gradient(ellipse, rgba(0,229,192,0.06) 0%, transparent 60%)", pointerEvents: "none" },
};
