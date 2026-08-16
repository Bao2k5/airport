import type { SimulationState, AirportGraph } from '../types';
import { airportGraph } from '../data/airportGraph';

interface Props {
  state: SimulationState;
  graph?: AirportGraph;
}

const INCIDENT_INFO: Record<string, { title: string; desc: string; color: string; badgeBg: string }> = {
  none: {
    title: 'Hoạt động bình thường',
    desc: 'Không có sự cố trên các tuyến lăn. Toàn bộ lộ trình thông thoáng theo tín hiệu đèn dẫn đường xanh.',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
  },
  blocked_taxiway: {
    title: 'Đường lăn bị chặn',
    desc: 'Có chướng ngại vật hoặc phương tiện chặn đường lăn phía trước. Hệ thống kích hoạt vạch dừng hoặc tính toán lộ trình vòng qua Dijkstra.',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
  },
  vehicle_crossing: {
    title: 'Phương tiện cắt ngang',
    desc: 'Xe mặt đất đang băng qua đường lăn. Vạch dừng màu đỏ được bật tại giao lộ để ngăn ngừa va chạm.',
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-950/80 text-yellow-300 border-yellow-800',
  },
  runway_incursion: {
    title: 'Nguy cơ xâm phạm đường băng',
    desc: 'Cảnh báo nguy cơ xâm nhập đường cất hạ cánh trái phép. Tạm dừng toàn bộ di chuyển tại các điểm chờ lân cận.',
    color: 'text-red-400',
    badgeBg: 'bg-red-950/80 text-red-300 border-red-800',
  },
  low_visibility: {
    title: 'Tầm nhìn hạn chế (LVC)',
    desc: 'Quy trình khai thác tầm nhìn thấp đang áp dụng. Bắt buộc tuân thủ nghiêm ngặt hệ thống đèn Follow-the-Green.',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-800',
  },
  aircraft_stopped_ahead: {
    title: 'Máy bay dừng phía trước',
    desc: 'Tàu bay phía trước tạm dừng lăn bánh. Tàu bay phía sau kích hoạt vạch dừng giữ khoảng cách an toàn.',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-800',
  },
};

export default function ScenarioPanel({ state, graph = airportGraph }: Props) {
  const currentGraph = graph || airportGraph;

  // Tính số đoạn đóng tĩnh của đồ thị để tách biệt với số đoạn bị chặn động
  const staticClosedCount = currentGraph.edges.filter(
    e => e.status === 'closed' || e.status === 'restricted'
  ).length;

  const totalBlockedCount = state.blockedEdgeIds ? state.blockedEdgeIds.size : 0;
  const dynamicBlockedCount = Math.max(0, totalBlockedCount - staticClosedCount);

  // Xác định tình huống hiện tại
  const rawIncident = state.config.incident || 'none';
  const hasDynamicIncident = dynamicBlockedCount > 0 || rawIncident !== 'none';
  const incidentKey = hasDynamicIncident ? rawIncident : 'none';
  const info = INCIDENT_INFO[incidentKey] || INCIDENT_INFO.none;

  // Máy bay đang chọn hoặc máy bay bị ảnh hưởng
  const activeAircraft = (state.manualFleet && state.manualFleet.length > 0)
    ? (state.manualFleet.find(a => a.id === (state.selectedAircraftId || 'VN001')) || state.manualFleet[0])
    : state.aircraft;

  // Đoạn đường bị sự cố (nếu có)
  const incidentEdgeId = state.config.incidentEdgeId || (dynamicBlockedCount > 0 ? Array.from(state.blockedEdgeIds).find(id => {
    const e = currentGraph.edges.find(edge => edge.id === id);
    return e && e.status !== 'closed' && e.status !== 'restricted';
  }) : null);

  // Lọc lấy 4 nhật ký sự kiện liên quan nhất
  const recentLogs = (state.liveEventLog || []).slice(-4).reverse();

  return (
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-[#111620] rounded-xl border border-[#1e2838] text-sm text-gray-200 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-wide">
          THÔNG TIN TÌNH HUỐNG
        </h2>
        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded border font-bold ${info.badgeBg}`}>
          {info.title}
        </span>
      </div>

      {/* Cảnh báo mới nhất (nếu có sự cố hoặc warning) */}
      {state.warningMessage && hasDynamicIncident && (
        <div className="bg-red-950/80 border border-red-500/80 text-red-100 rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed animate-pulse flex items-start gap-2 shadow-md">
          <span className="text-sm font-bold text-red-400">⚠</span>
          <span>{state.warningMessage}</span>
        </div>
      )}

      {/* Thẻ mô tả tình huống chi tiết */}
      <div className="bg-[#0d1318] rounded-xl p-3 border border-[#1e2838] flex flex-col gap-1.5">
        <div className={`font-bold text-xs sm:text-sm ${info.color}`}>
          {info.title}
        </div>
        <div className="text-xs text-gray-300 leading-relaxed">
          {info.desc}
        </div>
      </div>

      {/* Bảng thông số giám sát chi tiết */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0a0e14] p-2 rounded-lg border border-[#1e2838] flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Tàu bay ảnh hưởng</span>
          <span className="font-mono font-bold text-cyan-300 mt-0.5">
            {hasDynamicIncident ? (activeAircraft?.callsign || 'VN001') : 'Không có (Bình thường)'}
          </span>
        </div>

        <div className="bg-[#0a0e14] p-2 rounded-lg border border-[#1e2838] flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Đoạn đường sự cố</span>
          <span className="font-mono font-bold text-amber-300 mt-0.5">
            {incidentEdgeId ? `[${incidentEdgeId}]` : 'Không có'}
          </span>
        </div>

        <div className="bg-[#0a0e14] p-2 rounded-lg border border-[#1e2838] flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Đoạn bị chặn động</span>
          <span className="font-mono font-bold text-red-400 mt-0.5">
            {dynamicBlockedCount} đoạn
          </span>
        </div>

        <div className="bg-[#0a0e14] p-2 rounded-lg border border-[#1e2838] flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Tìm đường vòng (Dijkstra)</span>
          <span className={`font-semibold mt-0.5 ${state.config.autoReroute ? 'text-emerald-400' : 'text-gray-500'}`}>
            {state.config.autoReroute ? 'Đang bật' : 'Đang tắt'}
          </span>
        </div>
      </div>

      {/* Nhật ký sự kiện liên quan */}
      {recentLogs.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-[#1e2838] pt-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Nhật ký sự cố & điều phối
          </div>
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1 bg-[#0a0e14] p-2 rounded-lg border border-[#1e2838] font-mono text-[11px]">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-1.5 leading-snug">
                <span className="text-gray-500 font-bold flex-shrink-0">
                  [{Math.floor(log.atSeconds)}s]
                </span>
                <span className={
                  log.severity === 'warning'
                    ? 'text-amber-400 font-medium'
                    : log.severity === 'critical'
                    ? 'text-red-400 font-bold'
                    : 'text-gray-300'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hệ thống đèn Follow-the-Green */}
      <div className="border-t border-[#1e2838] pt-2.5 flex flex-col gap-1.5">
        <div className="text-[11px] uppercase tracking-wider text-[#4a5a6e] font-semibold">
          Hệ thống đèn dẫn đường (Follow-the-Green)
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <LightItem color="bg-emerald-500" label="Xanh lá" desc="Đoạn đường giải phóng — máy bay được phép lăn bánh." />
          <LightItem color="bg-red-500" label="Đỏ" desc="Vạch dừng / chướng ngại vật — cấm vượt qua." />
          <LightItem color="bg-gray-600" label="Tắt" desc="Đoạn đường ngoài lộ trình được cấp phép." />
        </div>
      </div>
    </div>
  );
}

function LightItem({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-gray-300 leading-snug">
        <strong className="text-white">{label}:</strong> {desc}
      </span>
    </div>
  );
}
