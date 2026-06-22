import { Note } from "tonal";
import type { Mode } from "./types";

/** 12 pitch class names (sharp spelling) indexed by chroma 0-11. */
export const PITCH_CLASSES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

/** Scale interval tables (semitones from tonic) — source of truth. */
export const SCALE_INTERVALS: Record<Mode | "majorPentatonic" | "minorPentatonic" | "blues", number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  minor: [0, 2, 3, 5, 7, 8, 10], // alias of aeolian (natural minor)
  locrian: [0, 1, 3, 5, 6, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

/** C4 = MIDI 60, A4 = 69 = 440Hz. midi = 12 * (octave + 1) + pitchClass. */
export function noteToMidi(name: string): number {
  const m = Note.midi(name);
  if (m === null) {
    throw new Error(`Invalid note name: ${name}`);
  }
  return m;
}

export function midiToNote(midi: number): string {
  return Note.fromMidi(midi);
}

/** Pitch class (chroma 0-11) of a MIDI number. */
export function pitchClassOf(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Chroma (0-11) of a tonic name like "C", "F#", "Bb". */
export function tonicChroma(tonic: string): number {
  const c = Note.chroma(tonic);
  if (c === null || c === undefined) {
    throw new Error(`Invalid tonic: ${tonic}`);
  }
  return c;
}

/**
 * Scale pitch-class chromas (0-11) for a key + mode, length 7 for diatonic modes.
 * Degree index 0 = tonic.
 */
export function scaleChromas(tonic: string, mode: Mode): number[] {
  const base = tonicChroma(tonic);
  const intervals = SCALE_INTERVALS[mode];
  return intervals.map((iv) => (base + iv) % 12);
}
