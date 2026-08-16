// Bảng điều khiển mô phỏng — hỗ trợ cấu hình tàu bay, hãng hàng không (6 Livery) và hạm đội 6 máy bay độc lập.

import React from 'react';
import { airportGraph } from '../data/airportGraph';
import { AIRLINES, type AirlineCode } from '../data/airlineTypes';
import { useActionLock } from '../utils/useActionLock';
import type { AirportGraph, Aircraft, SimulationConfig } from '../types';

interface Props {
  config: SimulationConfig;
  graph?: AirportGraph;
  manualFleet?: Aircraft[];
  selectedAircraftId?: string;
  onSelectAircraft?: (id: string) => void;
  onConfigChange: (patch: Partial<SimulationConfig>) => void;
  onAcceptRoute: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  routeStatus: 'pending' | 'accepted';
  isRunning: boolean;
  isPaused: boolean;
  canStart: boolean;
  blockedCount: number;
  autoIncidents: boolean;
  onToggleAutoIncidents: () => void;
  onTriggerIncident: () => void;
  onClearIncidents: () => void;
}

export default function ControlPanel({
  config,
  graph = airportGraph,
  manualFleet = [],
  selectedAircraftId = 'VN001',
  onSelectAircraft,
  onConfigChange,
  onAcceptRoute,
  onStart,
  onPause,
  onReset,
  routeStatus,
  isRunning,
  isPaused,
  canStart,
  blockedCount,
  autoIncidents,
  onToggleAutoIncidents,
  onTriggerIncident,
  onClearIncidents,
}: Props) {
  const { executeAction, getActionState } = useActionLock(2000);

  const selectedAircraft = manualFleet.find(a => a.id === selectedAircraftId);
  const currentAirlineCode = (selectedAircraft?.airlineCode || config.airlineCode || 'VN') as AirlineCode;
  const currentAirline = AIRLINES[currentAirlineCode] || AIRLINES.VN;
  const currentCallsign = selectedAircraft?.callsign ?? config.callsign;
  const currentAircraftType = selectedAircraft?.aircraftType ?? config.aircraftType;
  const currentStartNodeId = selectedAircraft?.currentNodeId ?? config.startNodeId;
  const currentDestNodeId = selectedAircraft?.targetNodeId ?? config.destinationNodeId;

  const startOptions = React.useMemo(() => {
    const priority = (n: typeof graph.nodes[0]) => {
      if (n.type === 'holding_point' || n.id.startsWith('H') || n.id.startsWith('HS')) return 1;
      if (n.type === 'stand' || n.id.startsWith('DOM_S') || n.id.startsWith('INTL_S') || n.id.startsWith('ST') || n.id.startsWith('P')) return 2;
      if (n.type === 'runway_entry' || n.type === 'runway_exit') return 3;
      return 4;
    };
    
    const sorted = [...graph.nodes].sort((a, b) => priority(a) - priority(b) || a.id.localeCompare(b.id));
    return sorted.map(n => ({
      value: n.id,
      label: `${n.label || n.id} — ${n.description || n.type}`,
    }));
  }, [graph]);

  const destOptions = React.useMemo(() => {
    const priority = (n: typeof graph.nodes[0]) => {
      if (n.type === 'runway_entry' || n.type === 'runway_exit' || n.id.includes('THR')) return 1;
      if (n.type === 'holding_point' || n.id.startsWith('H') || n.id.startsWith('HS')) return 2;
      if (n.type === 'stand' || n.id.startsWith('DOM_S') || n.id.startsWith('INTL_S') || n.id.startsWith('ST') || n.id.startsWith('P')) return 3;
      return 4;
    };
    
    const sorted = [...graph.nodes].sort((a, b) => priority(a) - priority(b) || a.id.localeCompare(b.id));
    return sorted.map(n => ({
      value: n.id,
      label: `${n.label || n.id} — ${n.description || n.type}`,
    }));
  }, [graph]);

  return (
    <div className="flex flex-col gap-3.5 p-3.5 sm:p-4 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <span>🎮</span> Điều Khiển Thủ Công
        </h2>
        <span className="text-[11px] px-2 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono font-semibold">
          6 Máy bay độc lập
        </span>
      </div>

      {/* ── 6 Máy Bay Manual Tabs ── */}
      {manualFleet.length > 0 && (
        <div className="flex flex-col gap-1.5 bg-[#0a0e14] p-2 rounded-xl border border-[#1e2838]">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-gray-300">Chọn tàu bay điều khiển:</span>
            <span className="text-[10px] text-cyan-400 font-mono">
              ● Chỉ 1 tàu bay chạy
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {manualFleet.map(ac => {
              const aDef = AIRLINES[ac.airlineCode as AirlineCode] || AIRLINES.VN;
              const isSelected = ac.id === selectedAircraftId;
              const isTaxiing = ac.status === 'taxiing';
              const isHolding = ac.status === 'holding';

              return (
                <button
                  key={ac.id}
                  type="button"
                  onClick={() => onSelectAircraft?.(ac.id)}
                  className={`flex flex-col items-start p-2 rounded-lg border text-left transition min-h-[58px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#152336] border-cyan-400 text-white shadow-md ring-2 ring-cyan-500/50'
                      : 'bg-[#0f141c] border-[#1f2937] text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs" style={{ color: isSelected ? '#38bdf8' : aDef.accentColor }}>
                      {ac.callsign}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-black/50 text-gray-300 uppercase font-semibold">
                      {ac.airlineCode}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate w-full mt-1">
                    {ac.currentNodeId} → {ac.targetNodeId}
                  </div>
                  <div className="text-[10px] font-bold mt-1 flex items-center gap-1" style={{ color: isTaxiing ? '#22c55e' : (isHolding ? '#ef4444' : '#9ca3af') }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isTaxiing ? '#22c55e' : (isHolding ? '#ef4444' : '#9ca3af') }} />
                    {ac.status.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cấu hình tàu bay */}
      <Section title={`Cấu hình tàu bay: ${currentCallsign}`}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium">Số hiệu chuyến bay</label>
          <input
            type="text"
            value={currentCallsign}
            onChange={e => onConfigChange({ callsign: e.target.value.toUpperCase() })}
            maxLength={8}
            className="bg-[#0d1318] border border-[#1e2838] text-gray-100 rounded-lg px-3 py-2 min-h-[42px] text-xs sm:text-sm font-mono uppercase focus:outline-none focus:border-cyan-400"
            placeholder="VN001"
          />
        </div>

        <LabeledSelect
          label="Loại tàu bay"
          value={currentAircraftType}
          onChange={v => onConfigChange({ aircraftType: v as SimulationConfig['aircraftType'] })}
          options={[
            { value: 'A321', label: 'Airbus A321 (Thân hẹp · lăn chuẩn)' },
            { value: 'B737', label: 'Boeing 737 (Thân hẹp · nhanh nhẹn)' },
            { value: 'A350', label: 'Airbus A350 (Thân rộng · lăn chậm, lớn)' },
            { value: 'ATR72', label: 'ATR 72 (Turboprop · nhỏ, chậm)' },
          ]}
        />

        {/* Dropdown Hãng hàng không / Livery */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-semibold">Hãng hàng không / Livery</label>
          <select
            value={currentAirlineCode}
            onChange={e => {
              const code = e.target.value as AirlineCode;
              onConfigChange({
                airlineCode: code,
              });
            }}
            className="bg-[#0d1318] border border-[#1e2838] text-gray-100 rounded-lg px-3 py-2 min-h-[42px] text-xs sm:text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="VJ">Vietjet Air (VJ)</option>
            <option value="VN">Vietnam Airlines (VN)</option>
            <option value="QH">Bamboo Airways (QH)</option>
            <option value="VU">Vietravel Airlines (VU)</option>
            <option value="SQ">Singapore Airlines (SQ)</option>
            <option value="TG">Thai Airways (TG)</option>
          </select>
        </div>

        {/* Livery Preview Card */}
        <div className="flex items-center gap-3 p-2 bg-[#090d14] rounded-lg border border-[#1e2838]">
          <div className="w-16 h-10 bg-black/40 rounded flex items-center justify-center p-1 border border-gray-800">
            <img
              src={currentAirline.asset}
              alt={currentAirline.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">{currentAirline.name}</span>
            <span className="text-[10px] text-gray-400 font-mono">Mã hãng: {currentAirline.code}</span>
          </div>
        </div>
      </Section>

      {/* Tuyến đường */}
      <Section title="Tuyến đường">
        <LabeledSelect
          label="Điểm xuất phát"
          value={currentStartNodeId}
          onChange={v => onConfigChange({ startNodeId: v })}
          options={startOptions}
        />
        <LabeledSelect
          label="Điểm đến"
          value={currentDestNodeId}
          onChange={v => onConfigChange({ destinationNodeId: v })}
          options={destOptions}
        />
      </Section>

      {/* Môi trường */}
      <Section title="Môi trường">
        <LabeledSelect
          label="Thời tiết"
          value={config.weather}
          onChange={v => onConfigChange({ weather: v as SimulationConfig['weather'] })}
          options={[
            { value: 'clear',        label: 'Quang đãng' },
            { value: 'rain',         label: 'Mưa (giảm 30% tốc độ)' },
            { value: 'fog',          label: 'Sương mù (giảm 55% tốc độ)' },
            { value: 'thunderstorm', label: 'Bão (giảm 65% tốc độ)' },
          ]}
        />
        <LabeledSelect
          label="Thời điểm trong ngày"
          value={config.timeOfDay}
          onChange={v => onConfigChange({ timeOfDay: v as SimulationConfig['timeOfDay'] })}
          options={[
            { value: 'morning',   label: 'Buổi sáng' },
            { value: 'afternoon', label: 'Buổi chiều' },
            { value: 'night',     label: 'Ban đêm' },
          ]}
        />
        <LabeledSelect
          label="Lưu lượng giao thông"
          value={config.trafficLevel}
          onChange={v => onConfigChange({ trafficLevel: v as SimulationConfig['trafficLevel'] })}
          options={[
            { value: 'low',    label: 'Thấp' },
            { value: 'medium', label: 'Trung bình (giảm 25% tốc độ)' },
            { value: 'high',   label: 'Cao (giảm 45% tốc độ)' },
          ]}
        />
      </Section>

      {/* Tốc độ */}
      <Section title="Tốc độ lăn bánh">
        <div className="flex items-center gap-3">
          <input
            type="range" min={3} max={30} step={1}
            value={config.taxiSpeedKts}
            onChange={e => onConfigChange({ taxiSpeedKts: Number(e.target.value) })}
            className="flex-1 accent-green-500 min-h-[36px]"
          />
          <span className="w-16 text-right text-green-400 font-mono font-bold text-sm">
            {config.taxiSpeedKts} kts
          </span>
        </div>
      </Section>

      {/* Sự cố động (A-SMGCS / SMAN) */}
      <Section title="Sự cố trên đường lăn (động)">
        <p className="text-xs text-gray-400 leading-relaxed -mt-0.5">
          Tạo sự cố ngay khi máy bay đang lăn — hệ thống sẽ tự chạy lại Dijkstra
          từ vị trí hiện tại để tìm đường vòng, không khởi động lại.
        </p>

        <button
          onClick={() => executeAction('trigger_incident', onTriggerIncident)}
          disabled={!isRunning || getActionState('trigger_incident').isPending}
          className="w-full bg-orange-700 hover:bg-orange-600 active:bg-orange-800 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition min-h-[44px] flex items-center justify-center gap-2 shadow cursor-pointer"
        >
          <span>{getActionState('trigger_incident').isPending ? '⏳' : '⚠'}</span>
          {getActionState('trigger_incident').isPending
            ? 'Đang xử lý…'
            : getActionState('trigger_incident').canRetry
            ? 'Thử lại: Tạo sự cố'
            : 'Tạo sự cố trên tuyến phía trước'}
        </button>

        <div className="flex items-center gap-2.5 min-h-[36px]">
          <input
            id="autoincidents"
            type="checkbox"
            checked={autoIncidents}
            onChange={onToggleAutoIncidents}
            className="w-4 h-4 accent-orange-500 cursor-pointer"
          />
          <label htmlFor="autoincidents" className="text-xs sm:text-sm text-gray-300 cursor-pointer select-none">
            Sự cố tự động (mỗi 4 giây khi đang lăn)
          </label>
        </div>

        <div className="flex items-center gap-2.5 min-h-[36px]">
          <input
            id="autoreroute"
            type="checkbox"
            checked={config.autoReroute}
            onChange={e => onConfigChange({ autoReroute: e.target.checked })}
            className="w-4 h-4 accent-green-500 cursor-pointer"
          />
          <label htmlFor="autoreroute" className="text-xs sm:text-sm text-gray-300 cursor-pointer select-none">
            Tự động tìm đường vòng (Dijkstra) khi bị chặn
          </label>
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">
            Đoạn bị chặn: <span className="text-red-400 font-mono font-bold text-sm">{blockedCount}</span>
          </span>
          <button
            onClick={() => executeAction('clear_incidents', onClearIncidents)}
            disabled={blockedCount === 0 || getActionState('clear_incidents').isPending}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline disabled:text-gray-600 disabled:no-underline font-semibold py-1 px-2 cursor-pointer"
          >
            {getActionState('clear_incidents').isPending
              ? 'Đang xử lý…'
              : getActionState('clear_incidents').canRetry
              ? 'Thử lại xóa'
              : 'Xóa sự cố'}
          </button>
        </div>
      </Section>

      {/* Nút điều khiển */}
      <div className="flex flex-col gap-2.5 mt-2">
        {!isRunning && !isPaused && routeStatus === 'pending' && (
          <button
            onClick={() => executeAction('accept_route', onAcceptRoute)}
            disabled={!canStart || getActionState('accept_route').isPending}
            className="w-full bg-blue-700 hover:bg-blue-600 active:bg-blue-800 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2.5 rounded-xl transition text-sm min-h-[46px] flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <span>{getActionState('accept_route').isPending ? '⏳' : '✓'}</span>
            {getActionState('accept_route').isPending
              ? 'Đang xử lý…'
              : getActionState('accept_route').canRetry
              ? 'Thử lại: Chấp nhận tuyến'
              : 'Chấp nhận tuyến đường'}
          </button>
        )}

        {/* Điều khiển hành trình */}
        {(!selectedAircraft || selectedAircraft.status === 'parked' || selectedAircraft.status === 'waiting') && routeStatus === 'accepted' && (
          <button
            onClick={() => executeAction('start', onStart)}
            disabled={!canStart || getActionState('start').isPending}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition text-sm min-h-[48px] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{getActionState('start').isPending ? '⏳' : '▶'}</span>
            {getActionState('start').isPending
              ? 'Đang xử lý…'
              : getActionState('start').canRetry
              ? `Thử lại: Cho lăn bánh ${selectedAircraft?.callsign || selectedAircraftId}`
              : `Cho lăn bánh: ${selectedAircraft?.callsign || selectedAircraftId}`}
          </button>
        )}

        {selectedAircraft?.status === 'taxiing' && (
          <button
            onClick={() => executeAction('pause', onPause)}
            disabled={getActionState('pause').isPending}
            className="w-full bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm min-h-[48px] flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <span>{getActionState('pause').isPending ? '⏳' : (isPaused ? '▶' : '⏸')}</span>
            {getActionState('pause').isPending
              ? 'Đang xử lý…'
              : getActionState('pause').canRetry
              ? 'Thử lại'
              : isPaused
              ? 'Tiếp tục mô phỏng'
              : 'Tạm dừng mô phỏng'}
          </button>
        )}

        {isPaused && (
          <button
            onClick={() => executeAction('pause', onPause)}
            disabled={getActionState('pause').isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm min-h-[48px] flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <span>{getActionState('pause').isPending ? '⏳' : '▶'}</span>
            {getActionState('pause').isPending
              ? 'Đang xử lý…'
              : getActionState('pause').canRetry
              ? 'Thử lại'
              : 'Tiếp tục'}
          </button>
        )}

        <button
          onClick={() => executeAction('reset', onReset)}
          disabled={getActionState('reset').isPending}
          className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 disabled:bg-gray-800 text-white font-bold py-2.5 rounded-xl transition text-sm min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{getActionState('reset').isPending ? '⏳' : '↺'}</span>
          {getActionState('reset').isPending
            ? 'Đang xử lý…'
            : getActionState('reset').canRetry
            ? 'Thử lại đặt lại'
            : `Đặt lại máy bay: ${selectedAircraft?.callsign || selectedAircraftId}`}
        </button>

      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-widest text-[#4a5a6e] border-b border-[#1e2838] pb-1 font-semibold">{title}</div>
      {children}
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#0d1318] border border-[#1e2838] text-gray-100 rounded-lg px-3 py-2 min-h-[42px] text-xs sm:text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
