export const dynamic = 'force-dynamic';

// ============================================================
// ROSTER — /api/calendar/booking-link
// ------------------------------------------------------------
// GET   — fetch the authenticated user's booking link config
// POST  — create or update (upsert) the booking link config
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const runtime = "nodejs";

const AvailabilityWindowSchema = z.object({
  day:  z.number().int().min(0).max(6),   // 0 = Sun, 6 = Sat
  from: z.string().regex(/^\d{2}:\d{2}$/),
  to:   z.string().regex(/^\d{2}:\d{2}$/),
});

const BookingLinkSchema = z.object({
  slug:           z.string()
                    .toLowerCase()
                    .min(4)
                    .max(50)
                    .regex(/^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/, {
                      message: "Slug must be 4–50 lowercase letters, numbers, or hyphens",
                    }),
  display_name:   z.string().trim().min(1).max(120),
  bio:            z.string().max(500).optional(),
  availability:   z.array(AvailabilityWindowSchema).max(14),
  buffer_minutes: z.number().int().min(0).max(120).default(15),
  notice_hours:   z.number().int().min(0).max(168).default(24),
  durations:      z.array(z.number().int().positive()).min(1).max(6),
  rate_cents:     z.number().int().min(0).default(0),
  currency:       z.string().length(3).default("ZAR"),
  active:         z.boolean().default(true),
});

// ── GET ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { data, error } = await supabase
      .from("calendar_booking_link")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      logger.error("[booking-link GET] query failed", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookingLink: data ?? null });
  } catch (err) {
    logger.error("[booking-link GET] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST — upsert ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const parsed = BookingLinkSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: `${first.path.join(".")} — ${first.message}` },
        { status: 422 }
      );
    }

    // Check slug is not taken by another user
    const { data: existing } = await supabase
      .from("calendar_booking_link")
      .select("user_id")
      .eq("slug", parsed.data.slug)
      .maybeSingle();

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "That slug is already taken — try a different one." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("calendar_booking_link")
      .upsert(
        { ...parsed.data, user_id: user.id },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      logger.error("[booking-link POST] upsert failed", {}, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    logger.info("[booking-link POST] saved", { userId: user.id, slug: parsed.data.slug });

    return NextResponse.json({
      bookingLink:  data,
      publicUrl:    `${appUrl}/book/${parsed.data.slug}`,
    });
  } catch (err) {
    logger.error("[booking-link POST] unexpected error", {}, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
