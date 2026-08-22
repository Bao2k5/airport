/* eslint-disable react-refresh/only-export-components */
// Dedicated Geometric Junction Reviewer & Manual Connector for Graph V3
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SVG_WIDTH, SVG_HEIGHT } from './data/airportGraph';
import { USER_RAW_TRACES } from './data/rawTracesData';
import proposedData from './data/v3_junctions.proposed.json';

export interface ProposedJunction {
  id: string;
  type: 'exact_coincident' | 'point_on_segment' | 'crossing' | 'manual_review';
  nodeA: string;
  lineA: string;
  lineAName?: string;
  coordA: { x: number; y: number };
  labelA?: string;
  nodeB: string;
  lineB: string;
  lineBName?: string;
  coordB: { x: number; y: number };
  labelB?: string;
  distancePx: number;
  status: 'pending_review' | 'confirmed' | 'rejected';
  extra?: any;
}

export interface ConfirmedJunctionItem {
  junctionId: string;
  fromNodeId: string;
  toNodeId: string;
  fromTraceId?: string;
  toTraceId?: string;
  fromCoords: { x: number; y: number };
  toCoords: { x: number; y: number };
  geometryDistancePx: number;
  lengthMeters: number;
  junctionType: string;
  verifiedByUser: boolean;
  allowedDirections: string;
  note?: string;
}

export interface FlattenedNode {
  id: string;
  lineId: string;
  pointIndex: number;
  x: number;
  y: number;
  label?: string;
}

const STORAGE_CANDIDATES_KEY = 'v3_junctions_candidate_state_v1';
const STORAGE_CONFIRMED_KEY = 'v3_manual_confirmed_junctions_v1';

export default function DedicatedJunctionAnnotator() {
  // ── Candidate Junctions State ─────────────────────────────────────────────
  const [candidates, setCandidates] = useState<ProposedJunction[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CANDIDATES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (proposedData as any).proposedJunctions || [];
  });

  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(() => candidates[0]?.id || null);
  const [filterType, setFilterType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'confirmed' | 'rejected'>('all');

  // ── Manual Connect State ──────────────────────────────────────────────────
  const [nodeA, setNodeA] = useState<FlattenedNode | null>(null);
  const [nodeB, setNodeB] = useState<FlattenedNode | null>(null);

  // ── Viewport & Canvas ─────────────────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [statusMsg, setStatusMsg] = useState<string>('🔎 Sẵn sàng duyệt các nút giao (Junctions)');

  // All 117 canonical raw trace nodes
  const allNodes: FlattenedNode[] = useMemo(() => {
    const pts: FlattenedNode[] = [];
    USER_RAW_TRACES.slice(0, 38).forEach((l: any) => {
      l.points.forEach((p: any, idx: number) => {
        pts.push({
          id: p.nodeId || `v3_${l.id}_p${String(idx).padStart(2, '0')}`,
          lineId: l.id,
          pointIndex: idx,
          x: p.x,
          y: p.y,
          label: p.label || undefined,
        });
      });
    });
    return pts;
  }, []);

  // Save candidates to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_CANDIDATES_KEY, JSON.stringify(candidates));
  }, [candidates]);

  // Active candidate object
  const activeCandidate = useMemo(() => {
    return candidates.find(c => c.id === activeCandidateId) || null;
  }, [candidates, activeCandidateId]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [candidates, filterType, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: candidates.length,
      confirmed: candidates.filter(c => c.status === 'confirmed').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
      pending: candidates.filter(c => c.status === 'pending_review').length,
      exact: candidates.filter(c => c.type === 'exact_coincident').length,
      pointOnSeg: candidates.filter(c => c.type === 'point_on_segment').length,
      crossing: candidates.filter(c => c.type === 'crossing').length,
      manualReview: candidates.filter(c => c.type === 'manual_review').length,
    };
  }, [candidates]);

  // Zoom into specific coordinate
  const zoomToCoord = useCallback((cx: number, cy: number, span = 260) => {
    const aspect = SVG_HEIGHT / SVG_WIDTH;
    const w = span;
    const h = span * aspect;
    const x = Math.max(0, Math.min(SVG_WIDTH - w, cx - w / 2));
    const y = Math.max(0, Math.min(SVG_HEIGHT - h, cy - h / 2));
    setView({ x, y, w, h });
  }, []);

  const resetView = () => {
    setView({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  };

  // Zoom to active candidate
  useEffect(() => {
    if (activeCandidate) {
      const midX = (activeCandidate.coordA.x + activeCandidate.coordB.x) / 2;
      const midY = (activeCandidate.coordA.y + activeCandidate.coordB.y) / 2;
      zoomToCoord(midX, midY, 240);
    }
  }, [activeCandidateId, zoomToCoord]);

  // Candidate Actions
  const handleUpdateStatus = (id: string, newStatus: 'confirmed' | 'rejected' | 'pending_review') => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setStatusMsg(`✓ Đã ${newStatus === 'confirmed' ? 'XÁC NHẬN' : newStatus === 'rejected' ? 'TỪ CHỐI' : 'đặt lại'} Junction [${id}]`);
  };

  const handleBulkConfirm = (type: string) => {
    setCandidates(prev => prev.map(c => {
      if (type === 'all' || c.type === type) {
        return { ...c, status: 'confirmed' };
      }
      return c;
    }));
    setStatusMsg(`✓ Đã xác nhận hàng loạt toàn bộ junction loại ${type}`);
  };

  // Manual Node Click
  const handleNodeClick = (n: FlattenedNode) => {
    if (!nodeA) {
      setNodeA(n);
      setStatusMsg(`📍 Đã chọn Node A: ${n.id} (${n.x}, ${n.y}) - Hãy chọn Node B để nối`);
    } else if (nodeA.id === n.id) {
      setNodeA(null);
      setStatusMsg('Đã hủy chọn Node A');
    } else {
      setNodeB(n);
      // Create new candidate
      const distPx = Math.hypot(n.x - nodeA.x, n.y - nodeA.y);
      const newCand: ProposedJunction = {
        id: `manual_junc_${Date.now()}`,
        type: distPx <= 2.0 ? 'exact_coincident' : 'manual_review',
        nodeA: nodeA.id,
        lineA: nodeA.lineId,
        coordA: { x: nodeA.x, y: nodeA.y },
        labelA: nodeA.label,
        nodeB: n.id,
        lineB: n.lineId,
        coordB: { x: n.x, y: n.y },
        labelB: n.label,
        distancePx: Math.round(distPx * 10) / 10,
        status: 'confirmed',
      };
      setCandidates(prev => [newCand, ...prev]);
      setActiveCandidateId(newCand.id);
      setNodeA(null);
      setNodeB(null);
      setStatusMsg(`✓ Đã tạo và xác nhận junction thủ công giữa ${nodeA.id} và ${n.id} (${Math.round(distPx)}px)`);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const confirmedList = candidates.filter(c => c.status === 'confirmed');
    const formatted: ConfirmedJunctionItem[] = confirmedList.map((c, idx) => ({
      junctionId: `J${String(idx + 1).padStart(2, '0')}`,
      fromNodeId: c.nodeA,
      toNodeId: c.nodeB,
      fromTraceId: c.lineA,
      toTraceId: c.lineB,
      fromCoords: c.coordA,
      toCoords: c.coordB,
      geometryDistancePx: c.distancePx,
      lengthMeters: Math.round(c.distancePx * 3.0 * 10) / 10,
      junctionType: c.type,
      verifiedByUser: true,
      allowedDirections: 'bidirectional',
      note: `Xác nhận junction ${c.type} giữa ${c.lineA} và ${c.lineB} (${c.distancePx}px)`,
    }));

    const exportData = {
      exportDate: new Date().toISOString(),
      exportTimestamp: Date.now(),
      summary: {
        totalConfirmed: formatted.length,
        totalRejected: candidates.filter(c => c.status === 'rejected').length,
        totalPending: candidates.filter(c => c.status === 'pending_review').length,
      },
      confirmedJunctions: formatted,
    };

    localStorage.setItem(STORAGE_CONFIRMED_KEY, JSON.stringify(exportData));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'v3_junctions.confirmed.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg(`💾 Đã xuất file v3_junctions.confirmed.json (${formatted.length} junctions đã duyệt)!`);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Khôi phục toàn bộ danh sách đề xuất hình học ban đầu?')) {
      const initCands = (proposedData as any).proposedJunctions || [];
      setCandidates(initCands);
      setActiveCandidateId(initCands[0]?.id || null);
      localStorage.removeItem(STORAGE_CANDIDATES_KEY);
      setStatusMsg('🔄 Đã nạp lại danh sách đề xuất hình học.');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#090d16] text-slate-100 font-sans select-none overflow-hidden">
      {/* ── LEFT SIDEBAR: JUNCTION CANDIDATE QUEUE ─────────────────────────── */}
      <div className="w-[390px] min-w-[390px] bg-[#0c121e] border-r border-slate-800 flex flex-col z-20 shadow-2xl">
        {/* Header */}
        <div className="p-3 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div>
            <h1 className="text-sm font-black tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
              <span>🔗 JUNCTION REVIEWER</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">V3 AUDIT</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Duyệt & Nối Điểm Giao Cắt Tim Đường</p>
          </div>
          <button
            onClick={resetView}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer"
            title="Xem toàn cảnh"
          >
            🗺️ Toàn cảnh
          </button>
        </div>

        {/* Stats & Filter Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
          {/* Quick Counter Badges */}
          <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono">
            <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
              <div className="text-slate-400">Tổng</div>
              <div className="font-bold text-white text-xs">{stats.total}</div>
            </div>
            <div className="p-1.5 bg-amber-950/40 border border-amber-800/60 rounded">
              <div className="text-amber-400">Chờ duyệt</div>
              <div className="font-bold text-amber-300 text-xs">{stats.pending}</div>
            </div>
            <div className="p-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded">
              <div className="text-emerald-400">Đã duyệt</div>
              <div className="font-bold text-emerald-300 text-xs">{stats.confirmed}</div>
            </div>
            <div className="p-1.5 bg-red-950/40 border border-red-800/60 rounded">
              <div className="text-red-400">Từ chối</div>
              <div className="font-bold text-red-300 text-xs">{stats.rejected}</div>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">Tất cả loại ({stats.total})</option>
              <option value="exact_coincident">Trùng điểm &lt;=2px ({stats.exact})</option>
              <option value="point_on_segment">Nằm trên đoạn &lt;=2px ({stats.pointOnSeg})</option>
              <option value="crossing">Giao cắt ({stats.crossing})</option>
              <option value="manual_review">Xem xét 2..12px ({stats.manualReview})</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="pending_review">⏳ Chờ duyệt ({stats.pending})</option>
              <option value="confirmed">✅ Đã duyệt ({stats.confirmed})</option>
              <option value="rejected">❌ Đã từ chối ({stats.rejected})</option>
            </select>
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={() => handleBulkConfirm('exact_coincident')}
              className="flex-1 py-1 px-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-[10px] rounded font-bold transition cursor-pointer"
            >
              ✓ Duyệt 13 Exact (&le;2px)
            </button>
            <button
              onClick={() => handleBulkConfirm('point_on_segment')}
              className="flex-1 py-1 px-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] rounded font-bold transition cursor-pointer"
            >
              ✓ Duyệt 24 Point-on-Seg
            </button>
          </div>
        </div>

        {/* Candidate List Queue */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {filteredCandidates.map((cand, idx) => {
            const isSelected = cand.id === activeCandidateId;
            const badgeBg =
              cand.type === 'exact_coincident'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : cand.type === 'point_on_segment'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                : cand.type === 'crossing'
                ? 'bg-purple-950 text-purple-300 border-purple-800'
                : 'bg-amber-950 text-amber-300 border-amber-800';

            const typeLabel =
              cand.type === 'exact_coincident'
                ? 'Exact'
                : cand.type === 'point_on_segment'
                ? 'Point-on-Seg'
                : cand.type === 'crossing'
                ? 'Crossing'
                : 'Manual Gap';

            return (
              <div
                key={cand.id}
                onClick={() => setActiveCandidateId(cand.id)}
                className={`p-2.5 rounded-xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-slate-400">#{idx + 1}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-sans font-bold ${badgeBg}`}>
                      {typeLabel} ({cand.distancePx}px)
                    </span>
                  </div>
                  <div>
                    {cand.status === 'confirmed' && (
                      <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-bold">✓ ĐÃ DUYỆT</span>
                    )}
                    {cand.status === 'rejected' && (
                      <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold">✕ TỪ CHỐI</span>
                    )}
                    {cand.status === 'pending_review' && (
                      <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded font-bold">⏳ CHỜ DUYỆT</span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-mono grid grid-cols-2 gap-1 text-slate-300 bg-slate-900/60 p-1.5 rounded">
                  <div className="truncate">
                    <span className="text-slate-500">A: </span>
                    <span className="text-sky-400 font-bold">{cand.lineA}</span>
                    <div className="text-[10px] text-slate-400">({cand.coordA.x}, {cand.coordA.y})</div>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">B: </span>
                    <span className="text-amber-400 font-bold">{cand.lineB}</span>
                    <div className="text-[10px] text-slate-400">({cand.coordB.x}, {cand.coordB.y})</div>
                  </div>
                </div>

                {/* Confirm / Reject Buttons */}
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(cand.id, 'confirmed');
                    }}
                    className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer transition ${
                      cand.status === 'confirmed'
                        ? 'bg-emerald-600 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-emerald-700 text-slate-200'
                    }`}
                  >
                    ✓ Xác nhận
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(cand.id, 'rejected');
                    }}
                    className={`flex-1 py-1 text-xs font-bold rounded cursor-pointer transition ${
                      cand.status === 'rejected'
                        ? 'bg-red-600 text-white font-black'
                        : 'bg-slate-800 hover:bg-red-800 text-slate-200'
                    }`}
                  >
                    ✕ Từ chối
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-[#0f172a] space-y-2">
          <button
            onClick={handleExportJson}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>💾 Xuất file JSON (v3_junctions.confirmed.json)</span>
          </button>
          <button
            onClick={handleResetToDefault}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] rounded transition cursor-pointer"
          >
            🔄 Nạp lại đề xuất ban đầu
          </button>
        </div>

        {/* Status Msg */}
        <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-cyan-400 truncate">
          {statusMsg}
        </div>
      </div>

      {/* ── MAIN SVG VIEWPORT ─────────────────────────────────────────────── */}
      <div className="flex-1 relative bg-[#070b14] overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
          shapeRendering="geometricPrecision"
        >
          {/* Background Image */}
          <image
            href="/anhchinh.png"
            x={0}
            y={0}
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            opacity={0.9}
            preserveAspectRatio="none"
            pointerEvents="none"
          />

          {/* 1. All 38 Raw Lines (Dashed Gray Centerlines) */}
          <g className="raw-centerlines" pointerEvents="none">
            {USER_RAW_TRACES.slice(0, 38).map((line: any) => {
              const ptsStr = line.points.map((p: any) => `${p.x},${p.y}`).join(' ');
              const isLineA = activeCandidate?.lineA === line.id;
              const isLineB = activeCandidate?.lineB === line.id;

              return (
                <g key={`cl-${line.id}`}>
                  <polyline
                    points={ptsStr}
                    fill="none"
                    stroke={isLineA ? '#38bdf8' : isLineB ? '#fbbf24' : '#64748b'}
                    strokeWidth={isLineA || isLineB ? 3.5 : 1.8}
                    strokeDasharray={isLineA || isLineB ? undefined : '4,3'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isLineA || isLineB ? 1.0 : 0.65}
                  />
                  {line.points[0] && (
                    <text
                      x={line.points[0].x + 4}
                      y={line.points[0].y - 4}
                      fontSize={6}
                      fontWeight={900}
                      fill={isLineA ? '#38bdf8' : isLineB ? '#fbbf24' : '#94a3b8'}
                      fontFamily="monospace"
                    >
                      {line.name || line.id}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2. Confirmed & Candidate Junction Lines */}
          <g className="junction-lines" pointerEvents="none">
            {candidates.map(c => {
              if (c.status === 'rejected') return null;
              const isConfirmed = c.status === 'confirmed';
              const isActive = c.id === activeCandidateId;

              return (
                <g key={`junc-line-${c.id}`}>
                  <line
                    x1={c.coordA.x}
                    y1={c.coordA.y}
                    x2={c.coordB.x}
                    y2={c.coordB.y}
                    stroke={isActive ? '#ffffff' : isConfirmed ? '#10b981' : '#f59e0b'}
                    strokeWidth={isActive ? 3.0 : isConfirmed ? 2.2 : 1.5}
                    strokeDasharray={isConfirmed ? undefined : '3,2'}
                  />
                  {/* Outer pulse circle for active candidate */}
                  {isActive && (
                    <circle
                      cx={(c.coordA.x + c.coordB.x) / 2}
                      cy={(c.coordA.y + c.coordB.y) / 2}
                      r={18}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={1.5}
                      strokeDasharray="4,3"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* 3. Interactive Raw Nodes */}
          <g className="raw-nodes">
            {allNodes.map(n => {
              const isA = activeCandidate?.nodeA === n.id || nodeA?.id === n.id;
              const isB = activeCandidate?.nodeB === n.id || nodeB?.id === n.id;
              const isOperational = !!n.label;

              return (
                <g
                  key={`node-${n.id}`}
                  onClick={() => handleNodeClick(n)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isA || isB ? 6.5 : isOperational ? 4.2 : 2.8}
                    fill={isA ? '#38bdf8' : isB ? '#fbbf24' : isOperational ? '#ffffff' : '#334155'}
                    stroke="#0f172a"
                    strokeWidth={isA || isB ? 2.0 : 1.0}
                    className="hover:scale-150 transition-transform"
                  />
                  {/* Node label */}
                  {n.label && (
                    <text
                      x={n.x + 4}
                      y={n.y - 4}
                      fontSize={6.5}
                      fontWeight={900}
                      fill={isA ? '#38bdf8' : isB ? '#fbbf24' : '#ffffff'}
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

if (typeof document !== 'undefined') {
  const container = document.getElementById('root');
  if (container) createRoot(container).render(<DedicatedJunctionAnnotator />);
}
