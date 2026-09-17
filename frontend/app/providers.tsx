"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionProvider } from "@/lib/session/SessionContext";
import { FeedbackProvider } from "@/lib/feedback/FeedbackContext";
import { Mascot } from "@/components/Mascot/Mascot";
import { Confetti } from "@/components/Confetti/Confetti";
import { SoundToggle } from "@/components/SoundToggle/SoundToggle";
import { InstallPrompt } from "@/components/InstallPrompt/InstallPrompt";
import { PwaRegister } from "@/components/PwaRegister/PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <FeedbackProvider>
          {children}
          <div className="pointer-events-none fixed top-4 right-4 z-50">
            <SoundToggle />
          </div>
          <InstallPrompt />
          <Mascot />
          <Confetti />
          <PwaRegister />
        </FeedbackProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
