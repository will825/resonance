import { describe, expect, it } from "vitest";
import { Chord } from "tonal";
import { buildChord, CHORD_FORMULAS, chordSymbol } from "@/lib/theory/chords";
import { noteToMidi, midiToNote, pitchClassOf } from "@/lib/theory/scales";
import { resolveRoman } from "@/lib/theory/romanNumerals";
import { applyComplexity } from "@/lib/theory/complexity";
import {
  naiveRootPosition,
  optimizeVoiceLeading,
  totalVoiceMovement,
  type ChordPitch,
} from "@/lib/theory/voicing";
import { realizeProgression } from "@/lib/theory/realize";
import type { ProgressionSpec } from "@/lib/theory/types";

describe("pitch & midi helpers", () => {
  it("maps middle C and A440 correctly", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("A4")).toBe(69);
    expect(pitchClassOf(60)).toBe(0);
    expect(pitchClassOf(69)).toBe(9);
  });

  it("round-trips midi <-> note", () => {
    expect(midiToNote(60)).toBe("C4");
    expect(noteToMidi(midiToNote(67))).toBe(67);
  });
});

describe("buildChord against the formula table", () => {
  it("builds every quality with the exact interval formula", () => {
    const root = 60; // C4
    for (const [quality, formula] of Object.entries(CHORD_FORMULAS)) {
      const notes = buildChord(root, quality as keyof typeof CHORD_FORMULAS);
      const intervals = notes.map((n) => n - root);
      expect(intervals).toEqual([...formula].sort((a, b) => a - b));
    }
  });

  it("agrees with Tonal on common chord pitch classes", () => {
    // Cmaj7 -> C E G B
    const cmaj7 = buildChord(60, "maj7").map(pitchClassOf);
    const tonal = Chord.get("Cmaj7").notes.map((n) => noteToMidi(`${n}4`) % 12);
    expect(new Set(cmaj7)).toEqual(new Set(tonal));

    // G7 -> G B D F
    const g7 = buildChord(noteToMidi("G4"), "7").map(pitchClassOf);
    const tonalG7 = Chord.get("G7").notes.map((n) => noteToMidi(`${n}4`) % 12);
    expect(new Set(g7)).toEqual(new Set(tonalG7));
  });

  it("builds readable chord symbols", () => {
    expect(chordSymbol("C", "maj7")).toBe("Cmaj7");
    expect(chordSymbol("D", "min7")).toBe("Dm7");
    expect(chordSymbol("G", "7")).toBe("G7");
  });
});

describe("roman numeral resolution", () => {
  const pc = (name: string) => noteToMidi(`${name}4`) % 12;

  it("resolves diatonic majors in C major", () => {
    expect(resolveRoman("I", "C", "major")).toMatchObject({ rootChroma: pc("C"), quality: "maj" });
    expect(resolveRoman("V", "C", "major")).toMatchObject({ rootChroma: pc("G"), quality: "maj" });
    expect(resolveRoman("vi", "C", "major")).toMatchObject({ rootChroma: pc("A"), quality: "min" });
    expect(resolveRoman("ii7", "C", "major")).toMatchObject({ rootChroma: pc("D"), quality: "min7" });
    expect(resolveRoman("V7", "C", "major")).toMatchObject({ rootChroma: pc("G"), quality: "7" });
    expect(resolveRoman("Imaj7", "C", "major")).toMatchObject({ rootChroma: pc("C"), quality: "maj7" });
    expect(resolveRoman("vii°", "C", "major")).toMatchObject({ rootChroma: pc("B"), quality: "dim" });
  });

  it("resolves the harmonic-minor dominant (major V in a minor key)", () => {
    // In A minor, an uppercase V should become a major / dominant chord.
    expect(resolveRoman("V", "A", "minor")).toMatchObject({ rootChroma: pc("E"), quality: "maj" });
    expect(resolveRoman("V7", "A", "minor")).toMatchObject({ rootChroma: pc("E"), quality: "7" });
    expect(resolveRoman("i", "A", "minor")).toMatchObject({ rootChroma: pc("A"), quality: "min" });
    expect(resolveRoman("VI", "A", "minor")).toMatchObject({ rootChroma: pc("F"), quality: "maj" });
  });

  it("resolves a borrowed bVII as a major chord", () => {
    // C major borrowed bVII = Bb major.
    expect(resolveRoman("bVII", "C", "major")).toMatchObject({ rootChroma: pc("Bb"), quality: "maj" });
    // G major borrowed bVII = F major.
    expect(resolveRoman("bVII", "G", "major")).toMatchObject({ rootChroma: pc("F"), quality: "maj" });
    // bVI in C major = Ab major.
    expect(resolveRoman("bVI", "C", "major")).toMatchObject({ rootChroma: pc("Ab"), quality: "maj" });
  });

  it("resolves a secondary dominant V/vi to the dominant 7 of vi", () => {
    // In C major, vi = A minor, so V/vi = E7.
    expect(resolveRoman("V/vi", "C", "major")).toMatchObject({ rootChroma: pc("E"), quality: "7" });
    // V/ii in C major: ii = Dm, dominant of D = A7.
    expect(resolveRoman("V/ii", "C", "major")).toMatchObject({ rootChroma: pc("A"), quality: "7" });
  });

  it("resolves modal tokens (scale-degree convention)", () => {
    expect(resolveRoman("I", "G", "mixolydian")).toMatchObject({ rootChroma: pc("G"), quality: "maj" });
    // Mixolydian's diatonic 7th is already flat: VII = F major in G Mixolydian.
    expect(resolveRoman("VII", "G", "mixolydian")).toMatchObject({ rootChroma: pc("F"), quality: "maj" });
    // Dorian i-IV vamp: the IV is major.
    expect(resolveRoman("IV", "C", "dorian")).toMatchObject({ rootChroma: pc("F"), quality: "maj" });
    expect(resolveRoman("i", "C", "dorian")).toMatchObject({ rootChroma: pc("C"), quality: "min" });
  });
});

describe("complexity dial", () => {
  it("strips to triads on simple", () => {
    expect(applyComplexity("ii7", "simple")).toBe("ii");
    expect(applyComplexity("Imaj7", "simple")).toBe("I");
    expect(applyComplexity("V9", "simple")).toBe("V");
    expect(applyComplexity("viiø7", "simple")).toBe("vii°");
    expect(applyComplexity("bVII", "simple")).toBe("bVII");
  });

  it("upgrades to 7ths on rich", () => {
    expect(applyComplexity("I", "rich")).toBe("Imaj7");
    expect(applyComplexity("ii", "rich")).toBe("ii7");
    expect(applyComplexity("V", "rich")).toBe("V7");
    expect(applyComplexity("vii°", "rich")).toBe("viiø7");
    expect(applyComplexity("ii9", "rich")).toBe("ii7");
    expect(applyComplexity("bVII", "rich")).toBe("bVIImaj7");
  });

  it("upgrades to 9ths on lush", () => {
    expect(applyComplexity("I", "lush")).toBe("Imaj9");
    expect(applyComplexity("ii7", "lush")).toBe("ii9");
    expect(applyComplexity("V7", "lush")).toBe("V9");
  });

  it("leaves auto, sus and secondary targets untouched", () => {
    expect(applyComplexity("ii7", "auto")).toBe("ii7");
    expect(applyComplexity("Isus4", "rich")).toBe("Isus4");
    expect(applyComplexity("V/vi", "simple")).toBe("V/vi");
    expect(applyComplexity("V/vi", "rich")).toBe("V7/vi");
  });

  it("produces tokens the resolver accepts at every level", () => {
    const romans = ["I", "ii7", "V9", "vii°", "bVII", "V/vi"];
    for (const level of ["simple", "rich", "lush"] as const) {
      for (const r of romans) {
        const t = applyComplexity(r, level);
        expect(() => resolveRoman(t, "C", "major")).not.toThrow();
      }
    }
  });
});

describe("voice-leading optimizer", () => {
  const progression: ChordPitch[] = [
    resolveRoman("I", "C", "major"),
    resolveRoman("V", "C", "major"),
    resolveRoman("vi", "C", "major"),
    resolveRoman("IV", "C", "major"),
  ].map((r) => ({ rootChroma: r.rootChroma, quality: r.quality }));

  it("reduces total voice movement vs naive root position", () => {
    const naive = naiveRootPosition(progression);
    const optimized = optimizeVoiceLeading(progression, "close");

    const naiveMovement = totalVoiceMovement(naive);
    const optimizedMovement = totalVoiceMovement(optimized);

    expect(optimizedMovement).toBeLessThan(naiveMovement);
  });

  it("keeps every optimized voicing harmonically complete", () => {
    const optimized = optimizeVoiceLeading(progression, "close");
    optimized.forEach((voicing, i) => {
      const pcs = new Set(voicing.map(pitchClassOf));
      const naivePcs = new Set(naiveRootPosition(progression)[i].map(pitchClassOf));
      expect(pcs).toEqual(naivePcs); // same chord tones, just revoiced
    });
  });
});

describe("realizeProgression integration", () => {
  it("realizes a lofi turnaround into correct, voice-led chords", () => {
    const spec: ProgressionSpec = {
      key: "C",
      mode: "major",
      tempo: 80,
      feel: "dreamy lofi",
      voicingStyle: "open",
      arpeggio: "up",
      progression: [
        { roman: "Imaj7", bars: 1 },
        { roman: "vi7", bars: 1 },
        { roman: "ii7", bars: 1 },
        { roman: "V7", bars: 1 },
      ],
    };
    const realized = realizeProgression(spec);
    expect(realized).toHaveLength(4);
    expect(realized[0].symbol).toBe("Cmaj7");
    expect(realized[1].symbol).toBe("Am7");
    expect(realized[3].symbol).toBe("G7");
    // Every chord has real notes.
    realized.forEach((c) => expect(c.midiNotes.length).toBeGreaterThanOrEqual(3));
  });
});
