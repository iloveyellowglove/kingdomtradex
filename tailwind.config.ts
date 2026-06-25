import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kt: {
          bg: 'var(--kt-bg)',
          surface: 'var(--kt-surface)',
          elevated: 'var(--kt-elevated)',
          border: 'var(--kt-border)',
          gold: 'var(--kt-gold)',
          'gold-hover': 'var(--kt-gold-hover)',
          'text-primary': 'var(--kt-text-primary)',
          'text-secondary': 'var(--kt-text-secondary)',
          'text-tertiary': 'var(--kt-text-tertiary)',
          green: 'var(--kt-green)',
          red: 'var(--kt-red)',
          'navbar-bg': 'var(--kt-navbar-bg)',
          'sidebar-bg': 'var(--kt-sidebar-bg)',
          'card-bg': 'var(--kt-card-bg)',
          'card-border': 'var(--kt-card-border)',
          'input-bg': 'var(--kt-input-bg)',
          'input-border': 'var(--kt-input-border)',
          'hover-bg': 'var(--kt-hover-bg)',
          'active-bg': 'var(--kt-active-bg)',
          'active-text': 'var(--kt-active-text)',
          'badge-bg': 'var(--kt-badge-bg)',
          'muted-text': 'var(--kt-muted-text)',
          divider: 'var(--kt-divider)',
        },
      },
      boxShadow: {
        "glow": "0 1px 3px rgba(0,0,0,0.3)",
      },
      animation: {
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-border": "pulseBorder 2s ease-in-out infinite",
      },
      keyframes: {
        slideDown: {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseBorder: {
          "0%, 100%": { borderColor: "var(--kt-gold)" },
          "50%": { borderColor: "#FF6F00" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
