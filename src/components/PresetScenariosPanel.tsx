// Preset Scenarios Side Panel — 100% parity with Vercel Production UI

import { useState } from 'react';
import { PRESET_SCENARIO_DEFS, type ScenarioAircraft } from '../data/presetScenarios';
import type { SimulationState } from '../types';

interface Props {
  state: SimulationState;
  onStartScenario: (scenarioId: string) => void;
  onExitScenario: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `[${m}:${s.toString().padStart(2, '0')}]`;
}

function getRoleBadge(ac: ScenarioAircraft) {
  if (ac.radioFailure) {
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-900/60 border border-purple-400 text-purple-200">MẤT LIÊN LẠC</span>;
  }
  if (ac.role === 'emergency' || ac.scenarioLabel === 'KHẨN NGUY') {
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">KHẨN NGUY</span>;
  }
  if (ac.role === 'pushback' || ac.scenarioLabel === 'PUSHBACK') {
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white">PUSHBACK</span>;
  }
  if (ac.role === 'arriving') {
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">Hạ cánh</span>;
  }
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">Cất cánh</span>;
}

function getStatusBadge(ac: ScenarioAircraft) {
  if (ac.status === 'departed') {
    return <span className="text-gray-400 text-xs font-semibold">ĐÃ CẤT CÁNH</span>;
  }
  if (ac.status === 'arrived') {
    return <span className="text-emerald-400 text-xs font-semibold">ĐÃ ĐẾN</span>;
  }
  if (ac.status === 'stopped' || ac.status === 'holding') {
    return <span className="text-amber-400 text-xs font-semibold">GIỮ NGUYÊN</span>;
  }
  if (ac.status === 'waiting') {
    return <span className="text-gray-400 text-xs font-semibold">CHỜ LĂN</span>;
  }
  return <span className="text-blue-400 text-xs font-semibold">LĂN BÁNH</span>;
}

export default function PresetScenariosPanel({ state, onStartScenario, onExitScenario }: Props) {
  const [showList, setShowList] = useState(false);
  const scenarioList = Object.values(PRESET_SCENARIO_DEFS);

  const scenarioState = state.scenario;
  const activeDef = scenarioState ? PRESET_SCENARIO_DEFS[scenarioState.id] : null;

  // Active scenario detail view
  if (scenarioState && activeDef && !showList) {
    const fleet = state.scenarioAircraft ?? [];
    const latestEvent = scenarioState.events.length > 0
      ? scenarioState.events[scenarioState.events.length - 1]
      : null;

    return (
      <div className="flex flex-col gap-3 p-3.5 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200">
        {/* Header & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-white leading-snug">
              {scenarioState.title}
            </h2>
          </div>
          {scenarioState.completed ? (
            <span className="px-2 py-0.5 rounded bg-emerald-600/90 text-white font-bold text-xs uppercase flex-shrink-0">
              HOÀN TẤT
            </span>
          ) : (
            <button
              onClick={onExitScenario}
              className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition flex-shrink-0"
            >
              ✕ Thoát
            </button>
          )}
        </div>

        {/* Action controls */}
        <div className="flex gap-2">
          <button
            onClick={() => onStartScenario(scenarioState.id)}
            className="flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white transition shadow-sm"
          >
            ↺ Chạy lại
          </button>
          <button
            onClick={() => setShowList(true)}
            className="flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#0d1318] border border-[#1e2838] hover:border-blue-600 text-gray-200 transition"
          >
            ≡ Đổi kịch bản
          </button>
        </div>

        {/* Box ĐIỀU CẦN QUAN SÁT */}
        {activeDef.watchFor && activeDef.watchFor.length > 0 && (
          <div className="p-3 bg-[#191308] border border-amber-800/60 rounded-xl text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold tracking-wide">
              <span>👁</span> ĐIỀU CẦN QUAN SÁT
            </div>
            <ol className="list-decimal list-inside space-y-1 text-amber-200/90 leading-relaxed pl-1">
              {activeDef.watchFor.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
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
            <span className="font-mono font-bold mr-1">{formatTime(latestEvent.atSeconds)}</span>
            <span>{latestEvent.message}</span>
          </div>
        )}

        {/* Collapsible Situation & Challenges */}
        <details className="text-xs text-gray-400 group border-t border-[#1e2838] pt-2">
          <summary className="cursor-pointer font-semibold text-gray-300 hover:text-white select-none">
            ▶ Tình huống & thách thức (chi tiết)
          </summary>
          <div className="mt-2 space-y-2 text-gray-300 pl-2">
            <div>
              <span className="text-gray-400 font-semibold">Tình huống: </span>
              {activeDef.situation}
            </div>
            {activeDef.challenges && (
              <div>
                <span className="text-gray-400 font-semibold">Thách thức:</span>
                <ul className="list-disc list-inside space-y-0.5 mt-1 pl-1">
                  {activeDef.challenges.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>

        {/* Fleet Table (ĐỘI BAY) */}
        <div className="border-t border-[#1e2838] pt-2.5 flex flex-col gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            ĐỘI BAY ({fleet.length})
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {fleet.map((ac) => (
              <div key={ac.id} className="flex items-center justify-between p-2 bg-[#0d1318] rounded-lg border border-[#1e2838]/60 text-xs">
                <div className="flex items-center gap-2">
                  {getRoleBadge(ac)}
                  <span className="font-semibold text-white font-mono">{ac.callsign}</span>
                </div>
                <div>{getStatusBadge(ac)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Log Timeline (NHẬT KÝ SỰ KIỆN) */}
        <div className="border-t border-[#1e2838] pt-2.5 flex flex-col gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            NHẬT KÝ SỰ KIỆN
          </div>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 font-mono text-[11px]">
            {scenarioState.events.slice().reverse().map((evt: any, idx: number) => (
              <div key={idx} className="flex items-start gap-1.5 text-gray-300">
                <span className="text-gray-500 font-bold flex-shrink-0">{formatTime(evt.atSeconds)}</span>
                <span className={
                  evt.severity === 'critical'
                    ? 'text-red-400'
                    : evt.severity === 'warning'
                    ? 'text-amber-400'
                    : 'text-blue-300'
                }>
                  {evt.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Selection list view
  return (
    <div className="flex flex-col gap-2 p-4 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-wide">Kịch Bản Mẫu</h2>
        {scenarioState && (
          <button
            onClick={onExitScenario}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            ✕ Thoát kịch bản
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 -mt-1 leading-relaxed">
        Mỗi kịch bản chạy tự động một đội bay có mục đích — minh họa các tình huống kiểm soát mặt đất điển hình dưới Follow the Green.
      </p>

      <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1 mt-1">
        {scenarioList.map(sc => {
          const isActive = scenarioState?.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                onStartScenario(sc.id);
                setShowList(false);
              }}
              className={`text-left rounded-xl p-3 transition border ${
                isActive
                  ? 'bg-blue-950/60 border-blue-500 shadow-md'
                  : 'bg-[#0d1318] border-[#1e2838] hover:border-blue-600 hover:bg-[#131b28]'
              }`}
            >
              <div className={`text-xs font-bold ${isActive ? 'text-blue-300' : 'text-gray-100'} leading-snug`}>
                {sc.title}
              </div>
              <div className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {sc.teaser}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
