"use client";

import type { Suggestion } from "@/lib/theory/suggest";
import type { RealizedChord } from "@/lib/theory/types";

interface ChordEditorProps {
  index: number;
  chord: RealizedChord;
  suggestions: Suggestion[];
  canRemove: boolean;
  onReplace: (roman: string) => void;
  onBars: (bars: number) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const GROUP_LABEL: Record<Suggestion["group"], string> = {
  diatonic: "In the key",
  borrowed: "Borrowed color",
  secondary: "Secondary dominant",
};

const GROUP_ORDER: Suggestion["group"][] = ["diatonic", "borrowed", "secondary"];

const actionButton =
  "paper-cut-3 border-2 border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-soft shadow-press transition hover:border-wave-blue hover:text-wave-blue active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40";

export function ChordEditor({
  index,
  chord,
  suggestions,
  canRemove,
  onReplace,
  onBars,
  onMove,
  onDuplicate,
  onRemove,
  onClose,
}: ChordEditorProps) {
  return (
    <div className="torn-3 fill-paper space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-bold text-ink-strong">
          Editing chord {index + 1} — <span className="text-wave-blue">{chord.symbol}</span>
        </h3>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Bars
            </span>
            {[1, 2].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onBars(b)}
                className={[
                  "paper-cut-2 border-2 px-2.5 py-1 text-xs font-bold transition",
                  chord.bars === b
                    ? "border-wave-blue bg-wave-blue text-white"
                    : "border-line bg-card text-ink-soft hover:border-wave-blue",
                ].join(" ")}
              >
                {b}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onMove(-1)} className={actionButton} title="Move left">
            ◀
          </button>
          <button type="button" onClick={() => onMove(1)} className={actionButton} title="Move right">
            ▶
          </button>
          <button type="button" onClick={onDuplicate} className={actionButton} title="Duplicate chord">
            ＋ copy
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className={`${actionButton} hover:border-wave-red hover:text-wave-red`}
            title="Remove chord"
          >
            ✕ remove
          </button>
          <button type="button" onClick={onClose} className={actionButton} title="Close editor">
            done
          </button>
        </div>
      </div>

      {GROUP_ORDER.map((group) => {
        const items = suggestions.filter((s) => s.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              {GROUP_LABEL[group]}
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => (
                <button
                  key={`${group}-${s.roman}`}
                  type="button"
                  onClick={() => onReplace(s.roman)}
                  title={s.hint}
                  className={[
                    "border-2 border-line bg-card px-3 py-1.5 font-mono text-sm font-bold text-ink shadow-press transition hover:-translate-y-0.5 active:translate-y-0",
                    group === "diatonic"
                      ? "paper-cut hover:border-wave-blue hover:text-wave-blue"
                      : group === "borrowed"
                        ? "paper-cut-2 hover:border-wave-red hover:text-wave-red"
                        : "paper-cut-3 hover:border-wave-orange hover:text-wave-orange",
                  ].join(" ")}
                >
                  {s.roman}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-[11px] text-ink-faint">
        Tap a chip to swap this chord — it auditions instantly. Suggestions are ranked by how
        naturally they follow the previous chord (tonic → subdominant → dominant → tonic).
      </p>
    </div>
  );
}
