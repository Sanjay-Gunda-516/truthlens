"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardApi, analyzeApi, type DashboardStats, type AnalysisResult } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, ShieldCheck, Activity, AlertTriangle, Clock, BarChart2 } from "lucide-react";

const VERDICT_COLORS: Record<string, string> = {
  FAKE:       "#ff5a5a",
  REAL:       "#00e5c0",
  MISLEADING: "#ffb833",
  UNCERTAIN:  "#a78bfa",
};

export default function DashboardPage() {
  const router  = useRouter();
  const user    = getUser();
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/auth/login"); return; }
    Promise.all([dashboardApi.stats(), analyzeApi.history(0, 20)])
      .then(([s, h]) => { setStats(s); setHistory(h); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingScreen />;

  const verdictPieData = stats
    ? Object.entries(stats.verdict_counts).map(([name, value]) => ({ name, value }))
    : [];
  const sentimentData = stats
    ? Object.entries(stats.sentiment_distribution).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,229,192,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,192,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />
      <Navbar active="dashboard" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px", position: "relative" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontWeight: 800, fontSize: 32, letterSpacing: "-0.04em", color: "var(--white)", marginBottom: 6 }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)" }}>
            {user?.full_name ? `Welcome back, ${user.full_name.split(" ")[0]}.` : "Welcome back."} Here&apos;s your analysis overview.
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
          <KpiCard
            label="Total Analyses"
            value={stats?.total ?? 0}
            icon={<Activity size={18} color="var(--cyan)" />}
            accent="var(--cyan)"
          />
          <KpiCard
            label="Avg Credibility"
            value={`${stats?.avg_credibility ?? 0}`}
            unit="/100"
            icon={<ShieldCheck size={18} color="var(--violet)" />}
            accent="var(--violet)"
          />
          <KpiCard
            label="Avg Confidence"
            value={`${stats?.avg_confidence ?? 0}`}
            unit="%"
            icon={<TrendingUp size={18} color="var(--amber)" />}
            accent="var(--amber)"
          />
          <KpiCard
            label="Fake / Misleading"
            value={(stats?.verdict_counts?.FAKE ?? 0) + (stats?.verdict_counts?.MISLEADING ?? 0)}
            icon={<AlertTriangle size={18} color="var(--coral)" />}
            accent="var(--coral)"
          />
        </div>

        {stats?.total === 0 ? (
          <EmptyState onAnalyze={() => router.push("/analyze")} />
        ) : (
          <>
            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Verdict Pie */}
              <div className="glass-card" style={{ padding: "22px 20px" }}>
                <ChartTitle icon={<BarChart2 size={15} color="var(--muted)" />} title="Verdict Breakdown" />
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={verdictPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {verdictPieData.map((entry) => (
                        <Cell key={entry.name} fill={VERDICT_COLORS[entry.name] || "#888"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--ink-3)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-outfit)", fontSize: 12 }}
                      labelStyle={{ color: "var(--white)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {verdictPieData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: VERDICT_COLORS[d.name] }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment Bar */}
              <div className="glass-card" style={{ padding: "22px 20px" }}>
                <ChartTitle icon={<Activity size={15} color="var(--muted)" />} title="Sentiment Distribution" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sentimentData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(240,244,255,0.45)", fontSize: 12, fontFamily: "var(--font-outfit)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(240,244,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--ink-3)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-outfit)", fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                      {sentimentData.map((d) => (
                        <Cell key={d.name} fill={d.name === "Positive" ? "#00e5c0" : d.name === "Negative" ? "#ff5a5a" : "#a78bfa"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Credibility Trend */}
              <div className="glass-card" style={{ padding: "22px 20px" }}>
                <ChartTitle icon={<TrendingUp size={15} color="var(--muted)" />} title="Credibility Trend" />
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats?.recent_trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "rgba(240,244,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(240,244,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--ink-3)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-outfit)", fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="credibility" stroke="#00e5c0" strokeWidth={2} dot={{ fill: "#00e5c0", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent history table */}
            <div className="glass-card" style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Clock size={15} color="var(--muted)" />
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--white)" }}>Analysis History</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Verdict", "Score", "Confidence", "Sentiment", "Content Preview", "Date"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td style={{ padding: "12px 12px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: VERDICT_COLORS[a.verdict], background: `${VERDICT_COLORS[a.verdict]}18`, padding: "3px 9px", borderRadius: 5, border: `1px solid ${VERDICT_COLORS[a.verdict]}35` }}>
                            {a.verdict}
                          </span>
                        </td>
                        <td style={{ padding: "12px 12px", color: "var(--white)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{a.credibility_score.toFixed(0)}</td>
                        <td style={{ padding: "12px 12px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{a.confidence.toFixed(0)}%</td>
                        <td style={{ padding: "12px 12px" }}>
                          <span style={{ color: a.sentiment === "positive" ? "var(--cyan)" : a.sentiment === "negative" ? "var(--coral)" : "var(--muted)", textTransform: "capitalize" }}>{a.sentiment}</span>
                        </td>
                        <td style={{ padding: "12px 12px", color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.content.slice(0, 60)}…
                        </td>
                        <td style={{ padding: "12px 12px", color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap" }}>
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function KpiCard({ label, value, unit, icon, accent }: { label: string; value: number | string; unit?: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="glass-card" style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 32, letterSpacing: "-0.04em", color: accent, lineHeight: 1 }}>
        {value}<span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>{unit}</span>
      </div>
    </div>
  );
}

function ChartTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      {icon}
      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--white)" }}>{title}</span>
    </div>
  );
}

function EmptyState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center" }}>
      <BarChart2 size={48} color="rgba(0,229,192,0.25)" style={{ margin: "0 auto 16px", display: "block" }} />
      <h3 style={{ fontWeight: 700, fontSize: 20, color: "var(--white)", marginBottom: 8 }}>No data yet</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Run your first analysis to see charts and statistics here.</p>
      <button className="btn-primary" onClick={onAnalyze}>Go to Analyze →</button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(0,229,192,0.2)", borderTopColor: "var(--cyan)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading dashboard…</p>
      </div>
    </div>
  );
}
