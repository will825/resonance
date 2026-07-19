"use client";

import type { ChordAnalysis } from "@/lib/theory/analyze";
import { midiToNote } from "@/lib/theory/scales";
import type { RealizedChord } from "@/lib/theory/types";

interface ChordCardProps {
  chord: RealizedChord;
  index: number;
  isPlaying: boolean;
  isSelected: boolean;
  analysis: ChordAnalysis;
  onClick?: (index: number) => void;
}

/* Each card is its own torn scrap, glued down at a slight angle. */
const TILTS = ["-rotate-1", "rotate-1", "rotate-0", "rotate-1", "-rotate-1", "rotate-0"];
const TEARS = ["torn", "torn-2", "torn-3"];

/* Function badge = a little square of colored construction paper. */
const BADGE_STYLE: Record<ChordAnalysis["fn"], string> = {
  tonic: "bg-wave-blue text-white",
  subdominant: "bg-wave-yellow text-ink-strong",
  dominant: "bg-wave-orange text-white",
  chromatic: "bg-wave-red text-white",
};

export function ChordCard({
  chord,
  index,
  isPlaying,
  isSelected,
  analysis,
  onClick,
}: ChordCardProps) {
  const noteNames = chord.midiNotes.map((m) => midiToNote(m));
  const tilt = TILTS[index % TILTS.length];
  const tear = TEARS[index % TEARS.length];

  return (
    <button
      type="button"
      onClick={() => onClick?.(index)}
      className={[
        "group flex min-w-[8.5rem] flex-1 flex-col gap-2 px-4 py-3 text-left transition",
        tear,
        isPlaying
          ? "playing-wiggle z-10 fill-warm"
          : isSelected
            ? "z-10 -translate-y-1 rotate-0 fill-warm"
            : `${tilt} fill-card hover:-translate-y-1 hover:rotate-0`,
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-wave-blue">
          {chord.roman}
        </span>
        <span
          title={analysis.label}
          className={[
            "paper-cut-3 px-1.5 text-[10px] font-bold leading-4",
            BADGE_STYLE[analysis.fn],
          ].join(" ")}
        >
          {analysis.badge}
        </span>
      </div>
      <div className="text-2xl font-bold text-ink-strong">{chord.symbol}</div>
      <div className="flex flex-wrap items-baseline gap-1">
        {noteNames.map((n, i) => (
          <span
            key={`${n}-${i}`}
            className="rounded-md bg-paper/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-soft"
          >
            {n}
          </span>
        ))}
        <span className="ml-auto text-[10px] font-semibold text-ink-faint">
          {chord.bars} bar{chord.bars > 1 ? "s" : ""}
        </span>
      </div>
    </button>
  );
}
