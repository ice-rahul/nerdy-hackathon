import { GuidedQA } from "@/components/GuidedQA/GuidedQA";
import { RequireOnboarding } from "@/components/RequireOnboarding/RequireOnboarding";

export default function QAPage() {
  return (
    <RequireOnboarding>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
        <GuidedQA />
      </div>
    </RequireOnboarding>
  );
}
