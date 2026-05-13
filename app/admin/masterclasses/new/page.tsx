"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["startup", "touring", "recording", "marketing", "money"];

export default function NewMasterclassPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", instructor_name: "", instructor_title: "",
    vimeo_id: "", thumbnail_url: "", duration_seconds: "", category: "startup",
    is_published: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (publish: boolean) => {
    if (!form.title) { setError("Title is required."); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: dbError } = await supabase.from("masterclasses").insert({
      title: form.title,
      description: form.description || null,
      instructor_name: form.instructor_name || null,
      instructor_title: form.instructor_title || null,
      vimeo_id: form.vimeo_id || null,
      thumbnail_url: form.thumbnail_url || null,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      category: form.category,
      is_published: publish,
    });

    if (dbError) { setError(dbError.message); setLoading(false); return; }
    router.push("/admin/masterclasses");
  };

  const fields = [
    { label: "Title *", key: "title", type: "text", placeholder: "e.g. Negotiating Your First Record Deal" },
    { label: "Instructor Name", key: "instructor_name", type: "text", placeholder: "e.g. Music Attorney" },
    { label: "Instructor Title", key: "instructor_title", type: "text", placeholder: "e.g. Entertainment Law, Johannesburg" },
    { label: "Vimeo Video ID", key: "vimeo_id", type: "text", placeholder: "e.g. 123456789 (from vimeo.com/123456789)" },
    { label: "Thumbnail URL", key: "thumbnail_url", type: "url", placeholder: "https://..." },
    { label: "Duration (seconds)", key: "duration_seconds", type: "number", placeholder: "e.g. 2820 = 47 min" },
  ];

  return (
    <div className="animate-fade-in max-w-2xl">
      <Link href="/admin/masterclasses" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors">
        <ChevronLeft size={15} />Back to Masterclasses
      </Link>

      <h1 className="text-2xl font-black text-text-primary mb-8">Add Masterclass</h1>

      <div className="glass-card rounded-2xl p-8 space-y-5">
        {fields.map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form] as string}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="What will members learn from this class?"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all capitalize"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => handleSave(false)}
            loading={loading}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            loading={loading}
            size="lg"
            className="flex-1"
          >
            Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
}
