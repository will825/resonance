"use client";

import type { ChordAnalysis } from "@/lib/theory/analyze";
import type { RealizedChord } from "@/lib/theory/types";
import { ChordCard } from "./ChordCard";

interface ProgressionViewProps {
  chords: RealizedChord[];
  analyses: ChordAnalysis[];
  playingIndex: number | null;
  selectedIndex: number | null;
  onChordClick?: (index: number) => void;
}

export function ProgressionView({
  chords,
  analyses,
  playingIndex,
  selectedIndex,
  onChordClick,
}: ProgressionViewProps) {
  if (chords.length === 0) {
    return (
      <div className="paper-cut flex h-32 items-center justify-center border-2 border-dashed border-line text-sm font-semibold text-ink-faint">
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
          isSelected={selectedIndex === i}
          analysis={analyses[i]}
          onClick={onChordClick}
        />
      ))}
    </div>
  );
}
