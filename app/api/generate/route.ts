import { NextResponse } from "next/server";
import { deterministicFallback } from "@/lib/ai/fallback";
import { generateSpec, MissingKeyError, RateLimitError } from "@/lib/ai/groq";
import { generateRequestSchema } from "@/lib/ai/schema";
import type { ProgressionSpec } from "@/lib/theory/types";

export const runtime = "nodejs";

interface GenerateResponse {
  spec: ProgressionSpec;
  source: "ai" | "fallback";
  reason?: string;
}

/**
 * Basic per-IP rate limiting so public traffic can't drain the Groq quota.
 * In-memory, so it's per-serverless-instance — coarse but effective as a
 * first line of defense. Over the limit, users get the curated library.
 */
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT = 20; // AI generations per IP per window
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [key, rec] of hits) {
      if (now > rec.resetAt) hits.delete(key);
    }
  }
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  rec.count++;
  return rec.count > RATE_LIMIT;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

export async function POST(request: Request): Promise<NextResponse<GenerateResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    // Even on a bad request, hand back something usable rather than 4xx-ing the
    // producer mid-flow. Use sane defaults.
    const spec = deterministicFallback("C", "major", "uplifting pop", 8);
    return NextResponse.json({ spec, source: "fallback", reason: "invalid-request" });
  }

  const { vibe, key, mode, bars = 8 } = parsed.data;

  if (isRateLimited(clientIp(request))) {
    const spec = deterministicFallback(key, mode, vibe, bars);
    return NextResponse.json({ spec, source: "fallback", reason: "rate-limited" });
  }

  try {
    const spec = await generateSpec({ vibe, key, mode, bars });
    return NextResponse.json({ spec, source: "ai" });
  } catch (err) {
    let reason = "error";
    if (err instanceof RateLimitError) reason = "rate-limited";
    else if (err instanceof MissingKeyError) reason = "no-api-key";

    // Always return a usable progression (status 200).
    const spec = deterministicFallback(key, mode, vibe, bars);
    return NextResponse.json({ spec, source: "fallback", reason });
  }
}
