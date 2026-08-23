import type { SimulationState, AirportGraph } from '../types';
import { airportGraphV3 } from '../data/airportGraph.v3';

interface Props {
  state: SimulationState;
  graph?: AirportGraph;
}

const INCIDENT_INFO: Record<string, { title: string; desc: string; color: string; badgeBg: string }> = {
  none: {
    title: 'Hoạt động bình thường',
    desc: 'Không có sự cố trên các tuyến lăn. Toàn bộ lộ trình thông thoáng theo tín hiệu đèn dẫn đường xanh.',
    color: 'text-[#16845B]',
    badgeBg: 'bg-[#F0FDF4] text-[#16845B] border-[#86EFAC]',
  },
  blocked_taxiway: {
    title: 'Đường lăn bị chặn',
    desc: 'Có chướng ngại vật hoặc phương tiện chặn đường lăn phía trước. Hệ thống kích hoạt vạch dừng hoặc tính toán lộ trình vòng qua Dijkstra.',
    color: 'text-[#D97706]',
    badgeBg: 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]',
  },
  vehicle_crossing: {
    title: 'Phương tiện cắt ngang',
    desc: 'Xe mặt đất đang băng qua đường lăn. Vạch dừng màu đỏ được bật tại giao lộ để ngăn ngừa va chạm.',
    color: 'text-[#D97706]',
    badgeBg: 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]',
  },
  runway_incursion: {
    title: 'Nguy cơ xâm phạm đường băng',
    desc: 'Cảnh báo nguy cơ xâm nhập đường cất hạ cánh trái phép. Tạm dừng toàn bộ di chuyển tại các điểm chờ lân cận.',
    color: 'text-[#D32F2F]',
    badgeBg: 'bg-[#FEF2F2] text-[#D32F2F] border-[#FCA5A5]',
  },
  low_visibility: {
    title: 'Tầm nhìn hạn chế (LVC)',
    desc: 'Quy trình khai thác tầm nhìn thấp đang áp dụng. Bắt buộc tuân thủ nghiêm ngặt hệ thống đèn Follow-the-Green.',
    color: 'text-[#1C67DA]',
    badgeBg: 'bg-[#EFF6FF] text-[#1C67DA] border-[#BFDBFE]',
  },
  aircraft_stopped_ahead: {
    title: 'Máy bay dừng phía trước',
    desc: 'Tàu bay phía trước tạm dừng lăn bánh. Tàu bay phía sau kích hoạt vạch dừng giữ khoảng cách an toàn.',
    color: 'text-[#D97706]',
    badgeBg: 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]',
  },
};

export default function ScenarioPanel({ state, graph = airportGraphV3 }: Props) {
  const currentGraph = graph || airportGraphV3;

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
    <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-[#E6ECF0] text-sm text-[#172033] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E6ECF0] pb-2.5">
        <h2 className="text-xs sm:text-sm font-bold text-[#0D254C] tracking-wide uppercase">
          Thông tin tình huống khai thác
        </h2>
        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border font-bold ${info.badgeBg}`}>
          {info.title}
        </span>
      </div>

      {/* Cảnh báo mới nhất (nếu có sự cố hoặc warning) */}
      {state.warningMessage && hasDynamicIncident && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-xl px-3.5 py-2 text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-2xs">
          <span className="text-sm font-bold text-[#D32F2F]">⚠</span>
          <span>{state.warningMessage}</span>
        </div>
      )}

      {/* Thẻ mô tả tình huống chi tiết */}
      <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] flex flex-col gap-1">
        <div className={`font-bold text-xs sm:text-sm ${info.color}`}>
          {info.title}
        </div>
        <div className="text-xs text-[#475569] leading-relaxed">
          {info.desc}
        </div>
      </div>

      {/* Bảng thông số giám sát chi tiết */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] flex flex-col">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Tàu bay ảnh hưởng</span>
          <span className="font-mono font-bold text-[#0D254C] mt-0.5">
            {hasDynamicIncident ? (activeAircraft?.callsign || 'VN001') : 'Không có (Bình thường)'}
          </span>
        </div>

        <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] flex flex-col">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Đoạn đường sự cố</span>
          <span className="font-mono font-bold text-[#D97706] mt-0.5">
            {incidentEdgeId ? `[${incidentEdgeId}]` : 'Không có'}
          </span>
        </div>

        <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] flex flex-col">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Đoạn bị chặn động</span>
          <span className="font-mono font-bold text-[#D32F2F] mt-0.5">
            {dynamicBlockedCount} đoạn
          </span>
        </div>

        <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] flex flex-col">
          <span className="text-[10px] text-[#64748B] uppercase font-semibold">Đường vòng (Dijkstra)</span>
          <span className={`font-bold mt-0.5 ${state.config.autoReroute ? 'text-[#16845B]' : 'text-[#64748B]'}`}>
            {state.config.autoReroute ? 'Đang kích hoạt' : 'Tắt'}
          </span>
        </div>
      </div>

      {/* Nhật ký sự kiện liên quan */}
      {recentLogs.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-[#E6ECF0] pt-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0D254C]">
            Nhật ký sự cố & điều phối
          </div>
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] font-mono text-[11px]">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-1.5 leading-snug">
                <span className="text-[#64748B] font-bold flex-shrink-0">
                  [{Math.floor(log.atSeconds)}s]
                </span>
                <span className={
                  log.severity === 'warning'
                    ? 'text-[#D97706] font-medium'
                    : log.severity === 'critical'
                    ? 'text-[#D32F2F] font-bold'
                    : 'text-[#334155]'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hệ thống đèn Follow-the-Green */}
      <div className="border-t border-[#E6ECF0] pt-2.5 flex flex-col gap-1.5">
        <div className="text-[11px] uppercase tracking-wider text-[#0D254C] font-bold">
          Hệ thống đèn dẫn đường (Follow-the-Green)
        </div>
        <div className="flex flex-col gap-1.5 text-xs">
          <LightItem color="bg-[#16845B]" label="Xanh lá" desc="Đoạn đường giải phóng — máy bay được phép lăn bánh." />
          <LightItem color="bg-[#D32F2F]" label="Đỏ" desc="Vạch dừng / chướng ngại vật — cấm vượt qua." />
          <LightItem color="bg-[#94A3B8]" label="Tắt" desc="Đoạn đường ngoài lộ trình được cấp phép." />
        </div>
      </div>
    </div>
  );
}

function LightItem({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[#475569] leading-snug">
        <strong className="text-[#172033]">{label}:</strong> {desc}
      </span>
    </div>
  );
}
