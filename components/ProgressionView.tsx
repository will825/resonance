"use client";

import type { RealizedChord } from "@/lib/theory/types";
import { ChordCard } from "./ChordCard";

interface ProgressionViewProps {
  chords: RealizedChord[];
  playingIndex: number | null;
  onChordClick?: (index: number) => void;
}

export function ProgressionView({ chords, playingIndex, onChordClick }: ProgressionViewProps) {
  if (chords.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-ink-faint">
        Describe a vibe and hit Generate to build a progression.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {chords.map((chord, i) => (
        <ChordCard
          key={`${chord.roman}-${i}`}
          chord={chord}
          index={i}
          isPlaying={playingIndex === i}
          onClick={onChordClick}
        />
      ))}
    </div>
  );
}
