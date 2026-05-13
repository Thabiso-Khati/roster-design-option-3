import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle, MapPin, Star } from "lucide-react";

export default async function AdminExpertsPage() {
  const supabase = await createClient();
  const { data: experts } = await supabase
    .from("experts")
    .select(`*, expert_sessions(duration_minutes, price, currency)`)
    .order("created_at", { ascending: false });

  const { data: applications } = await supabase
    .from("expert_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary">Experts</h1>
        <p className="text-text-muted mt-1">
          {experts?.filter((e) => e.is_active).length || 0} active ·{" "}
          {applications?.length || 0} pending applications
        </p>
      </div>

      {/* Pending applications */}
      {applications && applications.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold text-brand uppercase tracking-widest mb-4">
            ⚡ Pending Applications ({applications.length})
          </h2>
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="glass-card rounded-xl p-5 border-brand/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-text-primary">{app.name}</p>
                    <p className="text-sm text-brand">{app.specialty}</p>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                      <span className="flex items-center gap-1"><MapPin size={10} />{app.country}</span>
                      <span>{app.years_experience} yrs experience</span>
                      <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand underline">Profile</a>
                    </div>
                    {app.bio && <p className="text-xs text-text-muted mt-2 line-clamp-2">{app.bio}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <ApproveButton id={app.id} email={app.email} name={app.name} specialty={app.specialty} country={app.country} bio={app.bio} />
                    <RejectButton id={app.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active experts */}
      <div>
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
          Active Experts ({experts?.filter((e) => e.is_active).length || 0})
        </h2>
        {!experts || experts.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-text-muted text-sm">
            No experts yet. Applications will appear above when submitted.
          </div>
        ) : (
          <div className="space-y-3">
            {experts.map((exp) => (
              <div key={exp.id} className="glass-card rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-lg flex-shrink-0">👤</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-text-primary text-sm">{exp.name}</p>
                    {exp.is_verified && <Star size={11} className="text-brand fill-brand" />}
                  </div>
                  <p className="text-xs text-brand">{exp.specialty}</p>
                  {exp.country && (
                    <p className="text-xs text-text-muted flex items-center gap-0.5 mt-0.5">
                      <MapPin size={9} />{exp.country}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    exp.is_active ? "text-success bg-success/10" : "text-error bg-error/10"
                  }`}>
                    {exp.is_active ? "Active" : "Inactive"}
                  </span>
                  {!exp.is_verified && (
                    <VerifyButton id={exp.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApproveButton({ id, email, name, specialty, country, bio }: {
  id: string; email: string; name: string; specialty: string; country: string; bio: string;
}) {
  return (
    <form action="/api/admin/experts/approve" method="POST" className="inline">
      <input type="hidden" name="application_id" value={id} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="specialty" value={specialty} />
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="bio" value={bio} />
      <button type="submit" className="flex items-center gap-1.5 bg-success/10 border border-success/20 text-success text-xs font-bold px-3 py-2 rounded-lg hover:bg-success/20 transition-colors">
        <CheckCircle2 size={13} />Approve
      </button>
    </form>
  );
}

function RejectButton({ id }: { id: string }) {
  return (
    <form action="/api/admin/experts/reject" method="POST" className="inline">
      <input type="hidden" name="application_id" value={id} />
      <button type="submit" className="flex items-center gap-1.5 bg-error/10 border border-error/20 text-error text-xs font-bold px-3 py-2 rounded-lg hover:bg-error/20 transition-colors">
        <XCircle size={13} />Reject
      </button>
    </form>
  );
}

function VerifyButton({ id }: { id: string }) {
  return (
    <form action="/api/admin/experts/verify" method="POST" className="inline">
      <input type="hidden" name="expert_id" value={id} />
      <button type="submit" className="flex items-center gap-1.5 bg-brand/10 border border-brand/20 text-brand text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand/20 transition-colors">
        <Star size={12} />Verify
      </button>
    </form>
  );
}
