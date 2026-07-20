import { Midi } from "@tonejs/midi";
import type { MelodyNote } from "@/lib/theory/melody";
import { arpSchedule, rhythmEvents } from "@/lib/theory/rhythm";
import { midiToNote, pitchClassOf } from "@/lib/theory/scales";
import type { ProgressionSpec, RealizedChord } from "@/lib/theory/types";

const SECONDS_PER_BAR = (bpm: number) => (60 / bpm) * 4; // 4/4

export interface ExportOptions {
  /** include a root-note bassline as a second track (default true) */
  bass?: boolean;
  /** include a melody line as a track */
  melody?: MelodyNote[] | null;
}

/** Root of a chord placed in a bass register (C2..B2). */
function bassMidi(chord: RealizedChord): number {
  return 36 + pitchClassOf(chord.rootMidi);
}

/**
 * Build an in-memory multi-track MIDI file (chords + optional bass) honoring
 * the comping rhythm, arpeggio setting and rate. Returns the bytes.
 */
export function buildMidi(
  realized: RealizedChord[],
  spec: ProgressionSpec,
  options: ExportOptions = {},
): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(spec.tempo);

  const chordTrack = midi.addTrack();
  chordTrack.name = `Chords — ${spec.key} ${spec.mode} (${spec.feel})`;

  const secondsPerBeat = 60 / spec.tempo;
  const barSeconds = SECONDS_PER_BAR(spec.tempo);
  const vel = (scale = 1) =>
    clamp((0.7 + (Math.random() * 0.16 - 0.08)) * scale);

  let cursor = 0;
  for (const chord of realized) {
    const dur = chord.bars * barSeconds;

    if (spec.arpeggio === "none") {
      for (const ev of rhythmEvents(chord.bars, spec.rhythm ?? "block")) {
        for (const m of chord.midiNotes) {
          chordTrack.addNote({
            name: midiToNote(m),
            time: cursor + ev.beat * secondsPerBeat,
            duration: ev.beats * secondsPerBeat * 0.95,
            velocity: vel(ev.accent),
          });
        }
      }
    } else {
      const order = arpeggioOrder(chord.midiNotes, spec.arpeggio);
      const schedule = arpSchedule(order.length, chord.bars * 4, spec.arpRate ?? "auto");
      for (const step of schedule) {
        chordTrack.addNote({
          name: midiToNote(order[step.orderIndex]),
          time: cursor + step.beat * secondsPerBeat,
          duration: step.beats * secondsPerBeat,
          velocity: vel(),
        });
      }
    }

    cursor += dur;
  }

  if (options.bass !== false) {
    const bassTrack = midi.addTrack();
    bassTrack.name = "Bass — roots";
    let bassCursor = 0;
    for (const chord of realized) {
      const dur = chord.bars * barSeconds;
      bassTrack.addNote({
        name: midiToNote(bassMidi(chord)),
        time: bassCursor,
        duration: dur * 0.95,
        velocity: clamp(0.75 + (Math.random() * 0.1 - 0.05)),
      });
      bassCursor += dur;
    }
  }

  if (options.melody && options.melody.length > 0) {
    const melodyTrack = midi.addTrack();
    melodyTrack.name = "Melody";
    for (const note of options.melody) {
      melodyTrack.addNote({
        name: midiToNote(note.midi),
        time: note.beat * secondsPerBeat,
        duration: note.beats * secondsPerBeat,
        velocity: clamp(0.7 + (Math.random() * 0.12 - 0.06)),
      });
    }
  }

  return midi.toArray();
}

/** Browser-only: build + trigger a download of the MIDI file. */
export function downloadMidi(
  realized: RealizedChord[],
  spec: ProgressionSpec,
  options: ExportOptions = {},
): void {
  const bytes = buildMidi(realized, spec, options);
  // Copy into a fresh ArrayBuffer so the Blob part type is unambiguous.
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([buffer], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resonance-${spec.key}-${spec.mode}.mid`;
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
