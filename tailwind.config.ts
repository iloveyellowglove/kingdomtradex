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
        "temple-gold": "#FFD700",
        "temple-gold-light": "#FFE44D",
        "royal-purple": "#6A0DAD",
        "deep-purple": "#4B0082",
        "dark-indigo": "#1a1a2e",
        "bg-dark": "#0e0b1a",
        "card-bg": "#151025",
        "card-bg-hover": "#1c1635",
        "text-primary": "#f0edf5",
        "text-secondary": "#a89bb5",
        "text-muted": "#6e6080",
        border: "#261f3a",
        "border-light": "#352c4a",
      },
      boxShadow: {
        "gold-glow": "0 4px 20px rgba(255, 215, 0, 0.25)",
        "gold-glow-strong": "0 4px 20px rgba(255, 215, 0, 0.45)",
        "card": "0 4px 16px rgba(0, 0, 0, 0.3)",
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
          "0%, 100%": { borderColor: "#FFD700" },
          "50%": { borderColor: "#FF6F00" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
