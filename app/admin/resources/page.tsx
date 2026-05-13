"use client";
import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MODULES } from "@/lib/constants";
import { ModuleIcon } from "@/components/icons/module-icons";

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "#EF4444",
  docx: "#3B82F6",
  xlsx: "#10B981",
  pptx: "#F59E0B",
};

interface Resource {
  id: string;
  title: string;
  description?: string;
  module_slug: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedModule, setSelectedModule] = useState("startup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadResources = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    setResources(data || []);
  };

  useEffect(() => { loadResources(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) { setError("Title and file are required."); return; }
    setError("");
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${selectedModule}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      // Get public URL
      const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      // Save to DB via API
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          module_slug: selectedModule,
          file_url: fileUrl,
          file_type: ext,
        }),
      });

      if (!res.ok) throw new Error("Failed to save resource");

      setSuccess(`"${title}" uploaded successfully.`);
      setTitle("");
      setDescription("");
      setFile(null);
      setTimeout(() => setSuccess(""), 4000);
      loadResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm("Delete this resource? This cannot be undone.")) return;
    const supabase = createClient();

    // Remove from storage
    const pathMatch = fileUrl.match(/resources\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from("resources").remove([pathMatch[1]]);
    }

    await fetch("/api/admin/resources", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadResources();
  };

  const grouped = MODULES.reduce<Record<string, Resource[]>>((acc, mod) => {
    acc[mod.slug] = resources.filter((r) => r.module_slug === mod.slug);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary">Resources</h1>
        <p className="text-text-muted mt-1">
          Upload guides, templates, and spreadsheets for each module.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Upload form */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 sticky top-6">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-5">
              <Upload size={13} className="inline mr-1.5" />Upload Resource
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Module</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary"
                >
                  {MODULES.map((m) => (
                    <option key={m.slug} value={m.slug}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tour Budget Template"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description..."
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">File *</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand/40 transition-colors bg-surface-2">
                  {file ? (
                    <div className="text-center px-3">
                      <p className="text-sm font-semibold text-brand">{file.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Plus size={20} className="text-text-muted mx-auto mb-1" />
                      <p className="text-xs text-text-muted">PDF, DOCX, XLSX, PPTX</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.pptx,.doc,.xls"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {error && <p className="text-xs text-error">{error}</p>}
              {success && <p className="text-xs text-success">{success}</p>}

              <Button type="submit" loading={uploading} size="md" className="w-full">
                <Upload size={14} className="mr-2" />Upload File
              </Button>
            </form>
          </div>
        </div>

        {/* Resource list by module */}
        <div className="lg:col-span-3 space-y-8">
          {MODULES.map((mod) => {
            const modResources = grouped[mod.slug] || [];
            return (
              <div key={mod.slug}>
                <div className="flex items-center gap-2 mb-3">
                  <ModuleIcon id={mod.id} size={16} style={{ color: mod.color }} />
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
                    {mod.title} ({modResources.length})
                  </h3>
                </div>
                {modResources.length === 0 ? (
                  <p className="text-xs text-text-muted pl-6">No resources yet.</p>
                ) : (
                  <div className="space-y-2">
                    {modResources.map((res) => {
                      const color = FILE_TYPE_COLORS[res.file_type] || "#64748B";
                      return (
                        <div key={res.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${color}15` }}>
                            <FileText size={14} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{res.title}</p>
                            {res.description && (
                              <p className="text-xs text-text-muted truncate">{res.description}</p>
                            )}
                          </div>
                          <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color, backgroundColor: `${color}15` }}>
                            {res.file_type}
                          </span>
                          <button
                            onClick={() => handleDelete(res.id, res.file_url)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
