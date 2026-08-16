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
}

export default function PresetScenariosPanel({
  state,
  scenarioState,
  onStartScenario,
  onExitScenario,
  graph = airportGraph,
}: Props) {
  const { executeAction, getActionState } = useActionLock(2000);
  const [showList, setShowList] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('emergency_priority');
  const [expandedCardId, setExpandedCardId] = useState<string | null>('emergency_priority');

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
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-wide">
          KỊCH BẢN MÔ PHỎNG
        </h2>
        {currentScenarioState && (
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
            {currentScenarioState.completed ? 'HOÀN TẤT' : 'ĐANG CHẠY'}
          </span>
        )}
      </div>

      {/* ── KHI SCENARIO ĐANG HOẠT ĐỘNG VÀ KHÔNG Ở CHẾ ĐỘ CHỌN LẠI ── */}
      {currentScenarioState && !showList && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">{currentScenarioState.title}</span>
            {onExitScenario && (
              <button
                onClick={onExitScenario}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition flex-shrink-0 cursor-pointer"
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
              className="flex-1 text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 active:bg-blue-800 disabled:bg-gray-700 text-white transition shadow-md min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{getActionState('rerun_scenario').isPending ? '⏳' : '↺'}</span>
              {getActionState('rerun_scenario').isPending
                ? 'Đang xử lý…'
                : getActionState('rerun_scenario').canRetry
                ? 'Thử lại'
                : 'Chạy lại'}
            </button>
            <button
              onClick={() => setShowList(true)}
              className="flex-1 text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl bg-[#0d1318] border border-[#1e2838] hover:border-blue-600 text-gray-200 transition min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Đổi kịch bản
            </button>
          </div>

          {/* ── TIÊU CHÍ KIỂM THỬ BẮT BUỘC (ĐIỀU CẦN QUAN SÁT RUNTIME) ── */}
          {currentObservations.length > 0 && (
            <div className="p-3 bg-[#15120c] border border-amber-800/80 rounded-xl text-xs flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-amber-400 font-bold tracking-wide">
                  ĐIỀU CẦN QUAN SÁT (TIÊU CHÍ RUNTIME)
                </div>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                  passedCount === totalCount
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
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
                      className={`p-2 rounded-lg border flex flex-col gap-1 transition ${
                        isPass
                          ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
                          : isFail
                          ? 'bg-red-950/50 border-red-700/80 text-red-200'
                          : 'bg-[#1e1710] border-amber-900/60 text-amber-200/90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 leading-snug">
                          <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                          <span className="font-medium text-[11px]">{obs.text}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono flex-shrink-0 flex items-center gap-0.5 ${
                          isPass
                            ? 'bg-emerald-800 text-emerald-100'
                            : isFail
                            ? 'bg-red-800 text-red-100'
                            : 'bg-amber-900/80 text-amber-200'
                        }`}>
                          {isPass ? 'ĐẠT' : isFail ? 'SAI' : 'CHƯA ĐẠT'}
                        </span>
                      </div>

                      {obs.evidence && (
                        <div className="font-mono text-[10px] pl-4 text-gray-400 bg-[#0d1017] p-1 rounded border border-[#1e2838]/60 flex items-center justify-between">
                          <span className="truncate">Bằng chứng: {obs.evidence}</span>
                          {obs.checkedAtSeconds != null && (
                            <span className="text-gray-500 font-bold ml-1 flex-shrink-0">
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
            <div className="p-3 bg-[#0d1726] border border-blue-800/60 rounded-xl text-xs flex flex-col gap-1.5 shadow-sm">
              <div className="text-blue-400 font-bold tracking-wide">
                THÁCH THỨC VẬN HÀNH
              </div>
              <ul className="list-disc list-inside space-y-1 text-blue-200/90 leading-relaxed pl-1">
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
                ? 'bg-red-950/60 border-red-800/80 text-red-200'
                : latestEvent.severity === 'warning'
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                : 'bg-blue-950/60 border-blue-800/80 text-blue-200'
            }`}>
              <span className="font-mono font-bold mr-1">[{formatTime(latestEvent.atSeconds)}]</span>
              <span>{latestEvent.message}</span>
            </div>
          )}

          {/* Tình huống chi tiết */}
          <div className="text-xs text-gray-300 border-t border-[#1e2838] pt-2">
            <span className="text-gray-400 font-semibold">Tình huống: </span>
            <span className="leading-relaxed">{activeDef.situation}</span>
          </div>

          {/* Event Log Timeline */}
          <div className="border-t border-[#1e2838] pt-2.5 flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
              NHẬT KÝ SỰ KIỆN ({currentScenarioState.events.length})
            </div>
            <div className="flex flex-col gap-1.5 max-h-36 sm:max-h-40 overflow-y-auto pr-1 font-mono text-[11px] bg-[#0a0e14] p-2 rounded-xl border border-[#1e2838]">
              {currentScenarioState.events.slice().reverse().map((evt: any, idx: number) => (
                <div key={idx} className="flex items-start gap-1.5 text-gray-300">
                  <span className="text-gray-500 font-bold flex-shrink-0">[{formatTime(evt.atSeconds)}]</span>
                  <span className={
                    evt.severity === 'critical'
                      ? 'text-red-400 font-bold'
                      : evt.severity === 'warning'
                      ? 'text-amber-400 font-semibold'
                      : 'text-gray-300'
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
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
            <span>DANH SÁCH KỊCH BẢN ({defs.length})</span>
            {showList && currentScenarioState && (
              <button
                onClick={() => setShowList(false)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
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
                  data-testid={`scenario-card-${def.id}`}
                  onClick={() => handleCardClick(def.id)}
                  className={`relative p-3.5 rounded-xl border transition-all duration-200 ease-out cursor-pointer flex flex-col gap-2 group ${
                    isSelected
                      ? 'bg-[#131d2c] border-blue-500 shadow-lg ring-1 ring-blue-500/50 md:scale-[1.02] z-20'
                      : 'bg-[#0d1318] border-[#1e2838] hover:border-gray-600 hover:bg-[#101720] md:hover:scale-[1.02] md:hover:z-10'
                  }`}
                >
                  {/* Tiêu đề & Header Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                          Kịch bản {idx + 1}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/50 text-gray-400 border border-gray-800">
                          {acCount} tàu bay
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-xs sm:text-sm leading-snug group-hover:text-cyan-300 transition">
                        {def.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isRunningThis ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold animate-pulse">
                          Đang chạy
                        </span>
                      ) : isSelected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                          Đang chọn
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Teaser thu gọn (1 dòng) */}
                  <p className={`text-xs text-gray-400 leading-relaxed ${isExpanded ? 'line-clamp-2' : 'line-clamp-1'}`}>
                    {def.teaser}
                  </p>

                  {/* ── NỘI DUNG MỞ RỘNG (KHI CHỌN HOẶC MỞ RỘNG CARD) ── */}
                  {isExpanded && (
                    <div className="flex flex-col gap-2.5 pt-2 mt-1 border-t border-[#1e2838]/80 animate-fadeIn">
                      {/* Tình huống chi tiết */}
                      <div className="text-xs bg-[#090d14] p-2.5 rounded-lg border border-[#1e2838]/60 text-gray-300 leading-relaxed">
                        <strong className="text-white block mb-1">Tình huống:</strong>
                        {def.situation}
                      </div>

                      {/* Thách thức vận hành */}
                      {def.challenges && def.challenges.length > 0 && (
                        <div className="text-xs text-blue-300 bg-[#0b1320] p-2 rounded-lg border border-blue-900/60 leading-relaxed">
                          <strong className="text-blue-200 block mb-1">Thách thức:</strong>
                          <ul className="list-disc list-inside space-y-0.5 text-blue-200/90 pl-0.5">
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
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-700 text-white font-bold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
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
