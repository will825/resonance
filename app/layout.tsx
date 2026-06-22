import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chord Engine — AI chord progression generator",
  description:
    "Describe a vibe, get a musically-correct chord progression you can hear and export as MIDI. AI intent, deterministic theory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
