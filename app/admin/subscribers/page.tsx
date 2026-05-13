import { createClient } from "@/lib/supabase/server";
import { CreditCard, Users } from "lucide-react";

export default async function AdminSubscribersPage() {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, profiles(full_name, country, phone)")
    .order("created_at", { ascending: false });

  // ── Plan parsing helpers ────────────────────────────────────
  // Legacy plans: "monthly" | "annual" → treated as pro_monthly / pro_annual
  // New plans: "{tierId}_{billing}" e.g. "agency_annual"
  const TIER_MONTHLY: Record<string, number> = {
    pro: 599, agency: 1299, enterprise: 4999,
  };
  const TIER_ANNUAL: Record<string, number> = {
    pro: 5990, agency: 12990, enterprise: 49990,
  };

  function parsePlan(plan: string): { tierId: string; billing: "monthly" | "annual" } {
    if (plan === "monthly") return { tierId: "pro", billing: "monthly" };
    if (plan === "annual")  return { tierId: "pro", billing: "annual" };
    const idx = plan.lastIndexOf("_");
    const tierId  = idx > 0 ? plan.slice(0, idx) : "pro";
    const billing = plan.slice(idx + 1) === "annual" ? "annual" : "monthly";
    return { tierId, billing };
  }

  const activeSubs = subscriptions?.filter((s) => s.status === "active") ?? [];
  const active  = activeSubs.length;
  const monthly = activeSubs.filter((s) => parsePlan(s.plan).billing === "monthly").length;
  const annual  = activeSubs.filter((s) => parsePlan(s.plan).billing === "annual").length;

  // MRR = sum of monthly price for each active subscription
  const mrr = activeSubs.reduce((sum, s) => {
    const { tierId, billing } = parsePlan(s.plan);
    const contrib =
      billing === "monthly"
        ? (TIER_MONTHLY[tierId] ?? 599)
        : Math.round((TIER_ANNUAL[tierId] ?? 5990) / 12);
    return sum + contrib;
  }, 0);

  // Tier breakdown counts
  const tierCounts = activeSubs.reduce<Record<string, number>>((acc, s) => {
    const { tierId } = parsePlan(s.plan);
    acc[tierId] = (acc[tierId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary">Subscribers</h1>
        <p className="text-text-muted mt-1">All subscription data across the platform.</p>
      </div>

      {/* MRR stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Active Subscribers", value: active, icon: Users, color: "#C9A84C" },
          { label: "Monthly Billing", value: monthly, icon: CreditCard, color: "#8B5CF6" },
          { label: "Annual Billing", value: annual, icon: CreditCard, color: "#10B981" },
          { label: "Est. MRR", value: `R${mrr.toLocaleString()}`, icon: CreditCard, color: "#F59E0B" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${color}20` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tier breakdown */}
      {active > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {(["pro", "agency", "enterprise"] as const).map((tier) => {
            const count = tierCounts[tier] ?? 0;
            const colors: Record<string, string> = { pro: "#C9A84C", agency: "#8B5CF6", enterprise: "#10B981" };
            return (
              <div key={tier} className="glass-card rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[tier] }} />
                <span className="text-xs font-bold text-text-primary capitalize">{tier}</span>
                <span className="text-xs text-text-muted">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {!subscriptions || subscriptions.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-text-muted text-sm">
          No subscribers yet.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Member", "Plan", "Status", "Country", "Joined"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-text-primary">
                        {(sub.profiles as Record<string, unknown>)?.full_name as string || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      {(() => {
                        const { tierId, billing } = parsePlan(sub.plan);
                        const tierLabel = tierId.charAt(0).toUpperCase() + tierId.slice(1);
                        const billingLabel = billing.charAt(0).toUpperCase() + billing.slice(1);
                        return (
                          <span className="text-text-muted">
                            <span className="font-semibold text-text-primary">{tierLabel}</span>
                            {" · "}{billingLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                        sub.status === "active" ? "text-success bg-success/10" :
                        sub.status === "cancelled" ? "text-error bg-error/10" :
                        "text-text-muted bg-surface-2"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-text-muted">
                      {(sub.profiles as Record<string, unknown>)?.country as string || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-text-muted text-xs">
                      {sub.created_at ? new Date(sub.created_at).toLocaleDateString("en-ZA") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
