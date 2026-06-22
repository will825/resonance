import { chordSymbol } from "./chords";
import { resolveRoman } from "./romanNumerals";
import { pitchClassOf } from "./scales";
import type { ProgressionSpec, RealizedChord } from "./types";
import { optimizeVoiceLeading } from "./voicing";

/**
 * Deterministically realize a ProgressionSpec into concrete, voice-led chords.
 * This is the source of truth: roman numerals -> guaranteed-correct MIDI notes.
 */
export function realizeProgression(spec: ProgressionSpec): RealizedChord[] {
  const resolved = spec.progression.map((c) => ({
    chord: c,
    info: resolveRoman(c.roman, spec.key, spec.mode),
  }));

  const voicings = optimizeVoiceLeading(
    resolved.map((r) => ({ rootChroma: r.info.rootChroma, quality: r.info.quality })),
    spec.voicingStyle,
  );

  return resolved.map((r, i) => {
    const midiNotes = voicings[i];
    // Report the lowest sounding instance of the chord root for display/piano.
    const rootNote =
      midiNotes.find((n) => pitchClassOf(n) === r.info.rootChroma) ?? midiNotes[0];

    return {
      roman: r.chord.roman,
      symbol: chordSymbol(r.info.rootName, r.info.quality),
      rootMidi: rootNote,
      midiNotes,
      bars: r.chord.bars,
    };
  });
}
