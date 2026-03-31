"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { saveAuth, isLoggedIn } from "@/lib/auth";
import { Eye, EyeOff, Activity, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (isLoggedIn()) router.replace("/analyze");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const data = await authApi.register(email, password, fullName || undefined);
      saveAuth(data);
      router.push("/analyze");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthColors = ["transparent", "#ff5a5a", "#ffb833", "#00e5c0"];
  const strengthLabels = ["", "Too short", "Good", "Strong"];

  return (
    <div style={styles.page}>
      <div style={styles.bgGrid} />
      <div style={styles.bgGlow} />

      <div style={styles.container}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <Activity size={20} color="#080d1a" strokeWidth={2.5} />
          </div>
          <span style={styles.logoText}>
            Truth<span style={{ color: "var(--cyan)" }}>Lens</span>
          </span>
        </div>

        <div className="glass-card" style={styles.card}>
          <h1 style={styles.heading}>Create your account</h1>
          <p style={styles.subheading}>Start detecting misinformation in seconds</p>

          {/* Feature list */}
          <div style={styles.featureList}>
            {["Unlimited credibility analyses", "Personal history & dashboard", "Bias & sentiment detection"].map((f) => (
              <div key={f} style={styles.featureItem}>
                <CheckCircle2 size={14} color="var(--cyan)" />
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{f}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full name <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
              <input
                className="tl-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sanjay Gunda"
                autoComplete="name"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                className="tl-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="tl-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={styles.eyeBtn}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength */}
              {password.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{ display: "flex", gap: 4, flex: 1 }}>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= pwStrength ? strengthColors[pwStrength] : "rgba(255,255,255,0.08)",
                          transition: "background 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: strengthColors[pwStrength], fontWeight: 600, minWidth: 52 }}>
                    {strengthLabels[pwStrength]}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {loading ? <><Spinner /> Creating account…</> : "Create account →"}
            </button>
          </form>

          <p style={styles.switchText}>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/auth/login")}
              style={styles.switchLink}
            >
              Sign in
            </button>
          </p>
        </div>

        <p style={styles.footer}>
          AI-powered misinformation detection · TruthLens v1.0
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid rgba(8,13,26,0.3)", borderTopColor: "rgba(8,13,26,0.9)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "var(--ink)" },
  bgGrid:     { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,229,192,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,192,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  bgGlow:     { position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: "80%", height: "60%", background: "radial-gradient(ellipse, rgba(0,229,192,0.08) 0%, transparent 70%)", pointerEvents: "none" },
  container:  { position: "relative", width: "100%", maxWidth: 460, padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 },
  logoRow:    { display: "flex", alignItems: "center", gap: 10 },
  logoIcon:   { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--cyan), #00b89a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(0,229,192,0.3)" },
  logoText:   { fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "var(--white)" },
  card:       { width: "100%", padding: "36px 32px", display: "flex", flexDirection: "column", gap: 20 },
  heading:    { fontWeight: 700, fontSize: 26, letterSpacing: "-0.03em", color: "var(--white)", margin: 0 },
  subheading: { fontSize: 14, color: "var(--muted)", marginTop: -12 },
  featureList:{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", borderRadius: 10, background: "rgba(0,229,192,0.04)", border: "1px solid rgba(0,229,192,0.1)" },
  featureItem:{ display: "flex", alignItems: "center", gap: 8 },
  errorBox:   { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.25)", color: "var(--coral)", fontSize: 13 },
  form:       { display: "flex", flexDirection: "column", gap: 16 },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  label:      { fontSize: 13, fontWeight: 500, color: "rgba(240,244,255,0.65)" },
  eyeBtn:     { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 4 },
  switchText: { fontSize: 13, color: "var(--muted)", textAlign: "center" },
  switchLink: { background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-outfit)" },
  footer:     { fontSize: 11, color: "rgba(240,244,255,0.2)", textAlign: "center" },
};
