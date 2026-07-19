"use client";

interface TransportProps {
  isPlaying: boolean;
  tempo: number;
  canPlay: boolean;
  onPlay: () => void;
  onStop: () => void;
  onExport: () => void;
}

export function Transport({
  isPlaying,
  tempo,
  canPlay,
  onPlay,
  onStop,
  onExport,
}: TransportProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={isPlaying ? onStop : onPlay}
        disabled={!canPlay}
        className={[
          "paper-cut flex -rotate-1 items-center gap-2 px-5 py-2.5 text-lg font-bold text-white shadow-lift transition hover:rotate-0 active:translate-y-1 active:shadow-press disabled:cursor-not-allowed disabled:opacity-50",
          isPlaying ? "bg-wave-red" : "bg-wave-blue",
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
        onClick={onExport}
        disabled={!canPlay}
        className="paper-cut-2 rotate-1 border-2 border-line bg-card px-5 py-2.5 font-bold text-ink shadow-card transition hover:rotate-0 hover:border-wave-orange hover:text-wave-orange active:translate-y-1 active:shadow-press disabled:cursor-not-allowed disabled:opacity-50"
      >
        ↓ Download MIDI
      </button>

      <span className="ml-auto font-mono text-sm text-ink-soft">{tempo} BPM</span>
    </div>
  );
}
