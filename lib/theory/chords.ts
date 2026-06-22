/**
 * Chord interval formulas (semitones from chord root) — source of truth.
 * Cross-checked against Tonal's Chord.get(symbol).intervals in tests.
 */
export const CHORD_FORMULAS: Record<string, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14],
  maj7: [0, 4, 7, 11],
  "7": [0, 4, 7, 10], // dominant 7
  min7: [0, 3, 7, 10],
  mMaj7: [0, 3, 7, 11],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10], // half-diminished (ø7)
  maj9: [0, 4, 7, 11, 14],
  "9": [0, 4, 7, 10, 14], // dominant 9
  min9: [0, 3, 7, 10, 14],
  "11": [0, 4, 7, 10, 14, 17],
  "13": [0, 4, 7, 10, 14, 21],
};

/** Canonical chord-quality identifiers used across the engine. */
export type ChordQuality = keyof typeof CHORD_FORMULAS;

/**
 * Map a quality id to the suffix used when building a chord symbol like "Cmaj7".
 * Major triad has no suffix.
 */
export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  aug: "aug",
  sus2: "sus2",
  sus4: "sus4",
  "6": "6",
  m6: "m6",
  add9: "add9",
  maj7: "maj7",
  "7": "7",
  min7: "m7",
  mMaj7: "mMaj7",
  dim7: "dim7",
  m7b5: "m7b5",
  maj9: "maj9",
  "9": "9",
  min9: "m9",
  "11": "11",
  "13": "13",
};

/**
 * Build a chord as sorted MIDI notes from a root MIDI number + quality.
 */
export function buildChord(rootMidi: number, quality: ChordQuality): number[] {
  const formula = CHORD_FORMULAS[quality];
  if (!formula) {
    throw new Error(`Unknown chord quality: ${quality}`);
  }
  return formula.map((iv) => rootMidi + iv).sort((a, b) => a - b);
}

/** Build a readable chord symbol, e.g. ("C", "maj7") -> "Cmaj7". */
export function chordSymbol(rootName: string, quality: ChordQuality): string {
  return `${rootName}${QUALITY_SUFFIX[quality]}`;
}
