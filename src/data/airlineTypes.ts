// Definitions of the 6 supported airlines and their assets

export type AirlineCode = 'VJ' | 'VN' | 'QH' | 'VU' | 'SQ' | 'TG';

export interface AirlineDef {
  code: AirlineCode;
  name: string;
  defaultCallsignPrefix: string;
  asset: string;
  accentColor: string;
  badgeBg: string;
}

export const AIRLINES: Record<AirlineCode, AirlineDef> = {
  VJ: {
    code: 'VJ',
    name: 'Vietjet Air',
    defaultCallsignPrefix: 'VJ',
    asset: '/assets/aircraft-vietjet-vj.png',
    accentColor: '#ef4444',
    badgeBg: '#b91c1c',
  },
  VN: {
    code: 'VN',
    name: 'Vietnam Airlines',
    defaultCallsignPrefix: 'VN',
    asset: '/assets/aircraft-vietnam-vn.png',
    accentColor: '#0284c7',
    badgeBg: '#0369a1',
  },
  QH: {
    code: 'QH',
    name: 'Bamboo Airways',
    defaultCallsignPrefix: 'QH',
    asset: '/assets/aircraft-bamboo-qh.png',
    accentColor: '#22c55e',
    badgeBg: '#15803d',
  },
  VU: {
    code: 'VU',
    name: 'Vietravel Airlines',
    defaultCallsignPrefix: 'VU',
    asset: '/assets/aircraft-vietravel-vu.png',
    accentColor: '#eab308',
    badgeBg: '#a16207',
  },
  SQ: {
    code: 'SQ',
    name: 'Singapore Airlines',
    defaultCallsignPrefix: 'SQ',
    asset: '/assets/aircraft-singapore-sq.png',
    accentColor: '#3b82f6',
    badgeBg: '#1d4ed8',
  },
  TG: {
    code: 'TG',
    name: 'Thai Airways',
    defaultCallsignPrefix: 'TG',
    asset: '/assets/aircraft-thai-tg.png',
    accentColor: '#a855f7',
    badgeBg: '#7e22ce',
  },
};

export function getAirlineDef(codeOrCallsign: string = 'VN'): AirlineDef {
  const upper = codeOrCallsign.toUpperCase().trim();
  if (upper in AIRLINES) return AIRLINES[upper as AirlineCode];
  if (upper.startsWith('VJ') || upper.includes('VIETJET')) return AIRLINES.VJ;
  if (upper.startsWith('VN') || upper.startsWith('HVN') || upper.includes('VIETNAM')) return AIRLINES.VN;
  if (upper.startsWith('QH') || upper.startsWith('BAV') || upper.includes('BAMBOO')) return AIRLINES.QH;
  if (upper.startsWith('VU') || upper.startsWith('VAG') || upper.includes('VIETRAVEL')) return AIRLINES.VU;
  if (upper.startsWith('SQ') || upper.startsWith('SIA') || upper.includes('SINGAPORE')) return AIRLINES.SQ;
  if (upper.startsWith('TG') || upper.startsWith('THA') || upper.includes('THAI')) return AIRLINES.TG;
  return AIRLINES.VN;
}
