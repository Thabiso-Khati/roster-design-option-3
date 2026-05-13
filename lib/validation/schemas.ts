/**
 * lib/validation/schemas.ts
 *
 * Central Zod schemas for all API route request bodies.
 * Import the schema in the route, call .safeParse(), and return 400 on failure.
 * The error formatter below produces consistent { error, fields } responses.
 */

import { z } from "zod";
import type { ZodError } from "zod";

// ── Error formatter ───────────────────────────────────────────────────────────

export function formatZodError(err: ZodError): { error: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "root";
    fields[key] = issue.message;
  }
  const first = err.issues[0];
  const fieldName = first?.path.join(".") || "input";
  return {
    error: `Validation failed: ${fieldName} — ${first?.message ?? "invalid"}`,
    fields,
  };
}

// ── Paystack: initialize subscription ────────────────────────────────────────

export const InitSubscriptionSchema = z.object({
  name:    z.string().trim().min(1, "Name is required").max(120),
  tierId:  z.enum(["pro", "agency", "enterprise", "enterprise_max"], {
    errorMap: () => ({ message: "tierId must be one of: pro, agency, enterprise, enterprise_max" }),
  }),
  billing: z.enum(["monthly", "annual"], {
    errorMap: () => ({ message: "billing must be 'monthly' or 'annual'" }),
  }),
});

export type InitSubscriptionInput = z.infer<typeof InitSubscriptionSchema>;

// ── Bookings: create booking ──────────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  expertId:        z.string().uuid("expertId must be a valid UUID"),
  sessionId:       z.string().uuid("sessionId must be a valid UUID"),
  durationMinutes: z.number().int().min(15, "Minimum duration is 15 minutes").max(480),
  amount:          z.number().int().positive("Amount must be a positive integer (cents)"),
  currency:        z.string().length(3, "Currency must be a 3-letter ISO code").default("ZAR"),
  scheduledAt:     z.string().datetime({ message: "scheduledAt must be a valid ISO 8601 datetime" }),
  notes:           z.string().max(1000).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// ── Artists: add artist ───────────────────────────────────────────────────────

export const AddArtistSchema = z.object({
  spotifyUrl:              z.string().url().optional().or(z.literal("")),
  country:                 z.string().max(100).optional(),
  countries:               z.array(z.string().max(100)).max(10).optional(),
  manualName:              z.string().trim().max(120).optional(),
  manualGenre:             z.string().trim().max(80).optional(),
  manualFollowers:         z.number().int().nonnegative().optional(),
  manualMonthlyListeners:  z.number().int().nonnegative().optional(),
}).refine(
  (d) => (d.spotifyUrl && d.spotifyUrl.length > 0) || (d.manualName && d.manualName.length > 0),
  { message: "Either a Spotify URL or a manual artist name is required" }
);

export type AddArtistInput = z.infer<typeof AddArtistSchema>;

// ── Expert booking: create expert application ─────────────────────────────────

export const ExpertApplicationSchema = z.object({
  name:          z.string().trim().min(1).max(120),
  bio:           z.string().trim().min(20, "Bio must be at least 20 characters").max(2000),
  specialty:     z.string().trim().min(1).max(120),
  hourlyRate:    z.number().int().positive("Hourly rate must be a positive number"),
  currency:      z.string().length(3).default("ZAR"),
  linkedinUrl:   z.string().url("LinkedIn URL must be valid").optional().or(z.literal("")),
  websiteUrl:    z.string().url("Website URL must be valid").optional().or(z.literal("")),
});

export type ExpertApplicationInput = z.infer<typeof ExpertApplicationSchema>;
