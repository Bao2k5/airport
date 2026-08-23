// Bảng kịch bản mô phỏng mẫu — Chuẩn nhận diện Học viện Hàng không Việt Nam (VAA).

import { useState, useMemo } from 'react';
import type { ScenarioState, ScenarioObservation } from '../data/presetScenarios';
import { getPresetScenarioDefs } from '../data/presetScenarios';
import { airportGraph } from '../data/airportGraph';
import { useActionLock } from '../utils/useActionLock';
import type { AirportGraph, SimulationState } from '../types';

interface Props {
  state?: SimulationState;
  scenarioState?: ScenarioState | null;
  onStartScenario: (id: string) => void;
  onExitScenario?: () => void;
  graph?: AirportGraph;
  simSpeed?: number;
}

export default function PresetScenariosPanel({
  state,
  scenarioState,
  onStartScenario,
  onExitScenario,
  graph = airportGraph,
  simSpeed = 1,
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

  const currentObservations: ScenarioObservation[] = currentScenarioState?.observations || activeDef.observations || [];
  const passedCount = currentObservations.filter(o => o.status === 'pass').length;
  const totalCount = currentObservations.length;

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
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#1C67DA] border border-[#BFDBFE] font-bold">
            {currentScenarioState.completed ? 'HOÀN TẤT' : 'ĐANG CHẠY'}
          </span>
        )}
      </div>



      {/* ── KHI SCENARIO ĐANG HOẠT ĐỘNG VÀ KHÔNG Ở CHẾ ĐỘ CHỌN LẠI ── */}
      {currentScenarioState && !showList && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-[#0D254C] text-sm">{currentScenarioState.title}</span>
              <span className="text-[10px] font-mono text-[#1C67DA] font-bold mt-0.5">Tốc độ hiện tại: {simSpeed}x ({15 * simSpeed} kts tương đương)</span>
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

          {/* ── TIÊU CHÍ KIỂM THỬ BẮT BUỘC (ĐIỀU CẦN QUAN SÁT RUNTIME) ── */}
          {currentObservations.length > 0 && (
            <div className="p-3 bg-[#FFFBEB] border border-[#FCD34D] rounded-xl text-xs flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="text-[#92400E] font-bold tracking-wider uppercase text-[11px]">
                  Điều cần quan sát (Tiêu chí Đạt/Chưa đạt)
                </div>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  passedCount === totalCount
                    ? 'bg-[#F0FDF4] text-[#16845B] border border-[#86EFAC]'
                    : 'bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]'
                }`}>
                  {passedCount}/{totalCount} ĐẠT
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {currentObservations.map((obs, idx) => {
                  const isPass = obs.status === 'pass';
                  const isFail = obs.status === 'fail';
                  return (
                    <div
                      key={obs.id || idx}
                      className={`p-2.5 rounded-lg border flex flex-col gap-1 transition ${
                        isPass
                          ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
                          : isFail
                          ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                          : 'bg-white border-[#FDE68A] text-[#78350F]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 leading-snug">
                          <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                          <span className="font-medium text-[11px]">{obs.text}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono flex-shrink-0 flex items-center gap-0.5 ${
                          isPass
                            ? 'bg-[#16845B] text-white'
                            : isFail
                            ? 'bg-[#D32F2F] text-white'
                            : 'bg-[#E8A72B] text-white'
                        }`}>
                          {isPass ? 'ĐẠT' : isFail ? 'SAI' : 'CHƯA ĐẠT'}
                        </span>
                      </div>

                      {obs.evidence && (
                        <div className="font-mono text-[10px] pl-2 text-[#64748B] bg-[#F8FAFC] p-1 rounded border border-[#E2E8F0] flex items-center justify-between mt-1">
                          <span className="truncate">Bằng chứng: {obs.evidence}</span>
                          {obs.checkedAtSeconds != null && (
                            <span className="text-[#94A3B8] font-bold ml-1 flex-shrink-0">
                              [{obs.checkedAtSeconds.toFixed(1)}s]
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Tình huống chi tiết */}
          <div className="text-xs text-[#475569] border-t border-[#E6ECF0] pt-2">
            <span className="text-[#0D254C] font-bold">Tình huống: </span>
            <span className="leading-relaxed">{activeDef.situation}</span>
          </div>

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
                      {/* Tình huống chi tiết */}
                      <div className="text-xs bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] text-[#334155] leading-relaxed">
                        <strong className="text-[#0D254C] block mb-1">Tình huống:</strong>
                        {def.situation}
                      </div>

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
                          className="w-full py-2.5 px-4 rounded-xl bg-[#0D254C] hover:bg-[#173A73] active:bg-[#091B38] disabled:bg-[#E2E8F0] text-white font-bold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                        >
                          <span>{getActionState('start_scenario').isPending ? '⏳' : '▶'}</span>
                          {getActionState('start_scenario').isPending
                            ? 'Đang xử lý…'
                            : getActionState('start_scenario').canRetry
                            ? 'Thử lại bắt đầu'
                            : `Chạy kịch bản: ${def.title}`}
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
