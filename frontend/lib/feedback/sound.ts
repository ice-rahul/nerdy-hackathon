// Tones are synthesized with the Web Audio API rather than shipped as audio
// files — no assets to source/license, and it works instantly offline.
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!sharedCtx) sharedCtx = new AudioContextCtor();
  if (sharedCtx.state === "suspended") {
    // Swallow rejection: browsers reject resume() when it's not called
    // synchronously inside a real user-gesture event, which is exactly the
    // case primeAudio() below exists to avoid — an unhandled rejection here
    // would otherwise surface as a console error on every muted attempt.
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

// Correct/incorrect/level-up sounds are triggered from a useEffect reacting
// to state set by a click handler — by the time that effect runs, the
// browser's per-click "user activation" window has often already lapsed
// (most reliably on Safari, intermittently on Chrome), so an AudioContext
// first created/resumed there can get silently stuck "suspended" forever.
// Priming it directly inside the raw pointerdown/keydown event — before
// React's click handler and effects even run — resumes it while activation
// is unambiguously live. Safe to call on every gesture: it's a no-op once
// the shared context is already running, and it keeps retrying resume() on
// each new gesture if an earlier attempt was rejected.
export function primeAudio() {
  getAudioContext();
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

export type SoundKind = "correct" | "incorrect" | "levelup";

export function playSoundKind(kind: SoundKind) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (kind === "correct") {
    playTone(ctx, 880, now, 0.12, "sine", 0.15);
    playTone(ctx, 1318.5, now + 0.1, 0.18, "sine", 0.15);
  } else if (kind === "incorrect") {
    playTone(ctx, 180, now, 0.22, "sawtooth", 0.08);
  } else {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      playTone(ctx, freq, now + i * 0.09, 0.16, "triangle", 0.13)
    );
  }
}
