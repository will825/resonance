"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChordEditor } from "@/components/ChordEditor";
import { Controls, type ControlsState } from "@/components/Controls";
import { HistoryStrip, type HistoryEntry } from "@/components/HistoryStrip";
import { Keyboard } from "@/components/Keyboard";
import { ProgressionView } from "@/components/ProgressionView";
import { Transport } from "@/components/Transport";
import { VibeInput } from "@/components/VibeInput";
import { deterministicFallback } from "@/lib/ai/fallback";
import { ChordPlayer, type InstrumentName } from "@/lib/audio/player";
import { downloadMidi } from "@/lib/audio/exportMidi";
import { analyzeRoman, explainProgression } from "@/lib/theory/analyze";
import { applyComplexity, COMPLEXITIES, type Complexity } from "@/lib/theory/complexity";
import { realizeProgression } from "@/lib/theory/realize";
import { suggestChords } from "@/lib/theory/suggest";
import type { ArpRate, ChordSpec, Mode, ProgressionSpec, Rhythm } from "@/lib/theory/types";

interface Generated {
  progression: ChordSpec[];
  feel: string;
  notes?: string;
  source: "ai" | "fallback";
  reason?: string;
}

const INITIAL_VIBE = "dreamy lofi turnaround";
const SEED = deterministicFallback("C", "major", INITIAL_VIBE, 8);
const HISTORY_KEY = "resonance.history.v1";

/** Compact shape of a progression encoded into a share URL / history entry. */
interface SharePayload {
  v: string; // vibe
  k: string; // key
  m: Mode;
  t: number; // tempo
  b: number; // bars setting
  vs: ControlsState["voicingStyle"];
  a: ControlsState["arpeggio"];
  r?: ArpRate;
  y?: Rhythm;
  c: Complexity;
  f: string; // feel
  p: ChordSpec[];
  n?: string; // notes
}

function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeShare(code: string): SharePayload | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as SharePayload;
    if (
      typeof data.k !== "string" ||
      typeof data.t !== "number" ||
      !Array.isArray(data.p) ||
      data.p.some((c) => typeof c?.roman !== "string" || typeof c?.bars !== "number")
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistHistory(entries: HistoryEntry[]): void {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // storage full/unavailable — history is a convenience, not critical
  }
}

export default function Home() {
  const [vibe, setVibe] = useState(INITIAL_VIBE);
  const [controls, setControls] = useState<ControlsState>({
    musicKey: SEED.key,
    mode: SEED.mode,
    tempo: SEED.tempo,
    bars: 8,
    voicingStyle: SEED.voicingStyle,
    arpeggio: SEED.arpeggio,
    arpRate: "auto",
    rhythm: "block",
    complexity: "auto",
  });
  const [generated, setGenerated] = useState<Generated>({
    progression: SEED.progression,
    feel: SEED.feel,
    notes: SEED.notes,
    source: "fallback",
    reason: "initial",
  });

  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loop, setLoop] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentName>("piano");
  const [includeBass, setIncludeBass] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const playerRef = useRef<ChordPlayer | null>(null);

  useEffect(() => {
    const player = new ChordPlayer();
    player.setInstrument("piano"); // starts the sample download early
    playerRef.current = player;
    if (process.env.NODE_ENV !== "production") {
      // Dev-only handle for debugging/inspection.
      (window as unknown as Record<string, unknown>).__resonancePlayer = player;
    }
    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  const hydrateFromPayload = useCallback((data: SharePayload, reason: string) => {
    setVibe(data.v ?? "");
    setControls({
      musicKey: data.k,
      mode: data.m ?? "major",
      tempo: data.t,
      bars: data.b === 4 ? 4 : 8,
      voicingStyle: data.vs ?? "open",
      arpeggio: data.a ?? "none",
      arpRate: data.r ?? "auto",
      rhythm: data.y ?? "block",
      complexity: COMPLEXITIES.includes(data.c) ? data.c : "auto",
    });
    setGenerated({
      progression: data.p,
      feel: data.f ?? data.v ?? "shared progression",
      notes: data.n,
      source: "fallback",
      reason,
    });
    setSelectedIndex(null);
    setFocusIndex(0);
  }, []);

  // Hydrate from a share link (?s=...) and load history once on mount.
  useEffect(() => {
    setHistory(loadHistory());
    const code = new URLSearchParams(window.location.search).get("s");
    if (!code) return;
    const data = decodeShare(code);
    if (data) hydrateFromPayload(data, "shared");
  }, [hydrateFromPayload]);

  // The complexity dial rewrites roman tokens before the theory engine runs.
  const progression = useMemo(
    () =>
      generated.progression.map((c) => ({
        ...c,
        roman: applyComplexity(c.roman, controls.complexity),
      })),
    [generated.progression, controls.complexity],
  );

  const spec: ProgressionSpec = useMemo(
    () => ({
      key: controls.musicKey,
      mode: controls.mode,
      tempo: controls.tempo,
      feel: generated.feel,
      voicingStyle: controls.voicingStyle,
      arpeggio: controls.arpeggio,
      arpRate: controls.arpRate,
      rhythm: controls.rhythm,
      progression,
      notes: generated.notes,
    }),
    [controls, generated.feel, generated.notes, progression],
  );

  const realized = useMemo(() => realizeProgression(spec), [spec]);

  const analyses = useMemo(
    () => progression.map((c) => analyzeRoman(c.roman, controls.mode)),
    [progression, controls.mode],
  );

  const explanation = useMemo(
    () =>
      explainProgression(
        progression.map((c) => c.roman),
        controls.mode,
      ),
    [progression, controls.mode],
  );

  const suggestions = useMemo(() => {
    if (selectedIndex === null || !generated.progression[selectedIndex]) return [];
    const raw = generated.progression;
    return suggestChords(
      controls.mode,
      raw[selectedIndex - 1]?.roman,
      raw[selectedIndex + 1]?.roman,
      raw[selectedIndex].roman,
    );
  }, [selectedIndex, generated.progression, controls.mode]);

  // Editing controls re-realizes locally; stop playback to avoid stale schedules.
  function patchControls(patch: Partial<ControlsState>) {
    setControls((c) => ({ ...c, ...patch }));
    handleStop();
  }

  function currentPayload(): SharePayload {
    return {
      v: vibe,
      k: controls.musicKey,
      m: controls.mode,
      t: controls.tempo,
      b: controls.bars,
      vs: controls.voicingStyle,
      a: controls.arpeggio,
      r: controls.arpRate,
      y: controls.rhythm,
      c: controls.complexity,
      f: generated.feel,
      p: generated.progression,
      n: generated.notes,
    };
  }

  function addToHistory(payload: SharePayload) {
    setHistory((prev) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        feel: payload.f || payload.v || "untitled",
        key: payload.k,
        mode: payload.m,
        starred: false,
        code: encodeShare(payload),
      };
      let next = [entry, ...prev];
      // Cap: keep every starred entry plus the most recent unstarred, max ~20.
      const unstarred = next.filter((e) => !e.starred);
      if (next.length > 20 && unstarred.length > 0) {
        const toDrop = new Set(
          unstarred.slice(Math.max(0, 20 - next.length + unstarred.length)).map((e) => e.id),
        );
        next = next.filter((e) => e.starred || !toDrop.has(e.id) || e.id === entry.id);
        next = next.slice(0, 24);
      }
      persistHistory(next);
      return next;
    });
  }

  async function handleGenerate() {
    setLoading(true);
    handleStop();
    setSelectedIndex(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibe,
          key: controls.musicKey,
          mode: controls.mode,
          bars: controls.bars,
        }),
      });
      const data: { spec: ProgressionSpec; source: "ai" | "fallback"; reason?: string } =
        await res.json();

      setGenerated({
        progression: data.spec.progression,
        feel: data.spec.feel,
        notes: data.spec.notes,
        source: data.source,
        reason: data.reason,
      });
      // Adopt the generator's musical choices into the controls.
      setControls((c) => ({
        ...c,
        mode: data.spec.mode,
        tempo: data.spec.tempo,
        voicingStyle: data.spec.voicingStyle,
        arpeggio: data.spec.arpeggio,
      }));
      setFocusIndex(0);
      addToHistory({
        v: vibe,
        k: controls.musicKey,
        m: data.spec.mode,
        t: data.spec.tempo,
        b: controls.bars,
        vs: data.spec.voicingStyle,
        a: data.spec.arpeggio,
        r: controls.arpRate,
        y: controls.rhythm,
        c: controls.complexity,
        f: data.spec.feel,
        p: data.spec.progression,
        n: data.spec.notes,
      });
    } catch {
      // Network failure: local deterministic fallback so the app never dead-ends.
      const fb = deterministicFallback(controls.musicKey, controls.mode, vibe, controls.bars);
      setGenerated({
        progression: fb.progression,
        feel: fb.feel,
        notes: fb.notes,
        source: "fallback",
        reason: "network-error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function playFrom(startIndex: number, loopOverride?: boolean) {
    const player = playerRef.current;
    if (!player || realized.length === 0) return;
    setIsPlaying(true);
    await player.play(
      realized,
      spec,
      {
        onChordChange: (i) => {
          setPlayingIndex(i);
          setFocusIndex(i);
        },
        onStop: () => {
          setIsPlaying(false);
          setPlayingIndex(null);
        },
      },
      { loop: loopOverride ?? loop, startIndex },
    );
  }

  function handleStop() {
    playerRef.current?.stop();
    setIsPlaying(false);
    setPlayingIndex(null);
  }

  function handleToggleLoop() {
    const next = !loop;
    setLoop(next);
    // Keep the music going with the new setting, from the chord we're on.
    if (isPlaying) void playFrom(playingIndex ?? 0, next);
  }

  function handleInstrumentChange(name: InstrumentName) {
    setInstrument(name);
    playerRef.current?.setInstrument(name);
  }

  function auditionRoman(roman: string) {
    const chord = realizeProgression({
      ...spec,
      progression: [{ roman: applyComplexity(roman, controls.complexity), bars: 1 }],
    })[0];
    if (chord) void playerRef.current?.preview(chord);
  }

  function handleChordClick(index: number) {
    setFocusIndex(index);
    if (isPlaying) {
      // Jump playback to the clicked chord.
      void playFrom(index);
      return;
    }
    setSelectedIndex(index);
    void playerRef.current?.preview(realized[index]);
  }

  // ----- editor operations (all on the raw, pre-complexity progression) -----

  function editProgression(mutate: (prog: ChordSpec[]) => ChordSpec[]) {
    handleStop();
    setGenerated((g) => ({ ...g, progression: mutate([...g.progression]) }));
  }

  function handleReplace(roman: string) {
    if (selectedIndex === null) return;
    editProgression((prog) => {
      prog[selectedIndex] = { ...prog[selectedIndex], roman };
      return prog;
    });
    auditionRoman(roman);
  }

  function handleBars(bars: number) {
    if (selectedIndex === null) return;
    editProgression((prog) => {
      prog[selectedIndex] = { ...prog[selectedIndex], bars };
      return prog;
    });
  }

  function handleMove(direction: -1 | 1) {
    if (selectedIndex === null) return;
    const target = selectedIndex + direction;
    if (target < 0 || target >= generated.progression.length) return;
    editProgression((prog) => {
      [prog[selectedIndex], prog[target]] = [prog[target], prog[selectedIndex]];
      return prog;
    });
    setSelectedIndex(target);
    setFocusIndex(target);
  }

  function handleDuplicate() {
    if (selectedIndex === null || generated.progression.length >= 16) return;
    editProgression((prog) => {
      prog.splice(selectedIndex + 1, 0, { ...prog[selectedIndex] });
      return prog;
    });
  }

  function handleRemove() {
    if (selectedIndex === null || generated.progression.length <= 1) return;
    editProgression((prog) => {
      prog.splice(selectedIndex, 1);
      return prog;
    });
    setSelectedIndex(null);
    setFocusIndex(0);
  }

  // --------------------------------------------------------------------------

  function handleExport() {
    if (realized.length === 0) return;
    downloadMidi(realized, spec, { bass: includeBass });
  }

  async function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeShare(currentPayload())}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard can be unavailable (permissions/http) — the URL bar has it now.
    }
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  }

  function handleHistoryLoad(entry: HistoryEntry) {
    const data = decodeShare(entry.code);
    if (data) {
      handleStop();
      hydrateFromPayload(data, "history");
    }
  }

  function handleHistoryStar(id: string) {
    setHistory((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e));
      persistHistory(next);
      return next;
    });
  }

  function handleHistoryDelete(id: string) {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persistHistory(next);
      return next;
    });
  }

  const activeNotes = realized[focusIndex]?.midiNotes ?? realized[0]?.midiNotes ?? [];

  return (
    <main className="relative mx-auto max-w-5xl overflow-x-clip px-5 py-10 sm:py-14">
      {/* Tear filters: displacement maps that rip the edges of every .torn piece. */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <filter id="tear-1" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="10" />
          </filter>
          <filter id="tear-2" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.042" numOctaves="4" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="12" />
          </filter>
          <filter id="tear-3" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="27" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="8" />
          </filter>
        </defs>
      </svg>

      {/* Loose scraps of construction paper around the collage. */}
      <div
        aria-hidden="true"
        className="torn-2 fill-blue pointer-events-none absolute -left-16 top-24 -z-10 hidden h-24 w-52 -rotate-12 sm:block"
      />
      <div
        aria-hidden="true"
        className="torn fill-yellow pointer-events-none absolute -right-20 top-64 -z-10 hidden h-20 w-56 rotate-6 sm:block"
      />
      <div
        aria-hidden="true"
        className="torn-3 fill-red pointer-events-none absolute -left-12 bottom-40 -z-10 hidden h-16 w-44 rotate-3 sm:block"
      />
      <div
        aria-hidden="true"
        className="torn fill-orange pointer-events-none absolute -right-14 bottom-72 -z-10 hidden h-14 w-40 -rotate-6 sm:block"
      />

      <header className="mb-10 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          className="h-36 w-auto sm:h-44"
          draggable={false}
        />
        <h1 className="sr-only">Resonance</h1>
        <p className="mt-4 max-w-2xl text-sm text-ink-soft">
          Find the chords that resonate — vibe in, MIDI out. AI picks the creative intent; a
          music-theory engine turns it into guaranteed-correct, voice-led chords you can hear
          and export to any DAW.
        </p>
      </header>

      <section className="torn fill-card space-y-6 p-6 sm:p-8">
        <VibeInput value={vibe} onChange={setVibe} onGenerate={handleGenerate} loading={loading} />
        <Controls state={controls} onChange={patchControls} />
      </section>

      <section className="torn-2 fill-card mt-10 space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {generated.feel && (
            <span className="text-sm font-medium text-ink-soft">“{generated.feel}”</span>
          )}
          {generated.source === "fallback" &&
            !["initial", "shared", "history"].includes(generated.reason ?? "") && (
              <span className="text-xs text-wave-orange">
                {generated.reason === "no-api-key"
                  ? "No GROQ_API_KEY set — using the curated library."
                  : generated.reason === "rate-limited"
                    ? "Taking a breather — using the curated library for now."
                    : "Using the curated library."}
              </span>
            )}
        </div>

        <ProgressionView
          chords={realized}
          analyses={analyses}
          playingIndex={playingIndex}
          selectedIndex={selectedIndex}
          onChordClick={handleChordClick}
        />

        {selectedIndex !== null && realized[selectedIndex] && (
          <ChordEditor
            index={selectedIndex}
            chord={realized[selectedIndex]}
            suggestions={suggestions}
            canRemove={generated.progression.length > 1}
            onReplace={handleReplace}
            onBars={handleBars}
            onMove={handleMove}
            onDuplicate={handleDuplicate}
            onRemove={handleRemove}
            onClose={() => setSelectedIndex(null)}
          />
        )}

        {explanation && (
          <p className="text-xs text-ink-soft">
            <span className="font-bold uppercase tracking-wider text-ink-faint">
              Why it works —{" "}
            </span>
            {explanation}
          </p>
        )}
        {generated.notes && <p className="text-xs text-ink-faint">{generated.notes}</p>}

        <div className="torn-3 fill-paper p-4">
          <Keyboard activeNotes={activeNotes} />
        </div>

        <Transport
          isPlaying={isPlaying}
          tempo={controls.tempo}
          canPlay={realized.length > 0}
          loop={loop}
          instrument={instrument}
          shareCopied={shareCopied}
          includeBass={includeBass}
          onPlay={() => void playFrom(0)}
          onStop={handleStop}
          onToggleLoop={handleToggleLoop}
          onInstrumentChange={handleInstrumentChange}
          onExport={handleExport}
          onShare={() => void handleShare()}
          onToggleBass={() => setIncludeBass((b) => !b)}
        />
      </section>

      <HistoryStrip
        entries={history}
        onLoad={handleHistoryLoad}
        onStar={handleHistoryStar}
        onDelete={handleHistoryDelete}
      />

      <footer className="mt-10 text-center text-xs text-ink-faint">
        Resonance · Terra Echo Studios
      </footer>
    </main>
  );
}
