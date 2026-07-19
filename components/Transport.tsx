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
        onClick={onExport}
        disabled={!canPlay}
        className="torn-2 fill-card rotate-1 px-6 py-2.5 font-bold text-ink transition hover:rotate-0 hover:text-wave-orange active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ↓ Download MIDI
      </button>

      <span className="ml-auto font-mono text-sm text-ink-soft">{tempo} BPM</span>
    </div>
  );
}
