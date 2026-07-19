import { analyzeRoman, type HarmonicFunction } from "./analyze";
import { diatonicTriadQuality, parseRomanToken } from "./romanNumerals";
import { scaleChromas } from "./scales";
import type { Mode } from "./types";

export interface Suggestion {
  roman: string;
  group: "diatonic" | "borrowed" | "secondary";
  /** short hint shown with the chip, e.g. "Dominant" or "borrowed iv" */
  hint: string;
  score: number;
}

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** How strongly a function tends to follow the previous one (T→S→D→T). */
const FLOW: Record<HarmonicFunction, Record<HarmonicFunction, number>> = {
  tonic: { subdominant: 3, dominant: 2, tonic: 1, chromatic: 2 },
  subdominant: { dominant: 3, tonic: 2, subdominant: 1, chromatic: 2 },
  dominant: { tonic: 3, subdominant: 1, dominant: 1, chromatic: 1 },
  chromatic: { tonic: 3, dominant: 2, subdominant: 2, chromatic: 1 },
};

/** The seven diatonic numerals for a mode, cased and marked by triad quality. */
export function diatonicNumerals(mode: Mode): string[] {
  const chromas = scaleChromas("C", mode); // any tonic; qualities are key-agnostic
  return NUMERALS.map((numeral, degree) => {
    const quality = diatonicTriadQuality(chromas, degree);
    switch (quality) {
      case "maj":
        return numeral;
      case "min":
        return numeral.toLowerCase();
      case "dim":
        return numeral.toLowerCase() + "°";
      case "aug":
        return numeral + "+";
    }
  });
}

const MAJOR_LIKE: Mode[] = ["major", "lydian", "mixolydian"];

/** Borrowed-chord palette for the mode family. */
function borrowedPool(mode: Mode): { roman: string; hint: string }[] {
  if (MAJOR_LIKE.includes(mode)) {
    return [
      { roman: "iv", hint: "minor iv — instant melancholy" },
      { roman: "bVII", hint: "borrowed ♭VII — rock/lofi lift" },
      { roman: "bVI", hint: "borrowed ♭VI — cinematic swell" },
      { roman: "bIII", hint: "borrowed ♭III — bold sidestep" },
      { roman: "ii°", hint: "borrowed ii° — dark pre-dominant" },
    ];
  }
  return [
    { roman: "V", hint: "major V — harmonic-minor pull home" },
    { roman: "IV", hint: "Dorian IV — hopeful brightness" },
    { roman: "VII7", hint: "dominant VII — backdoor motion" },
  ];
}

/**
 * Ranked replacement candidates for the chord at a position, based on what
 * comes before and after (functional flow) plus tasteful borrowed options and
 * a secondary dominant aimed at the next chord.
 */
export function suggestChords(
  mode: Mode,
  prevRoman: string | undefined,
  nextRoman: string | undefined,
  currentRoman: string,
): Suggestion[] {
  const prevFn = prevRoman ? analyzeRoman(prevRoman, mode).fn : "tonic";
  const out: Suggestion[] = [];

  for (const roman of diatonicNumerals(mode)) {
    const a = analyzeRoman(roman, mode);
    out.push({
      roman,
      group: "diatonic",
      hint: a.label,
      score: FLOW[prevFn][a.fn] ?? 1,
    });
  }

  for (const b of borrowedPool(mode)) {
    const a = analyzeRoman(b.roman, mode);
    out.push({
      roman: b.roman,
      group: "borrowed",
      hint: b.hint,
      score: (FLOW[prevFn][a.fn] ?? 1) - 0.5, // spice ranks just below the plain option
    });
  }

  // A secondary dominant that tonicizes the NEXT chord (not the tonic itself).
  if (nextRoman) {
    try {
      const next = parseRomanToken(nextRoman.split("/")[0]);
      const base = NUMERALS[next.degreeIndex];
      const target = next.isUpper ? base : base.toLowerCase();
      if (next.degreeIndex !== 0 && !/°|ø/.test(nextRoman)) {
        out.push({
          roman: `V/${target}`,
          group: "secondary",
          hint: `pulls hard into ${nextRoman}`,
          score: 2.5,
        });
      }
    } catch {
      // unparseable next chord — skip the secondary suggestion
    }
  }

  // Don't suggest what's already there.
  const currentBase = currentRoman.trim();
  return out
    .filter((s) => s.roman !== currentBase)
    .sort((a, b) => b.score - a.score);
}
