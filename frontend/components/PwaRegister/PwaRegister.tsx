"use client";

import { useEffect } from "react";

// Registered production-only: a service worker in dev fights Turbopack's
// HMR by serving stale cached chunks after a hot reload.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
