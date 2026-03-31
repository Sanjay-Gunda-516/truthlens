import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TruthLens Design System
        ink:    { DEFAULT: "#080d1a", 900: "#080d1a", 800: "#0e1528", 700: "#141d35", 600: "#1c2740" },
        slate:  { lens: "#1e2d4a" },
        cyan:   { lens: "#00e5c0", dim: "#00b89a" },
        coral:  { lens: "#ff5a5a", dim: "#cc4545" },
        amber:  { lens: "#ffb833", dim: "#cc9229" },
        violet: { lens: "#a78bfa" },
        ghost:  { DEFAULT: "rgba(255,255,255,0.06)", bright: "rgba(255,255,255,0.10)" },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "sans-serif"],
        body:    ["var(--font-outfit)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-ink": "linear-gradient(rgba(0,229,192,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,192,0.03) 1px, transparent 1px)",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,229,192,0.15), transparent)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      boxShadow: {
        "glow-cyan":  "0 0 30px rgba(0,229,192,0.2), 0 0 60px rgba(0,229,192,0.06)",
        "glow-coral": "0 0 20px rgba(255,90,90,0.25)",
        "glow-amber": "0 0 20px rgba(255,184,51,0.25)",
        "card":       "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "scan":       "scan 2s linear infinite",
        "spin-slow":  "spin 8s linear infinite",
      },
      keyframes: {
        fadeUp:  { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        scan:    { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(400%)" } },
      },
    },
  },
  plugins: [],
};

export default config;
