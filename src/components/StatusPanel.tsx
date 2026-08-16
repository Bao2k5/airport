import { Fragment } from 'react';
import type { SimulationState, AirportGraph } from '../types';
import { airportGraph } from '../data/airportGraph';
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
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          {isScenarioMode ? 'TRẠNG THÁI TRỰC TIẾP (KỊCH BẢN)' : 'TRẠNG THÁI TRỰC TIẾP'}
        </h2>
        {!isScenarioMode && activeAircraft && (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold shadow-sm">
            {activeAircraft.callsign}
          </span>
        )}
        {isScenarioMode && (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-700 font-bold shadow-sm">
            {scenarioFleet.length} TÀU BAY
          </span>
        )}
      </div>

      {warningMessage && (
        <div className="bg-red-950/80 border border-red-500 text-red-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed animate-pulse flex items-start gap-2 shadow-lg">
          <span className="text-base leading-none">⚠</span>
          <span>{warningMessage}</span>
        </div>
      )}

      {/* ── SCENARIO MODE FLEET STATUS ────────────────────────────────────────── */}
      {isScenarioMode && (
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-widest text-[#4a5a6e] font-semibold flex items-center justify-between">
            <span>Đội bay kịch bản ({scenarioFleet.length})</span>
            <span className="text-[10px] text-gray-500">Tự động điều phối SMAN</span>
          </div>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {scenarioFleet.map((ac: any) => {
              const isHolding = ac.status === 'holding' || ac.speedKts === 0;
              const hasStopBar = ac.holdReason === 'stop-bar';
              return (
                <div
                  key={ac.id}
                  className={`flex flex-col gap-1.5 p-2.5 rounded-xl border transition ${
                    isHolding
                      ? 'bg-[#220e10] border-red-700/80 shadow'
                      : 'bg-[#0d1318] border-[#1e2838]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-xs text-white">{ac.callsign}</span>
                      {ac.scenarioLabel && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900 text-red-100 font-bold">
                          {ac.scenarioLabel}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={ac.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div>Vị trí: <span className="text-cyan-300 font-mono font-semibold">{ac.currentNodeId}</span></div>
                    <div>Tốc độ: <span className="text-green-400 font-mono font-semibold">{ac.speedKts || 0} kts</span></div>
                  </div>

                  {hasStopBar && (
                    <div className="text-[10px] font-bold text-red-300 bg-red-950/90 border border-red-800 rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <span>⛔</span> STOP BAR — {ac.callsign === 'TG302' ? 'NHƯỜNG VN301' : 'DỪNG LẠI'}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 font-mono truncate bg-[#0a0e14] px-2 py-1 rounded">
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
        <div className="text-gray-500 text-xs italic p-2">Chưa có tàu bay nào được chọn.</div>
      )}

      {!isScenarioMode && activeAircraft && (
        <>
          {/* Card thông tin cốt lõi */}
          <div className="grid grid-cols-2 gap-2 bg-[#0d1318] p-2.5 rounded-xl border border-[#1e2838]">
            <div className="flex flex-col">
              <span className="text-gray-500 text-[11px]">Tàu bay</span>
              <span className="text-cyan-300 text-xs font-mono font-bold truncate">
                {activeAircraft.callsign} ({activeAircraft.airlineCode || 'VN'})
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[11px]">Trạng thái</span>
              <StatusBadge status={activeAircraft.status} />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-[11px]">Vị trí hiện tại</span>
              <span className="text-white text-xs font-mono font-medium truncate">
                {currentEdge ? `Edge: ${currentEdge.id}` : `${activeAircraft.currentNodeId} (Stand)`}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[11px]">Tốc độ lăn</span>
              <span className="text-green-400 text-xs font-mono font-bold">
                {activeAircraft.speedKts.toFixed(1)} kts
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-[11px]">Thời gian chạy</span>
              <span className="text-gray-200 text-xs font-mono font-semibold">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[11px]">Thời gian còn lại</span>
              <span className="text-gray-200 text-xs font-mono font-semibold">
                {etaSeconds != null ? formatTime(etaSeconds) : (activeAircraft.status === 'parked' ? 'Chờ lệnh' : '—')}
              </span>
            </div>
          </div>

          {/* Môi trường & Sự cố */}
          <div className="border-t border-[#1e2838] pt-2.5">
            <div className="text-xs uppercase tracking-widest text-[#4a5a6e] mb-1.5 font-semibold">Môi trường & Sự cố</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-gray-500">Thời tiết:</span>
                <WeatherBadge weather={config.weather} />
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-gray-500">Thời điểm:</span>
                <span className="text-gray-200 font-mono">{TIME_VI[config.timeOfDay] ?? config.timeOfDay}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-gray-500">Lưu lượng:</span>
                <span className="text-gray-200 font-mono">{TRAFFIC_VI[config.trafficLevel] ?? config.trafficLevel}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-gray-500">Bị chặn:</span>
                <span className="text-red-400 font-mono font-bold">{state.blockedEdgeIds.size} đoạn</span>
              </div>
              <div className="flex justify-between items-center py-0.5 col-span-2">
                <span className="text-gray-500">Sự cố:</span>
                <span className="text-amber-400 font-mono text-[11px] truncate">{INCIDENT_VI[config.incident] ?? config.incident}</span>
              </div>
            </div>
          </div>

          {/* Tuyến đường đang đi */}
          <div className="border-t border-[#1e2838] pt-2.5">
            <div className="text-xs uppercase tracking-widest text-[#4a5a6e] mb-1.5 font-semibold flex items-center justify-between">
              <span>Lộ trình ({routeEdgeIds.length} đoạn lăn)</span>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                {activeAircraft.currentNodeId} → {activeAircraft.targetNodeId}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 bg-[#0a0e14] p-2 rounded-xl border border-[#1e2838]">
              {routeNodeLabels.length > 0 ? (
                routeNodeLabels.map((label, i) => (
                  <Fragment key={i}>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono ${
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
      <div className="border-t border-[#1e2838] pt-2.5">
        <div className="text-xs uppercase tracking-widest text-[#4a5a6e] mb-1.5 font-semibold flex items-center justify-between">
          <span>Nhật ký trực tiếp</span>
          <span className="text-[10px] text-cyan-400 font-mono font-semibold">
            {allLogs.length} sự kiện
          </span>
        </div>
        <div className="flex flex-col gap-1.5 font-mono text-[11px] max-h-32 sm:max-h-36 overflow-y-auto pr-1 bg-[#0a0e14] p-2 rounded-xl border border-[#1e2838]">
          {allLogs.length === 0 ? (
            <div className="text-gray-600 text-xs italic">Chưa có sự kiện nào.</div>
          ) : (
            allLogs.slice().reverse().map((log: any) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
