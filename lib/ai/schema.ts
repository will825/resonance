import { z } from "zod";

export const MODES = [
  "major",
  "minor",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
  "harmonicMinor",
  "melodicMinor",
] as const;

export const chordSpecSchema = z.object({
  roman: z.string().min(1).max(12),
  bars: z.number().int().min(1).max(8),
});

export const progressionSpecSchema = z.object({
  key: z.string().min(1).max(3),
  mode: z.enum(MODES),
  tempo: z.number().int().min(40).max(220),
  feel: z.string().min(1).max(200),
  voicingStyle: z.enum(["close", "open", "drop2"]),
  arpeggio: z.enum(["none", "up", "down", "updown"]),
  progression: z.array(chordSpecSchema).min(2).max(16),
  notes: z.string().max(500).optional(),
});

export type ProgressionSpecInput = z.infer<typeof progressionSpecSchema>;

/** Request body for the /api/generate route. */
export const generateRequestSchema = z.object({
  vibe: z.string().min(1).max(300),
  key: z.string().min(1).max(3),
  mode: z.enum(MODES),
  bars: z.number().int().min(4).max(8).optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
