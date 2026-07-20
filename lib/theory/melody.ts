import { pitchClassOf, scaleChromas } from "./scales";
import type { ProgressionSpec, RealizedChord } from "./types";

export interface MelodyNote {
  midi: number;
  /** absolute position in beats from the start of the progression */
  beat: number;
  /** length in beats */
  beats: number;
}

/** Singable lead register — roughly A4 to D6. */
const LOW = 69;
const HIGH = 86;
const CENTER = 76;
const MAX_LEAP = 7; // keep the line singable: no jump bigger than a fifth

/** Rhythm cells (durations in beats) that fill one 4/4 bar. */
const RHYTHM_CELLS: number[][] = [
  [1, 1, 1, 1],
  [2, 1, 1],
  [1, 1, 2],
  [1, 2, 1],
  [1.5, 0.5, 1, 1],
];

/** Deterministic PRNG so a given progression always yields the same melody. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The pitch in [low, high] whose pitch class is allowed and nearest the target. */
function nearestInSet(target: number, allowed: Set<number>, low = LOW, high = HIGH): number {
  let best = target;
  let bestDist = Infinity;
  for (let m = low; m <= high; m++) {
    if (!allowed.has(pitchClassOf(m))) continue;
    const d = Math.abs(m - target);
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  return best;
}

/**
 * Generate a singable top-line melody over a realized progression. Downbeats
 * land on chord tones; weaker beats mix chord tones and stepwise scale passing
 * tones. Motion is constrained to small intervals so the result is hummable,
 * and the whole thing is deterministic per progression + key.
 */
export function generateMelody(realized: RealizedChord[], spec: ProgressionSpec): MelodyNote[] {
  if (realized.length === 0) return [];

  const scalePCs = new Set(scaleChromas(spec.key, spec.mode));
  const seed = hashString(realized.map((c) => c.roman).join("|") + spec.key + spec.mode);
  const rand = mulberry32(seed);

  const notes: MelodyNote[] = [];
  let beatCursor = 0;
  let prev = CENTER;

  realized.forEach((chord) => {
    const chordPCs = new Set(chord.midiNotes.map(pitchClassOf));

    for (let bar = 0; bar < chord.bars; bar++) {
      const cell = RHYTHM_CELLS[Math.floor(rand() * RHYTHM_CELLS.length)];
      let posInBar = 0;

      cell.forEach((dur, idx) => {
        const isDownbeat = idx === 0;
        let target = prev;
        let allowed = chordPCs;

        if (!isDownbeat && rand() > 0.55) {
          // Passing tone: step away from the previous note within the scale.
          allowed = scalePCs;
          const step = rand() < 0.7 ? 2 : 1;
          target = prev + (rand() < 0.5 ? -step : step);
        }

        let midi = nearestInSet(target, allowed);
        // Fold big leaps back within a fifth for singability.
        if (Math.abs(midi - prev) > MAX_LEAP) {
          const folded = midi + (midi > prev ? -12 : 12);
          if (folded >= LOW && folded <= HIGH) midi = folded;
        }

        notes.push({
          midi,
          beat: beatCursor + bar * 4 + posInBar,
          beats: dur * 0.92,
        });
        prev = midi;
        posInBar += dur;
      });
    }

    beatCursor += chord.bars * 4;
  });

  return notes;
}
