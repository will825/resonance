import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Resonance — AI chord progression generator | Terra Echo Studios",
  description:
    "Find the chords that resonate. Describe a vibe, get a musically-correct chord progression you can hear and export as MIDI. AI intent, deterministic theory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={baloo.className}>{children}</body>
    </html>
  );
}
