"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionContext";
import { LanguageBar } from "@/components/LanguageBar/LanguageBar";

// Wraps the homepage and every exercise page: redirects to /onboarding until
// the learner's name and language choices are set. Gated on `hydrated` (not
// just `onboarded`) — otherwise this would redirect on every hard reload
// before localStorage has even been checked, since the default session
// starts with onboarded=false until hydration proves otherwise.
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, onboarded } = useSession();

  useEffect(() => {
    if (hydrated && !onboarded) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboarded, router]);

  if (!hydrated || !onboarded) return null;

  return (
    <>
      <LanguageBar />
      {children}
    </>
  );
}
