import * as Tone from "tone";
import type { MelodyNote } from "@/lib/theory/melody";
import { arpSchedule, rhythmEvents } from "@/lib/theory/rhythm";
import { midiToNote, pitchClassOf } from "@/lib/theory/scales";
import type { ProgressionSpec, RealizedChord } from "@/lib/theory/types";
import { WebMidiOut } from "./webmidi";

const SECONDS_PER_BAR = (bpm: number) => (60 / bpm) * 4; // 4/4 time

export type InstrumentName = "piano" | "synth";

/** MIDI channels used when streaming to an external device. */
const CH_CHORD = 0;
const CH_BASS = 1;
const CH_MELODY = 2;

/** Root of a chord placed in a bass register (C2..B2). */
function bassMidi(chord: RealizedChord): number {
  return 36 + pitchClassOf(chord.rootMidi);
}

interface PlayHandlers {
  onChordChange?: (index: number) => void;
  onStop?: () => void;
}

interface PlayOptions {
  loop?: boolean;
  startIndex?: number;
  bass?: boolean;
  melody?: MelodyNote[] | null;
}

/**
 * Tone.js-backed playback engine. Plays chords through a sampled grand piano
 * (Salamander, lazy CDN) with a PolySynth fallback, plus optional bass and
 * melody voices — and can mirror every note to an external MIDI device.
 */
export class ChordPlayer {
  private synth: Tone.PolySynth | null = null;
  private sampler: Tone.Sampler | null = null;
  private bass: Tone.Synth | null = null;
  private lead: Tone.Synth | null = null;
  private samplerLoaded = false;
  private started = false;
  instrument: InstrumentName = "piano";
  readonly midiOut = new WebMidiOut();

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

  private getBass(): Tone.Synth {
    if (!this.bass) {
      this.bass = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.6 },
        volume: -12,
      }).toDestination();
    }
    return this.bass;
  }

  private getLead(): Tone.Synth {
    if (!this.lead) {
      this.lead = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.015, decay: 0.15, sustain: 0.35, release: 0.3 },
        volume: -14,
      }).toDestination();
    }
    return this.lead;
  }

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

  get pianoReady(): boolean {
    return this.samplerLoaded;
  }

  private chordInstrument(): Tone.PolySynth | Tone.Sampler {
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

  /** Play one audio note and, if streaming, mirror it out over MIDI. */
  private emit(
    instrument: Tone.PolySynth | Tone.Sampler | Tone.Synth,
    midi: number,
    durSeconds: number,
    time: number,
    velocity: number,
    channel: number,
  ): void {
    instrument.triggerAttackRelease(midiToNote(midi), durSeconds, time, velocity);
    if (this.midiOut.enabled) {
      const draw = Tone.getDraw();
      draw.schedule(() => this.midiOut.noteOn(midi, velocity, channel), time);
      draw.schedule(() => this.midiOut.noteOff(midi, channel), time + durSeconds);
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

    if (this.instrument === "piano") {
      this.preloadPiano();
      if (!this.samplerLoaded) {
        await Promise.race([Tone.loaded(), new Promise((r) => setTimeout(r, 3500))]);
      }
    }

    const transport = Tone.getTransport();
    transport.bpm.value = spec.tempo;
    const secondsPerBeat = 60 / spec.tempo;
    const barSeconds = SECONDS_PER_BAR(spec.tempo);

    let cursor = 0;
    const startTimes: number[] = [];
    realized.forEach((chord, index) => {
      startTimes.push(cursor);
      const startAt = cursor;
      const dur = chord.bars * barSeconds;
      cursor += dur;

      transport.schedule((time) => {
        Tone.getDraw().schedule(() => handlers.onChordChange?.(index), time);
        this.triggerChord(chord, dur, spec, time);
        if (options.bass) {
          this.emit(this.getBass(), bassMidi(chord), dur * 0.95, time, 0.75, CH_BASS);
        }
      }, startAt);
    });

    if (options.melody) {
      for (const note of options.melody) {
        const at = note.beat * secondsPerBeat;
        if (at >= cursor) continue;
        transport.schedule((time) => {
          this.emit(this.getLead(), note.midi, note.beats * secondsPerBeat, time, 0.6, CH_MELODY);
        }, at);
      }
    }

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
    const instrument = this.chordInstrument();
    const secondsPerBeat = 60 / spec.tempo;
    const velocity = () => 0.55 + (Math.random() * 0.2 - 0.1); // +/-10% humanize
    const jitter = () => Math.random() * 0.03 - 0.015; // +/-15ms

    if (spec.arpeggio === "none") {
      for (const ev of rhythmEvents(chord.bars, spec.rhythm ?? "block")) {
        const at = time + ev.beat * secondsPerBeat + (ev.beat > 0 ? jitter() : 0);
        const dur = ev.beats * secondsPerBeat * 0.95;
        for (const m of chord.midiNotes) {
          this.emit(instrument, m, dur, at, velocity() * ev.accent, CH_CHORD);
        }
      }
      return;
    }

    const order = arpeggioOrder(chord.midiNotes, spec.arpeggio);
    const schedule = arpSchedule(order.length, chord.bars * 4, spec.arpRate ?? "auto");
    for (const step of schedule) {
      const at = time + step.beat * secondsPerBeat + (step.beat > 0 ? jitter() : 0);
      this.emit(instrument, order[step.orderIndex], step.beats * secondsPerBeat, at, velocity(), CH_CHORD);
    }
  }

  /** Audition a single chord (used when a chord card is clicked while stopped). */
  async preview(chord: RealizedChord): Promise<void> {
    await this.ensureAudio();
    // Cut whatever is still ringing so quick clicks don't bleed together.
    this.synth?.releaseAll();
    this.sampler?.releaseAll();
    const instrument = this.chordInstrument();
    const notes = chord.midiNotes.map(midiToNote);
    instrument.triggerAttackRelease(notes, 1.1, undefined, 0.5);
    if (this.midiOut.enabled) {
      for (const m of chord.midiNotes) {
        this.midiOut.noteOn(m, 0.5, CH_CHORD);
        window.setTimeout(() => this.midiOut.noteOff(m, CH_CHORD), 1100);
      }
    }
  }

  stop(): void {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.loop = false;
    this.synth?.releaseAll();
    this.sampler?.releaseAll();
    this.bass?.triggerRelease();
    this.lead?.triggerRelease();
    this.midiOut.allOff();
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.synth = null;
    this.sampler?.dispose();
    this.sampler = null;
    this.bass?.dispose();
    this.bass = null;
    this.lead?.dispose();
    this.lead = null;
    this.samplerLoaded = false;
  }
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
