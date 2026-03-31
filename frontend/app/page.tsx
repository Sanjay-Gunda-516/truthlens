"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

/**
 * Root page — redirects to /analyze if logged in, else /auth/login
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isLoggedIn() ? "/analyze" : "/auth/login");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ink)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* Spinning logo mark */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "var(--cyan)",
            borderRightColor: "rgba(0,229,192,0.3)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading TruthLens…</p>
      </div>
    </div>
  );
}
