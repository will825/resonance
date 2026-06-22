import { buildChord, type ChordQuality } from "./chords";
import type { VoicingStyle } from "./types";

export interface ChordPitch {
  rootChroma: number;
  quality: ChordQuality;
}

const sortNotes = (notes: number[]): number[] => [...notes].sort((a, b) => a - b);

/** MIDI root for a given chroma at a scientific-pitch octave (C4 = 60). */
function rootMidiAt(rootChroma: number, octave: number): number {
  return 12 * (octave + 1) + rootChroma;
}

/** All inversions of a close-position chord (rotating tones up by octaves). */
function inversions(close: number[]): number[][] {
  const out: number[][] = [];
  const n = close.length;
  for (let k = 0; k < n; k++) {
    const voiced: number[] = [];
    for (let i = 0; i < n; i++) {
      const idx = (k + i) % n;
      const octaveBump = k + i >= n ? 12 : 0;
      voiced.push(close[idx] + octaveBump);
    }
    out.push(sortNotes(voiced));
  }
  return out;
}

/** Apply a voicing style to a set of (sorted) chord notes. */
export function applyStyle(notes: number[], style: VoicingStyle): number[] {
  const sorted = sortNotes(notes);
  if (style === "close" || sorted.length < 3) return sorted;

  if (style === "open") {
    // Spread the voicing by lifting the second-lowest voice up an octave.
    const out = [...sorted];
    out[1] += 12;
    return sortNotes(out);
  }

  // drop2: drop the second voice from the top down an octave.
  const out = [...sorted];
  out[sorted.length - 2] -= 12;
  return sortNotes(out);
}

/** Naive realization: every chord in root position at a fixed octave. */
export function naiveRootPosition(chords: ChordPitch[], octave = 4): number[][] {
  return chords.map((ch) => buildChord(rootMidiAt(ch.rootChroma, octave), ch.quality));
}

/** Candidate voicings for a chord across registers and inversions. */
function candidates(ch: ChordPitch, style: VoicingStyle): number[][] {
  const out: number[][] = [];
  for (let octave = 2; octave <= 5; octave++) {
    const close = buildChord(rootMidiAt(ch.rootChroma, octave), ch.quality);
    for (const inv of inversions(close)) {
      out.push(applyStyle(inv, style));
    }
  }
  return out;
}

/** Sum, over notes in `a`, of the distance to the nearest note in `b`. */
export function voicingDistance(a: number[], b: number[]): number {
  let total = 0;
  for (const n of a) {
    let best = Infinity;
    for (const m of b) best = Math.min(best, Math.abs(n - m));
    total += best;
  }
  return total;
}

/** Total movement across a sequence of voicings (sum of consecutive distances). */
export function totalVoiceMovement(voicings: number[][]): number {
  let total = 0;
  for (let i = 1; i < voicings.length; i++) {
    total += voicingDistance(voicings[i], voicings[i - 1]);
  }
  return total;
}

/**
 * Voice-leading optimizer: for each chord after the first, choose the candidate
 * voicing that minimizes total semitone movement from the previous voicing.
 * The first chord is centered near middle C.
 */
export function optimizeVoiceLeading(chords: ChordPitch[], style: VoicingStyle): number[][] {
  const result: number[][] = [];
  let prev: number[] | null = null;

  for (const ch of chords) {
    const cands = candidates(ch, style);
    let best = cands[0];
    let bestScore = Infinity;

    for (const c of cands) {
      let score: number;
      if (prev === null) {
        const avg = c.reduce((s, n) => s + n, 0) / c.length;
        score = Math.abs(avg - 60); // center the opening chord around middle C
      } else {
        // Symmetric nearest-voice movement keeps common tones static.
        score = voicingDistance(c, prev) + voicingDistance(prev, c);
      }
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }

    result.push(best);
    prev = best;
  }

  return result;
}
