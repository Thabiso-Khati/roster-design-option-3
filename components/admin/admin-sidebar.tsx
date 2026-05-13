"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Video, Users, CreditCard, FileText, LogOut, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/masterclasses", label: "Masterclasses", icon: Video },
  { href: "/admin/experts", label: "Experts", icon: Users },
  { href: "/admin/subscribers", label: "Subscribers", icon: CreditCard },
  { href: "/admin/resources", label: "Resources", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface border-r border-border flex flex-col z-40 hidden lg:flex">
      <div className="px-5 py-5 border-b border-border">
        <span className="text-lg font-black tracking-widest text-gold">ROSTER</span>
        <p className="text-xs text-error font-semibold mt-0.5">Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active ? "bg-brand/10 text-brand" : "text-text-muted hover:text-text-primary hover:bg-surface-2"
              )}
            >
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={13} className="ml-auto text-brand/60" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
          <LayoutDashboard size={16} />Member Dashboard
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error/5 transition-all"
        >
          <LogOut size={16} />Sign out
        </button>
      </div>
    </aside>
  );
}
