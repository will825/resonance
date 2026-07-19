"use client";

export interface HistoryEntry {
  id: string;
  ts: number;
  feel: string;
  key: string;
  mode: string;
  starred: boolean;
  /** encoded share payload — the full recipe */
  code: string;
}

interface HistoryStripProps {
  entries: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onStar: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HistoryStrip({ entries, onLoad, onStar, onDelete }: HistoryStripProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => Number(b.starred) - Number(a.starred) || b.ts - a.ts,
  );

  return (
    <section className="torn fill-card mt-10 space-y-3 p-6 sm:p-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-ink-faint">
        Your progressions
      </h2>
      <div className="flex flex-wrap gap-2">
        {sorted.map((entry, i) => (
          <div
            key={entry.id}
            className={[
              "paper-cut flex items-center gap-1.5 border-2 border-line bg-paper/60 py-1 pl-3 pr-1.5 shadow-press",
              i % 2 === 0 ? "rotate-1" : "-rotate-1",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => onLoad(entry)}
              className="text-left text-xs font-bold text-ink transition hover:text-wave-blue"
              title={`Load "${entry.feel}"`}
            >
              {entry.feel.length > 28 ? `${entry.feel.slice(0, 28)}…` : entry.feel}
              <span className="ml-1.5 font-mono text-[10px] font-semibold text-ink-faint">
                {entry.key} {entry.mode}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onStar(entry.id)}
              className={[
                "px-1 text-sm leading-none transition",
                entry.starred ? "text-wave-yellow" : "text-line hover:text-wave-yellow",
              ].join(" ")}
              title={entry.starred ? "Unstar" : "Star to keep"}
              aria-pressed={entry.starred}
            >
              ★
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="px-1 text-xs leading-none text-ink-faint transition hover:text-wave-red"
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
