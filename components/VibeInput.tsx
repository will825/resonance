"use client";

interface VibeInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const SUGGESTIONS = [
  "dreamy lofi turnaround",
  "epic cinematic minor build",
  "smooth neo-soul ii-V-I",
  "uplifting pop anthem",
  "gritty 12-bar blues",
];

export function VibeInput({ value, onChange, onGenerate, loading }: VibeInputProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) onGenerate();
          }}
          placeholder="describe the vibe… e.g. dreamy lofi turnaround"
          className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="rounded-full border border-ink-600 px-3 py-1 text-xs text-slate-400 transition hover:border-accent/60 hover:text-slate-200"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
