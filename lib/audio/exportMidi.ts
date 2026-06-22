import { Midi } from "@tonejs/midi";
import { midiToNote } from "@/lib/theory/scales";
import type { ProgressionSpec, RealizedChord } from "@/lib/theory/types";

const SECONDS_PER_BAR = (bpm: number) => (60 / bpm) * 4; // 4/4

/** Build an in-memory MIDI file from realized chords. Returns the bytes. */
export function buildMidi(realized: RealizedChord[], spec: ProgressionSpec): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(spec.tempo);
  const track = midi.addTrack();
  track.name = `${spec.key} ${spec.mode} — ${spec.feel}`;

  const barSeconds = SECONDS_PER_BAR(spec.tempo);
  let cursor = 0;

  for (const chord of realized) {
    const dur = chord.bars * barSeconds;

    if (spec.arpeggio === "none") {
      for (const m of chord.midiNotes) {
        track.addNote({
          name: midiToNote(m),
          time: cursor,
          duration: dur * 0.95,
          velocity: clamp(0.7 + (Math.random() * 0.16 - 0.08)),
        });
      }
    } else {
      const order = arpeggioOrder(chord.midiNotes, spec.arpeggio);
      const step = dur / order.length;
      order.forEach((m, i) => {
        track.addNote({
          name: midiToNote(m),
          time: cursor + i * step,
          duration: step * 0.9,
          velocity: clamp(0.7 + (Math.random() * 0.16 - 0.08)),
        });
      });
    }

    cursor += dur;
  }

  return midi.toArray();
}

/** Browser-only: build + trigger a download of the MIDI file. */
export function downloadMidi(realized: RealizedChord[], spec: ProgressionSpec): void {
  const bytes = buildMidi(realized, spec);
  // Copy into a fresh ArrayBuffer so the Blob part type is unambiguous.
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([buffer], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chord-engine-${spec.key}-${spec.mode}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function arpeggioOrder(notes: number[], arpeggio: ProgressionSpec["arpeggio"]): number[] {
  const up = [...notes];
  switch (arpeggio) {
    case "up":
      return up;
    case "down":
      return up.reverse();
    case "updown":
      return [...up, ...up.slice(1, -1).reverse()];
    default:
      return up;
  }
}
