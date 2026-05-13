"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the component has mounted on the client.
 * Use to defer rendering of anything that depends on browser state
 * (locale-aware date formatting, Date.now(), window, localStorage, etc.)
 * — prevents React hydration mismatches between server and client.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
