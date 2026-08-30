import { ParagraphSummary } from "@/components/ParagraphSummary/ParagraphSummary";
import { RequireOnboarding } from "@/components/RequireOnboarding/RequireOnboarding";

export default function ParagraphSummaryPage() {
  return (
    <RequireOnboarding>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
        <ParagraphSummary />
      </div>
    </RequireOnboarding>
  );
}
