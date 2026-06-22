import * as Tone from "tone";
import { midiToNote } from "@/lib/theory/scales";
import type { ProgressionSpec, RealizedChord } from "@/lib/theory/types";

const SECONDS_PER_BAR = (bpm: number) => (60 / bpm) * 4; // 4/4 time

interface PlayHandlers {
  onChordChange?: (index: number) => void;
  onStop?: () => void;
}

/**
 * Tone.js-backed playback engine. Schedules realized chords on the Transport,
 * honoring per-chord bar lengths, arpeggiation and light humanization.
 */
export class ChordPlayer {
  private synth: Tone.PolySynth | null = null;
  private scheduledIds: number[] = [];
  private started = false;

  private getSynth(): Tone.PolySynth {
    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth", count: 3, spread: 18 },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 1.4 },
        volume: -10,
      }).toDestination();
    }
    return this.synth;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  async ensureAudio(): Promise<void> {
    if (!this.started) {
      await Tone.start();
      this.started = true;
    }
  }

  async play(
    realized: RealizedChord[],
    spec: ProgressionSpec,
    handlers: PlayHandlers = {},
  ): Promise<void> {
    await this.ensureAudio();
    this.stop();

    const synth = this.getSynth();
    const transport = Tone.getTransport();
    transport.bpm.value = spec.tempo;
    const barSeconds = SECONDS_PER_BAR(spec.tempo);

    let cursor = 0;
    realized.forEach((chord, index) => {
      const startAt = cursor;
      const dur = chord.bars * barSeconds;
      cursor += dur;

      const id = transport.scheduleOnce((time) => {
        handlers.onChordChange?.(index);
        this.triggerChord(synth, chord, dur, spec, time);
      }, startAt);
      this.scheduledIds.push(id);
    });

    // Stop at the end of the progression.
    const endId = transport.scheduleOnce(() => {
      this.stop();
      handlers.onStop?.();
    }, cursor + 0.05);
    this.scheduledIds.push(endId);

    transport.start();
  }

  private triggerChord(
    synth: Tone.PolySynth,
    chord: RealizedChord,
    durSeconds: number,
    spec: ProgressionSpec,
    time: number,
  ): void {
    const notes = chord.midiNotes.map(midiToNote);
    const velocity = () => 0.55 + (Math.random() * 0.2 - 0.1); // +/-10% humanize
    const jitter = () => (Math.random() * 0.03 - 0.015); // +/-15ms

    if (spec.arpeggio === "none") {
      synth.triggerAttackRelease(notes, durSeconds * 0.95, time, velocity());
      return;
    }

    const order = arpeggioOrder(notes, spec.arpeggio);
    const step = durSeconds / order.length;
    order.forEach((note, i) => {
      synth.triggerAttackRelease(
        note,
        step * 0.9,
        time + i * step + jitter(),
        velocity(),
      );
    });
  }

  /** Audition a single chord (used when a chord card is clicked). */
  async preview(chord: RealizedChord): Promise<void> {
    await this.ensureAudio();
    const synth = this.getSynth();
    const notes = chord.midiNotes.map(midiToNote);
    synth.triggerAttackRelease(notes, 1.1, undefined, 0.5);
  }

  stop(): void {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    this.scheduledIds = [];
    this.synth?.releaseAll();
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.synth = null;
  }
}

function arpeggioOrder(notes: string[], arpeggio: ProgressionSpec["arpeggio"]): string[] {
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
