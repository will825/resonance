"use client";

import type { ChordSpec } from "@/lib/theory/types";

export interface Section {
  id: string;
  name: string;
  progression: ChordSpec[];
  repeat: number;
}

export const SECTION_NAMES = [
  "Intro",
  "Verse",
  "Pre-Chorus",
  "Chorus",
  "Bridge",
  "Outro",
];

interface SongArrangerProps {
  sections: Section[];
  isPlayingSong: boolean;
  onAddCurrent: () => void;
  onLoad: (section: Section) => void;
  onRename: (id: string, name: string) => void;
  onRepeat: (id: string, repeat: number) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (id: string) => void;
  onPlaySong: () => void;
  onStopSong: () => void;
  onExportSong: () => void;
}

const chip =
  "paper-cut-3 border-2 border-line bg-card px-2.5 py-1 text-xs font-bold text-ink-soft shadow-press transition hover:border-wave-blue hover:text-wave-blue active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40";

export function SongArranger({
  sections,
  isPlayingSong,
  onAddCurrent,
  onLoad,
  onRename,
  onRepeat,
  onMove,
  onDelete,
  onPlaySong,
  onStopSong,
  onExportSong,
}: SongArrangerProps) {
  const totalBars = sections.reduce(
    (sum, s) => sum + s.progression.reduce((b, c) => b + c.bars, 0) * s.repeat,
    0,
  );

  return (
    <section className="torn-3 fill-card mt-10 space-y-4 p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-faint">
          Song arrangement
        </h2>
        <button type="button" onClick={onAddCurrent} className={chip}>
          ＋ add current section
        </button>
        {sections.length > 0 && (
          <>
            <button
              type="button"
              onClick={isPlayingSong ? onStopSong : onPlaySong}
              className={[
                "torn -rotate-1 px-5 py-2 text-sm font-bold text-white transition hover:rotate-0 active:translate-y-0.5",
                isPlayingSong ? "fill-red" : "fill-blue",
              ].join(" ")}
            >
              {isPlayingSong ? "■ Stop song" : "▶ Play song"}
            </button>
            <button type="button" onClick={onExportSong} className={`${chip} rotate-1`}>
              ↓ Export song
            </button>
            <span className="ml-auto font-mono text-xs text-ink-faint">
              {sections.length} sections · {totalBars} bars
            </span>
          </>
        )}
      </div>

      {sections.length === 0 ? (
        <p className="text-xs text-ink-faint">
          Build a progression above, then “add current section” to start arranging a full song —
          verse, chorus, bridge. Each section stays in the same key, and Play/Export Song strings
          them together.
        </p>
      ) : (
        <div className="space-y-2">
          {sections.map((section, i) => (
            <div
              key={section.id}
              className={[
                "paper-cut flex flex-wrap items-center gap-2 border-2 border-line bg-paper/50 px-3 py-2 shadow-press",
                i % 2 === 0 ? "rotate-[0.4deg]" : "-rotate-[0.4deg]",
              ].join(" ")}
            >
              <span className="font-mono text-xs font-bold text-wave-blue">{i + 1}</span>
              <select
                value={section.name}
                onChange={(e) => onRename(section.id, e.target.value)}
                className="paper-cut-3 border-2 border-line bg-card px-2 py-1 text-sm font-bold text-ink-strong focus:border-wave-blue focus:outline-none"
              >
                {SECTION_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                {!SECTION_NAMES.includes(section.name) && (
                  <option value={section.name}>{section.name}</option>
                )}
              </select>
              <span className="font-mono text-[11px] text-ink-faint">
                {section.progression.map((c) => c.roman).join(" · ")}
              </span>

              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                  ×
                </span>
                {[1, 2, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onRepeat(section.id, n)}
                    className={[
                      "paper-cut-2 border-2 px-2 py-0.5 text-xs font-bold transition",
                      section.repeat === n
                        ? "border-wave-blue bg-wave-blue text-white"
                        : "border-line bg-card text-ink-soft hover:border-wave-blue",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                ))}
                <button type="button" onClick={() => onLoad(section)} className={chip} title="Load into editor">
                  edit
                </button>
                <button type="button" onClick={() => onMove(section.id, -1)} className={chip} title="Move up">
                  ▲
                </button>
                <button type="button" onClick={() => onMove(section.id, 1)} className={chip} title="Move down">
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(section.id)}
                  className={`${chip} hover:border-wave-red hover:text-wave-red`}
                  title="Remove section"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
