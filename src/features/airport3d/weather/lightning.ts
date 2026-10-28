// Bộ lập lịch tia chớp cho thời tiết Dông bão.
// Giới hạn an toàn quang học: mỗi cụm cách nhau ≥ 5 s, tối đa 2 chớp/cụm (≤ 2 chớp trong 1 s).
const RISE = 0.04;
const DECAY = 0.09;
const PULSE_END = 0.35;
const SECOND_PULSE_DELAY = 0.18;
const SECOND_PULSE_SCALE = 0.7;
const MIN_GAP = 5;
const MAX_GAP = 12;

export interface LightningScheduler {
  /** Trả về cường độ chớp k ∈ [0, 1] tại thời điểm t (giây). */
  sample(t: number): number;
}

export function createLightningScheduler(random: () => number = Math.random): LightningScheduler {
  let nextClusterAt: number | null = null;
  let pulses: { start: number; peak: number }[] = [];
  const gap = () => MIN_GAP + random() * (MAX_GAP - MIN_GAP);

  return {
    sample(t: number) {
      if (nextClusterAt === null) nextClusterAt = t + 3 + random() * 3;
      if (t >= nextClusterAt) {
        if (t - nextClusterAt > 2) {
          // Đồng hồ nhảy (tab bị ẩn): lên lịch lại, không bắn dồn.
          nextClusterAt = t + gap();
        } else {
          pulses = [{ start: t, peak: 1 }];
          if (random() < 0.5) pulses.push({ start: t + SECOND_PULSE_DELAY, peak: SECOND_PULSE_SCALE });
          nextClusterAt = t + gap();
        }
      }
      let k = 0;
      for (const pulse of pulses) {
        const dt = t - pulse.start;
        if (dt < 0 || dt > PULSE_END) continue;
        const value = dt < RISE ? dt / RISE : Math.exp(-(dt - RISE) / DECAY);
        k = Math.max(k, value * pulse.peak);
      }
      if (pulses.length && pulses.every(pulse => t - pulse.start > PULSE_END)) pulses = [];
      return Math.min(1, Math.max(0, k));
    },
  };
}
