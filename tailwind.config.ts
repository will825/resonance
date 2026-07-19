import type { Config } from "tailwindcss";

/**
 * Resonance brand palette — derived from the Terra Echo Studios logo:
 * a warm white ground, navy hand-drawn wordmark, and a waveform that
 * sweeps blue -> yellow -> orange -> red.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F1",
        card: "#FFFFFF",
        line: "#E8E2D6",
        ink: {
          DEFAULT: "#1D3D5C",
          strong: "#152C43",
          soft: "#4A6B8A",
          faint: "#93A7B9",
        },
        wave: {
          blue: "#2E9BDE",
          sky: "#63BCEA",
          yellow: "#F7B32B",
          orange: "#F2711B",
          red: "#E85555",
        },
      },
      fontFamily: {
        sans: ["ui-rounded", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21, 44, 67, 0.06), 0 4px 16px rgba(21, 44, 67, 0.06)",
        lift: "0 2px 4px rgba(21, 44, 67, 0.08), 0 10px 28px rgba(21, 44, 67, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
