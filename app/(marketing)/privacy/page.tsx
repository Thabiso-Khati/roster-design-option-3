import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ROSTER Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  const updated = "15 April 2026";

  return (
    <div className="pt-28 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-text-muted text-sm mb-12">Last updated: {updated}</p>

        <div className="space-y-8 text-sm leading-relaxed text-text-muted">

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect information you provide directly: your name, email address, phone number, and country when you create an account. We also collect payment information through Paystack — ROSTER does not store card or banking details.</p>
            <p>We automatically collect usage data including pages visited, features used, and device/browser information for platform improvement purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">2. How We Use Your Information</h2>
            <p>We use your information to: provide and maintain the Service; process subscription and booking payments; send transactional emails (booking confirmations, receipts, account updates); improve platform features; and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">3. Information Sharing</h2>
            <p className="mb-2">We do not sell your personal data. We share information only with trusted service providers necessary to operate the platform:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-text-primary">Supabase</strong> — authentication and database</li>
              <li><strong className="text-text-primary">Paystack</strong> — payment processing</li>
              <li><strong className="text-text-primary">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-text-primary">Vercel</strong> — hosting and infrastructure</li>
              <li><strong className="text-text-primary">Vimeo</strong> — video hosting for masterclasses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">4. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you close your account, we delete your personal data within 30 days, except where required for legal or financial record-keeping.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">5. Your Rights (POPIA)</h2>
            <p>Under the Protection of Personal Information Act (POPIA) and applicable data protection laws, you have the right to: access your personal data; request corrections; request deletion; object to processing; and lodge a complaint with the Information Regulator (South Africa).</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">6. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use advertising or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">7. Security</h2>
            <p>We implement industry-standard security practices including encrypted connections (HTTPS), hashed passwords, and role-based access controls. No system is 100% secure — please use a strong, unique password.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">8. Contact</h2>
            <p>For privacy enquiries or data requests, contact us at{" "}
              <a href="mailto:privacy@rosterapp.ai" className="text-brand underline">privacy@rosterapp.ai</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
