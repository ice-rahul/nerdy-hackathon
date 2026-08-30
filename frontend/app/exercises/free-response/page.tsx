import { FreeResponse } from "@/components/FreeResponse/FreeResponse";
import { RequireOnboarding } from "@/components/RequireOnboarding/RequireOnboarding";

export default function FreeResponsePage() {
  return (
    <RequireOnboarding>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
        <FreeResponse />
      </div>
    </RequireOnboarding>
  );
}
