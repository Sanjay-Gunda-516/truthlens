"use client";
import { useRouter } from "next/navigation";
import { clearAuth, getUser } from "@/lib/auth";
import { LogOut, Activity, LayoutDashboard } from "lucide-react";

export default function Navbar({ active }: { active: "analyze" | "dashboard" }) {
  const router = useRouter();
  const user   = getUser();

  function logout() {
    clearAuth();
    router.push("/auth/login");
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(8,13,26,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => router.push("/analyze")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--cyan), #00b89a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(0,229,192,0.3)",
            }}
          >
            <Activity size={16} color="#080d1a" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--white)",
              letterSpacing: "-0.02em",
            }}
          >
            Truth<span style={{ color: "var(--cyan)" }}>Lens</span>
          </span>
        </button>

        {/* Nav links + user */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NavLink
            label="Analyze"
            icon={<Activity size={15} />}
            active={active === "analyze"}
            onClick={() => router.push("/analyze")}
          />
          <NavLink
            label="Dashboard"
            icon={<LayoutDashboard size={15} />}
            active={active === "dashboard"}
            onClick={() => router.push("/dashboard")}
          />

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 8px" }} />

          {/* User email */}
          {user && (
            <span
              style={{
                fontSize: 13,
                color: "var(--muted)",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </span>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            title="Logout"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted)",
              fontSize: 13,
              fontFamily: "var(--font-outfit)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--coral)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,90,90,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  label, icon, active, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 8,
        border: active ? "1px solid rgba(0,229,192,0.3)" : "1px solid transparent",
        background: active ? "rgba(0,229,192,0.08)" : "transparent",
        color: active ? "var(--cyan)" : "var(--muted)",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "var(--font-outfit)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--white)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}
