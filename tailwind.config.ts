import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0a0a0f",
          800: "#12121a",
          700: "#1b1b27",
          600: "#262636",
          500: "#36364a",
        },
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#a48bff",
          glow: "#b9a6ff",
        },
        mint: "#3ddc97",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
