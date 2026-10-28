import type { WeatherCondition } from '../../../types';

export interface RainVisual {
  /** Số hạt mưa (mỗi hạt là 1 quad) */
  count: number;
  /** Tốc độ rơi (đơn vị/giây) */
  speed: number;
  /** Chiều dài vệt mưa */
  length: number;
  /** Bề ngang vệt mưa */
  width: number;
  opacity: number;
  color: string;
  /** Gió ngang (x, z) đơn vị/giây */
  wind: [number, number];
}

export interface LightningVisual {
  boostHemi: number;
  boostAmbient: number;
  flashColor: string;
}

export interface WeatherVisual {
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ambient: number;
  directional: number;
  /** scene.environmentIntensity — giảm nhẹ để gợi cảm giác trời âm u / mặt đường ướt */
  env: number;
  rain: RainVisual | null;
  lightning: LightningVisual | null;
}

/** Bảng tham số hiển thị 3D theo thời tiết; 'clear' giữ nguyên giá trị cũ của AirportScene. */
export function getWeatherVisual(weather: WeatherCondition, night: boolean): WeatherVisual {
  switch (weather) {
    case 'rain':
      return {
        background: night ? '#0a1220' : '#7d868d',
        fogColor: night ? '#121b28' : '#858e95',
        fogNear: 60, fogFar: 230,
        hemiSky: night ? '#61788f' : '#c9d2db',
        hemiGround: night ? '#1c2128' : '#3d4247',
        hemiIntensity: night ? 0.6 : 0.95,
        ambient: night ? 0.42 : 0.34,
        directional: night ? 0.35 : 1.25,
        env: 0.7,
        rain: { count: 2200, speed: 28, length: 1.1, width: 0.035, opacity: night ? 0.35 : 0.42, color: night ? '#8fa3b8' : '#c4d2e0', wind: [0.6, 0.15] },
        lightning: null,
      };
    case 'fog':
      return {
        background: night ? '#1a2230' : '#9aa1a6',
        fogColor: night ? '#1e2735' : '#a3aaaf',
        fogNear: 35, fogFar: 180,
        hemiSky: night ? '#6c8299' : '#e3e7ea',
        hemiGround: night ? '#20262d' : '#50555a',
        hemiIntensity: night ? 0.62 : 1.0,
        ambient: night ? 0.46 : 0.42,
        directional: night ? 0.28 : 0.9,
        env: 0.6,
        rain: null,
        lightning: null,
      };
    case 'thunderstorm':
      return {
        background: night ? '#05080f' : '#4d5660',
        fogColor: night ? '#0b111b' : '#58616a',
        fogNear: 40, fogFar: 210,
        hemiSky: night ? '#4f6378' : '#9fabb8',
        hemiGround: night ? '#151a20' : '#2c3136',
        hemiIntensity: night ? 0.5 : 0.72,
        ambient: night ? 0.36 : 0.3,
        directional: night ? 0.22 : 0.6,
        env: 0.5,
        rain: { count: 3600, speed: 38, length: 1.5, width: 0.04, opacity: night ? 0.4 : 0.5, color: night ? '#9fb2c6' : '#c9d5e2', wind: [2.2, 0.6] },
        lightning: { boostHemi: night ? 0.7 : 0.9, boostAmbient: night ? 0.4 : 0.5, flashColor: night ? '#5a6b85' : '#b8c2d0' },
      };
    case 'clear':
    default:
      return {
        background: night ? '#081426' : '#a6aaad',
        fogColor: night ? '#101c2c' : '#a6aaad',
        fogNear: 130, fogFar: 290,
        hemiSky: night ? '#7893b3' : '#f2f4f6',
        hemiGround: night ? '#222830' : '#4a4e52',
        hemiIntensity: night ? 0.72 : 1.18,
        ambient: night ? 0.48 : 0.38,
        directional: night ? 0.52 : 2.15,
        env: 1,
        rain: null,
        lightning: null,
      };
  }
}
