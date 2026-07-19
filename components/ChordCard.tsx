"use client";

import { midiToNote } from "@/lib/theory/scales";
import type { RealizedChord } from "@/lib/theory/types";

interface ChordCardProps {
  chord: RealizedChord;
  index: number;
  isPlaying: boolean;
  onClick?: (index: number) => void;
}

export function ChordCard({ chord, index, isPlaying, onClick }: ChordCardProps) {
  const noteNames = chord.midiNotes.map((m) => midiToNote(m));

  return (
    <button
      type="button"
      onClick={() => onClick?.(index)}
      className={[
        "group flex min-w-[8.5rem] flex-1 flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition",
        isPlaying
          ? "playing-glow border-wave-orange bg-wave-orange/10 shadow-lift"
          : "border-line bg-card shadow-card hover:-translate-y-0.5 hover:border-wave-blue hover:shadow-lift",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-wave-blue">
          {chord.roman}
        </span>
        <span className="text-[10px] text-ink-faint">
          {chord.bars} bar{chord.bars > 1 ? "s" : ""}
        </span>
      </div>
      <div className="text-2xl font-bold text-ink-strong">{chord.symbol}</div>
      <div className="flex flex-wrap gap-1">
        {noteNames.map((n, i) => (
          <span
            key={`${n}-${i}`}
            className="rounded-md bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink-soft"
          >
            {n}
          </span>
        ))}
      </div>
    </button>
  );
}
