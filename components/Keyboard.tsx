"use client";

import { useMemo } from "react";
import { pitchClassOf } from "@/lib/theory/scales";

interface KeyboardProps {
  activeNotes: number[];
  low?: number;
  high?: number;
}

const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);

/** A small SVG piano that highlights the active chord's notes. */
export function Keyboard({ activeNotes, low = 36, high = 84 }: KeyboardProps) {
  const active = useMemo(() => new Set(activeNotes), [activeNotes]);

  const { whites, blacks, width, height } = useMemo(() => {
    const whiteWidth = 20;
    const whiteHeight = 96;
    const blackWidth = 12;
    const blackHeight = 60;

    const whiteMidis: number[] = [];
    for (let m = low; m <= high; m++) {
      if (WHITE_PCS.has(pitchClassOf(m))) whiteMidis.push(m);
    }
    const whiteIndex = new Map<number, number>();
    whiteMidis.forEach((m, i) => whiteIndex.set(m, i));

    const whites = whiteMidis.map((m, i) => ({
      midi: m,
      x: i * whiteWidth,
      w: whiteWidth,
      h: whiteHeight,
      on: active.has(m),
    }));

    const blacks: { midi: number; x: number; w: number; h: number; on: boolean }[] = [];
    for (let m = low; m <= high; m++) {
      if (!WHITE_PCS.has(pitchClassOf(m))) {
        const belowIdx = whiteIndex.get(m - 1);
        if (belowIdx === undefined) continue;
        blacks.push({
          midi: m,
          x: (belowIdx + 1) * whiteWidth - blackWidth / 2,
          w: blackWidth,
          h: blackHeight,
          on: active.has(m),
        });
      }
    }

    return {
      whites,
      blacks,
      width: whiteMidis.length * whiteWidth,
      height: whiteHeight,
    };
  }, [low, high, active]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-24 w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Piano showing the active chord"
    >
      {whites.map((k) => (
        <rect
          key={k.midi}
          x={k.x + 0.5}
          y={0}
          width={k.w - 1}
          height={k.h}
          rx={2}
          className={k.on ? "fill-wave-blue" : "fill-white"}
          stroke="#D8D2C6"
          strokeWidth={1}
        />
      ))}
      {blacks.map((k) => (
        <rect
          key={k.midi}
          x={k.x}
          y={0}
          width={k.w}
          height={k.h}
          rx={1.5}
          className={k.on ? "fill-wave-orange" : "fill-ink-strong"}
          stroke="#152C43"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
