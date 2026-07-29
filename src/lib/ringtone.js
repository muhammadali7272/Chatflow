// Call ringtones generated with the Web Audio API — no audio asset files.
// Two looping patterns: an incoming ring (double beep) and an outgoing
// ringback (one long tone). Browsers may keep the AudioContext suspended until
// a user gesture (autoplay policy); we resume() best-effort. For outgoing calls
// the user just clicked "call" (a gesture), so ringback plays reliably; an
// incoming ring may stay silent until the callee interacts with the page.

let ctx = null;
let loopTimer = null;
let nodes = [];

function ensureCtx() {
  if (ctx) return ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    ctx = new Ctx();
  } catch {
    ctx = null;
  }
  return ctx;
}

// One tone (or chord) shaped with a short attack/release so it doesn't click.
function tone(freqs, start, duration, volume) {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.04);
  gain.gain.setValueAtTime(volume, start + duration - 0.06);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    osc.connect(gain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
    nodes.push(osc, gain);
  });
}

function playPattern(kind) {
  if (!ctx) return;
  const t = ctx.currentTime;
  if (kind === "incoming") {
    // Attention-grabbing double beep.
    tone([480, 620], t, 0.4, 0.16);
    tone([480, 620], t + 0.55, 0.4, 0.16);
  } else {
    // Classic ringback (US 440 + 480 Hz), softer.
    tone([440, 480], t, 1.0, 0.1);
  }
}

/**
 * Start looping a ringtone. `kind` is "incoming" or "outgoing".
 * Safe to call repeatedly — it restarts cleanly.
 */
export function startRingtone(kind) {
  stopRingtone();
  if (!ensureCtx()) return;
  ctx.resume?.().catch(() => {});
  playPattern(kind);
  const period = kind === "incoming" ? 2000 : 4000;
  loopTimer = setInterval(() => playPattern(kind), period);
}

/** Stop the ringtone and silence any scheduled tones. */
export function stopRingtone() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
  nodes.forEach((n) => {
    try {
      n.stop?.();
      n.disconnect?.();
    } catch {
      /* already stopped */
    }
  });
  nodes = [];
}
