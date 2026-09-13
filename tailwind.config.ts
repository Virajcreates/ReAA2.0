import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        // Pure Black & White Minimalist Design Tokens
        "bg-deep": "#000000",
        hairline: "rgba(255, 255, 255, 0.12)",
        panel: "#000000",
        "panel-raised": "rgba(255, 255, 255, 0.05)",
        "silver-1": "#ffffff",
        "silver-2": "#ffffff",
        "silver-3": "#a1a1aa",
        "silver-4": "#71717a",
        steel: "#ffffff",
        "steel-dim": "rgba(255, 255, 255, 0.2)",
        verified: "#ffffff",
        sidebar: {
          DEFAULT: "#000000",
          border: "rgba(255, 255, 255, 0.12)",
          hover: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Space Grotesk",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "IBM Plex Mono",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "stroke-draw": "strokeDraw 10s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "stroke-draw-fast": "strokeDraw 8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "stroke-draw-slow": "strokeDraw 12s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "blueprint-pulse": "blueprintPulse 4s ease-in-out infinite",
        "crane-sway": "craneSway 8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        strokeDraw: {
          "0%": {
            strokeDashoffset: "1200",
            opacity: "0",
          },
          "10%": {
            opacity: "1",
          },
          "70%": {
            strokeDashoffset: "0",
            opacity: "1",
          },
          "88%": {
            strokeDashoffset: "0",
            opacity: "1",
          },
          "100%": {
            strokeDashoffset: "0",
            opacity: "0",
          },
        },
        blueprintPulse: {
          "0%, 100%": { opacity: "0.15" },
          "50%": { opacity: "0.5" },
        },
        craneSway: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(1.2deg)" },
        },
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
