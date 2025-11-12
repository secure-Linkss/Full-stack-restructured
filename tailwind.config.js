/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#475569",
        input: "#1e293b",
        ring: "#3b82f6",
        foreground: "#f8fafc",
        background: "#0f172a",
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#f8fafc",
        },
        secondary: {
          DEFAULT: "#334155",
          foreground: "#f8fafc",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#f8fafc",
        },
        muted: {
          DEFAULT: "#334155",
          foreground: "#cbd5e1",
        },
        accent: {
          DEFAULT: "#1e40af",
          foreground: "#f8fafc",
        },
        popover: {
          DEFAULT: "#1e293b",
          foreground: "#f8fafc",
        },
        card: {
          DEFAULT: "#1e293b",
          foreground: "#f8fafc",
        },
        sidebar: {
          DEFAULT: "#1e293b",
          foreground: "#f8fafc",
          primary: "#3b82f6",
          accent: "#334155",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
