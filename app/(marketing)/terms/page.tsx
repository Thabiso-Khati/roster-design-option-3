import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "ROSTER Terms of Service — the rules governing use of the platform.",
};

export default function TermsPage() {
  const updated = "15 April 2026";

  return (
    <div className="pt-28 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-text-primary mb-2">Terms of Service</h1>
        <p className="text-text-muted text-sm mb-12">Last updated: {updated}</p>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-text-muted">

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the ROSTER platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">2. Description of Service</h2>
            <p>ROSTER is an online platform providing music management resources, video masterclasses, and a directory for booking sessions with industry professionals. Access to the Service requires an active paid subscription.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">3. Subscriptions & Payments</h2>
            <p className="mb-2">Subscriptions are available on Pro, Agency, and Enterprise tiers, with monthly and annual billing options. All payments are processed by Paystack. By subscribing, you authorise recurring charges at the rate shown at the time of purchase.</p>
            <p className="mb-2">Monthly subscribers may cancel at any time; access continues until the end of the current billing period. Annual subscriptions are non-refundable once activated.</p>
            <p>Prices are stated in South African Rand (ZAR) and are subject to change with 30 days&apos; notice.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">4. Expert Booking Sessions</h2>
            <p className="mb-2">Session fees are set by individual experts and are charged separately from your subscription. ROSTER collects a 20% platform fee; 80% is paid to the expert.</p>
            <p>ROSTER does not guarantee the outcome or quality of any expert session. Disputes between users and experts should first be raised with the ROSTER support team.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">5. Intellectual Property</h2>
            <p>All content on the ROSTER platform — including guides, templates, video masterclasses, and software — is owned by ROSTER or its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">6. User Conduct</h2>
            <p>You agree not to use the Service to: share login credentials with others; resell or redistribute platform content; harass other users or experts; or engage in any unlawful activity.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">7. Limitation of Liability</h2>
            <p>ROSTER is provided &ldquo;as is&rdquo;. To the maximum extent permitted by law, ROSTER shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">8. Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of South Africa. Disputes shall be subject to the exclusive jurisdiction of South African courts.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text-primary mb-3">9. Contact</h2>
            <p>For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@rosterapp.ai" className="text-brand underline">legal@rosterapp.ai</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
