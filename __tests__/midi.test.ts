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
  it("produces a valid file with chord + bass tracks, right tempo and notes", () => {
    const realized = realizeProgression(spec);
    const bytes = buildMidi(realized, spec);

    // Re-parse the serialized bytes — proves the file is structurally valid.
    const parsed = new Midi(bytes);

    expect(parsed.header.tempos[0]?.bpm).toBeCloseTo(96, 1);
    expect(parsed.tracks).toHaveLength(2); // chords + bass

    const totalNotes = realized.reduce((sum, c) => sum + c.midiNotes.length, 0);
    expect(parsed.tracks[0].notes.length).toBe(totalNotes);

    // The first chord-track notes should spell the C major tonic chord.
    const firstMidis = parsed.tracks[0].notes
      .filter((n) => n.time === 0)
      .map((n) => n.midi % 12)
      .sort();
    expect(firstMidis).toEqual([0, 4, 7]); // C, E, G

    // Bass: one root per chord, in the C2..B2 register.
    expect(parsed.tracks[1].notes.length).toBe(realized.length);
    for (const n of parsed.tracks[1].notes) {
      expect(n.midi).toBeGreaterThanOrEqual(36);
      expect(n.midi).toBeLessThanOrEqual(47);
    }
    expect(parsed.tracks[1].notes[0].midi % 12).toBe(0); // C root under the I chord
  });

  it("omits the bass track when disabled", () => {
    const realized = realizeProgression(spec);
    const parsed = new Midi(buildMidi(realized, spec, { bass: false }));
    expect(parsed.tracks).toHaveLength(1);
  });

  it("tiles comping rhythms across each chord", () => {
    const rhythmSpec: ProgressionSpec = { ...spec, rhythm: "pulse8" };
    const realized = realizeProgression(rhythmSpec);
    const parsed = new Midi(buildMidi(realized, rhythmSpec, { bass: false }));
    // 8 hits per bar, every hit restates all chord tones.
    const expected = realized.reduce((sum, c) => sum + 8 * c.bars * c.midiNotes.length, 0);
    expect(parsed.tracks[0].notes.length).toBe(expected);
  });

  it("cycles arpeggio tones at a fixed rate", () => {
    const arpSpec: ProgressionSpec = { ...spec, arpeggio: "up", arpRate: "8n" };
    const realized = realizeProgression(arpSpec);
    const parsed = new Midi(buildMidi(realized, arpSpec, { bass: false }));
    // 8 eighth-note steps per bar regardless of chord size.
    const expected = realized.reduce((sum, c) => sum + 8 * c.bars, 0);
    expect(parsed.tracks[0].notes.length).toBe(expected);
  });

  it("spreads one arpeggio cycle across the bar on auto", () => {
    const arpSpec: ProgressionSpec = { ...spec, arpeggio: "up", arpRate: "auto" };
    const realized = realizeProgression(arpSpec);
    const parsed = new Midi(buildMidi(realized, arpSpec, { bass: false }));
    const totalNotes = realized.reduce((sum, c) => sum + c.midiNotes.length, 0);
    expect(parsed.tracks[0].notes.length).toBe(totalNotes);
    const times = new Set(parsed.tracks[0].notes.map((n) => n.time));
    expect(times.size).toBeGreaterThan(realized.length);
  });
});
