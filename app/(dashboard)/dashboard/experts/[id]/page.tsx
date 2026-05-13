import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, MapPin, Star, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/experts/booking-form";
import { type ExpertCardData } from "@/components/experts/expert-card";

interface Props {
  params: Promise<{ id: string }>;
}

// Seed data matching the expert directory seeds.
// NOTE: Thabiso himself is a REAL DB expert (see migration
// supabase-migration-thabiso-as-expert.sql) — the founder is
// no longer a seed. Seeds below are demo/marketing cards for
// the other specialists until real experts onboard via
// /become-expert.
const SEED_EXPERTS: Record<
  string,
  Omit<ExpertCardData, "session_types"> & {
    long_bio?: string;
    highlights?: string[];
    session_types?: { id: string; duration_minutes: number; price: number; currency: string }[];
  }
> = {
  "seed-1": { id: "seed-1", name: "Advocate Thabo Nkosi", bio: "15 years in music law across South Africa, Nigeria and the UK.", long_bio: "Advocate Thabo Nkosi has represented artists, managers, labels, and publishers across sub-Saharan Africa and internationally. He has negotiated major label deals, publishing agreements, and has resolved complex royalty disputes for some of Africa's biggest names. A trusted advisor to the industry.", specialty: "Music Law & Contracts", country: "South Africa", avatar_url: null, is_verified: true, highlights: ["15+ years in entertainment law", "Negotiated 200+ record deals", "Expert in SAMRO & CAPASSO disputes", "International deal experience (UK, US, Nigeria)"], session_types: [{ id: "s1-30", duration_minutes: 30, price: 800, currency: "ZAR" }, { id: "s1-60", duration_minutes: 60, price: 1400, currency: "ZAR" }, { id: "s1-120", duration_minutes: 120, price: 2500, currency: "ZAR" }] },
  "seed-3": { id: "seed-3", name: "Zanele Mokoena", bio: "Digital marketing director specialising in music release campaigns.", long_bio: "Zanele Mokoena has driven over 500M streams for African artists through strategic digital marketing. She specialises in full-cycle release campaigns — from pre-save strategies to playlist pitching to post-release DSP optimisation.", specialty: "Digital Marketing", country: "South Africa", avatar_url: null, is_verified: true, highlights: ["500M+ streams driven", "Expert in Spotify & Apple Music strategy", "Boomplay & African platform specialist", "TikTok & social campaign experience"], session_types: [{ id: "s3-45", duration_minutes: 45, price: 700, currency: "ZAR" }, { id: "s3-60", duration_minutes: 60, price: 1200, currency: "ZAR" }] },
};

export default async function ExpertPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Local shape — includes id on each session, which the booking form
  // needs but the shared ExpertCardData type omits (it's directory-focused).
  type PageExpert = Omit<ExpertCardData, "session_types"> & {
    long_bio?: string;
    highlights?: string[];
    session_types?: { id: string; duration_minutes: number; price: number; currency: string }[];
  };
  let expert: PageExpert | null = null;
  // Booking is only truly live if the expert has a Paystack subaccount.
  // Seed cards are marketing placeholders — they don't have DB rows and
  // therefore can't be booked (bookings/create would 503 anyway).
  let acceptsBookings = false;

  if (id.startsWith("seed-")) {
    expert = SEED_EXPERTS[id] || null;
    // Seeds cannot receive payouts — leave acceptsBookings=false so the
    // right-hand panel shows the friendly "not accepting bookings" state
    // instead of surfacing a button that would fail at checkout.
  } else {
    const { data } = await supabase
      .from("experts")
      .select(`*, expert_sessions(id, duration_minutes, price, currency)`)
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (data) {
      expert = { ...data, session_types: data.expert_sessions };
      // DEMO MODE — accept bookings as long as the expert has session types.
      // bookings/create already skips Paystack init when subaccount_code is
      // null, so the booking lands as a free reservation and the Daily.co
      // room still provisions. ACTIVATE: tighten back to !!paystack_subaccount_code
      // before public launch / paid bookings go live.
      acceptsBookings = (data.expert_sessions?.length ?? 0) > 0;
    }
  }

  if (!expert) notFound();

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/experts"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15} />
        Back to Experts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — expert profile */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="glass-card rounded-2xl p-7">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                {expert.avatar_url ? (
                  <Image src={expert.avatar_url} alt={expert.name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                ) : "👤"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-black text-text-primary">{expert.name}</h1>
                  {expert.is_verified && (
                    <div className="flex items-center gap-1 bg-brand/10 border border-brand/20 rounded-full px-2 py-0.5">
                      <Star size={10} className="text-brand fill-brand" />
                      <span className="text-xs font-semibold text-brand">Verified</span>
                    </div>
                  )}
                </div>
                {expert.specialty && (
                  <p className="text-brand font-semibold mb-2">{expert.specialty}</p>
                )}
                {expert.country && (
                  <div className="flex items-center gap-1.5 text-sm text-text-muted">
                    <MapPin size={13} />
                    {expert.country}
                  </div>
                )}
              </div>
            </div>

            {(expert.long_bio || expert.bio) && (
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-text-muted text-sm leading-relaxed">
                  {expert.long_bio || expert.bio}
                </p>
              </div>
            )}
          </div>

          {/* Highlights */}
          {expert.highlights && expert.highlights.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4">
                Expertise
              </h3>
              <div className="space-y-2.5">
                {expert.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-brand flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-muted">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — booking form */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 sticky top-6">
            <h2 className="text-lg font-black text-text-primary mb-1">
              Book a Session
            </h2>
            <p className="text-xs text-text-muted mb-6">
              with {expert.name.split(" ")[0]}
            </p>

            {!acceptsBookings ? (
              // Expert hasn't connected a payout account yet (or is a seed
              // card). We still show the prices so bookers can gauge them,
              // but the CTA is replaced by a friendly "coming soon" panel.
              <div>
                {expert.session_types && expert.session_types.length > 0 && (
                  <div className="space-y-2 mb-5">
                    {expert.session_types.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between bg-surface-2 border border-border rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                          <Clock size={13} />
                          {s.duration_minutes} min
                        </div>
                        <div className="text-sm font-bold text-text-primary">
                          {s.currency} {s.price.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    Not accepting bookings yet
                  </p>
                  <p className="text-xs text-text-muted">
                    {expert.name.split(" ")[0]} is finishing their setup. Check back soon.
                  </p>
                </div>
              </div>
            ) : expert.session_types && expert.session_types.length > 0 ? (
              <BookingForm
                expertId={expert.id}
                expertName={expert.name}
                sessionTypes={expert.session_types}
              />
            ) : (
              <p className="text-text-muted text-sm text-center py-8">
                No sessions currently available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
