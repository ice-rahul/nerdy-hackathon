import Link from "next/link";

export default function CreditsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Credits</h1>
      <p className="sticker-panel max-w-md border-explorer p-6 text-center font-body text-sm font-semibold text-ink/80">
        Exercise 1&apos;s object icons were AI-generated with FLUX.1-schnell
        (Black Forest Labs) via the Hugging Face Inference API, then had their
        backgrounds removed locally with rembg.
      </p>
      <Link href="/" className="btn-ghost">
        ← Back to home
      </Link>
    </div>
  );
}
