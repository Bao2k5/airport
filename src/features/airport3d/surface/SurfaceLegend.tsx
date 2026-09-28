import type { SimulationState } from '../../../types';
import { AIRPORT_VISUAL as COLORS } from '../visualTokens';

export default function SurfaceLegend({ state }: { state: SimulationState }) {
  const active = Object.values(state.lightStates).filter(value => value === 'green').length;
  return <div className="pointer-events-none absolute bottom-20 right-2 max-w-64 rounded-lg border border-slate-600/50 bg-[#07111deb] px-3 py-2 text-[11px] text-slate-200 sm:bottom-2" aria-label="Trạng thái đèn FTG">
    <div className="mb-1 font-semibold text-white">{state.isPaused ? 'Tạm dừng · giữ trạng thái đèn' : active ? `FTG đang dẫn đường · ${active} đoạn` : 'FTG chưa bật · chờ trạng thái cấp tuyến'}</div>
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {[[COLORS.runwayEdgeLight, 'Biên đường băng'], [COLORS.taxiwayEdgeLight, 'Biên đường lăn'], [COLORS.ftgCenterline, 'FTG đang bật'], [COLORS.stopBar, 'Dừng / chặn']].map(([color, label]) => <span key={label} className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}
    </div>
  </div>;
}
