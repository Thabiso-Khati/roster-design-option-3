"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// PostHogPageView is only rendered after posthog.init() has resolved, so
// the capture() call here is always safe — no race with initialisation.
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const url =
      window.origin +
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // `ready` flips to true only after posthog.init() resolves on the client.
  // We never branch on `typeof window` at module level, so there is no
  // server/client render difference and no React hydration mismatch.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (posthog.__loaded) {
      setReady(true);
      return;
    }
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // fired manually in PostHogPageView
      capture_pageleave: true,
      respect_dnt: true,
      loaded: () => setReady(true),
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      {ready && (
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
      )}
      {children}
    </PHProvider>
  );
}
