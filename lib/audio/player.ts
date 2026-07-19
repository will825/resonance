import * as Tone from "tone";
import { midiToNote } from "@/lib/theory/scales";
import type { ProgressionSpec, RealizedChord } from "@/lib/theory/types";

const SECONDS_PER_BAR = (bpm: number) => (60 / bpm) * 4; // 4/4 time

export type InstrumentName = "piano" | "synth";

interface PlayHandlers {
  onChordChange?: (index: number) => void;
  onStop?: () => void;
}

interface PlayOptions {
  /** repeat the progression until stopped */
  loop?: boolean;
  /** start playback from this chord index */
  startIndex?: number;
}

/**
 * Tone.js-backed playback engine. Plays through a sampled grand piano
 * (Salamander, loaded lazily from CDN) with a PolySynth fallback, honoring
 * per-chord bar lengths, looping, arpeggiation and light humanization.
 */
export class ChordPlayer {
  private synth: Tone.PolySynth | null = null;
  private sampler: Tone.Sampler | null = null;
  private samplerLoaded = false;
  private started = false;
  instrument: InstrumentName = "piano";

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

  /**
   * Kick off the piano sample download (~9 small mp3s). Safe to call early —
   * playback falls back to the synth until loading finishes.
   */
  preloadPiano(): void {
    if (this.sampler) return;
    this.sampler = new Tone.Sampler({
      urls: {
        C2: "C2.mp3",
        "F#2": "Fs2.mp3",
        C3: "C3.mp3",
        "F#3": "Fs3.mp3",
        C4: "C4.mp3",
        "F#4": "Fs4.mp3",
        C5: "C5.mp3",
        "F#5": "Fs5.mp3",
        C6: "C6.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      release: 1.4,
      volume: -4,
      onload: () => {
        this.samplerLoaded = true;
      },
    }).toDestination();
  }

  setInstrument(name: InstrumentName): void {
    this.instrument = name;
    if (name === "piano") this.preloadPiano();
  }

  /** True once the piano samples have finished downloading. */
  get pianoReady(): boolean {
    return this.samplerLoaded;
  }

  /** The instrument that should sound right now (piano once its samples exist). */
  private currentInstrument(): Tone.PolySynth | Tone.Sampler {
    if (this.instrument === "piano" && this.sampler && this.samplerLoaded) {
      return this.sampler;
    }
    return this.getSynth();
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
    options: PlayOptions = {},
  ): Promise<void> {
    await this.ensureAudio();
    this.stop();

    // Give the piano a moment to finish loading, but never block playback on it.
    if (this.instrument === "piano") {
      this.preloadPiano();
      if (!this.samplerLoaded) {
        await Promise.race([
          Tone.loaded(),
          new Promise((resolve) => setTimeout(resolve, 3500)),
        ]);
      }
    }

    const transport = Tone.getTransport();
    transport.bpm.value = spec.tempo;
    const barSeconds = SECONDS_PER_BAR(spec.tempo);

    let cursor = 0;
    const startTimes: number[] = [];
    realized.forEach((chord, index) => {
      startTimes.push(cursor);
      const startAt = cursor;
      const dur = chord.bars * barSeconds;
      cursor += dur;

      // transport.schedule (not scheduleOnce) so events re-fire on loop passes.
      transport.schedule((time) => {
        Tone.getDraw().schedule(() => handlers.onChordChange?.(index), time);
        this.triggerChord(chord, dur, spec, time);
      }, startAt);
    });

    if (options.loop) {
      transport.loop = true;
      transport.loopStart = 0;
      transport.loopEnd = cursor;
    } else {
      transport.loop = false;
      transport.schedule(() => {
        this.stop();
        handlers.onStop?.();
      }, cursor + 0.05);
    }

    const offset =
      options.startIndex !== undefined ? (startTimes[options.startIndex] ?? 0) : 0;
    transport.start(undefined, offset);
  }

  private triggerChord(
    chord: RealizedChord,
    durSeconds: number,
    spec: ProgressionSpec,
    time: number,
  ): void {
    const instrument = this.currentInstrument();
    const notes = chord.midiNotes.map(midiToNote);
    const velocity = () => 0.55 + (Math.random() * 0.2 - 0.1); // +/-10% humanize
    const jitter = () => (Math.random() * 0.03 - 0.015); // +/-15ms

    if (spec.arpeggio === "none") {
      instrument.triggerAttackRelease(notes, durSeconds * 0.95, time, velocity());
      return;
    }

    const order = arpeggioOrder(notes, spec.arpeggio);
    const step = durSeconds / order.length;
    order.forEach((note, i) => {
      instrument.triggerAttackRelease(
        note,
        step * 0.9,
        time + i * step + jitter(),
        velocity(),
      );
    });
  }

  /** Audition a single chord (used when a chord card is clicked while stopped). */
  async preview(chord: RealizedChord): Promise<void> {
    await this.ensureAudio();
    const instrument = this.currentInstrument();
    const notes = chord.midiNotes.map(midiToNote);
    instrument.triggerAttackRelease(notes, 1.1, undefined, 0.5);
  }

  stop(): void {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.loop = false;
    this.synth?.releaseAll();
    this.sampler?.releaseAll();
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.synth = null;
    this.sampler?.dispose();
    this.sampler = null;
    this.samplerLoaded = false;
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
