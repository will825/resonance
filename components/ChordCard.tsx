"use client";

import { midiToNote } from "@/lib/theory/scales";
import type { RealizedChord } from "@/lib/theory/types";

interface ChordCardProps {
  chord: RealizedChord;
  index: number;
  isPlaying: boolean;
  onClick?: (index: number) => void;
}

/* Each card sits at its own slight angle, like cutouts glued by hand. */
const TILTS = ["-rotate-1", "rotate-1", "rotate-0", "rotate-1", "-rotate-1", "rotate-0"];
const CUTS = ["paper-cut", "paper-cut-2", "paper-cut-3"];

export function ChordCard({ chord, index, isPlaying, onClick }: ChordCardProps) {
  const noteNames = chord.midiNotes.map((m) => midiToNote(m));
  const tilt = TILTS[index % TILTS.length];
  const cut = CUTS[index % CUTS.length];

  return (
    <button
      type="button"
      onClick={() => onClick?.(index)}
      className={[
        "paper group flex min-w-[8.5rem] flex-1 flex-col gap-2 border-2 px-4 py-3 text-left transition",
        cut,
        isPlaying
          ? "playing-wiggle z-10 border-wave-orange bg-wave-yellow/25 shadow-lift"
          : `${tilt} border-line bg-card shadow-card hover:-translate-y-1 hover:border-wave-blue hover:shadow-lift`,
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-wave-blue">
          {chord.roman}
        </span>
        <span className="text-[10px] font-semibold text-ink-faint">
          {chord.bars} bar{chord.bars > 1 ? "s" : ""}
        </span>
      </div>
      <div className="text-2xl font-bold text-ink-strong">{chord.symbol}</div>
      <div className="flex flex-wrap gap-1">
        {noteNames.map((n, i) => (
          <span
            key={`${n}-${i}`}
            className="rounded-md bg-paper px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-soft"
          >
            {n}
          </span>
        ))}
      </div>
    </button>
  );
}
