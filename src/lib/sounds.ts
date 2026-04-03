/** Short camera-style chime on manual capture (Web Audio API, no asset files). */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

export async function playManualCaptureChime(): Promise<void> {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    const t0 = ctx.currentTime;
    const blip = (start: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
      osc.start(start);
      osc.stop(start + 0.095);
    };
    blip(t0, 523.25);
    blip(t0 + 0.065, 783.99);
  } catch {
    /* ignore if audio blocked */
  }
}
