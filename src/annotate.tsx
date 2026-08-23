/* eslint-disable react-refresh/only-export-components */
// Precision Manual Node Repositioning & Raw Trace Inspection for Graph V3
// Mode 'raw-only': Reads strictly from v3_raw_traces_manual.json, with direct reload from file, SHA-256 metadata, Gap Audit table, and zero auto-connections.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SVG_WIDTH, SVG_HEIGHT } from './data/airportGraph.v3';
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

export interface GapAuditItem {
  id: string;
  type: 'EXACT_TOUCHING' | 'POINT_ON_SEGMENT' | 'CLOSE_ALIGNED' | 'DRAWING_GAP' | 'CROSSING';
  pointA: { lineId: string; pIdx: number; x: number; y: number; label?: string };
  pointB?: { lineId: string; pIdx: number; x: number; y: number; label?: string };
  segmentB?: { lineId: string; p1Idx: number; p2Idx: number; p1: { x: number; y: number }; p2: { x: number; y: number } };
  distancePx: number;
  description: string;
}

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

  // ── File Source Metadata State ────────────────────────────────────────────
  const [fileMeta, setFileMeta] = useState<{
    absolutePath: string;
    sha256: string;
    lineCount: number;
    pointCount: number;
    lineIds: string[];
  }>({
    absolutePath: 'd:\\Thao\\airport-simulator\\v3_raw_traces_manual.json',
    sha256: '30B8A929FCB6CA1E25AE80F430FA49DE8B06F4DB4E0292D57DB28A5DA89D8991',
    lineCount: (rawTracesManualData as any[]).length,
    pointCount: (rawTracesManualData as any[]).reduce((sum, l) => sum + (l.points?.length || 0), 0),
    lineIds: (rawTracesManualData as any[]).map(l => l.id),
  });

  // ── Raw Lines State (Strictly initialized from file without stale localStorage in raw-only) ──
  const [lines, setLines] = useState<RawLine[]>(() => {
    return sanitizeRawLines(rawTracesManualData);
  });

  const [activeLineId, setActiveLineId] = useState<string | null>(() => lines[0]?.id || 'line_01');
  
  // ── Selected Node & Dragging State ────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
  const [nodeLabelInput, setNodeLabelInput] = useState<string>('');
  const draggingNodeRef = useRef<{ lineId: string; pointIndex: number; origX: number; origY: number; moved: boolean } | null>(null);

  // ── Display Toggles ───────────────────────────────────────────────────────
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showLineNames, setShowLineNames] = useState<boolean>(true);
  const [showPointIndices, setShowPointIndices] = useState<boolean>(false);
  const [showGapPanel, setShowGapPanel] = useState<boolean>(false);
  const [highlightedGap, setHighlightedGap] = useState<GapAuditItem | null>(null);

  // ── Save State & Toast ────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Viewport & Cursor ─────────────────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>(
    '🔍 NGUỒN DUY NHẤT: v3_raw_traces_manual.json (0 Junctions, không dùng tên tạm V1/V2)'
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

  // ── Fetch Fresh File on Load & On Reload Button ───────────────────────────
  const fetchFreshRawFromFile = useCallback(async () => {
    try {
      const resp = await fetch('/api/raw-traces-info');
      if (resp.ok) {
        const info = await resp.json();
        setFileMeta({
          absolutePath: info.absolutePath,
          sha256: info.sha256,
          lineCount: info.lineCount,
          pointCount: info.pointCount,
          lineIds: info.lineIds,
        });
        if (Array.isArray(info.lines)) {
          const sanitized = sanitizeRawLines(info.lines);
          setLines(sanitized);
          historyRef.current = [JSON.parse(JSON.stringify(sanitized))];
          historyIdxRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
          setToastMsg(`✅ ĐÃ NẠP LẠI TỪ FILE: ${info.lineCount} Lines, ${info.pointCount} Points!`);
          setStatusMsg(`🔄 Đã nạp lại trực tiếp từ ${info.absolutePath} (SHA: ${info.sha256.slice(0, 8)}...)`);
          setTimeout(() => setToastMsg(null), 4000);
          return;
        }
      }
    } catch {}
    // Fallback to imported JSON
    const clean = sanitizeRawLines(rawTracesManualData);
    setLines(clean);
    setToastMsg(`✅ ĐÃ NẠP LẠI NGUỒN CHUẨN TỪ FILE JSON!`);
    setStatusMsg(`🔄 Đã nạp lại file gốc v3_raw_traces_manual.json`);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  useEffect(() => {
    fetchFreshRawFromFile();
  }, [fetchFreshRawFromFile]);

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

  // ── Gap Audit Calculation (Inspection Only, Never Auto-Connect) ───────────
  const gapAuditItems: GapAuditItem[] = useMemo(() => {
    const items: GapAuditItem[] = [];
    const allPts: { lineId: string; pIdx: number; x: number; y: number; label?: string }[] = [];
    lines.forEach(l => {
      l.points.forEach((p, idx) => {
        allPts.push({ lineId: l.id, pIdx: idx, x: p.x, y: p.y, label: p.label });
      });
    });

    lines.forEach(line => {
      if (line.points.length === 0) return;
      const startPt = { lineId: line.id, pIdx: 0, x: line.points[0].x, y: line.points[0].y, label: line.points[0].label };
      const endPt = {
        lineId: line.id,
        pIdx: line.points.length - 1,
        x: line.points[line.points.length - 1].x,
        y: line.points[line.points.length - 1].y,
        label: line.points[line.points.length - 1].label,
      };

      [startPt, endPt].forEach((pt, isEnd) => {
        let nearestPt = { dist: Infinity, pt: null as any };
        let nearestSeg = { dist: Infinity, lineId: '', p1Idx: 0, p2Idx: 0, p1: null as any, p2: null as any };

        allPts.forEach(other => {
          if (other.lineId === line.id) return;
          const d = Math.hypot(other.x - pt.x, other.y - pt.y);
          if (d < nearestPt.dist) nearestPt = { dist: d, pt: other };
        });

        lines.forEach(otherLine => {
          if (otherLine.id === line.id) return;
          for (let s = 0; s < otherLine.points.length - 1; s++) {
            const a = otherLine.points[s];
            const b = otherLine.points[s + 1];
            const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
            let t = l2 === 0 ? 0 : ((pt.x - a.x) * (b.x - a.x) + (pt.y - a.y) * (b.y - a.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
            const d = Math.hypot(pt.x - proj.x, pt.y - proj.y);
            if (d < nearestSeg.dist) {
              nearestSeg = { dist: d, lineId: otherLine.id, p1Idx: s, p2Idx: s + 1, p1: a, p2: b };
            }
          }
        });

        const distVal = Math.min(nearestPt.dist, nearestSeg.dist);
        let type: GapAuditItem['type'] = 'DRAWING_GAP';
        if (nearestPt.dist <= 2.0) type = 'EXACT_TOUCHING';
        else if (nearestSeg.dist <= 2.0) type = 'POINT_ON_SEGMENT';
        else if (distVal <= 5.0) type = 'CLOSE_ALIGNED';

        items.push({
          id: `gap_${line.id}_${isEnd ? 'end' : 'start'}`,
          type,
          pointA: pt,
          pointB: nearestPt.pt || undefined,
          segmentB: nearestSeg.lineId ? {
            lineId: nearestSeg.lineId,
            p1Idx: nearestSeg.p1Idx,
            p2Idx: nearestSeg.p2Idx,
            p1: nearestSeg.p1,
            p2: nearestSeg.p2,
          } : undefined,
          distancePx: Math.round(distVal * 10) / 10,
          description: `${line.id} [${isEnd ? 'END' : 'START'} #${pt.pIdx + 1}] (${pt.x}, ${pt.y}) -> gần nhất ${nearestPt.pt?.lineId || nearestSeg.lineId} (${Math.round(distVal * 10) / 10}px)`,
        });
      });
    });

    return items;
  }, [lines]);

  // Selected node detailed object
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;
    const l = lines.find(x => x.id === selectedNode.lineId);
    if (!l) return null;
    const pt = l.points[selectedNode.pointIndex];
    if (!pt) return null;
    return {
      line: l,
      point: pt,
      pointIndex: selectedNode.pointIndex,
      origX: selectedNode.origX,
      origY: selectedNode.origY,
    };
  }, [selectedNode, lines]);

  // Sync nodeLabelInput when selected node changes
  useEffect(() => {
    if (selectedNodeDetails) {
      setNodeLabelInput(selectedNodeDetails.point.label || '');
    } else {
      setNodeLabelInput('');
    }
  }, [selectedNodeDetails?.line.id, selectedNodeDetails?.pointIndex]);

  // ── Instant Real-Time Node Label Updater ──────────────────────────────────
  const handleLabelChange = useCallback((newVal: string) => {
    setNodeLabelInput(newVal);
    if (!selectedNode) return;
    const trimmed = newVal.trim();
    const { lineId, pointIndex } = selectedNode;

    setLines(prev => {
      return prev.map(l => {
        if (l.id !== lineId) return l;
        const newPts = [...l.points];
        if (newPts[pointIndex]) {
          newPts[pointIndex] = {
            ...newPts[pointIndex],
            label: trimmed || undefined,
            nodeId: trimmed || undefined,
          };
        }
        return { ...l, points: newPts };
      });
    });

    setStatusMsg(
      trimmed
        ? `✏️ Tên node: "${trimmed}" (Đã cập nhật tức thì - Bấm Ctrl+S để lưu vào file)`
        : `✕ Đã xóa nhãn node (Bấm Ctrl+S để lưu vào file)`
    );
  }, [selectedNode]);

  // ── Apply Node Label Helper (With History Push) ───────────────────────────
  const handleApplyNodeLabel = useCallback((customLabel?: string) => {
    if (!selectedNode) return;
    const rawVal = customLabel !== undefined ? customLabel : nodeLabelInput;
    const trimmed = rawVal.trim();
    const { lineId, pointIndex } = selectedNode;

    setNodeLabelInput(trimmed);
    setLines(prev => {
      const next = prev.map(l => {
        if (l.id !== lineId) return l;
        const newPts = [...l.points];
        if (newPts[pointIndex]) {
          newPts[pointIndex] = {
            ...newPts[pointIndex],
            label: trimmed || undefined,
            nodeId: trimmed || undefined,
          };
        }
        return { ...l, points: newPts };
      });
      pushHistory(
        next,
        trimmed
          ? `🏷️ Đã đặt tên node #${pointIndex + 1} của ${lineId}: "${trimmed}"`
          : `✕ Đã xóa nhãn node #${pointIndex + 1} của ${lineId}`
      );
      return next;
    });

    setStatusMsg(
      trimmed
        ? `✓ Đã lưu nhãn: "${trimmed}" (Nhấn Ctrl+S hoặc nút "Lưu" để ghi vào file)`
        : `✓ Đã xóa nhãn node (Nhấn Ctrl+S hoặc nút "Lưu" để ghi vào file)`
    );
  }, [selectedNode, nodeLabelInput, pushHistory]);

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

  const zoomToCoord = useCallback((cx: number, cy: number, span = 200) => {
    const aspect = SVG_HEIGHT / SVG_WIDTH;
    const w = span;
    const h = span * aspect;
    const x = Math.max(0, Math.min(SVG_WIDTH - w, cx - w / 2));
    const y = Math.max(0, Math.min(SVG_HEIGHT - h, cy - h / 2));
    setView({ x, y, w, h });
  }, []);

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
    setHighlightedGap(null);
  };

  // ── Clean Export Data Format Helper ───────────────────────────────────────
  const getCleanData = (sourceLines = lines) => {
    return sourceLines.map(l => ({
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

  // ── Direct Save to Disk API ───────────────────────────────────────────────
  const handleDirectSave = async () => {
    setSaveStatus('saving');
    
    // Auto-commit any currently typed label in nodeLabelInput
    let currentLines = lines;
    if (selectedNode) {
      const currentPoint = currentLines.find(l => l.id === selectedNode.lineId)?.points[selectedNode.pointIndex];
      const trimmed = nodeLabelInput.trim();
      const currentLabel = currentPoint?.label || '';
      if (trimmed !== currentLabel) {
        currentLines = currentLines.map(l => {
          if (l.id !== selectedNode.lineId) return l;
          const newPts = [...l.points];
          if (newPts[selectedNode.pointIndex]) {
            newPts[selectedNode.pointIndex] = {
              ...newPts[selectedNode.pointIndex],
              label: trimmed || undefined,
              nodeId: trimmed || undefined,
            };
          }
          return { ...l, points: newPts };
        });
        setLines(currentLines);
      }
    }

    const cleanData = getCleanData(currentLines);

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
      setSaveStatus('error');
      exportJson();
      setToastMsg('⚠️ Đã tải file JSON về máy (Download)');
      setTimeout(() => {
        setSaveStatus('idle');
        setToastMsg(null);
      }, 4000);
    }
  };

  // ── Export JSON (Download) ────────────────────────────────────────────────
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

  // ── Import JSON (Upload File) ─────────────────────────────────────────────
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeRawLines(parsed);
          setLines(sanitized);
          pushHistory(sanitized, `📥 Đã nạp thành công ${sanitized.length} lines từ file ${file.name}`);
          setToastMsg(`✅ ĐÃ IMPORT THÀNH CÔNG: ${sanitized.length} Lines!`);
          setTimeout(() => setToastMsg(null), 4000);
        }
      } catch (err) {
        alert('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Save
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDirectSave();
        return;
      }

      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
        return;
      }

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
      } else if (e.key === 'Escape') {
        setSelectedNode(null);
        setHighlightedGap(null);
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

  return (
    <div className="flex h-screen w-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* ── TOP NAV BAR ───────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-[#0c121e]/95 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-cyan-400 uppercase">
              {isRawOnlyMode ? '🔍 RAW-ONLY V3' : '🖐️ GRAPH V3'}
            </span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800 font-mono font-bold">
              {lines.length} RAW LINES
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 truncate">
            <span>Points: <strong className="text-cyan-300">{stats.totalPoints}</strong></span>
            <span>Named: <strong className="text-emerald-300">{stats.namedPoints}</strong></span>
            <span>Geom: <strong className="text-slate-300">{stats.geometryOnlyPoints}</strong></span>
            <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
              Junctions = 0
            </span>
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
            ↺
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
            ↻
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* Toggles */}
          <button
            onClick={() => setShowPoints(!showPoints)}
            className={`px-2 py-1 text-xs rounded border transition cursor-pointer font-bold flex items-center gap-1 ${
              showPoints
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Hiện/Ẩn Chấm Điểm"
          >
            <span>🔘 Điểm</span>
          </button>

          <button
            onClick={() => setShowLineNames(!showLineNames)}
            className={`px-2 py-1 text-xs rounded border transition cursor-pointer font-bold flex items-center gap-1 ${
              showLineNames
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Hiện/Ẩn Tên Tuyến"
          >
            <span>🏷️ Tên</span>
          </button>

          <button
            onClick={() => setShowPointIndices(!showPointIndices)}
            className={`px-2 py-1 text-xs rounded border transition cursor-pointer font-bold flex items-center gap-1 ${
              showPointIndices
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Hiện/Ẩn Thứ Tự Điểm (#1, #2...)"
          >
            <span>🔢 Số #</span>
          </button>

          <button
            onClick={() => setShowGapPanel(!showGapPanel)}
            className={`px-2 py-1 text-xs rounded border transition cursor-pointer font-bold flex items-center gap-1 ${
              showGapPanel
                ? 'bg-amber-950 border-amber-500 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Bảng Kiểm Toán Điểm Hở (RAW_GAP_AUDIT)"
          >
            <span>📐 Điểm Hở ({gapAuditItems.length})</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* 🔄 Nạp Lại RAW V3 từ File Button */}
          <button
            onClick={fetchFreshRawFromFile}
            className="px-2.5 py-1 bg-sky-900 hover:bg-sky-800 border border-sky-600 text-sky-200 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1"
            title="Nạp lại trực tiếp từ v3_raw_traces_manual.json trên ổ đĩa"
          >
            <span>🔄 Nạp lại RAW từ file</span>
          </button>

          {/* 💾 LƯU TRỰC TIẾP Button */}
          <button
            onClick={handleDirectSave}
            disabled={saveStatus === 'saving'}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black rounded-lg shadow-lg shadow-emerald-950/50 cursor-pointer transition flex items-center gap-1 ring-2 ring-emerald-400/50"
            title="Lưu trực tiếp vào file v3_raw_traces_manual.json (Ctrl+S)"
          >
            <span>💾 {saveStatus === 'saving' ? 'Đang lưu...' : 'Lưu (Ctrl+S)'}</span>
          </button>

          {/* Import / Export JSON Buttons */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition"
            title="Nhập file JSON từ máy tính"
          >
            📤 Import
          </button>
          <button
            onClick={exportJson}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition"
            title="Xuất file JSON về máy"
          >
            📥 Export
          </button>

          <button
            onClick={resetView}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer transition text-slate-200"
            title="Toàn Cảnh"
          >
            🗺️
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
      <div className="w-[310px] min-w-[310px] bg-[#0c121e] border-r border-slate-800 flex flex-col z-20 shadow-2xl pt-12">
        {/* Source File Info Box */}
        <div className="p-2.5 bg-slate-950 border-b border-slate-800 text-[10px] font-mono space-y-1">
          <div className="text-slate-400 truncate" title={fileMeta.absolutePath}>
            📁 <strong className="text-slate-200">Nguồn:</strong> {fileMeta.absolutePath.replace(/\\/g, '/')}
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>SHA-256: <strong className="text-cyan-300">{fileMeta.sha256.slice(0, 12)}...</strong></span>
            <span>Lines: <strong className="text-white">{stats.lineCount}</strong> | Pts: <strong className="text-white">{stats.totalPoints}</strong></span>
          </div>
        </div>

        <div className="p-2 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <span className="text-xs font-black tracking-wider text-slate-300 uppercase">DANH SÁCH 38 LINES</span>
          <span className="text-[11px] font-mono text-cyan-400 font-bold">{lines.length} Tuyến</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {lines.map((line, idx) => {
            const isSelected = line.id === activeLineId;
            const lineColor = VIBRANT_LINE_COLORS[idx % VIBRANT_LINE_COLORS.length];

            return (
              <div
                key={`${line.id}-${idx}`}
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

        {/* Selected Node Coordinates Panel (Strictly LineId + Index + Coords + Explicit Label) */}
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
              <div className="flex justify-between text-slate-400">
                <span>Tên hiện tại:</span>
                <span className={selectedNodeDetails.point.label ? "text-amber-300 font-bold" : "text-slate-500 italic"}>
                  {selectedNodeDetails.point.label || '(Chưa có tên)'}
                </span>
              </div>
            </div>

            {/* 🏷️ Form Đặt Tên Node Trực Tiếp */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <span>🏷️ Tên node:</span>
                </label>
                {selectedNodeDetails.point.label && (
                  <button
                    type="button"
                    onClick={() => {
                      setNodeLabelInput('');
                      handleApplyNodeLabel('');
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    title="Xóa nhãn của node này"
                  >
                    ✕ Xóa nhãn
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={nodeLabelInput}
                  onChange={e => handleLabelChange(e.target.value)}
                  onBlur={() => handleApplyNodeLabel()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyNodeLabel();
                    }
                  }}
                  placeholder="Nhập tên node (vd: 07L, W1...)"
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded text-xs font-mono text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyNodeLabel()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold rounded text-xs cursor-pointer transition shadow flex items-center gap-1 shrink-0"
                  title="Xác nhận đặt tên (Enter)"
                >
                  <span>Đặt tên</span>
                </button>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium leading-tight">
                ⚡ <em>Tự động nhận tên ngay khi gõ!</em> Nhấn <strong>Lưu (Ctrl+S)</strong> để ghi vào file.
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              💡 Chuột kéo hoặc phím mũi tên <kbd className="bg-slate-800 px-1 rounded">← ↑ ↓ →</kbd> (Shift: 5px)
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-cyan-400 truncate">
          {statusMsg}
        </div>
      </div>

      {/* ── RIGHT DRAWER: RAW_GAP_AUDIT PANEL (INSPECTION ONLY) ─────────────── */}
      {showGapPanel && (
        <div className="w-[360px] min-w-[360px] bg-[#0c121e] border-l border-slate-800 flex flex-col z-20 shadow-2xl pt-12">
          <div className="p-3 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
            <div>
              <span className="text-xs font-black tracking-wider text-amber-400 uppercase">📐 RAW GAP AUDIT</span>
              <p className="text-[10px] text-slate-400">Kiểm tra khoảng cách đầu mút (Chỉ báo cáo)</p>
            </div>
            <button
              onClick={() => setShowGapPanel(false)}
              className="text-slate-400 hover:text-white text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {gapAuditItems.map(item => {
              const isSelected = highlightedGap?.id === item.id;
              const badgeBg =
                item.type === 'EXACT_TOUCHING'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : item.type === 'POINT_ON_SEGMENT'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : item.type === 'CLOSE_ALIGNED'
                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setHighlightedGap(item);
                    zoomToCoord(item.pointA.x, item.pointA.y, 160);
                  }}
                  className={`p-2.5 rounded-lg border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{item.pointA.lineId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${badgeBg}`}>
                      {item.type} ({item.distancePx}px)
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 font-mono">
                    {item.description}
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setHighlightedGap(item);
                      zoomToCoord(item.pointA.x, item.pointA.y, 140);
                    }}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded font-bold transition"
                  >
                    🔍 Phóng to vị trí này ({item.pointA.x}, {item.pointA.y})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                <g key={`raw-line-${line.id}-${idx}`}>
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

          {/* 2. Gap Audit Highlight Overlays (Inspection Only) */}
          {highlightedGap && (
            <g className="gap-highlight" pointerEvents="none">
              <circle
                cx={highlightedGap.pointA.x}
                cy={highlightedGap.pointA.y}
                r={14}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={2.0}
                strokeDasharray="4,3"
                className="animate-pulse"
              />
              {highlightedGap.pointB && (
                <>
                  <circle
                    cx={highlightedGap.pointB.x}
                    cy={highlightedGap.pointB.y}
                    r={14}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={2.0}
                    strokeDasharray="4,3"
                  />
                  <line
                    x1={highlightedGap.pointA.x}
                    y1={highlightedGap.pointA.y}
                    x2={highlightedGap.pointB.x}
                    y2={highlightedGap.pointB.y}
                    stroke="#fbbf24"
                    strokeWidth={1.5}
                    strokeDasharray="2,2"
                  />
                </>
              )}
            </g>
          )}

          {/* 3. Raw Points & Touch Targets */}
          {showPoints && (
            <g className="raw-points">
              {lines.map((line, lIdx) => {
                const lineColor = VIBRANT_LINE_COLORS[lIdx % VIBRANT_LINE_COLORS.length];

                return (
                  <g key={`raw-pts-group-${line.id}-${lIdx}`}>
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

                          {/* Explicit Operational Label Only */}
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
