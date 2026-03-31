/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    "./App.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tanina: {
          background: "#F8FAFC",
          foreground: "#0F172A",

          primary: "#0EA5E9",
          primaryDark: "#0284C7",

          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",

          card: "#FFFFFF",
          border: "#E2E8F0",
          muted: "#64748B",

          // 💡 Add these for fintech UI
          input: "#F1F5F9",
          accent: "#38BDF8",
        },
      },

      borderRadius: {
        xl: "14px",
        "2xl": "20px", // smoother fintech cards
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },

      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};