import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resonance — AI chord progression generator | Terra Echo Studios",
  description:
    "Find the chords that resonate. Describe a vibe, get a musically-correct chord progression you can hear and export as MIDI. AI intent, deterministic theory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
