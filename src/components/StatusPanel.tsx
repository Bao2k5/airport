// Bảng giám sát trạng thái trực tiếp — Chuẩn nhận diện Học viện Hàng không Việt Nam (VAA).

import { Fragment } from 'react';
import type { SimulationState, AirportGraph } from '../types';
import { airportGraph } from '../data/airportGraph';
import { routeToEdges } from '../simulation/pathfinding';

interface Props {
  state: SimulationState;
  graph?: AirportGraph;
}

const STATUS_VI: Record<string, string> = {
  parked:   'ĐỖ TẠI BẾN',
  waiting:  'CHỜ KHỞI HÀNH',
  taxiing:  'ĐANG LĂN BÁNH',
  holding:  'DỪNG CHỜ LỆNH',
  stopped:  'DỪNG KHẨN CẤP',
  arrived:  'ĐÃ ĐẾN NƠI',
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
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-[#E6ECF0] text-sm text-[#172033] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E6ECF0] pb-2.5">
        <h2 className="text-xs sm:text-sm font-bold text-[#0D254C] tracking-wide flex items-center gap-2 uppercase">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1C67DA] animate-pulse" />
          {isScenarioMode ? 'Trạng thái trực tiếp (Kịch bản)' : 'Trạng thái giám sát trực tiếp'}
        </h2>
        {!isScenarioMode && activeAircraft && (
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#1C67DA] border border-[#BFDBFE] font-bold">
            {activeAircraft.callsign}
          </span>
        )}
        {isScenarioMode && (
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#1C67DA] border border-[#BFDBFE] font-bold">
            {scenarioFleet.length} TÀU BAY
          </span>
        )}
      </div>

      {warningMessage && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-2xs">
          <span className="text-base leading-none text-[#D32F2F]">⚠</span>
          <span>{warningMessage}</span>
        </div>
      )}

      {/* ── SCENARIO MODE FLEET STATUS ────────────────────────────────────────── */}
      {isScenarioMode && (
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wider text-[#0D254C] font-bold flex items-center justify-between">
            <span>Đội bay kịch bản ({scenarioFleet.length})</span>
            <span className="text-[11px] text-[#64748B] font-mono">Điều phối tự động SMAN</span>
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
                      ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-xs text-[#0D254C]">{ac.callsign}</span>
                      {ac.scenarioLabel && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] font-bold border border-[#FCA5A5]">
                          {ac.scenarioLabel}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={ac.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#475569]">
                    <div>Vị trí: <span className="text-[#0D254C] font-mono font-semibold">{ac.currentNodeId}</span></div>
                    <div>Tốc độ: <span className="text-[#16845B] font-mono font-semibold">{ac.speedKts || 0} kts</span></div>
                  </div>

                  {hasStopBar && (
                    <div className="text-[10px] font-bold text-[#991B1B] bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <span>⛔</span> STOP BAR — {ac.callsign === 'TG302' ? 'NHƯỜNG VN301' : 'DỪNG LẠI'}
                    </div>
                  )}

                  <div className="text-[10px] text-[#64748B] font-mono truncate bg-white border border-[#E2E8F0] px-2 py-1 rounded">
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
        <div className="text-[#64748B] text-xs italic p-2">Chưa có tàu bay nào được chọn.</div>
      )}

      {!isScenarioMode && activeAircraft && (
        <>
          {/* Card thông tin cốt lõi */}
          <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
            <div className="flex flex-col">
              <span className="text-[#64748B] text-[11px]">Tàu bay khai thác</span>
              <span className="text-[#0D254C] text-xs font-mono font-bold truncate">
                {activeAircraft.callsign} ({activeAircraft.airlineCode || 'VN'})
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#64748B] text-[11px]">Trạng thái khai thác</span>
              <StatusBadge status={activeAircraft.status} />
            </div>
            <div className="flex flex-col">
              <span className="text-[#64748B] text-[11px]">Vị trí hiện tại</span>
              <span className="text-[#172033] text-xs font-mono font-semibold truncate">
                {currentEdge ? `Edge: ${currentEdge.id}` : `${activeAircraft.currentNodeId} (Stand)`}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#64748B] text-[11px]">Tốc độ lăn bánh</span>
              <span className="text-[#16845B] text-xs font-mono font-bold">
                {activeAircraft.speedKts.toFixed(1)} kts
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#64748B] text-[11px]">Thời gian hoạt động</span>
              <span className="text-[#334155] text-xs font-mono font-semibold">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#64748B] text-[11px]">Thời gian dự kiến (ETA)</span>
              <span className="text-[#334155] text-xs font-mono font-semibold">
                {etaSeconds != null ? formatTime(etaSeconds) : (activeAircraft.status === 'parked' ? 'Chờ lệnh' : '—')}
              </span>
            </div>
          </div>

          {/* Môi trường & Sự cố */}
          <div className="border-t border-[#E6ECF0] pt-2.5">
            <div className="text-xs uppercase tracking-wider text-[#0D254C] mb-1.5 font-bold">Điều kiện môi trường & Sự cố</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[#64748B]">Thời tiết:</span>
                <WeatherBadge weather={config.weather} />
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[#64748B]">Thời điểm:</span>
                <span className="text-[#172033] font-mono">{TIME_VI[config.timeOfDay] ?? config.timeOfDay}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[#64748B]">Mật độ:</span>
                <span className="text-[#172033] font-mono">{TRAFFIC_VI[config.trafficLevel] ?? config.trafficLevel}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[#64748B]">Bị chặn:</span>
                <span className="text-[#D32F2F] font-mono font-bold">{state.blockedEdgeIds.size} đoạn</span>
              </div>
              <div className="flex justify-between items-center py-0.5 col-span-2">
                <span className="text-[#64748B]">Sự cố:</span>
                <span className="text-[#D97706] font-mono text-[11px] font-semibold truncate">{INCIDENT_VI[config.incident] ?? config.incident}</span>
              </div>
            </div>
          </div>

          {/* Tuyến đường đang đi */}
          <div className="border-t border-[#E6ECF0] pt-2.5">
            <div className="text-xs uppercase tracking-wider text-[#0D254C] mb-1.5 font-bold flex items-center justify-between">
              <span>Tuyến lăn được cấp ({routeEdgeIds.length} đoạn)</span>
              <span className="text-[11px] font-mono text-[#1C67DA] font-bold">
                {activeAircraft.currentNodeId} → {activeAircraft.targetNodeId}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]">
              {routeNodeLabels.length > 0 ? (
                routeNodeLabels.map((label, i) => (
                  <Fragment key={i}>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        i === activeAircraft.routeEdgeIndex && activeAircraft.status === 'taxiing'
                          ? 'bg-[#1C67DA] text-white font-bold shadow-xs'
                          : i < activeAircraft.routeEdgeIndex
                          ? 'bg-[#E2E8F0] text-[#64748B]'
                          : 'bg-white border border-[#CBD5E1] text-[#334155]'
                      }`}
                    >
                      {label}
                    </span>
                    {i < routeNodeLabels.length - 1 && (
                      <span className="text-[#94A3B8] self-center text-[10px]">›</span>
                    )}
                  </Fragment>
                ))
              ) : (
                <span className="text-xs text-[#64748B] italic">Chưa tạo lộ trình</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── NHẬT KÝ SỰ KIỆN TRỰC TIẾP (DÙNG CHUNG) ────────────────────────────── */}
      <div className="border-t border-[#E6ECF0] pt-2.5">
        <div className="text-xs uppercase tracking-wider text-[#0D254C] mb-1.5 font-bold flex items-center justify-between">
          <span>Nhật ký điều hành</span>
          <span className="text-[10px] text-[#1C67DA] font-mono font-semibold">
            {allLogs.length} bản ghi
          </span>
        </div>
        <div className="flex flex-col gap-1.5 font-mono text-[11px] max-h-32 sm:max-h-36 overflow-y-auto pr-1 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
          {allLogs.length === 0 ? (
            <div className="text-[#94A3B8] text-xs italic">Chưa có sự kiện nào được ghi nhận.</div>
          ) : (
            allLogs.slice().reverse().map((log: any) => (
              <div key={log.id} className="flex items-start gap-1.5 leading-snug">
                <span className="text-[#64748B] font-bold flex-shrink-0">
                  [{formatTime(log.atSeconds)}]
                </span>
                <span className={
                  log.severity === 'critical'
                    ? 'text-[#D32F2F] font-bold'
                    : log.severity === 'warning'
                    ? 'text-[#D97706] font-semibold'
                    : 'text-[#334155]'
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
    parked:   'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]',
    waiting:  'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]',
    taxiing:  'bg-[#F0FDF4] text-[#16845B] border border-[#86EFAC]',
    holding:  'bg-[#FEF2F2] text-[#D32F2F] border border-[#FCA5A5] animate-pulse font-bold',
    stopped:  'bg-[#FEF2F2] text-[#D32F2F] border border-[#FCA5A5]',
    arrived:  'bg-[#EFF6FF] text-[#1C67DA] border border-[#BFDBFE]',
    departed: 'bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${colors[status] ?? 'bg-[#F1F5F9] text-[#475569]'}`}>
      ● {STATUS_VI[status] ?? status.toUpperCase()}
    </span>
  );
}

function WeatherBadge({ weather }: { weather: string }) {
  const labels: Record<string, string> = {
    clear:        'Quang đãng (VMC)',
    rain:         'Mưa',
    fog:          'Sương mù (LVC)',
    thunderstorm: 'Dông bão',
  };
  return <span className="text-[#172033] font-mono">{labels[weather] ?? weather}</span>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
