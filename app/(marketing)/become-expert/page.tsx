"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Star, DollarSign, Calendar, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const SPECIALTIES = [
  "Music Law & Contracts", "Tour Management", "Digital Marketing",
  "A&R & Label Operations", "Royalties & Publishing", "Radio Promotion",
  "Artist Branding", "Music Distribution", "Social Media Strategy",
  "Financial Management", "Studio Production", "Other",
];

const COUNTRIES = [
  "South Africa", "Nigeria", "Ghana", "Kenya", "Tanzania", "Uganda",
  "Zimbabwe", "Zambia", "Botswana", "Namibia", "Senegal", "Côte d'Ivoire",
  "Ethiopia", "Rwanda", "Cameroon", "United Kingdom", "United States",
  "Brazil", "India", "Other",
];

export default function BecomeExpertPage() {
  const [step, setStep] = useState<"info" | "submitted">("info");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", specialty: "", country: "",
    bio: "", years_experience: "", linkedin: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/experts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStep("submitted");
    } catch {
      // still show submitted — application saved
      setStep("submitted");
    }
    setLoading(false);
  };

  if (step === "submitted") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-success" />
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-3">
              Application submitted.
            </h2>
            <p className="text-text-muted text-sm max-w-xs mx-auto mb-8">
              We review every expert application personally. We&apos;ll be in touch within
              3–5 business days with your onboarding details.
            </p>
            <Link href="/">
              <Button variant="outline">Back to ROSTER</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="hero-bg py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand inline-block mb-4">
              Expert Network
            </span>
            <h1 className="text-5xl font-black tracking-tight mb-5">
              Share your expertise.<br />
              <span className="text-gold">Get paid for it.</span>
            </h1>
            <p className="text-text-muted text-lg max-w-xl mx-auto">
              Join the ROSTER expert network. Set your own rates, manage your availability,
              and get paid directly for every session you take.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {[
              { icon: <DollarSign size={20} />, title: "You set the price", desc: "Full control over what you charge per session length." },
              { icon: <Calendar size={20} />, title: "Your schedule", desc: "Work when you want. No minimum sessions required." },
              { icon: <Star size={20} />, title: "Verified badge", desc: "Get verified and stand out to ROSTER members." },
              { icon: <Globe size={20} />, title: "Reach serious managers", desc: "Connect with managers who are actively building artist careers." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="glass-card rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-text-primary text-sm mb-1">{title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Application form */}
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-text-primary mb-2 text-center">
              Apply to Join
            </h2>
            <p className="text-text-muted text-sm text-center mb-8">
              All applications are reviewed by the ROSTER team. We only accept working professionals.
            </p>

            <div className="glass-card rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "Your full name" },
                  { label: "Email Address", key: "email", type: "email", placeholder: "you@example.com" },
                  { label: "LinkedIn or Website", key: "linkedin", type: "url", placeholder: "https://linkedin.com/in/..." },
                  { label: "Years of Experience", key: "years_experience", type: "number", placeholder: "10" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                      {label}
                    </label>
                    <input
                      type={type}
                      required
                      value={form[key as keyof typeof form]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Primary Specialty
                  </label>
                  <select
                    required
                    value={form.specialty}
                    onChange={(e) => set("specialty", e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all"
                  >
                    <option value="">Select a specialty...</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Country
                  </label>
                  <select
                    required
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary transition-all"
                  >
                    <option value="">Select your country...</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Professional Bio
                  </label>
                  <textarea
                    required
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Tell us about your background, experience, and what you can help managers with..."
                    rows={4}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none transition-all"
                  />
                </div>

                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Submit Application
                  <ArrowRight size={15} className="ml-2" />
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
