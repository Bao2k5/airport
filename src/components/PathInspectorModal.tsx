import type { Aircraft, AirportGraph } from '../types';
import { routeToEdges } from '../simulation/pathfinding';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  aircraft: Aircraft | null;
  graph: AirportGraph;
  graphId: string;
  onCaptureAuditImages?: () => void;
  isCapturing?: boolean;
}

export default function PathInspectorModal({
  isOpen,
  onClose,
  aircraft,
  graph,
  graphId,
  onCaptureAuditImages,
  isCapturing = false,
}: Props) {
  if (!isOpen || !aircraft) return null;

  const routeNodeIds = aircraft.assignedRoute || [];
  const routeEdgeIds = routeToEdges(routeNodeIds, graph.edges) || [];

  // Calculate total route distance in meters / pixels
  let totalPixelDistance = 0;
  const nodesDetail: { index: number; id: string; label: string; x: number; y: number }[] = [];
  const edgesDetail: { index: number; id: string; from: string; to: string; lengthMeters: number; valid: boolean }[] = [];
  const topologyErrors: string[] = [];

  routeNodeIds.forEach((nodeId, idx) => {
    const n = graph.nodes.find(node => node.id === nodeId);
    if (n) {
      nodesDetail.push({
        index: idx + 1,
        id: n.id,
        label: n.label || '(geometry)',
        x: n.x,
        y: n.y,
      });
      if (idx > 0) {
        const prev = nodesDetail[idx - 1];
        totalPixelDistance += Math.hypot(n.x - prev.x, n.y - prev.y);
      }
    } else {
      topologyErrors.push(`Node không tồn tại trong Graph V3: ${nodeId} (tại bước ${idx + 1})`);
    }
  });

  routeEdgeIds.forEach((edgeId, idx) => {
    const e = graph.edges.find(edge => edge.id === edgeId);
    const expectedFrom = routeNodeIds[idx];
    const expectedTo = routeNodeIds[idx + 1];

    if (!e) {
      topologyErrors.push(`Edge không tồn tại trong Graph V3: ${edgeId} (tại bước ${idx + 1})`);
      edgesDetail.push({
        index: idx + 1,
        id: edgeId,
        from: expectedFrom || '?',
        to: expectedTo || '?',
        lengthMeters: 0,
        valid: false,
      });
    } else {
      const isValidConn =
        (e.fromNodeId === expectedFrom && e.toNodeId === expectedTo) ||
        (e.bidirectional && e.fromNodeId === expectedTo && e.toNodeId === expectedFrom);
      if (!isValidConn) {
        topologyErrors.push(`Edge ${edgeId} nối sai thứ tự: kỳ vọng ${expectedFrom} -> ${expectedTo}, thực tế ${e.fromNodeId} -> ${e.toNodeId}`);
      }
      edgesDetail.push({
        index: idx + 1,
        id: e.id,
        from: expectedFrom,
        to: expectedTo,
        lengthMeters: e.lengthMeters || (e as any).weight || 10,
        valid: isValidConn,
      });
    }
  });

  const totalLengthM = edgesDetail.reduce((acc, cur) => acc + cur.lengthMeters, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0B1528] border border-[#1E3A8A] text-[#F8FAFC] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#08182E] border-b border-[#1E3A8A]">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Path Inspector Graph V3
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40">
                  {aircraft.callsign}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
                  GRAPH: {graphId.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Nguồn dữ liệu: <span className="text-[#38BDF8] font-mono">v3_coordinates_new.json</span> (Nền: /anhchinh.png)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#112240] p-3 rounded-xl border border-[#1E3A8A]/60">
              <span className="text-[11px] text-[#94A3B8] block">Điểm xuất phát</span>
              <span className="text-sm font-bold text-[#34D399] font-mono">{aircraft.currentNodeId}</span>
            </div>
            <div className="bg-[#112240] p-3 rounded-xl border border-[#1E3A8A]/60">
              <span className="text-[11px] text-[#94A3B8] block">Điểm kết thúc</span>
              <span className="text-sm font-bold text-[#F87171] font-mono">{aircraft.targetNodeId}</span>
            </div>
            <div className="bg-[#112240] p-3 rounded-xl border border-[#1E3A8A]/60">
              <span className="text-[11px] text-[#94A3B8] block">Quy mô tuyến</span>
              <span className="text-sm font-bold text-white font-mono">
                {nodesDetail.length} nodes / {edgesDetail.length} edges
              </span>
            </div>
            <div className="bg-[#112240] p-3 rounded-xl border border-[#1E3A8A]/60">
              <span className="text-[11px] text-[#94A3B8] block">Tổng chiều dài</span>
              <span className="text-sm font-bold text-[#FBBF24] font-mono">
                {totalLengthM} m <span className="text-[10px] text-[#94A3B8]">({Math.round(totalPixelDistance)} px)</span>
              </span>
            </div>
          </div>

          {/* Topology Verification Status */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            topologyErrors.length === 0
              ? 'bg-[#064E3B]/40 border-[#059669] text-[#A7F3D0]'
              : 'bg-[#7F1D1D]/40 border-[#DC2626] text-[#FECACA]'
          }`}>
            <div className="flex items-center gap-2">
              <span>{topologyErrors.length === 0 ? '✅' : '❌'}</span>
              <span className="font-bold text-xs">
                {topologyErrors.length === 0
                  ? 'Kiểm tra kết nối liên tục: 100% HỢP LỆ — Không bị nhảy đoạn, mọi node & edge đều khớp Graph V3'
                  : `Phát hiện ${topologyErrors.length} lỗi kết nối topology!`}
              </span>
            </div>
          </div>

          {topologyErrors.length > 0 && (
            <div className="bg-[#450A0A] p-3 rounded-xl border border-[#DC2626] space-y-1">
              <span className="font-bold text-[#FCA5A5]">Chi tiết lỗi:</span>
              {topologyErrors.map((err, idx) => (
                <p key={`err-${idx}`} className="text-red-300 font-mono text-[11px]">• {err}</p>
              ))}
            </div>
          )}

          {/* Node Sequence Table */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-sm text-[#38BDF8] flex items-center justify-between">
              <span>Danh sách Node Sequence ({nodesDetail.length} nodes)</span>
              <span className="text-[11px] font-normal text-[#94A3B8]">Đang hiển thị đánh số thứ tự trên bản đồ</span>
            </h3>
            <div className="bg-[#112240] rounded-xl border border-[#1E3A8A]/60 overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0D254C] text-[11px] text-[#94A3B8] sticky top-0">
                  <tr>
                    <th className="p-2 w-12 text-center">STT</th>
                    <th className="p-2">Node ID</th>
                    <th className="p-2">Nhãn hiển thị</th>
                    <th className="p-2 text-right">Tọa độ X</th>
                    <th className="p-2 text-right">Tọa độ Y</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A8A]/40 font-mono text-[11px]">
                  {nodesDetail.map(n => (
                    <tr key={`tbl-node-${n.index}`} className="hover:bg-white/5">
                      <td className="p-2 text-center text-[#FBBF24] font-bold">
                        {String(n.index).padStart(2, '0')}
                      </td>
                      <td className="p-2 font-bold text-white">{n.id}</td>
                      <td className="p-2 text-[#38BDF8]">{n.label}</td>
                      <td className="p-2 text-right text-[#A7F3D0]">{n.x}</td>
                      <td className="p-2 text-right text-[#A7F3D0]">{n.y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edge Sequence Table */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-sm text-[#38BDF8]">
              Danh sách Edge Sequence ({edgesDetail.length} edges)
            </h3>
            <div className="bg-[#112240] rounded-xl border border-[#1E3A8A]/60 overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0D254C] text-[11px] text-[#94A3B8] sticky top-0">
                  <tr>
                    <th className="p-2 w-12 text-center">STT</th>
                    <th className="p-2">Edge ID</th>
                    <th className="p-2">Từ Node (From)</th>
                    <th className="p-2">Đến Node (To)</th>
                    <th className="p-2 text-right">Chiều dài</th>
                    <th className="p-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A8A]/40 font-mono text-[11px]">
                  {edgesDetail.map(e => (
                    <tr key={`tbl-edge-${e.index}`} className="hover:bg-white/5">
                      <td className="p-2 text-center text-[#FBBF24] font-bold">
                        {String(e.index).padStart(2, '0')}
                      </td>
                      <td className="p-2 font-bold text-white">{e.id}</td>
                      <td className="p-2 text-[#38BDF8]">{e.from}</td>
                      <td className="p-2 text-[#38BDF8]">{e.to}</td>
                      <td className="p-2 text-right text-[#A7F3D0]">{e.lengthMeters} m</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          e.valid ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'
                        }`}>
                          {e.valid ? 'HỢP LỆ' : 'LỖI'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#08182E] border-t border-[#1E3A8A] flex items-center justify-between">
          <button
            onClick={onCaptureAuditImages}
            disabled={isCapturing}
            className="flex items-center gap-2 bg-[#1C67DA] hover:bg-[#1558BC] active:bg-[#0F4499] disabled:bg-[#475569] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <span>{isCapturing ? '⏳' : '📷'}</span>
            <span>{isCapturing ? 'Đang xuất 4 ảnh bằng chứng...' : 'Chụp ảnh kiểm tra Path (4 ảnh bằng chứng)'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-[#334155] hover:bg-[#475569] active:bg-[#1E293B] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Đóng Path Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
