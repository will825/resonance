import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const TITLE = "Resonance — AI chord progression generator";
const DESCRIPTION =
  "Find the chords that resonate. Describe a vibe, get a musically-correct chord progression you can hear and export as MIDI. Free MIDI, always.";

export const metadata: Metadata = {
  metadataBase: new URL("https://resonance-beige-omega.vercel.app"),
  title: `${TITLE} | Terra Echo Studios`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Resonance",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Resonance app" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={baloo.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
