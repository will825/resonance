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
          "flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
          isPlaying ? "bg-mint text-ink-900 hover:opacity-90" : "bg-accent text-white hover:bg-accent-soft",
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
        className="rounded-lg border border-ink-600 bg-ink-800 px-5 py-2.5 font-semibold text-slate-200 transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ↓ Download MIDI
      </button>

      <span className="ml-auto font-mono text-sm text-slate-400">{tempo} BPM</span>
    </div>
  );
}
