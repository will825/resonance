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
          className="flex-1 rounded-xl border border-line bg-card px-4 py-3 text-ink-strong shadow-card placeholder:text-ink-faint focus:border-wave-blue focus:outline-none focus:ring-2 focus:ring-wave-blue/25"
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="wave-gradient rounded-xl px-7 py-3 font-bold text-white shadow-lift transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="rounded-full border border-line bg-card px-3 py-1 text-xs text-ink-soft transition hover:border-wave-blue hover:text-wave-blue"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
