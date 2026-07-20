"use client";

import type { InstrumentName } from "@/lib/audio/player";
import type { MidiOutputInfo } from "@/lib/audio/webmidi";

interface TransportProps {
  isPlaying: boolean;
  tempo: number;
  canPlay: boolean;
  loop: boolean;
  instrument: InstrumentName;
  shareCopied: boolean;
  includeBass: boolean;
  includeMelody: boolean;
  midiSupported: boolean;
  midiOutputs: MidiOutputInfo[];
  midiOutId: string | null;
  onPlay: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onInstrumentChange: (name: InstrumentName) => void;
  onExport: () => void;
  onShare: () => void;
  onToggleBass: () => void;
  onToggleMelody: () => void;
  onSelectMidiOut: (id: string | null) => void;
}

const INSTRUMENTS: InstrumentName[] = ["piano", "synth"];

const toggleClass = (on: boolean, accent: "blue" | "orange" | "yellow") =>
  [
    "paper-cut-3 border-2 px-3 py-2 text-xs font-bold transition active:translate-y-0.5",
    on
      ? accent === "orange"
        ? "border-wave-orange bg-wave-orange text-white shadow-press"
        : accent === "yellow"
          ? "border-wave-yellow bg-wave-yellow text-ink-strong shadow-press"
          : "border-wave-blue bg-wave-blue text-white shadow-press"
      : "border-line bg-card text-ink-soft shadow-card hover:border-wave-blue hover:text-wave-blue",
  ].join(" ");

export function Transport({
  isPlaying,
  tempo,
  canPlay,
  loop,
  instrument,
  shareCopied,
  includeBass,
  includeMelody,
  midiSupported,
  midiOutputs,
  midiOutId,
  onPlay,
  onStop,
  onToggleLoop,
  onInstrumentChange,
  onExport,
  onShare,
  onToggleBass,
  onToggleMelody,
  onSelectMidiOut,
}: TransportProps) {
  return (
    <div className="space-y-3">
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
          className={toggleClass(loop, "blue")}
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
          onClick={onToggleBass}
          aria-pressed={includeBass}
          title="Add a root-note bass voice (heard + exported)"
          className={toggleClass(includeBass, "orange")}
        >
          + bass
        </button>

        <button
          type="button"
          onClick={onToggleMelody}
          aria-pressed={includeMelody}
          title="Add a generated melody line (heard + exported)"
          className={toggleClass(includeMelody, "yellow")}
        >
          + melody
        </button>

        <span className="ml-auto font-mono text-sm text-ink-soft">{tempo} BPM</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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

        {midiSupported && (
          <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-ink-faint">
            <span className="uppercase tracking-wider">MIDI out</span>
            <select
              value={midiOutId ?? ""}
              onChange={(e) => onSelectMidiOut(e.target.value || null)}
              className="paper-cut-3 max-w-[12rem] border-2 border-line bg-card px-2 py-1 text-xs font-bold text-ink-strong focus:border-wave-blue focus:outline-none"
            >
              <option value="">Audio only</option>
              {midiOutputs.map((o) => (
                <option key={o.id} value={o.id}>
                  → {o.name}
                </option>
              ))}
              {midiOutputs.length === 0 && <option value="__scan">Enable MIDI…</option>}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
