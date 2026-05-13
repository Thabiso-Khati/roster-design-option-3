import Link from "next/link";
import { ChevronLeft, Megaphone } from "lucide-react";
import { MarketingTabs } from "./marketing-tabs";

const MODULE_COLOR = "#8B5CF6";

export default function MarketingModulePage() {
  return (
    <div className="animate-fade-in max-w-4xl">
      <Link
        href="/dashboard/library"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <ChevronLeft size={15} />
        Back to Toolkit
      </Link>

      {/* Module header — server-rendered, no hydration risk */}
      <div className="glass-card rounded-2xl p-6 mb-7" style={{ borderColor: "#8B5CF625" }}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#8B5CF615" }}
          >
            <Megaphone size={26} style={{ color: MODULE_COLOR }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: MODULE_COLOR }}>
              Get Heard
            </p>
            <h1 className="text-2xl font-black text-text-primary">Marketing Music &amp; Artists</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Brand identity, radio, playlists, social, release day, outreach, content production, YouTube — every layer of artist marketing, as software, in every market.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
              <span style={{ color: MODULE_COLOR }} className="font-semibold">Brand Studio</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">1 guide</span>
              <span>·</span>
              <span style={{ color: MODULE_COLOR }} className="font-semibold">10 work tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive tabs — client component, no SSR conflict */}
      <MarketingTabs />
    </div>
  );
}
