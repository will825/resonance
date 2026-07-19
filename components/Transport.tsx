"use client";

import type { InstrumentName } from "@/lib/audio/player";

interface TransportProps {
  isPlaying: boolean;
  tempo: number;
  canPlay: boolean;
  loop: boolean;
  instrument: InstrumentName;
  shareCopied: boolean;
  includeBass: boolean;
  onPlay: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onInstrumentChange: (name: InstrumentName) => void;
  onExport: () => void;
  onShare: () => void;
  onToggleBass: () => void;
}

const INSTRUMENTS: InstrumentName[] = ["piano", "synth"];

export function Transport({
  isPlaying,
  tempo,
  canPlay,
  loop,
  instrument,
  shareCopied,
  includeBass,
  onPlay,
  onStop,
  onToggleLoop,
  onInstrumentChange,
  onExport,
  onShare,
  onToggleBass,
}: TransportProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={isPlaying ? onStop : onPlay}
        disabled={!canPlay}
        className={[
          "torn-3 flex -rotate-1 items-center gap-2 px-6 py-2.5 text-lg font-bold text-white transition hover:rotate-0 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50",
          isPlaying ? "fill-red" : "fill-blue",
        ].join(" ")}
      >
        {isPlaying ? (
          <>
            <span className="text-lg leading-none">■</span> Stop
          </>
        ) : (
          <>
            <span className="text-lg leading-none">▶</span> Play
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onToggleLoop}
        aria-pressed={loop}
        title="Loop playback"
        className={[
          "paper-cut border-2 px-4 py-2 text-sm font-bold transition active:translate-y-0.5",
          loop
            ? "border-wave-blue bg-wave-blue text-white shadow-press"
            : "border-line bg-card text-ink-soft shadow-card hover:border-wave-blue hover:text-wave-blue",
        ].join(" ")}
      >
        ⟳ Loop
      </button>

      <div className="paper-cut-3 flex border-2 border-line bg-card p-1 shadow-card">
        {INSTRUMENTS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onInstrumentChange(name)}
            className={[
              "min-w-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition",
              instrument === name
                ? "paper-cut-2 bg-wave-orange text-white shadow-press"
                : "text-ink-soft hover:text-ink-strong",
            ].join(" ")}
          >
            {name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={!canPlay}
        className="torn-2 fill-card rotate-1 px-6 py-2.5 font-bold text-ink transition hover:rotate-0 hover:text-wave-orange active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ↓ Download MIDI
      </button>

      <button
        type="button"
        onClick={onToggleBass}
        aria-pressed={includeBass}
        title="Include a root-note bass track in the MIDI file"
        className={[
          "paper-cut-3 border-2 px-3 py-2 text-xs font-bold transition active:translate-y-0.5",
          includeBass
            ? "border-wave-orange bg-wave-orange text-white shadow-press"
            : "border-line bg-card text-ink-soft shadow-card hover:border-wave-orange hover:text-wave-orange",
        ].join(" ")}
      >
        + bass
      </button>

      <button
        type="button"
        onClick={onShare}
        disabled={!canPlay}
        className={[
          "paper-cut-2 border-2 px-4 py-2 text-sm font-bold transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
          shareCopied
            ? "border-wave-blue bg-wave-blue text-white shadow-press"
            : "border-line bg-card text-ink-soft shadow-card hover:border-wave-blue hover:text-wave-blue",
        ].join(" ")}
      >
        {shareCopied ? "Copied!" : "Share link"}
      </button>

      <span className="ml-auto font-mono text-sm text-ink-soft">{tempo} BPM</span>
    </div>
  );
}
