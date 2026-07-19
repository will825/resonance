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

const INITIAL_VIBE = "dreamy lofi turnaround";
const SEED = deterministicFallback("C", "major", INITIAL_VIBE, 8);

export default function Home() {
  const [vibe, setVibe] = useState(INITIAL_VIBE);
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
          {generated.source === "fallback" && generated.reason !== "initial" && (
            <span className="text-xs text-wave-orange">
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

        {generated.notes && <p className="text-xs text-ink-faint">{generated.notes}</p>}

        <div className="torn-3 fill-paper p-4">
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

      <footer className="mt-10 text-center text-xs text-ink-faint">
        Resonance · Terra Echo Studios
      </footer>
    </main>
  );
}
