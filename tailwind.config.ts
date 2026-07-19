import type { Config } from "tailwindcss";

/**
 * Resonance brand palette — construction-paper edition.
 * Derived from the Terra Echo Studios logo (blue -> yellow -> orange -> red
 * waveform, navy wordmark) laid over warm kraft paper. Shadows are hard
 * offsets, like paper cutouts stacked on a desk.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F3EBDB",
        card: "#FFFDF6",
        line: "#DCCEAE",
        ink: {
          DEFAULT: "#1D3D5C",
          strong: "#152C43",
          soft: "#4A6B8A",
          faint: "#8FA3B5",
        },
        wave: {
          blue: "#2E9BDE",
          sky: "#63BCEA",
          yellow: "#F7B32B",
          orange: "#F2711B",
          red: "#E85555",
        },
      },
      boxShadow: {
        card: "3px 4px 0 rgba(63, 48, 29, 0.14)",
        lift: "5px 7px 0 rgba(63, 48, 29, 0.18)",
        press: "1px 2px 0 rgba(63, 48, 29, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
