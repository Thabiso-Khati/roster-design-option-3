import { createClient } from "@/lib/supabase/server";
import { Users, Video, CreditCard, DollarSign } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: subscriberCount },
    { count: masterclassCount },
    { count: expertCount },
    { count: bookingCount },
    { data: recentSubs },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("masterclasses").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("experts").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("payment_status", "paid"),
    supabase.from("subscriptions").select("*, profiles(full_name)").eq("status", "active").order("activated_at", { ascending: false }).limit(5),
    supabase.from("bookings").select("*, experts(name), profiles(full_name)").eq("payment_status", "paid").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Active Subscribers", value: subscriberCount ?? 0, icon: Users, color: "#C9A84C" },
    { label: "Published Masterclasses", value: masterclassCount ?? 0, icon: Video, color: "#8B5CF6" },
    { label: "Active Experts", value: expertCount ?? 0, icon: Users, color: "#10B981" },
    { label: "Paid Bookings", value: bookingCount ?? 0, icon: DollarSign, color: "#F59E0B" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-text-primary">Admin Overview</h1>
        <p className="text-text-muted mt-2">Platform health at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${color}20` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent subscribers */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
              <CreditCard size={12} className="inline mr-1.5" />Recent Subscribers
            </h2>
            <a href="/admin/subscribers" className="text-xs text-brand hover:text-brand-light">View all</a>
          </div>
          {!recentSubs || recentSubs.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">No subscribers yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {(sub.profiles as Record<string, unknown>)?.full_name as string || "Member"}
                    </p>
                    <p className="text-xs text-text-muted capitalize">{sub.plan}</p>
                  </div>
                  <span className="text-xs font-bold text-success bg-success/10 rounded-full px-2 py-0.5">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">
              <DollarSign size={12} className="inline mr-1.5" />Recent Bookings
            </h2>
          </div>
          {!recentBookings || recentBookings.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={String(b.id)} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {(b.experts as Record<string, unknown>)?.name as string || "Expert"}
                    </p>
                    <p className="text-xs text-text-muted">{b.duration_minutes} min session</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">
                      R{((b.amount as number) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-brand">
                      R{((b.platform_commission as number) || 0).toLocaleString()} fee
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
