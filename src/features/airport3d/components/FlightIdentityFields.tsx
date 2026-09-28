import { AIRLINES } from '../../../data/airlineTypes';
import type { Aircraft, AircraftType, AirlineCode, SimulationConfig } from '../../../types';

export default function FlightIdentityFields({ aircraft, onChange }: {
  aircraft: Aircraft;
  onChange: (patch: Partial<SimulationConfig>) => void;
}) {
  const disabled = !['parked', 'idle', 'waiting'].includes(aircraft.status);
  return <fieldset disabled={disabled} className="mt-3 grid gap-2 border-t border-slate-600 pt-3 text-xs disabled:opacity-50">
    <legend className="text-slate-300">Thông tin chuyến bay</legend>
    <label>Hiệu gọi<input key={`${aircraft.id}-${aircraft.callsign}`} defaultValue={aircraft.callsign} maxLength={12}
      onBlur={event => { const callsign = event.target.value.trim().toUpperCase(); if (/^[A-Z0-9-]{2,12}$/.test(callsign)) onChange({ callsign }); else event.target.value = aircraft.callsign; }}
      className="mt-1 w-full rounded border border-slate-500 bg-slate-950 p-2 text-white" /></label>
    <label>Loại tàu bay<select value={aircraft.aircraftType ?? 'A321'} onChange={e => onChange({ aircraftType: e.target.value as AircraftType })} className="mt-1 w-full rounded bg-slate-950 p-2">
      {['A320', 'A321', 'A350', 'B737', 'B747', 'ATR72'].map(type => <option key={type}>{type}</option>)}
    </select></label>
    <label>Hãng / màu nhận diện<select value={aircraft.airlineCode ?? 'VN'} onChange={e => onChange({ airlineCode: e.target.value as AirlineCode })} className="mt-1 w-full rounded bg-slate-950 p-2">
      {Object.values(AIRLINES).map(airline => <option key={airline.code} value={airline.code}>{airline.name}</option>)}
    </select></label>
  </fieldset>;
}
