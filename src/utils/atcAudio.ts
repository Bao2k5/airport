/**
 * ATC Audio & Speech Engine
 * - Web Speech API (Text-to-Speech)
 * - Web Audio API (VHF Radio Mic Click / Squelch Chime)
 * - Mute / Unmute state management with persistent storage
 */

let isAudioMuted = false;
try {
  const saved = localStorage.getItem('atc_audio_muted');
  if (saved !== null) {
    isAudioMuted = saved === 'true';
  }
} catch {
  // Ignore localStorage issues
}

const listeners = new Set<(muted: boolean) => void>();

export function isAtcAudioMuted(): boolean {
  return isAudioMuted;
}

export function setAtcAudioMuted(muted: boolean) {
  isAudioMuted = muted;
  try {
    localStorage.setItem('atc_audio_muted', String(muted));
  } catch {
    // Ignore
  }
  if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  listeners.forEach(fn => fn(muted));
}

export function toggleAtcAudioMuted(): boolean {
  const next = !isAudioMuted;
  setAtcAudioMuted(next);
  return next;
}

export function subscribeAtcAudio(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Native Web Audio API Radio Mic Click / Squelch Sound ───────────────────
let audioCtx: AudioContext | null = null;

function playRadioClick() {
  if (isAudioMuted || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    // Short crisp radio chirp (1400Hz -> 700Hz in 35ms)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.035);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Ignore audio context errors
  }
}

// ── Web Speech API Text-to-Speech Engine ───────────────────────────────────
export function speakAtcDialogue(rawText: string) {
  if (isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Extract spoken content (prefer text inside quotes if present)
  let cleanText = rawText;
  const quoteMatch = rawText.match(/"([^"]+)"/);
  if (quoteMatch) {
    cleanText = quoteMatch[1];
  } else {
    // Strip leading speaker prefix like '📻 KSVKL:' or '[ATC]'
    cleanText = rawText.replace(/^[^:]+:\s*/, '').replace(/\[[^\]]+\]\s*/g, '');
  }

  // Remove emojis and excess punctuation
  cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  if (!cleanText) return;

  // Play radio transmission start chirp
  playRadioClick();

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Detect if English ATC terminology is predominant
    const isEnglish = /\b(taxi|hold|runway|holding|cleared|turn|via|stand|stop|cross|flight|immediately)\b/i.test(cleanText);

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (isEnglish) {
        const enVoice = voices.find(v => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Zira') || v.default)))
          || voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = 'en-US';
      } else {
        const viVoice = voices.find(v => v.lang.startsWith('vi'));
        if (viVoice) utterance.voice = viVoice;
        utterance.lang = 'vi-VN';
      }
    }

    utterance.rate = 1.05; // Slightly brisk aviation cadence
    utterance.pitch = 0.95; // Authoritative tone
    utterance.volume = 0.85;

    // Small 45ms delay after radio click
    setTimeout(() => {
      if (!isAudioMuted) {
        window.speechSynthesis.speak(utterance);
      }
    }, 45);
  } catch {
    // Ignore speech synthesis errors
  }
}
