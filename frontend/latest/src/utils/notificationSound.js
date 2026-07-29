// Telegram-style incoming-message chime, synthesized with the Web Audio API
// so no audio asset ships with the bundle. Deduped per message id so the
// same message never dings twice (duplicate socket deliveries, listener
// re-registration on reconnect, etc.).
let audioCtx = null;
const playedIds = new Set();
const MAX_TRACKED_IDS = 300;

const getContext = () => {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

// Two quick soft sine notes (~0.25s total) with a fast decay — short and
// clean, close to Telegram's incoming-message tone.
const chime = (ctx) => {
  const now = ctx.currentTime;
  [[660, 0], [880, 0.07]].forEach(([freq, offset]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.14, now + offset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.2);
  });
};

export const playMessageSound = (messageId) => {
  if (messageId) {
    if (playedIds.has(messageId)) return;
    playedIds.add(messageId);
    if (playedIds.size > MAX_TRACKED_IDS) {
      playedIds.delete(playedIds.values().next().value);
    }
  }
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      // Autoplay policy: audio unlocks only after a user gesture — resume if
      // the browser lets us, otherwise stay silent (no console error).
      ctx.resume().then(() => chime(ctx)).catch(() => {});
      return;
    }
    chime(ctx);
  } catch {
    // Sound is best-effort — never let it break message handling.
  }
};
