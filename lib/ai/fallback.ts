import { pickTemplate } from "@/lib/theory/progressions";
import type { Mode, ProgressionSpec } from "@/lib/theory/types";

/**
 * Deterministic fallback generator. Always returns a musically-valid spec by
 * choosing a curated template that matches the vibe — no AI required. Used when
 * GROQ_API_KEY is unset, the model is rate-limited (429), or validation fails.
 */
export function deterministicFallback(
  key: string,
  mode: Mode,
  vibe: string,
  bars = 8,
): ProgressionSpec {
  const template = pickTemplate(vibe, mode);

  // Repeat / trim the template to roughly fill the requested number of bars.
  const romans: string[] = [];
  let i = 0;
  while (romans.length < bars && romans.length < 16) {
    romans.push(template.romans[i % template.romans.length]);
    i++;
  }

  return {
    key,
    // Honor the template's mode (it carries the right diatonic flavor).
    mode: template.mode,
    tempo: template.tempo,
    feel: vibe.trim() || template.tags[0],
    voicingStyle: template.voicingStyle,
    arpeggio: template.arpeggio,
    progression: romans.map((roman) => ({ roman, bars: 1 })),
    notes: `${template.notes} (offline fallback — set GROQ_API_KEY for AI generation)`,
  };
}
