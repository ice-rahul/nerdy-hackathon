import { Exercise1 } from "@/components/Exercise1/Exercise1";
import categories from "@/lib/scenes/categories.json";
import type { SceneCategory } from "@/lib/scenes/types";
import { RequireOnboarding } from "@/components/RequireOnboarding/RequireOnboarding";

export default function WordIdentificationPage() {
  return (
    <RequireOnboarding>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
        <Exercise1 categories={categories as SceneCategory[]} />
      </div>
    </RequireOnboarding>
  );
}
