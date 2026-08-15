import React, { Fragment } from 'react';
import type { SimulationState, AirportGraph } from '../types';
import { airportGraph } from '../data/airportGraph';
import { getAircraftSpec } from '../data/aircraftTypes';
import { routeToEdges } from '../simulation/pathfinding';

interface Props {
  state: SimulationState;
  graph?: AirportGraph;
}

const STATUS_VI: Record<string, string> = {
  parked:   'ĐỖ',
  waiting:  'CHỜ LĂN',
  taxiing:  'LĂN BÁNH',
  holding:  'GIỮ NGUYÊN',
  stopped:  'DỪNG LẠI',
  arrived:  'ĐÃ ĐẾN',
  departed: 'ĐÃ CẤT CÁNH',
};

const TIME_VI: Record<string, string> = {
  morning:   'Buổi sáng',
  afternoon: 'Buổi chiều',
  night:     'Ban đêm',
};

const TRAFFIC_VI: Record<string, string> = {
  low:    'Thấp',
  medium: 'Trung bình (-25% tốc độ)',
  high:   'Cao (-45% tốc độ)',
};

const INCIDENT_VI: Record<string, string> = {
  none:                   'Bình thường (Không có sự cố)',
  blocked_taxiway:        'Đường lăn bị chặn',
  vehicle_crossing:       'Phương tiện cắt ngang',
  runway_incursion:       'Nguy cơ xâm phạm đường băng',
  low_visibility:         'Tầm nhìn hạn chế (LVC)',
  aircraft_stopped_ahead: 'Máy bay dừng phía trước',
};

export default function StatusPanel({ state, graph = airportGraph }: Props) {
  const { config, elapsedSeconds, etaSeconds, warningMessage } = state;
  const currentGraph = graph || airportGraph;

  const isScenarioMode = Boolean(state.scenario || (state.scenarioAircraft && state.scenarioAircraft.length > 0));
  const scenarioFleet = state.scenarioAircraft || [];

  // Lấy đúng máy bay đang được chọn trong Manual Fleet hoặc Primary Aircraft
  const activeAircraft = (state.manualFleet && state.manualFleet.length > 0)
    ? (state.manualFleet.find(a => a.id === (state.selectedAircraftId || 'VN001')) || state.manualFleet[0])
    : state.aircraft;

  const routeEdgeIds = activeAircraft?.assignedRoute
    ? (routeToEdges(activeAircraft.assignedRoute, currentGraph.edges) ?? [])
    : [];

  const currentEdge = activeAircraft?.currentEdgeId
    ? currentGraph.edges.find(e => e.id === activeAircraft.currentEdgeId)
    : null;

  const routeNodeLabels = activeAircraft?.assignedRoute.map(id => {
    const n = currentGraph.nodes.find(node => node.id === id);
    return n?.label || id;
  }) ?? [];

  // Hợp nhất logs từ scenario và manual
  const allLogs = isScenarioMode && state.scenario?.events
    ? state.scenario.events.map((e: any, idx: number) => ({
        id: `sc_${idx}`,
        atSeconds: e.atSeconds,
        message: e.message,
        severity: e.severity || 'info',
      }))
    : state.liveEventLog || [];

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          {isScenarioMode ? 'TRẠNG THÁI TRỰC TIẾP (KỊCH BẢN)' : 'TRẠNG THÁI TRỰC TIẾP'}
        </h2>
        {!isScenarioMode && activeAircraft && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
            {activeAircraft.callsign}
          </span>
        )}
        {isScenarioMode && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
            {scenarioFleet.length} TÀU BAY
          </span>
        )}
      </div>

      {warningMessage && (
        <div className="bg-red-950/70 border border-red-500 text-red-200 rounded-lg px-3 py-2 text-xs font-semibold leading-relaxed animate-pulse flex items-start gap-1.5">
          <span>⚠</span>
          <span>{warningMessage}</span>
        </div>
      )}

      {/* ── SCENARIO MODE FLEET STATUS ────────────────────────────────────────── */}
      {isScenarioMode && (
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-widest text-[#4a5a6e] font-semibold">
            Đội bay kịch bản ({scenarioFleet.length})
          </div>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
            {scenarioFleet.map((ac: any) => {
              const isHolding = ac.status === 'holding' || ac.speedKts === 0;
              const hasStopBar = ac.holdReason === 'stop-bar';
              return (
                <div
                  key={ac.id}
                  className={`flex flex-col gap-1 p-2 rounded-lg border transition ${
                    isHolding
                      ? 'bg-[#220e10] border-red-700/80 shadow'
                      : 'bg-[#0d1318] border-[#1e2838]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold text-xs text-white">{ac.callsign}</span>
                      {ac.scenarioLabel && (
                        <span className="text-[9px] px-1 rounded bg-red-900 text-red-200 font-bold">
                          {ac.scenarioLabel}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={ac.status} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Vị trí: <span className="text-cyan-300 font-mono">{ac.currentNodeId}</span></span>
                    <span>Tốc độ: <span className="text-green-400 font-mono">{ac.speedKts || 0} kts</span></span>
                  </div>

                  {hasStopBar && (
                    <div className="text-[10px] font-bold text-red-300 bg-red-950/80 border border-red-800 rounded px-1.5 py-0.5 mt-0.5 flex items-center gap-1">
                      <span>⛔</span> STOP BAR — {ac.callsign === 'TG302' ? 'NHƯỜNG VN301' : 'DỪNG LẠI'}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500 font-mono truncate">
                    Tuyến: {ac.assignedRoute?.slice(0, 4).join(' › ')} ... › {ac.targetNodeId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MANUAL MODE SINGLE AIRCRAFT STATUS ───────────────────────────────── */}
      {!isScenarioMode && !activeAircraft && (
        <div className="text-gray-500 text-xs italic">Chưa có tàu bay nào được chọn.</div>
      )}

      {!isScenarioMode && activeAircraft && (
        <>
          <StatusGrid items={[
            { label: 'Mã hiệu',        value: `${activeAircraft.callsign} (${activeAircraft.airlineName || activeAircraft.airlineCode || 'VN'})` },
            { label: 'Loại tàu bay',   value: `${activeAircraft.aircraftType || config.aircraftType} (${getAircraftSpec(activeAircraft.aircraftType || config.aircraftType).category})` },
            { label: 'Trạng thái',     value: <StatusBadge status={activeAircraft.status} /> },
            { label: 'Tốc độ',         value: `${activeAircraft.speedKts.toFixed(1)} kts` },
            { label: 'Vị trí / Đoạn',   value: currentEdge ? currentEdge.id : `${activeAircraft.currentNodeId} (Stand)` },
            { label: 'Thời gian đã chạy', value: formatTime(elapsedSeconds) },
            { label: 'Thời gian còn lại', value: etaSeconds != null ? formatTime(etaSeconds) : (activeAircraft.status === 'parked' ? 'Chưa bắt đầu' : '—') },
          ]} />

          {/* Môi trường & Sự cố */}
          <div className="border-t border-[#1e2838] pt-2">
            <div className="text-xs uppercase tracking-widest text-[#4a5a6e] mb-1 font-semibold">Môi trường & Sự cố</div>
            <StatusGrid items={[
              { label: 'Thời tiết',      value: <WeatherBadge weather={config.weather} /> },
              { label: 'Thời điểm',      value: TIME_VI[config.timeOfDay] ?? config.timeOfDay },
              { label: 'Lưu lượng',      value: TRAFFIC_VI[config.trafficLevel] ?? config.trafficLevel },
              { label: 'Đoạn bị chặn',   value: <span className="text-red-400 font-bold">{state.blockedEdgeIds.size} đoạn</span> },
              { label: 'Sự cố hiện tại', value: INCIDENT_VI[config.incident] ?? config.incident },
            ]} />
          </div>

          {/* Tuyến đường đang đi */}
          <div className="border-t border-[#1e2838] pt-2">
            <div className="text-xs uppercase tracking-widest text-[#4a5a6e] mb-1 font-semibold flex items-center justify-between">
              <span>Tuyến đường ({routeEdgeIds.length} đoạn lăn)</span>
              <span className="text-[10px] font-mono text-cyan-400">
                {activeAircraft.currentNodeId} → {activeAircraft.targetNodeId}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 bg-[#0a0e14] p-1.5 rounded-lg border border-[#1e2838]">
              {routeNodeLabels.length > 0 ? (
                routeNodeLabels.map((label, i) => (
                  <Fragment key={i}>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                        i === activeAircraft.routeEdgeIndex && activeAircraft.status === 'taxiing'
                          ? 'bg-cyan-600 text-white font-bold shadow'
                          : i < activeAircraft.routeEdgeIndex
                          ? 'bg-[#151d28] text-gray-500'
                          : 'bg-[#1a2230] text-gray-300'
                      }`}
                    >
                      {label}
                    </span>
                    {i < routeNodeLabels.length - 1 && (
                      <span className="text-gray-600 self-center text-[10px]">›</span>
                    )}
                  </Fragment>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">Chưa tạo lộ trình</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── NHẬT KÝ SỰ KIỆN TRỰC TIẾP (DÙNG CHUNG) ────────────────────────────── */}
      <div className="border-t border-[#1e2838] pt-2">
        <div className="text-xs uppercase tracking-widest text-[#4a5a6e] mb-1 font-semibold flex items-center justify-between">
          <span>Nhật ký trực tiếp</span>
          <span className="text-[10px] text-gray-500 font-mono">
            {allLogs.length} sự kiện
          </span>
        </div>
        <div className="flex flex-col gap-1 font-mono text-[11px] max-h-28 overflow-y-auto pr-1">
          {allLogs.slice().reverse().map((log: any) => (
            <div key={log.id} className="flex items-start gap-1.5 leading-snug">
              <span className="text-gray-500 font-bold flex-shrink-0">
                [{formatTime(log.atSeconds)}]
              </span>
              <span className={
                log.severity === 'critical'
                  ? 'text-red-400 font-bold'
                  : log.severity === 'warning'
                  ? 'text-amber-400 font-semibold'
                  : 'text-gray-300'
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {items.map(item => (
        <div key={item.label} className="flex flex-col">
          <span className="text-gray-500 text-[11px]">{item.label}</span>
          <span className="text-gray-100 text-xs font-mono font-medium truncate">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    parked:   'bg-slate-700 text-slate-200 border border-slate-600',
    waiting:  'bg-gray-700 text-gray-300 border border-gray-600',
    taxiing:  'bg-green-800 text-green-200 border border-green-600',
    holding:  'bg-red-900 text-red-200 border border-red-600 animate-pulse font-bold',
    stopped:  'bg-red-900 text-red-200 border border-red-600',
    arrived:  'bg-blue-800 text-blue-200 border border-blue-600',
    departed: 'bg-indigo-800 text-indigo-200 border border-indigo-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${colors[status] ?? 'bg-gray-700 text-gray-300'}`}>
      ● {STATUS_VI[status] ?? status.toUpperCase()}
    </span>
  );
}

function WeatherBadge({ weather }: { weather: string }) {
  const labels: Record<string, string> = {
    clear:        '☀ Quang đãng',
    rain:         '🌧 Mưa',
    fog:          '🌫 Sương mù (LVC)',
    thunderstorm: '⛈ Dông bão',
  };
  return <span>{labels[weather] ?? weather}</span>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
