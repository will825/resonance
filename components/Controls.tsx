"use client";

import { COMPLEXITIES, type Complexity } from "@/lib/theory/complexity";
import type { Arpeggio, ArpRate, Mode, Rhythm, VoicingStyle } from "@/lib/theory/types";

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MODES: { value: Mode; label: string }[] = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "dorian", label: "Dorian" },
  { value: "phrygian", label: "Phrygian" },
  { value: "lydian", label: "Lydian" },
  { value: "mixolydian", label: "Mixolydian" },
  { value: "aeolian", label: "Aeolian" },
  { value: "locrian", label: "Locrian" },
  { value: "harmonicMinor", label: "Harmonic minor" },
  { value: "melodicMinor", label: "Melodic minor" },
];

const VOICINGS: VoicingStyle[] = ["close", "open", "drop2"];
const ARPS: Arpeggio[] = ["none", "up", "down", "updown"];
const ARP_RATES: { value: ArpRate; label: string }[] = [
  { value: "auto", label: "auto" },
  { value: "4n", label: "1/4" },
  { value: "8n", label: "1/8" },
  { value: "16n", label: "1/16" },
];
const RHYTHMS: { value: Rhythm; label: string }[] = [
  { value: "block", label: "block" },
  { value: "pulse8", label: "8ths" },
  { value: "charleston", label: "charleston" },
  { value: "push", label: "push" },
];

export interface ControlsState {
  musicKey: string;
  mode: Mode;
  tempo: number;
  bars: number;
  voicingStyle: VoicingStyle;
  arpeggio: Arpeggio;
  arpRate: ArpRate;
  rhythm: Rhythm;
  complexity: Complexity;
}

interface ControlsProps {
  state: ControlsState;
  onChange: (patch: Partial<ControlsState>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "paper-cut-3 border-2 border-line bg-card px-3 py-2 text-sm font-semibold text-ink-strong shadow-card focus:border-wave-blue focus:outline-none";

function Segmented<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: readonly (T | { value: T; label: string })[];
  value: T;
  onSelect: (v: T) => void;
}) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div className="paper-cut flex border-2 border-line bg-card p-1 shadow-card">
      {normalized.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={[
            "min-w-0 flex-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-center text-xs font-bold capitalize transition",
            value === opt.value
              ? "paper-cut-3 bg-wave-blue text-white shadow-press"
              : "text-ink-soft hover:text-ink-strong",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Controls({ state, onChange }: ControlsProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: core musical settings */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Key">
          <select
            className={selectClass}
            value={state.musicKey}
            onChange={(e) => onChange({ musicKey: e.target.value })}
          >
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mode">
          <select
            className={selectClass}
            value={state.mode}
            onChange={(e) => onChange({ mode: e.target.value as Mode })}
          >
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Tempo · ${state.tempo} BPM`}>
          <input
            type="range"
            min={60}
            max={180}
            value={state.tempo}
            onChange={(e) => onChange({ tempo: Number(e.target.value) })}
            className="mt-2.5 w-full"
          />
        </Field>

        <Field label="Bars">
          <Segmented
            options={["4", "8"] as const}
            value={String(state.bars) as "4" | "8"}
            onSelect={(v) => onChange({ bars: Number(v) })}
          />
        </Field>
      </div>

      {/* Row 2: the musical character dials, each with room to breathe */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Voicing">
          <Segmented
            options={VOICINGS}
            value={state.voicingStyle}
            onSelect={(v) => onChange({ voicingStyle: v })}
          />
        </Field>

        <Field label="Complexity">
          <Segmented
            options={COMPLEXITIES}
            value={state.complexity}
            onSelect={(v) => onChange({ complexity: v })}
          />
        </Field>

        <Field label="Rhythm">
          <Segmented
            options={RHYTHMS}
            value={state.rhythm}
            onSelect={(v) => onChange({ rhythm: v })}
          />
        </Field>

        <Field label="Arpeggio">
          <Segmented options={ARPS} value={state.arpeggio} onSelect={(v) => onChange({ arpeggio: v })} />
        </Field>

        <Field label="Arp rate">
          <Segmented
            options={ARP_RATES}
            value={state.arpRate}
            onSelect={(v) => onChange({ arpRate: v })}
          />
        </Field>
      </div>
    </div>
  );
}
