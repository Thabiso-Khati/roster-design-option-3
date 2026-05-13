"use client";
import { useLocale } from "@/context/locale-context";
import { ResourcePage } from "@/components/library/module-shell";
import {
  TAX_CALENDAR_BY_COUNTRY,
  TAX_AUTHORITY_BY_COUNTRY,
  DEFAULT_TAX_COUNTRY,
  COVERED_COUNTRIES,
} from "@/lib/tax-calendar-data";

const COLOR = "#EC4899";

export default function TaxCalendarPage() {
  const { country } = useLocale();
  const isCovered = !!TAX_CALENDAR_BY_COUNTRY[country];
  const displayCountry = isCovered ? country : DEFAULT_TAX_COUNTRY;
  const list = TAX_CALENDAR_BY_COUNTRY[displayCountry];
  const taxAuthority = TAX_AUTHORITY_BY_COUNTRY[displayCountry] ?? "the local tax authority";

  return (
    <ResourcePage
      parentHref="/dashboard/library/money"
      parentLabel="Back to Finance and Tax"
      color={COLOR}
      tag={`Finance · Tax Calendar (${displayCountry})`}
      title={`${displayCountry} Tax Calendar`}
      intro={`Country-specific tax obligations across the music business — ${taxAuthority}. Use the locale switcher in the top bar to flip jurisdictions. Currently shipping all 15 IFPI key African markets: ${COVERED_COUNTRIES.join(", ")}.`}
      next={{ href: "/dashboard/library/money/grant-funding", label: "Grant & Funding Guide" }}
    >
      {!isCovered && (
        <div
          className="glass-card rounded-2xl p-5 mb-4 flex items-start gap-3"
          style={{ borderColor: "rgba(236,72,153,0.30)", backgroundColor: "rgba(236,72,153,0.06)" }}
        >
          <span className="text-base flex-shrink-0">ℹ️</span>
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-text-primary">No localised calendar for {country} yet.</span> Showing
            South Africa as a reference template. We currently ship full coverage for {COVERED_COUNTRIES.length} African
            markets — switch country in Settings → Locale to see your jurisdiction, or use this as a starting framework
            and verify each obligation with your local revenue authority.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {list.map((it, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
              <p className="font-bold text-sm text-text-primary">{it.obligation}</p>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded"
                style={{ color: COLOR, backgroundColor: `${COLOR}15` }}
              >
                {it.date}
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mb-1">
              <span className="font-semibold text-text-primary">Who:</span> {it.who}
            </p>
            <p className="text-xs text-text-muted leading-relaxed">{it.note}</p>
          </div>
        ))}
      </div>

      <div
        className="glass-card rounded-2xl p-5 mt-6 flex items-start gap-3"
        style={{ borderColor: "rgba(236,72,153,0.20)", backgroundColor: "rgba(236,72,153,0.04)" }}
      >
        <span className="text-base flex-shrink-0">⚠️</span>
        <p className="text-xs text-text-muted leading-relaxed">
          Tax dates and rules change. This calendar is for planning only, not tax advice. Always confirm with the local
          revenue authority ({taxAuthority}), your bookkeeper, or a qualified accountant licensed in {displayCountry}{" "}
          before filing.
        </p>
      </div>
    </ResourcePage>
  );
}
