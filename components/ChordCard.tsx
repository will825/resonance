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
        "group flex min-w-[8.5rem] flex-1 flex-col gap-2 rounded-xl border px-4 py-3 text-left transition",
        isPlaying
          ? "playing-glow border-accent bg-accent/15"
          : "border-ink-600 bg-ink-700/60 hover:border-accent/60 hover:bg-ink-700",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-accent-soft">
          {chord.roman}
        </span>
        <span className="text-[10px] text-slate-500">
          {chord.bars} bar{chord.bars > 1 ? "s" : ""}
        </span>
      </div>
      <div className="text-2xl font-semibold text-slate-50">{chord.symbol}</div>
      <div className="flex flex-wrap gap-1">
        {noteNames.map((n, i) => (
          <span
            key={`${n}-${i}`}
            className="rounded bg-ink-900/70 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
          >
            {n}
          </span>
        ))}
      </div>
    </button>
  );
}
