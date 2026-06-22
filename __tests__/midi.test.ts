import { describe, expect, it } from "vitest";
import { Midi } from "@tonejs/midi";
import { buildMidi } from "@/lib/audio/exportMidi";
import { realizeProgression } from "@/lib/theory/realize";
import type { ProgressionSpec } from "@/lib/theory/types";

const spec: ProgressionSpec = {
  key: "C",
  mode: "major",
  tempo: 96,
  feel: "test",
  voicingStyle: "close",
  arpeggio: "none",
  progression: [
    { roman: "I", bars: 1 },
    { roman: "V", bars: 1 },
    { roman: "vi", bars: 1 },
    { roman: "IV", bars: 1 },
  ],
};

describe("MIDI export", () => {
  it("produces a valid, re-parseable MIDI file with the right tempo and notes", () => {
    const realized = realizeProgression(spec);
    const bytes = buildMidi(realized, spec);

    // Re-parse the serialized bytes — proves the file is structurally valid.
    const parsed = new Midi(bytes);

    expect(parsed.header.tempos[0]?.bpm).toBeCloseTo(96, 1);
    expect(parsed.tracks).toHaveLength(1);

    const totalNotes = realized.reduce((sum, c) => sum + c.midiNotes.length, 0);
    expect(parsed.tracks[0].notes.length).toBe(totalNotes);

    // The first note's pitch class should belong to the C major tonic chord.
    const firstMidis = parsed.tracks[0].notes
      .filter((n) => n.time === 0)
      .map((n) => n.midi % 12)
      .sort();
    expect(firstMidis).toEqual([0, 4, 7]); // C, E, G
  });

  it("emits one note per chord-tone per arpeggio step when arpeggiated", () => {
    const arpSpec: ProgressionSpec = { ...spec, arpeggio: "up" };
    const realized = realizeProgression(arpSpec);
    const parsed = new Midi(buildMidi(realized, arpSpec));
    const totalNotes = realized.reduce((sum, c) => sum + c.midiNotes.length, 0);
    expect(parsed.tracks[0].notes.length).toBe(totalNotes);
    // Arpeggiated notes are staggered, not stacked at the same time.
    const times = new Set(parsed.tracks[0].notes.map((n) => n.time));
    expect(times.size).toBeGreaterThan(realized.length);
  });
});
