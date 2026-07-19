export type Mode =
  | "major"
  | "minor"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "harmonicMinor"
  | "melodicMinor";

export type VoicingStyle = "close" | "open" | "drop2";

export type Arpeggio = "none" | "up" | "down" | "updown";

/** How fast an arpeggio cycles: spread over the bar, or at a fixed note value. */
export type ArpRate = "auto" | "4n" | "8n" | "16n";

/** Comping rhythm applied to block (non-arpeggiated) chords. */
export type Rhythm = "block" | "pulse8" | "charleston" | "push";

export interface ChordSpec {
  /** e.g. "ii7", "V9", "bVII", "V/vi" */
  roman: string;
  /** duration in bars */
  bars: number;
}

export interface ProgressionSpec {
  /** tonic, e.g. "C", "F#" */
  key: string;
  mode: Mode;
  /** BPM */
  tempo: number;
  /** free-text style tag */
  feel: string;
  voicingStyle: VoicingStyle;
  arpeggio: Arpeggio;
  /** arpeggio speed; "auto" spreads the tones evenly across each bar */
  arpRate?: ArpRate;
  /** comping rhythm for block chords */
  rhythm?: Rhythm;
  progression: ChordSpec[];
  /** optional human-readable explanation */
  notes?: string;
}

export interface RealizedChord {
  roman: string;
  /** e.g. "Cmaj7" */
  symbol: string;
  rootMidi: number;
  /** MIDI note numbers after voicing / voice-leading */
  midiNotes: number[];
  bars: number;
}
