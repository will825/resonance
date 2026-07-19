import type { ArpRate, Rhythm } from "./types";

/** One hit within a 4/4 bar: position and length in beats, velocity scale. */
export interface RhythmEvent {
  beat: number;
  beats: number;
  accent: number;
}

/** Comping patterns, expressed per single 4/4 bar. */
const PATTERNS: Record<Rhythm, RhythmEvent[]> = {
  block: [{ beat: 0, beats: 4, accent: 1 }],
  pulse8: Array.from({ length: 8 }, (_, i) => ({
    beat: i * 0.5,
    beats: 0.45,
    accent: i % 2 === 0 ? 1 : 0.72,
  })),
  // The Charleston: a dotted-quarter push answered on the "and" of two.
  charleston: [
    { beat: 0, beats: 1.4, accent: 1 },
    { beat: 1.5, beats: 0.6, accent: 0.8 },
  ],
  // Pop push: long, then anticipate beat three, ride out the bar.
  push: [
    { beat: 0, beats: 1.4, accent: 1 },
    { beat: 1.5, beats: 0.9, accent: 0.8 },
    { beat: 2.5, beats: 1.5, accent: 0.9 },
  ],
};

/**
 * Expand a rhythm across a chord lasting `bars` bars: the per-bar pattern is
 * tiled, with beat offsets shifted by 4 per bar.
 */
export function rhythmEvents(bars: number, rhythm: Rhythm): RhythmEvent[] {
  const pattern = PATTERNS[rhythm] ?? PATTERNS.block;
  const out: RhythmEvent[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (const ev of pattern) {
      out.push({ ...ev, beat: ev.beat + bar * 4 });
    }
  }
  return out;
}

/** Beats per arpeggio step at a given rate; null means spread-across-the-bar. */
export function arpStepBeats(rate: ArpRate): number | null {
  switch (rate) {
    case "4n":
      return 1;
    case "8n":
      return 0.5;
    case "16n":
      return 0.25;
    default:
      return null;
  }
}

/**
 * The arpeggio note schedule for a chord lasting `totalBeats`, cycling through
 * `order` (tone indices) at the given rate. "auto" spreads one full cycle
 * across the chord, as before.
 */
export function arpSchedule(
  orderLength: number,
  totalBeats: number,
  rate: ArpRate,
): { beat: number; beats: number; orderIndex: number }[] {
  const step = arpStepBeats(rate);
  if (step === null) {
    const auto = totalBeats / orderLength;
    return Array.from({ length: orderLength }, (_, i) => ({
      beat: i * auto,
      beats: auto * 0.9,
      orderIndex: i,
    }));
  }
  const count = Math.max(1, Math.floor(totalBeats / step));
  return Array.from({ length: count }, (_, i) => ({
    beat: i * step,
    beats: step * 0.9,
    orderIndex: i % orderLength,
  }));
}
