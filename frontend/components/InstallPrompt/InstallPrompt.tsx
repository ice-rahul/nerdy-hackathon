"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// The visible "install this app" affordance the PWA manifest alone doesn't
// provide — Chrome/Edge/Android fire `beforeinstallprompt` and we surface a
// button for it; iOS Safari never fires that event, so we detect the device
// instead and show manual "Add to Home Screen" steps.
export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Hydrating from browser-only APIs (matchMedia, userAgent) unavailable
    // during SSR — this mount effect is exactly the correct place for it,
    // not the derived-state anti-pattern this rule otherwise guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setIosDevice(isIos());
    if (isStandalone()) setInstalled(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) {
      setShowIosHint(true);
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (!mounted || installed || dismissed) return null;
  if (!deferredPrompt && !iosDevice) return null;

  return (
    <div className="pointer-events-none fixed top-16 right-4 z-50 flex flex-col items-end gap-2 sm:top-20 sm:right-6">
      <div className="pointer-events-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 rounded-full border-4 border-ink bg-explorer px-3 py-1.5 font-display text-xs font-bold text-white shadow-sticker-sm transition-transform hover:-translate-y-0.5"
        >
          📲 Install App
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install prompt"
          className="flex h-7 w-7 items-center justify-center rounded-full border-4 border-ink bg-white text-xs font-bold text-ink shadow-sticker-sm"
        >
          ✕
        </button>
      </div>

      {showIosHint && (
        <div className="sticker-panel pointer-events-auto max-w-[220px] border-explorer px-4 py-2.5 text-left font-body text-xs font-bold text-ink">
          On iPhone/iPad: tap the Share icon, then &quot;Add to Home Screen&quot;.
        </div>
      )}
    </div>
  );
}
