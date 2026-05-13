import { createClient } from "@/lib/supabase/server";
import { ExpertCard, type ExpertCardData } from "@/components/experts/expert-card";
import { Search } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

// Demo seed cards for specialties that don't yet have a real
// onboarded expert. Thabiso (founder) is deliberately NOT here
// — he's a real DB expert row, seeded by
// supabase-migration-thabiso-as-expert.sql. That makes him
// bookable end-to-end and places him first in the directory
// (real experts are merged before seeds in the render).
const SEED_EXPERTS: ExpertCardData[] = [
  { id: "seed-1", name: "Advocate Thabo Nkosi", bio: "15 years in music law across South Africa, Nigeria and the UK. Specialises in recording contracts, publishing deals, and dispute resolution.", specialty: "Music Law & Contracts", country: "South Africa", avatar_url: null, is_verified: true, session_types: [{ id: "s1-30", duration_minutes: 30, price: 800, currency: "ZAR" }, { id: "s1-60", duration_minutes: 60, price: 1400, currency: "ZAR" }, { id: "s1-120", duration_minutes: 120, price: 2500, currency: "ZAR" }] },
  { id: "seed-3", name: "Zanele Mokoena", bio: "Digital marketing director specialising in music release campaigns. Has driven millions of streams for African artists on global platforms.", specialty: "Digital Marketing", country: "South Africa", avatar_url: null, is_verified: true, session_types: [{ id: "s3-45", duration_minutes: 45, price: 700, currency: "ZAR" }, { id: "s3-60", duration_minutes: 60, price: 1200, currency: "ZAR" }] },
  { id: "seed-4", name: "Chidi Eze", bio: "Label manager and A&R consultant who has signed and developed artists across Nigeria, UK, and the US market.", specialty: "A&R & Label Operations", country: "Nigeria", avatar_url: null, is_verified: true, session_types: [{ id: "s4-30", duration_minutes: 30, price: 500, currency: "ZAR" }, { id: "s4-60", duration_minutes: 60, price: 900, currency: "ZAR" }, { id: "s4-120", duration_minutes: 120, price: 1600, currency: "ZAR" }] },
  { id: "seed-5", name: "Fatima Al-Hassan", bio: "Royalties and publishing expert. Has helped over 200 African artists register and collect from SAMRO, CAPASSO, PRS, and ASCAP.", specialty: "Royalties & Publishing", country: "Kenya", avatar_url: null, is_verified: true, session_types: [{ id: "s5-30", duration_minutes: 30, price: 650, currency: "ZAR" }, { id: "s5-60", duration_minutes: 60, price: 1150, currency: "ZAR" }] },
  { id: "seed-6", name: "Marcus DuPlessis", bio: "Radio promoter with relationships at over 80 stations across Africa. Specialises in commercial radio strategy and playlist placement.", specialty: "Radio Promotion", country: "South Africa", avatar_url: null, is_verified: false, session_types: [{ id: "s6-45", duration_minutes: 45, price: 750, currency: "ZAR" }, { id: "s6-60", duration_minutes: 60, price: 1300, currency: "ZAR" }, { id: "s6-120", duration_minutes: 120, price: 2200, currency: "ZAR" }] },
];

export default async function ExpertsPage() {
  const supabase = await createClient();
  const t = await getServerT(supabase);

  // Pull real experts from the DB, excluding dev-only `[TEST] ...` rows
  // created by /api/dev/create-test-booking. Those are meeting-flow
  // scaffolding, not real experts, and don't belong in the public
  // directory.
  const { data: expertsData } = await supabase
    .from("experts")
    .select(`*, expert_sessions(duration_minutes, price, currency)`)
    .eq("is_active", true)
    .not("name", "ilike", "[TEST]%")
    .order("is_verified", { ascending: false });

  // Always show the founder/seed cards (Tom-from-MySpace: the founder
  // is the first face on the directory). Real DB experts — when they
  // onboard via /become-expert — render alongside the seeds. Seed IDs
  // are prefixed `seed-` so they never collide with DB UUIDs.
  const realExperts: ExpertCardData[] =
    expertsData?.map((e) => ({ ...e, session_types: e.expert_sessions })) ?? [];

  const experts: ExpertCardData[] = [...realExperts, ...SEED_EXPERTS];

  const HOW_IT_WORKS = [
    { step: "01", title: t("experts.step1Title"), desc: t("experts.step1Desc") },
    { step: "02", title: t("experts.step2Title"), desc: t("experts.step2Desc") },
    { step: "03", title: t("experts.step3Title"), desc: t("experts.step3Desc") },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-text-primary">{t("nav.bookExpert")}</h1>
        <p className="text-text-muted mt-2">{t("experts.subtitle")}</p>
      </div>

      {/* Search bar (UI only — search logic can be wired in v2) */}
      <div className="relative mb-8 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder={t("experts.searchPlaceholder")}
          className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand/50 transition-colors"
        />
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {HOW_IT_WORKS.map(({ step, title, desc }) => (
          <div key={step} className="glass-card rounded-xl p-5">
            <p className="text-xs font-black text-brand mb-2">{step}</p>
            <p className="font-bold text-text-primary text-sm mb-1">{title}</p>
            <p className="text-xs text-text-muted">{desc}</p>
          </div>
        ))}
      </div>

      {/* Expert grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>

      {/* Become an expert CTA */}
      <div className="mt-12 glass-card rounded-2xl p-8 text-center border-brand/10">
        <h3 className="text-lg font-black text-text-primary mb-2">
          {t("experts.becomeExpert")}
        </h3>
        <p className="text-text-muted text-sm mb-5 max-w-md mx-auto">
          {t("experts.becomeExpertDesc")}
        </p>
        <a
          href="/become-expert"
          className="inline-flex items-center gap-2 bg-gold-gradient text-background font-bold text-sm px-6 py-3 rounded-lg hover:brightness-110 transition-all"
        >
          {t("experts.applyExpert")}
        </a>
      </div>
    </div>
  );
}
