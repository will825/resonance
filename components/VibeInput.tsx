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
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) onGenerate();
          }}
          placeholder="describe the vibe… e.g. dreamy lofi turnaround"
          className="paper-cut-2 flex-1 border-2 border-line bg-card px-4 py-3 text-ink-strong shadow-card placeholder:text-ink-faint focus:border-wave-blue focus:outline-none"
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="wave-gradient paper-cut -rotate-1 px-7 py-3 text-lg font-bold text-white shadow-lift transition hover:rotate-0 hover:shadow-card active:translate-y-1 active:shadow-press disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={[
              "border-2 border-line bg-card px-3 py-1 text-xs font-semibold text-ink-soft shadow-press transition hover:border-wave-blue hover:text-wave-blue",
              i % 2 === 0 ? "paper-cut-3 rotate-1" : "paper-cut -rotate-1",
              "hover:rotate-0",
            ].join(" ")}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
