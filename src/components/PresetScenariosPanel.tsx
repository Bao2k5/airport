import { useState, useMemo } from 'react';
import type { ScenarioState } from '../data/presetScenarios';
import { getPresetScenarioDefs } from '../data/presetScenarios';
import { airportGraphV3 } from '../data/airportGraph.v3';
import { useActionLock } from '../utils/useActionLock';
import type { AirportGraph, SimulationState } from '../types';
import { Play, LoaderCircle } from 'lucide-react';

interface Props {
  state?: SimulationState;
  scenarioState?: ScenarioState | null;
  onStartScenario: (id: string) => void;
  onExitScenario?: () => void;
  onPause?: () => void;
  onSimSpeedChange?: (speed: number) => void;
  onAircraftSpeedChange?: (aircraftId: string, speedKts: number) => void;
  graph?: AirportGraph;
  simSpeed?: number;
  isPaused?: boolean;
}

export default function PresetScenariosPanel({
  state,
  scenarioState,
  onStartScenario,
  onExitScenario,
  onPause,
  onSimSpeedChange,
  onAircraftSpeedChange,
  graph = airportGraphV3,
  simSpeed = 1,
  isPaused = false,
}: Props) {
  const { executeAction, getActionState } = useActionLock(2000);
  const [showList, setShowList] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('lvc_wrong_turn_radio_failure');
  const [expandedCardId, setExpandedCardId] = useState<string | null>('lvc_wrong_turn_radio_failure');

  const currentScenarioState: ScenarioState | null = scenarioState !== undefined
    ? scenarioState
    : state?.scenario || null;

  const SCENARIO_DEFS = getPresetScenarioDefs(graph);
  const defs = Object.values(SCENARIO_DEFS);
  const activeDef = currentScenarioState
    ? SCENARIO_DEFS[currentScenarioState.id] || defs[0]
    : SCENARIO_DEFS[selectedId] || defs[0];

  const latestEvent = currentScenarioState && currentScenarioState.events.length > 0
    ? currentScenarioState.events[currentScenarioState.events.length - 1]
    : null;

  // Tính số lượng máy bay cho từng kịch bản
  const aircraftCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const def of defs) {
      try {
        const setupRes = def.setup(graph);
        counts[def.id] = setupRes.aircraft ? setupRes.aircraft.length : 1;
      } catch {
        counts[def.id] = 1;
      }
    }
    return counts;
  }, [defs, graph]);

  const handleCardClick = (id: string) => {
    setSelectedId(id);
    setExpandedCardId(prev => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-[#E6ECF0] text-sm text-[#172033] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E6ECF0] pb-2.5">
        <h2 className="text-xs sm:text-sm font-bold text-[#0D254C] tracking-wide uppercase">
          Kịch bản mô phỏng huấn luyện
        </h2>
        {currentScenarioState && (
          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md font-bold border ${
            isPaused
              ? 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]'
              : currentScenarioState.completed
              ? 'bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC]'
              : 'bg-[#EFF6FF] text-[#1C67DA] border-[#BFDBFE]'
          }`}>
            {isPaused ? '⏸ TẠM DỪNG' : currentScenarioState.completed ? 'HOÀN TẤT' : 'ĐANG CHẠY'}
          </span>
        )}
      </div>

      {/* ── KHI SCENARIO ĐANG HOẠT ĐỘNG VÀ KHÔNG Ở CHẾ ĐỘ CHỌN LẠI ── */}
      {currentScenarioState && !showList && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-[#0D254C] text-sm">{currentScenarioState.title}</span>
              <span className="text-[10px] font-mono text-[#1C67DA] font-bold mt-0.5">Tốc độ kịch bản: {simSpeed}x ({15 * simSpeed} kts tương đương)</span>
            </div>
            {onExitScenario && (
              <button
                onClick={onExitScenario}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1] transition flex-shrink-0 cursor-pointer shadow-2xs"
              >
                ✕ Thoát
              </button>
            )}
          </div>

          {/* ── BỘ ĐIỀU KHIỂN TẠM DỪNG & TỐC ĐỘ KỊCH BẢN (KỊCH BẢN 4) ── */}
          <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#0D254C] uppercase tracking-wider">
                ⚡ Điều khiển tốc độ & Tạm dừng
              </span>
              {onPause && (
                <button
                  onClick={onPause}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isPaused
                      ? 'bg-[#16A34A] hover:bg-[#15803D] text-white border-[#15803D]'
                      : 'bg-[#EAB308] hover:bg-[#CA8A04] text-slate-900 border-[#CA8A04]'
                  }`}
                >
                  {isPaused ? '▶ Tiếp tục kịch bản' : '⏸ Tạm dừng kịch bản'}
                </button>
              )}
            </div>

            {/* Bộ chuyển đổi tốc độ mô phỏng nhanh */}
            {onSimSpeedChange && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#475569] font-medium">Tốc độ chạy:</span>
                {[0.5, 1, 2, 5, 10].map(spd => (
                  <button
                    key={`scenario-spd-${spd}`}
                    onClick={() => onSimSpeedChange(spd)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      simSpeed === spd
                        ? 'bg-[#1C67DA] text-white border-[#1C67DA] shadow-xs'
                        : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}

            {/* Thay đổi tốc độ trực tiếp từng tàu bay trong kịch bản */}
            {state?.scenarioAircraft && state.scenarioAircraft.length > 0 && onAircraftSpeedChange && (
              <div className="flex flex-col gap-1.5 mt-1 border-t border-[#E2E8F0] pt-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">
                  Tùy chỉnh tốc độ từng tàu bay (kts):
                </span>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {state.scenarioAircraft.map(ac => (
                    <div key={ac.id} className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#0D254C]">{ac.callsign}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {ac.speedKts.toFixed(0)} kts
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onAircraftSpeedChange(ac.id, Math.max(0, ac.speedKts - 5))}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[10px]"
                          title="Giảm 5 kts"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => onAircraftSpeedChange(ac.id, 15)}
                          className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[10px]"
                          title="15 kts (Chuẩn LVC)"
                        >
                          15
                        </button>
                        <button
                          onClick={() => onAircraftSpeedChange(ac.id, 25)}
                          className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[10px]"
                          title="25 kts (Tốc độ cao)"
                        >
                          25
                        </button>
                        <button
                          onClick={() => onAircraftSpeedChange(ac.id, ac.speedKts + 5)}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[10px]"
                          title="Tăng 5 kts"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action controls */}
          <div className="flex gap-2">
            <button
              onClick={() => executeAction('rerun_scenario', () => onStartScenario(currentScenarioState.id))}
              disabled={getActionState('rerun_scenario').isPending}
              className="flex-1 text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl bg-[#0D254C] hover:bg-[#173A73] active:bg-[#091B38] disabled:bg-[#E2E8F0] text-white transition shadow-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{getActionState('rerun_scenario').isPending ? '⏳' : '↺'}</span>
              {getActionState('rerun_scenario').isPending
                ? 'Đang xử lý…'
                : getActionState('rerun_scenario').canRetry
                ? 'Thử lại'
                : 'Chạy lại'}
            </button>
            <button
              data-testid="change-scenario-btn"
              onClick={() => setShowList(true)}
              className="flex-1 text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#334155] transition min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              Đổi kịch bản
            </button>
          </div>

            {/* Box THÁCH THỨC */}
          {activeDef.challenges && activeDef.challenges.length > 0 && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs flex flex-col gap-1.5 shadow-2xs">
              <div className="text-[#1E40AF] font-bold tracking-wider uppercase text-[11px]">
                Thách thức vận hành
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#1E3A8A] leading-relaxed pl-1">
                {activeDef.challenges.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Real-time alert banner */}
          {latestEvent && (
            <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
              latestEvent.severity === 'critical'
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                : latestEvent.severity === 'warning'
                ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#92400E]'
                : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
            }`}>
              <span className="font-mono font-bold mr-1">[{formatTime(latestEvent.atSeconds)}]</span>
              <span>{latestEvent.message}</span>
            </div>
          )}

          {/* Event Log Timeline */}
          <div className="border-t border-[#E6ECF0] pt-2.5 flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0D254C]">
              Nhật ký sự kiện ({currentScenarioState.events.length})
            </div>
            <div className="flex flex-col gap-1.5 max-h-36 sm:max-h-40 overflow-y-auto pr-1 font-mono text-[11px] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
              {currentScenarioState.events.slice().reverse().map((evt: any, idx: number) => (
                <div key={idx} className="flex items-start gap-1.5 text-[#334155]">
                  <span className="text-[#64748B] font-bold flex-shrink-0">[{formatTime(evt.atSeconds)}]</span>
                  <span className={
                    evt.severity === 'critical'
                      ? 'text-[#D32F2F] font-bold'
                      : evt.severity === 'warning'
                      ? 'text-[#D97706] font-semibold'
                      : 'text-[#334155]'
                  }>
                    {evt.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DANH SÁCH 7 CARD KỊCH BẢN MẪU (CHẾ ĐỘ CHỌN) ── */}
      {(!currentScenarioState || showList) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-[#0D254C] font-bold uppercase tracking-wider">
            <span>Danh sách kịch bản ({defs.length})</span>
            {showList && currentScenarioState && (
              <button
                onClick={() => setShowList(false)}
                className="text-xs text-[#1C67DA] hover:underline font-bold cursor-pointer"
              >
                Trở lại kịch bản đang chạy
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 md:max-h-[68vh] md:overflow-y-auto pr-1">
            {defs.map((def, idx) => {
              const isSelected = def.id === selectedId;
              const isExpanded = expandedCardId === def.id || isSelected;
              const isRunningThis = currentScenarioState?.id === def.id;
              const acCount = aircraftCounts[def.id] || 1;

              return (
                <div
                  key={def.id}
                  data-testid={`scenario-${idx + 1}`}
                  onClick={() => handleCardClick(def.id)}
                  className={`relative p-3.5 rounded-xl border transition-all duration-200 ease-out cursor-pointer flex flex-col gap-2 group ${
                    isSelected
                      ? 'bg-white border-[#1C67DA] shadow-md ring-2 ring-[#1C67DA]/30 md:scale-[1.01] z-20'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white md:hover:scale-[1.01] md:hover:z-10'
                  }`}
                >
                  {/* Tiêu đề & Header Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#1C67DA] uppercase tracking-wider">
                          Kịch bản {idx + 1}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-[#475569] border border-[#CBD5E1] font-semibold">
                          {acCount} tàu bay
                        </span>
                      </div>
                      <h3 className="font-bold text-[#0D254C] text-xs sm:text-sm leading-snug group-hover:text-[#1C67DA] transition">
                        {def.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isRunningThis ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] font-bold animate-pulse">
                          Đang chạy
                        </span>
                      ) : isSelected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0D254C] text-white font-bold">
                          Đang chọn
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Teaser thu gọn (1 dòng) */}
                  <p className={`text-xs text-[#5A6A80] leading-relaxed ${isExpanded ? 'line-clamp-2' : 'line-clamp-1'}`}>
                    {def.teaser}
                  </p>

                  {/* ── NỘI DUNG MỞ RỘNG (KHI CHỌN HOẶC MỞ RỘNG CARD) ── */}
                  {isExpanded && (
                    <div className="flex flex-col gap-2.5 pt-2 mt-1 border-t border-[#E6ECF0]">
                      {/* Thách thức vận hành */}
                      {def.challenges && def.challenges.length > 0 && (
                        <div className="text-xs text-[#1E40AF] bg-[#EFF6FF] p-2 rounded-lg border border-[#BFDBFE] leading-relaxed">
                          <strong className="text-[#1E3A8A] block mb-1">Thách thức:</strong>
                          <ul className="list-disc list-inside space-y-0.5 text-[#1E3A8A] pl-0.5">
                            {def.challenges.slice(0, 2).map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Nút bấm khởi chạy trực tiếp từ Card */}
                      <div className="pt-1">
                        <button
                          type="button"
                          data-testid={`start-scenario-btn-${def.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            executeAction('start_scenario', async () => {
                              setShowList(false);
                              onStartScenario(def.id);
                            });
                          }}
                          disabled={getActionState('start_scenario').isPending}
                          className="w-full py-2.5 px-4 rounded-[10px] bg-[#06B6D4] hover:bg-[#22D3EE] active:bg-[#0891B2] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                        >
                          {getActionState('start_scenario').isPending ? (
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span>
                            {getActionState('start_scenario').isPending
                              ? 'Đang xử lý…'
                              : getActionState('start_scenario').canRetry
                              ? 'Thử lại bắt đầu'
                              : `Chạy kịch bản: ${def.title}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
