import type { Mode } from "./types";

export interface Template {
  id: string;
  /** mood / genre tags matched against the user's vibe text */
  tags: string[];
  romans: string[];
  /** suggested defaults for this template */
  mode: Mode;
  tempo: number;
  voicingStyle: "close" | "open" | "drop2";
  arpeggio: "none" | "up" | "down" | "updown";
  notes: string;
}

/**
 * Curated progression library. These let the app produce musically-correct
 * output with zero AI calls (deterministic fallback).
 */
export const TEMPLATES: Template[] = [
  // Pop
  {
    id: "pop-axis",
    tags: ["pop", "happy", "uplifting", "anthem", "catchy", "bright"],
    romans: ["I", "V", "vi", "IV"],
    mode: "major",
    tempo: 120,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "The 'axis' progression — bright and instantly familiar.",
  },
  {
    id: "pop-sensitive",
    tags: ["pop", "emotional", "sad", "ballad", "bittersweet"],
    romans: ["vi", "IV", "I", "V"],
    mode: "major",
    tempo: 100,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "Starts on the relative minor for a wistful lift into the chorus.",
  },
  {
    id: "pop-50s",
    tags: ["pop", "retro", "doo-wop", "nostalgic", "sweet"],
    romans: ["I", "vi", "IV", "V"],
    mode: "major",
    tempo: 116,
    voicingStyle: "close",
    arpeggio: "none",
    notes: "The classic 50s doo-wop turnaround.",
  },

  // Jazz
  {
    id: "jazz-251",
    tags: ["jazz", "smooth", "sophisticated", "swing", "standard"],
    romans: ["ii7", "V7", "Imaj7"],
    mode: "major",
    tempo: 132,
    voicingStyle: "drop2",
    arpeggio: "none",
    notes: "The fundamental ii–V–I, the backbone of jazz harmony.",
  },
  {
    id: "jazz-rhythm",
    tags: ["jazz", "bebop", "swing", "turnaround"],
    romans: ["iii7", "vi7", "ii7", "V7"],
    mode: "major",
    tempo: 140,
    voicingStyle: "drop2",
    arpeggio: "none",
    notes: "A descending circle-of-fifths turnaround.",
  },
  {
    id: "jazz-1625",
    tags: ["jazz", "smooth", "classic", "turnaround"],
    romans: ["Imaj7", "vi7", "ii7", "V7"],
    mode: "major",
    tempo: 128,
    voicingStyle: "drop2",
    arpeggio: "none",
    notes: "The 'rhythm changes' I–vi–ii–V loop.",
  },

  // Blues
  {
    id: "blues-12bar",
    tags: ["blues", "shuffle", "soul", "gritty", "groove"],
    romans: [
      "I7",
      "I7",
      "I7",
      "I7",
      "IV7",
      "IV7",
      "I7",
      "I7",
      "V7",
      "IV7",
      "I7",
      "V7",
    ],
    mode: "major",
    tempo: 96,
    voicingStyle: "close",
    arpeggio: "none",
    notes: "Standard 12-bar blues with dominant 7ths throughout.",
  },

  // Lofi / neo-soul
  {
    id: "lofi-4-3-6",
    tags: ["lofi", "chill", "dreamy", "study", "mellow", "neo-soul", "relaxed"],
    romans: ["IVmaj7", "iii7", "vi7"],
    mode: "major",
    tempo: 78,
    voicingStyle: "open",
    arpeggio: "up",
    notes: "Floating lofi loop full of 7ths — perfect for late-night beats.",
  },
  {
    id: "lofi-259",
    tags: ["lofi", "neo-soul", "warm", "jazzy", "smooth", "rnb"],
    romans: ["ii9", "V9", "Imaj7"],
    mode: "major",
    tempo: 82,
    voicingStyle: "drop2",
    arpeggio: "none",
    notes: "A lush 9th-laden ii–V–I for neo-soul color.",
  },
  {
    id: "lofi-turnaround",
    tags: ["lofi", "chill", "boom-bap", "hip-hop", "laid-back"],
    romans: ["Imaj7", "vi7", "ii7", "V7"],
    mode: "major",
    tempo: 84,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "Mellow major-7th turnaround that loops forever.",
  },

  // Epic / cinematic minor
  {
    id: "cinematic-andalusian",
    tags: ["epic", "cinematic", "dark", "dramatic", "minor", "trailer", "powerful"],
    romans: ["i", "VI", "III", "VII"],
    mode: "minor",
    tempo: 90,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "Sweeping minor descent built for cinematic builds.",
  },
  {
    id: "cinematic-tragic",
    tags: ["epic", "cinematic", "tragic", "tense", "minor", "build"],
    romans: ["i", "iv", "V", "i"],
    mode: "harmonicMinor",
    tempo: 88,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "Harmonic-minor i–iv–V–i with a strong leading-tone cadence.",
  },
  {
    id: "cinematic-rise",
    tags: ["epic", "cinematic", "heroic", "build", "minor", "adventure"],
    romans: ["i", "VII", "VI", "VII"],
    mode: "minor",
    tempo: 100,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "An oscillating minor build that surges forward.",
  },

  // Modal
  {
    id: "modal-dorian",
    tags: ["dorian", "modal", "folk", "groovy", "hopeful-minor"],
    romans: ["i", "IV"],
    mode: "dorian",
    tempo: 104,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "Dorian vamp — minor tonic with a bright major IV.",
  },
  {
    id: "modal-mixolydian",
    tags: ["mixolydian", "modal", "rock", "bluesy", "groove"],
    // In Mixolydian the 7th degree is already flat, so the subtonic chord is the
    // diatonic VII (e.g. F major in G Mixolydian) — written "bVII" in major keys.
    romans: ["I", "VII"],
    mode: "mixolydian",
    tempo: 112,
    voicingStyle: "open",
    arpeggio: "none",
    notes: "Mixolydian I–bVII rock vamp.",
  },
  {
    id: "modal-lydian",
    tags: ["lydian", "modal", "dreamy", "floating", "ethereal", "wonder"],
    romans: ["I", "II"],
    mode: "lydian",
    tempo: 96,
    voicingStyle: "open",
    arpeggio: "updown",
    notes: "Lydian I–II for an airy, wondrous lift.",
  },
];

/**
 * Pick a template by matching the vibe text against template tags. Falls back to
 * a sensible default when nothing matches. Mode preference (if the user picked
 * one) is used as a tie-breaker / filter.
 */
export function pickTemplate(vibe: string, preferredMode?: Mode): Template {
  const text = vibe.toLowerCase();
  let best: Template | null = null;
  let bestScore = -1;

  for (const t of TEMPLATES) {
    let score = 0;
    for (const tag of t.tags) {
      if (text.includes(tag)) score += 2;
    }
    if (preferredMode && t.mode === preferredMode) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }

  // No tag match at all: respect the preferred mode if given.
  if (bestScore <= 0 && preferredMode) {
    const byMode = TEMPLATES.find((t) => t.mode === preferredMode);
    if (byMode) return byMode;
  }

  return best ?? TEMPLATES[0];
}
