import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim());

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Only allow designated admin emails
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || "")) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-60">
        <main className="p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
