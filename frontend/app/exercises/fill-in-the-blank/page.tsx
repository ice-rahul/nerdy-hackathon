import { FillInTheBlank } from "@/components/FillInTheBlank/FillInTheBlank";
import { RequireOnboarding } from "@/components/RequireOnboarding/RequireOnboarding";

export default function FillInTheBlankPage() {
  return (
    <RequireOnboarding>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
        <FillInTheBlank />
      </div>
    </RequireOnboarding>
  );
}
