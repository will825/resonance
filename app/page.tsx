"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controls, type ControlsState } from "@/components/Controls";
import { Keyboard } from "@/components/Keyboard";
import { ProgressionView } from "@/components/ProgressionView";
import { Transport } from "@/components/Transport";
import { VibeInput } from "@/components/VibeInput";
import { deterministicFallback } from "@/lib/ai/fallback";
import { ChordPlayer } from "@/lib/audio/player";
import { downloadMidi } from "@/lib/audio/exportMidi";
import { realizeProgression } from "@/lib/theory/realize";
import type { ChordSpec, ProgressionSpec } from "@/lib/theory/types";

interface Generated {
  progression: ChordSpec[];
  feel: string;
  notes?: string;
  source: "ai" | "fallback";
  reason?: string;
}

const SEED = deterministicFallback("C", "major", "uplifting pop anthem", 8);

export default function Home() {
  const [vibe, setVibe] = useState("dreamy lofi turnaround");
  const [controls, setControls] = useState<ControlsState>({
    musicKey: SEED.key,
    mode: SEED.mode,
    tempo: SEED.tempo,
    bars: 8,
    voicingStyle: SEED.voicingStyle,
    arpeggio: SEED.arpeggio,
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

  const playerRef = useRef<ChordPlayer | null>(null);

  useEffect(() => {
    playerRef.current = new ChordPlayer();
    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  const spec: ProgressionSpec = useMemo(
    () => ({
      key: controls.musicKey,
      mode: controls.mode,
      tempo: controls.tempo,
      feel: generated.feel,
      voicingStyle: controls.voicingStyle,
      arpeggio: controls.arpeggio,
      progression: generated.progression,
      notes: generated.notes,
    }),
    [controls, generated],
  );

  const realized = useMemo(() => realizeProgression(spec), [spec]);

  // Editing controls re-realizes locally; stop playback to avoid stale schedules.
  function patchControls(patch: Partial<ControlsState>) {
    setControls((c) => ({ ...c, ...patch }));
    handleStop();
  }

  async function handleGenerate() {
    setLoading(true);
    handleStop();
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

  async function handlePlay() {
    const player = playerRef.current;
    if (!player || realized.length === 0) return;
    setIsPlaying(true);
    await player.play(realized, spec, {
      onChordChange: (i) => {
        setPlayingIndex(i);
        setFocusIndex(i);
      },
      onStop: () => {
        setIsPlaying(false);
        setPlayingIndex(null);
      },
    });
  }

  function handleStop() {
    playerRef.current?.stop();
    setIsPlaying(false);
    setPlayingIndex(null);
  }

  function handleChordClick(index: number) {
    setFocusIndex(index);
    void playerRef.current?.preview(realized[index]);
  }

  function handleExport() {
    if (realized.length === 0) return;
    downloadMidi(realized, spec);
  }

  const activeNotes = realized[focusIndex]?.midiNotes ?? realized[0]?.midiNotes ?? [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-accent">◆</span> Resonance
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Find the chords that resonate — vibe in, MIDI out. AI picks the creative intent; a
          deterministic theory engine turns it into guaranteed-correct, voice-led chords you can
          hear and export to any DAW.
        </p>
      </header>

      <section className="space-y-6 rounded-2xl border border-ink-700 bg-ink-800/50 p-5 sm:p-7">
        <VibeInput value={vibe} onChange={setVibe} onGenerate={handleGenerate} loading={loading} />
        <Controls state={controls} onChange={patchControls} />
      </section>

      <section className="mt-6 space-y-4 rounded-2xl border border-ink-700 bg-ink-800/50 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {generated.feel && (
            <span className="text-sm text-slate-400">“{generated.feel}”</span>
          )}
          {generated.source === "fallback" && generated.reason !== "initial" && (
            <span className="text-xs text-amber-300/80">
              {generated.reason === "no-api-key"
                ? "No GROQ_API_KEY set — using the curated library."
                : generated.reason === "rate-limited"
                  ? "Groq rate-limited (429) — using the curated library."
                  : "Using the curated library."}
            </span>
          )}
        </div>

        <ProgressionView
          chords={realized}
          playingIndex={playingIndex}
          onChordClick={handleChordClick}
        />

        {generated.notes && <p className="text-xs text-slate-500">{generated.notes}</p>}

        <div className="rounded-xl border border-ink-700 bg-ink-900/40 p-3">
          <Keyboard activeNotes={activeNotes} />
        </div>

        <Transport
          isPlaying={isPlaying}
          tempo={controls.tempo}
          canPlay={realized.length > 0}
          onPlay={handlePlay}
          onStop={handleStop}
          onExport={handleExport}
        />
      </section>
    </main>
  );
}
