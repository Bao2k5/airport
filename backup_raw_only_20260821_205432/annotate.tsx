/* eslint-disable react-refresh/only-export-components */
// Precision Manual Node Repositioning & Raw Trace Annotation for Graph V3
// Mode 'raw-only': Strictly renders v3_raw_traces_manual.json on /anhchinh.png with Direct Save Button.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SVG_WIDTH, SVG_HEIGHT } from './data/airportGraph';
import rawTracesManualData from './data/v3_raw_traces_manual.json';

export interface RawPoint {
  x: number;
  y: number;
  label?: string;
  nodeId?: string;
  note?: string;
}

export interface RawLine {
  id: string;
  name: string;
  points: RawPoint[];
}

export interface SelectedNodeInfo {
  lineId: string;
  pointIndex: number;
  origX: number;
  origY: number;
}

const STORAGE_KEY = 'v3_chart_pen_raw_traces_v1';
const RAW_ONLY_STORAGE_KEY = 'v3_raw_only_traces_v1';

// 38 Distinct High-Contrast Vibrant Colors for each Raw Line
const VIBRANT_LINE_COLORS = [
  '#00f5ff', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa',
  '#f472b6', '#fb923c', '#4ade80', '#22d3ee', '#818cf8',
  '#f87171', '#e879f9', '#a3e635', '#2dd4bf', '#60a5fa',
  '#facc15', '#ec4899', '#14b8a6', '#8b5cf6', '#06b6d4',
  '#10b981', '#f97316', '#6366f1', '#d946ef', '#84cc16',
  '#0ea5e9', '#e11d48', '#059669', '#d97706', '#7c3aed',
  '#2563eb', '#db2777', '#0d9488', '#ea580c', '#4f46e5',
  '#c026d3', '#65a30d', '#0284c7'
];

function sanitizeRawLines(input: any): RawLine[] {
  const sourceArray = Array.isArray(input) ? input : (rawTracesManualData as any[]);
  const valid: RawLine[] = [];
  sourceArray.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id : `line_${String(idx + 1).padStart(2, '0')}`;
    const name = typeof item.name === 'string' && item.name.trim() ? item.name : id;
    
    // Strictly filter to 38 lines
    const numMatch = id.match(/line_(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num > 38) return;
    }

    const pts: RawPoint[] = [];
    if (Array.isArray(item.points)) {
      item.points.forEach((p: any) => {
        if (p && typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y)) {
          pts.push({
            x: Math.round(p.x),
            y: Math.round(p.y),
            label: typeof p.label === 'string' && p.label.trim() ? p.label.trim() : undefined,
            nodeId: typeof p.nodeId === 'string' && p.nodeId.trim() ? p.nodeId.trim() : undefined,
            note: typeof p.note === 'string' ? p.note : undefined,
          });
        }
      });
    }
    valid.push({ id, name, points: pts });
  });
  return valid;
}

export default function PrecisionChartPenAnnotator() {
  // Check URL params for raw-only mode
  const isRawOnlyMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'raw-only';
  }, []);

  const activeStorageKey = isRawOnlyMode ? RAW_ONLY_STORAGE_KEY : STORAGE_KEY;

  // ── Raw Lines State ───────────────────────────────────────────────────────
  const [lines, setLines] = useState<RawLine[]>(() => {
    try {
      if (isRawOnlyMode) {
        const cached = localStorage.getItem(RAW_ONLY_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return sanitizeRawLines(parsed);
        }
        return sanitizeRawLines(rawTracesManualData);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return sanitizeRawLines(parsed);
      }
    } catch {}
    return sanitizeRawLines(rawTracesManualData);
  });
  
  const [activeLineId, setActiveLineId] = useState<string | null>(() => lines[0]?.id || 'line_01');
  
  // ── Selected Node & Dragging State ────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
  const draggingNodeRef = useRef<{ lineId: string; pointIndex: number; origX: number; origY: number; moved: boolean } | null>(null);

  // ── Layers & Display Toggles ──────────────────────────────────────────────
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showLineNames, setShowLineNames] = useState<boolean>(true);
  const [showPointIndices, setShowPointIndices] = useState<boolean>(false);

  // ── Save State & Notification Toast ───────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Viewport & Cursor ─────────────────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>(
    isRawOnlyMode
      ? '🔍 CHẾ ĐỘ KIỂM TRA RAW-ONLY V3: 38 Lines nguyên bản từ v3_raw_traces_manual.json'
      : '🖐️ Chế độ KÉO ĐIỂM: Nhấp chọn hoặc kéo trực tiếp bất kỳ đầu mút nào.'
  );

  // ── Undo / Redo History ───────────────────────────────────────────────────
  const historyRef = useRef<RawLine[][]>([JSON.parse(JSON.stringify(lines))]);
  const historyIdxRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((nextLines: RawLine[], msg: string) => {
    const nextCopy = JSON.parse(JSON.stringify(nextLines));
    const newHist = historyRef.current.slice(0, historyIdxRef.current + 1);
    newHist.push(nextCopy);
    if (newHist.length > 50) newHist.shift();
    historyRef.current = newHist;
    historyIdxRef.current = newHist.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
    setStatusMsg(msg);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current--;
      const prev = JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current]));
      setLines(prev);
      setCanUndo(historyIdxRef.current > 0);
      setCanRedo(true);
      setStatusMsg('↺ Đã hoàn tác (Undo)');
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current++;
      const next = JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current]));
      setLines(next);
      setCanUndo(true);
      setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
      setStatusMsg('↻ Đã làm lại (Redo)');
    }
  }, []);

  // Save to local storage on edit
  useEffect(() => {
    localStorage.setItem(activeStorageKey, JSON.stringify(lines));
  }, [lines, activeStorageKey]);

  // Statistics
  const stats = useMemo(() => {
    let totalPts = 0;
    let namedPts = 0;
    let geomPts = 0;
    lines.forEach(l => {
      l.points.forEach(p => {
        totalPts++;
        if (p.label && p.label.trim().length > 0) namedPts++;
        else geomPts++;
      });
    });
    return {
      lineCount: lines.length,
      totalPoints: totalPts,
      namedPoints: namedPts,
      geometryOnlyPoints: geomPts,
    };
  }, [lines]);

  // Selected node detailed object
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;
    const l = lines.find(x => x.id === selectedNode.lineId);
    if (!l) return null;
    const pt = l.points[selectedNode.pointIndex];
    if (!pt) return null;
    const isEndNode = selectedNode.pointIndex === 0 || selectedNode.pointIndex === l.points.length - 1;
    const techId = `v3_${l.id}_p${String(selectedNode.pointIndex).padStart(2, '0')}`;
    return {
      line: l,
      point: pt,
      techId,
      isEndNode,
      pointIndex: selectedNode.pointIndex,
      origX: selectedNode.origX,
      origY: selectedNode.origY,
    };
  }, [selectedNode, lines]);

  // ── Zoom & Pan Logic ──────────────────────────────────────────────────────
  const clampView = useCallback((v: { x: number; y: number; w: number; h: number }) => {
    const aspect = SVG_HEIGHT / SVG_WIDTH;
    const w = Math.min(SVG_WIDTH, Math.max(SVG_WIDTH * 0.08, v.w));
    const h = w * aspect;
    const x = Math.min(SVG_WIDTH - w, Math.max(0, v.x));
    const y = Math.min(SVG_HEIGHT - h, Math.max(0, v.y));
    return { x, y, w, h };
  }, []);

  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setView(v => {
      const aspect = SVG_HEIGHT / SVG_WIDTH;
      const w = Math.min(SVG_WIDTH, Math.max(SVG_WIDTH * 0.08, v.w * factor));
      const h = w * aspect;
      const fx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const fy = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const sx = v.x + fx * v.w;
      const sy = v.y + fy * v.h;
      return clampView({ x: sx - fx * w, y: sy - fy * h, w, h });
    });
  }, [clampView]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1 / 1.3 : 1.3);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const resetView = () => {
    setView({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  };

  // ── Clean Export Data Format Helper ───────────────────────────────────────
  const getCleanData = () => {
    return lines.map(l => ({
      id: l.id,
      name: l.name,
      points: l.points.map(p => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
        label: p.label ? p.label.trim() : undefined,
        nodeId: p.nodeId ? p.nodeId.trim() : undefined,
        note: p.note,
      })),
    }));
  };

  // ── DIRECT SAVE TO DISK API ───────────────────────────────────────────────
  const handleDirectSave = async () => {
    setSaveStatus('saving');
    const cleanData = getCleanData();

    try {
      const resp = await fetch('/api/save-raw-traces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });

      if (resp.ok) {
        setSaveStatus('saved');
        setToastMsg('✅ ĐÃ LƯU TRỰC TIẾP VÀO FILE v3_raw_traces_manual.json TRÊN Ổ ĐĨA!');
        setStatusMsg(`💾 Đã lưu thành công ${cleanData.length} lines vào v3_raw_traces_manual.json lúc ${new Date().toLocaleTimeString()}`);
        setTimeout(() => {
          setSaveStatus('idle');
          setToastMsg(null);
        }, 4000);
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('API save failed, falling back to JSON download:', err);
      setSaveStatus('error');
      // Fallback to downloading
      exportJson();
      setToastMsg('⚠️ Đã tải file JSON về máy (Download)');
      setTimeout(() => {
        setSaveStatus('idle');
        setToastMsg(null);
      }, 4000);
    }
  };

  // ── Download JSON Backup ──────────────────────────────────────────────────
  const exportJson = () => {
    const cleanData = getCleanData();
    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'v3_raw_traces_manual.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg(`📥 Đã tải file v3_raw_traces_manual.json (${lines.length} lines, ${stats.totalPoints} points)!`);
  };

  // ── Node Click & Drag Handlers ────────────────────────────────────────────
  const handleNodeMouseDown = (e: React.MouseEvent, lineId: string, pointIndex: number) => {
    e.stopPropagation();
    const l = lines.find(x => x.id === lineId);
    if (!l) return;
    const pt = l.points[pointIndex];
    if (!pt) return;

    setSelectedNode({ lineId, pointIndex, origX: pt.x, origY: pt.y });
    setActiveLineId(lineId);
    draggingNodeRef.current = { lineId, pointIndex, origX: pt.x, origY: pt.y, moved: false };

    setStatusMsg(`🎯 Đã chọn: ${lineId} - Điểm #${pointIndex + 1} (${pt.x}, ${pt.y})`);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const curX = Math.round(view.x + fx * view.w);
    const curY = Math.round(view.y + fy * view.h);
    setCursor({ x: curX, y: curY });

    if (panning && panRef.current) {
      const dx = (e.clientX - panRef.current.px) * (view.w / rect.width);
      const dy = (e.clientY - panRef.current.py) * (view.h / rect.height);
      setView(clampView({
        x: panRef.current.vx - dx,
        y: panRef.current.vy - dy,
        w: view.w,
        h: view.h,
      }));
      return;
    }

    if (draggingNodeRef.current) {
      draggingNodeRef.current.moved = true;
      const { lineId, pointIndex } = draggingNodeRef.current;
      setLines(prev => prev.map(l => {
        if (l.id !== lineId) return l;
        const newPts = [...l.points];
        if (newPts[pointIndex]) {
          newPts[pointIndex] = { ...newPts[pointIndex], x: Math.max(0, Math.min(SVG_WIDTH, curX)), y: Math.max(0, Math.min(SVG_HEIGHT, curY)) };
        }
        return { ...l, points: newPts };
      }));
    }
  };

  const handleSvgMouseUp = () => {
    if (panning) {
      setPanning(false);
      panRef.current = null;
    }
    if (draggingNodeRef.current) {
      if (draggingNodeRef.current.moved) {
        pushHistory(lines, `✓ Đã dời điểm #${draggingNodeRef.current.pointIndex + 1} của ${draggingNodeRef.current.lineId}`);
      }
      draggingNodeRef.current = null;
    }
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.altKey || e.shiftKey) {
      setPanning(true);
      panRef.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
    }
  };

  // Fine-tuning with arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNode) return;
      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 5 : 1;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
        return;
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
        return;
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDirectSave();
        return;
      } else if (e.key === 'Escape') {
        setSelectedNode(null);
        return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        const { lineId, pointIndex } = selectedNode;
        setLines(prev => {
          const next = prev.map(l => {
            if (l.id !== lineId) return l;
            const newPts = [...l.points];
            if (newPts[pointIndex]) {
              newPts[pointIndex] = {
                ...newPts[pointIndex],
                x: Math.max(0, Math.min(SVG_WIDTH, newPts[pointIndex].x + dx)),
                y: Math.max(0, Math.min(SVG_HEIGHT, newPts[pointIndex].y + dy)),
              };
            }
            return { ...l, points: newPts };
          });
          pushHistory(next, `🎯 Tinh chỉnh điểm #${pointIndex + 1} (${dx !== 0 ? `X: ${dx > 0 ? '+' : ''}${dx}` : `Y: ${dy > 0 ? '+' : ''}${dy}`})`);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, pushHistory, handleUndo, handleRedo]);

  const handleResetToCleanRaw = () => {
    if (window.confirm('Khôi phục lại toàn bộ tọa độ gốc từ v3_raw_traces_manual.json?')) {
      const clean = sanitizeRawLines(rawTracesManualData);
      setLines(clean);
      localStorage.removeItem(RAW_ONLY_STORAGE_KEY);
      pushHistory(clean, '🔄 Đã nạp lại file gốc v3_raw_traces_manual.json');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden">
      {/* ── TOP NAV BAR ───────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-[#0c121e]/95 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-cyan-400 uppercase">
              {isRawOnlyMode ? '🔍 RAW-ONLY V3 AUDIT' : '🖐️ GRAPH V3 ANNOTATOR'}
            </span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800 font-mono font-bold">
              38 RAW LINES
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Lines: <strong className="text-white">{stats.lineCount}</strong></span>
            <span>Points: <strong className="text-cyan-300">{stats.totalPoints}</strong></span>
            <span>Named: <strong className="text-emerald-300">{stats.namedPoints}</strong></span>
            <span>Geom: <strong className="text-slate-300">{stats.geometryOnlyPoints}</strong></span>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`px-2 py-1 text-xs rounded border transition font-bold ${
              canUndo
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 cursor-pointer'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Hoàn tác (Ctrl+Z)"
          >
            ↺ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`px-2 py-1 text-xs rounded border transition font-bold ${
              canRedo
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 cursor-pointer'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Làm lại (Ctrl+Y)"
          >
            ↻ Redo
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* Toggles */}
          <button
            onClick={() => setShowPoints(!showPoints)}
            className={`px-2.5 py-1 text-xs rounded border transition cursor-pointer font-bold flex items-center gap-1 ${
              showPoints
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Hiện/Ẩn Chấm Điểm"
          >
            <span>🔘 Chấm Điểm</span>
          </button>

          <button
            onClick={() => setShowLineNames(!showLineNames)}
            className={`px-2.5 py-1 text-xs rounded border transition cursor-pointer font-bold flex items-center gap-1 ${
              showLineNames
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Hiện/Ẩn Tên Tuyến"
          >
            <span>🏷️ Tên Tuyến</span>
          </button>

          <button
            onClick={() => setShowPointIndices(!showPointIndices)}
            className={`px-2.5 py-1 text-xs rounded border transition cursor-pointer font-bold flex items-center gap-1 ${
              showPointIndices
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Hiện/Ẩn Thứ Tự Điểm (#1, #2...)"
          >
            <span>🔢 Số Thứ Tự</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button
            onClick={resetView}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer transition text-slate-200"
            title="Toàn Cảnh"
          >
            🗺️ Toàn Cảnh
          </button>

          {/* 🌟 PROMINENT DIRECT SAVE BUTTON */}
          <button
            onClick={handleDirectSave}
            disabled={saveStatus === 'saving'}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black rounded-lg shadow-lg shadow-emerald-950/50 cursor-pointer transition flex items-center gap-1.5 ring-2 ring-emerald-400/50"
            title="Lưu trực tiếp vào file v3_raw_traces_manual.json (Ctrl+S)"
          >
            <span>💾 {saveStatus === 'saving' ? 'Đang lưu...' : 'LƯU TRỰC TIẾP (Ctrl+S)'}</span>
          </button>

          {/* Download JSON Backup Button */}
          <button
            onClick={exportJson}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1"
            title="Tải file JSON dự phòng về máy"
          >
            <span>📥 Tải File</span>
          </button>

          <button
            onClick={handleResetToCleanRaw}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded cursor-pointer transition"
            title="Nạp Lại File Gốc"
          >
            🔄 Nạp Lại
          </button>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION POPUP ────────────────────────────────────────── */}
      {toastMsg && (
        <div className="absolute top-14 right-6 z-50 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-100 font-bold px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur animate-bounce flex items-center gap-2 text-xs">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── LEFT SIDEBAR: LINE LIST ─────────────────────────────────────────── */}
      <div className="w-[300px] min-w-[300px] bg-[#0c121e] border-r border-slate-800 flex flex-col z-20 shadow-2xl pt-12">
        <div className="p-3 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <span className="text-xs font-black tracking-wider text-slate-300 uppercase">DANH SÁCH 38 LINES</span>
          <span className="text-[11px] font-mono text-cyan-400 font-bold">{lines.length} Tuyến</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {lines.map((line, idx) => {
            const isSelected = line.id === activeLineId;
            const lineColor = VIBRANT_LINE_COLORS[idx % VIBRANT_LINE_COLORS.length];

            return (
              <div
                key={line.id}
                onClick={() => {
                  setActiveLineId(line.id);
                  if (line.points[0]) {
                    setSelectedNode({
                      lineId: line.id,
                      pointIndex: 0,
                      origX: line.points[0].x,
                      origY: line.points[0].y,
                    });
                  }
                }}
                className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: lineColor }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-200 truncate">{line.name || line.id}</div>
                    <div className="text-[10px] font-mono text-slate-400">{line.id}</div>
                  </div>
                </div>

                <div className="text-[11px] font-mono font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {line.points.length} pts
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Coordinates Panel */}
        {selectedNodeDetails && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-400">📍 ĐIỂM ĐANG CHỌN</span>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                #{selectedNodeDetails.pointIndex + 1}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Tuyến:</span>
                <span className="text-white font-bold">{selectedNodeDetails.line.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tọa độ:</span>
                <span className="text-emerald-400 font-bold">({selectedNodeDetails.point.x}, {selectedNodeDetails.point.y})</span>
              </div>
              {selectedNodeDetails.point.label && (
                <div className="flex justify-between text-slate-400">
                  <span>Tên:</span>
                  <span className="text-sky-300 font-bold">{selectedNodeDetails.point.label}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              💡 Dùng chuột kéo hoặc phím mũi tên <kbd className="bg-slate-800 px-1 rounded">← ↑ ↓ →</kbd> (Shift: 5px)
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-cyan-400 truncate">
          {statusMsg}
        </div>
      </div>

      {/* ── MAIN SVG VIEWPORT ─────────────────────────────────────────────── */}
      <div className="flex-1 relative bg-[#070b14] overflow-hidden pt-12">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
          shapeRendering="geometricPrecision"
          onMouseMove={handleSvgMouseMove}
          onMouseDown={handleSvgMouseDown}
          onMouseUp={handleSvgMouseUp}
        >
          {/* Background Image: Strictly /anhchinh.png */}
          <image
            href="/anhchinh.png"
            x={0}
            y={0}
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            opacity={1.0}
            preserveAspectRatio="none"
            pointerEvents="none"
          />

          {/* 1. All 38 Raw Lines Polyline (Sequential Edges Within Each Line Only) */}
          <g className="raw-lines" pointerEvents="none">
            {lines.map((line, idx) => {
              if (line.points.length < 2) return null;
              const isLineActive = line.id === activeLineId;
              const lineColor = VIBRANT_LINE_COLORS[idx % VIBRANT_LINE_COLORS.length];
              const ptsStr = line.points.map(p => `${p.x},${p.y}`).join(' ');

              return (
                <g key={`raw-line-${line.id}`}>
                  {/* Glow under active line */}
                  {isLineActive && (
                    <polyline
                      points={ptsStr}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={5.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.35}
                    />
                  )}
                  {/* Main Polyline */}
                  <polyline
                    points={ptsStr}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={isLineActive ? 2.8 : 2.0}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isLineActive ? 1.0 : 0.85}
                  />

                  {/* Line Name Label */}
                  {showLineNames && line.points[0] && (
                    <text
                      x={line.points[0].x + 4}
                      y={line.points[0].y - 4}
                      fontSize={6.5}
                      fontWeight={900}
                      fill={lineColor}
                      fontFamily="monospace"
                    >
                      {line.name || line.id}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2. Raw Points & Touch Targets */}
          {showPoints && (
            <g className="raw-points">
              {lines.map((line, lIdx) => {
                const lineColor = VIBRANT_LINE_COLORS[lIdx % VIBRANT_LINE_COLORS.length];

                return (
                  <g key={`raw-pts-group-${line.id}`}>
                    {line.points.map((p, pIdx) => {
                      const isSelected = selectedNode?.lineId === line.id && selectedNode?.pointIndex === pIdx;
                      const isNamed = !!p.label;

                      return (
                        <g
                          key={`pt-${line.id}-${pIdx}`}
                          onMouseDown={e => handleNodeMouseDown(e, line.id, pIdx)}
                          className="cursor-pointer"
                        >
                          {/* Invisible Extra-Large Touch Target (16px radius) */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={16}
                            fill="transparent"
                            stroke="none"
                            className="cursor-grab active:cursor-grabbing"
                          />

                          {/* Outer selection ring */}
                          {isSelected && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={8.5}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth={1.8}
                              strokeDasharray="3,2"
                              className="animate-pulse"
                            />
                          )}

                          {/* Center Node Dot */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isSelected ? 6.0 : isNamed ? 4.5 : 3.0}
                            fill={isSelected ? '#ffffff' : isNamed ? '#fbbf24' : lineColor}
                            stroke="#0c121e"
                            strokeWidth={1.2}
                            className="hover:scale-125 transition-transform"
                          />

                          {/* Operational Name */}
                          {p.label && (
                            <text
                              x={p.x + 5}
                              y={p.y - 4}
                              fontSize={6.5}
                              fontWeight={900}
                              fill="#fbbf24"
                              fontFamily="monospace"
                              pointerEvents="none"
                            >
                              {p.label}
                            </text>
                          )}

                          {/* Point Index (#1, #2...) */}
                          {showPointIndices && (
                            <text
                              x={p.x}
                              y={p.y + 7.5}
                              fontSize={5}
                              fontWeight={900}
                              fill="#ffffff"
                              textAnchor="middle"
                              fontFamily="monospace"
                              pointerEvents="none"
                            >
                              {pIdx + 1}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Live Cursor Coordinate Pill */}
        {cursor && (
          <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-700/80 px-2.5 py-1 rounded text-xs font-mono text-cyan-300 pointer-events-none shadow-xl">
            X: {cursor.x} | Y: {cursor.y}
          </div>
        )}
      </div>
    </div>
  );
}

if (typeof document !== 'undefined') {
  const container = document.getElementById('root');
  if (container) createRoot(container).render(<PrecisionChartPenAnnotator />);
}
