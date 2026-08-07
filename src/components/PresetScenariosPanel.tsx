// Bảng Kịch Bản Mẫu — 100% khớp giao diện & logic Vercel demo

import { useState } from 'react';
import { PRESET_SCENARIO_DEFS } from '../data/presetScenarios';

interface Props {
  activeScenarioId?: string;
  onStartScenario: (scenarioId: string) => void;
  onExitScenario: () => void;
}

export default function PresetScenariosPanel({ activeScenarioId, onStartScenario, onExitScenario }: Props) {
  const [showList, setShowList] = useState(false);

  const scenarioList = Object.values(PRESET_SCENARIO_DEFS);
  const activeDef = activeScenarioId ? PRESET_SCENARIO_DEFS[activeScenarioId] : null;

  // Active state view
  if (activeDef && !showList) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-[#111620] rounded-xl border border-[#1e2838] text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-widest text-[#4a5a6e]">Đang chạy</span>
          <button
            onClick={onExitScenario}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            ✕ Thoát
          </button>
        </div>
        <div className="text-xs font-semibold text-blue-200 leading-snug">
          {activeDef.title}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onStartScenario(activeDef.id)}
            className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-white transition"
          >
            ↺ Chạy lại
          </button>
          <button
            onClick={() => setShowList(true)}
            className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-[#0d1318] border border-[#1e2838] hover:border-blue-700 text-gray-200 transition"
          >
            ☰ Đổi kịch bản
          </button>
        </div>
      </div>
    );
  }

  // Selection list view
  return (
    <div className="flex flex-col gap-2 p-4 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-wide">Kịch Bản Mẫu</h2>
        {activeScenarioId && (
          <button
            onClick={onExitScenario}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            ✕ Thoát kịch bản
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 -mt-1">
        Mỗi kịch bản chạy tự động một đội bay có mục đích — minh họa các tình huống kiểm soát mặt đất điển hình dưới Follow the Green.
      </p>

      <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto pr-1">
        {scenarioList.map(sc => {
          const isActive = sc.id === activeScenarioId;
          return (
            <button
              key={sc.id}
              onClick={() => {
                onStartScenario(sc.id);
                setShowList(false);
              }}
              className={`text-left rounded-lg px-3 py-2 transition border ${
                isActive
                  ? 'bg-blue-900/50 border-blue-500'
                  : 'bg-[#0d1318] border-[#1e2838] hover:border-blue-700 hover:bg-[#131b28]'
              }`}
            >
              <div className={`text-xs font-semibold ${isActive ? 'text-blue-200' : 'text-gray-100'}`}>
                {sc.title}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                {sc.teaser}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
