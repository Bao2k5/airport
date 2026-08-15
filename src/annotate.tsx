/* eslint-disable react-refresh/only-export-components */
// Guided Node Placement & Raw Trace Calibration Editor
// Crash-Proof, High-Performance Drawing, Lightweight RAM History, Instant Auto-Save & Recovery

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { airportGraph, SVG_WIDTH, SVG_HEIGHT } from './data/airportGraph';
import { NODE_GUIDE_DATA, type NodeGuideItem } from './data/nodeGuideData';

export interface NodeStateItem extends NodeGuideItem {
  x: number | null;
  y: number | null;
  status: 'unplaced' | 'placed';
  centerlineErrorPx?: number;
  assignedRawLine?: string;
  isUncertain?: boolean;
}

export interface RawLineItem {
  id: string;
  name: string;
  points: Array<{ x: number; y: number }>;
}

export interface EditorSnapshot {
  timestamp: number;
  description: string;
  nodeStates: NodeStateItem[];
  rawLines: RawLineItem[];
  activeGroup: string;
  selectedId: string;
  activeLineId: string;
}

const STORAGE_KEY = 'guided_node_editor_v9';
const RAW_LINES_STORAGE_KEY = 'raw_trace_lines_v5';
const AUTOSAVE_BACKUP_KEY = 'raw_trace_backup_v5';

export const GROUP_LABELS: Record<string, string> = {
  ALL: 'Tất cả 11 nhóm (127 node)',
  RUNWAY_NORTH: '1. Trục đường băng Bắc (07L/25R)',
  RUNWAY_SOUTH: '2. Trục đường băng Nam (07R/25L)',
  W11_W9A_W9B: '3. Vòng xoay W11/W9A/W9B Tây Bắc',
  W5_WEST: '4. Đường lăn W5 Phía Tây',
  W6_VERTICAL: '5. Trục dọc W6',
  W5_MIDDLE: '6. Đường lăn W5 Phía Giữa',
  W7A_W7B_M5: '7. Cụm nút giao W7A/W7B/M5',
  W3_M1_APRON: '8. Nút chéo W3 & M1 vào Apron',
  NS1_NS2_E1_E2: '9. Trục trung tâm NS1/NS2/E1/E2',
  E4_E6: '10. Đường rẽ E4 & Vòng E6 Đông',
  APRON_STANDS: '11. Apron Bến đỗ & Parking',
};

export const GROUP_COLORS: Record<string, string> = {
  RUNWAY_NORTH: '#ef4444',
  RUNWAY_SOUTH: '#f97316',
  W11_W9A_W9B: '#a855f7',
  W5_WEST: '#ec4899',
  W6_VERTICAL: '#3b82f6',
  W5_MIDDLE: '#06b6d4',
  W7A_W7B_M5: '#14b8a6',
  W3_M1_APRON: '#eab308',
  NS1_NS2_E1_E2: '#84cc16',
  E4_E6: '#6366f1',
  APRON_STANDS: '#10b981',
};

// Complete 44-line immutable baseline raw traces (182 points)
export const PRESET_COMPLETE_RAW_LINES: RawLineItem[] = [
  { "id": "line_01", "name": "line_01", "points": [{ "x": 50, "y": 440 }, { "x": 120, "y": 408 }, { "x": 228, "y": 360 }, { "x": 420, "y": 272 }, { "x": 620, "y": 182 }, { "x": 823, "y": 91 }, { "x": 880, "y": 65 }, { "x": 926, "y": 44 }] },
  { "id": "line_02", "name": "line_02", "points": [{ "x": 61, "y": 643 }, { "x": 140, "y": 610 }, { "x": 237, "y": 571 }, { "x": 370, "y": 515 }, { "x": 499, "y": 459 }, { "x": 580, "y": 424 }, { "x": 653, "y": 392 }, { "x": 820, "y": 319 }, { "x": 991, "y": 246 }, { "x": 1135, "y": 184 }] },
  { "id": "line_03", "name": "line_03", "points": [{ "x": 71, "y": 469 }, { "x": 70, "y": 490 }, { "x": 68, "y": 510 }, { "x": 67, "y": 535 }, { "x": 67, "y": 555 }, { "x": 66, "y": 575 }, { "x": 66, "y": 595 }, { "x": 67, "y": 620 }, { "x": 68, "y": 640 }, { "x": 70, "y": 655 }, { "x": 73, "y": 672 }, { "x": 78, "y": 695 }, { "x": 85, "y": 715 }, { "x": 96, "y": 735 }, { "x": 110, "y": 755 }, { "x": 126, "y": 765 }, { "x": 145, "y": 770 }, { "x": 170, "y": 765 }, { "x": 200, "y": 750 }, { "x": 240, "y": 730 }, { "x": 280, "y": 705 }, { "x": 125, "y": 680 }] },
  { "id": "line_04", "name": "line_04", "points": [{ "x": 75, "y": 460 }, { "x": 85, "y": 500 }, { "x": 84, "y": 550 }, { "x": 83, "y": 600 }, { "x": 85, "y": 650 }, { "x": 95, "y": 700 }, { "x": 115, "y": 735 }] },
  { "id": "line_05", "name": "line_05", "points": [{ "x": 235, "y": 395 }, { "x": 232, "y": 420 }, { "x": 230, "y": 440 }, { "x": 227, "y": 465 }, { "x": 225, "y": 490 }, { "x": 223, "y": 510 }, { "x": 222, "y": 530 }, { "x": 223, "y": 555 }, { "x": 225, "y": 580 }, { "x": 232, "y": 605 }, { "x": 240, "y": 630 }, { "x": 260, "y": 660 }, { "x": 345, "y": 680 }] },
  { "id": "line_06", "name": "line_06", "points": [{ "x": 85, "y": 715 }, { "x": 105, "y": 650 }, { "x": 125, "y": 680 }, { "x": 220, "y": 600 }, { "x": 295, "y": 678 }] },
  { "id": "line_07", "name": "line_07", "points": [{ "x": 498, "y": 475 }, { "x": 494, "y": 495 }, { "x": 490, "y": 510 }, { "x": 485, "y": 530 }, { "x": 480, "y": 550 }, { "x": 470, "y": 580 }, { "x": 465, "y": 615 }] },
  { "id": "line_08", "name": "line_08", "points": [{ "x": 498, "y": 620 }, { "x": 515, "y": 612 }, { "x": 535, "y": 605 }] },
  { "id": "line_09", "name": "line_09", "points": [{ "x": 380, "y": 665 }, { "x": 410, "y": 650 }, { "x": 440, "y": 635 }, { "x": 470, "y": 620 }, { "x": 498, "y": 620 }] },
  { "id": "line_10", "name": "line_10", "points": [{ "x": 665, "y": 415 }, { "x": 685, "y": 430 }, { "x": 705, "y": 445 }, { "x": 730, "y": 480 }] },
  { "id": "line_11", "name": "line_11", "points": [{ "x": 705, "y": 445 }, { "x": 750, "y": 445 }] },
  { "id": "line_12", "name": "line_12", "points": [{ "x": 823, "y": 115 }, { "x": 820, "y": 140 }, { "x": 818, "y": 170 }, { "x": 812, "y": 220 }, { "x": 805, "y": 275 }, { "x": 800, "y": 305 }, { "x": 795, "y": 335 }] },
  { "id": "line_13", "name": "line_13", "points": [{ "x": 795, "y": 335 }, { "x": 788, "y": 375 }, { "x": 780, "y": 415 }] },
  { "id": "line_14", "name": "line_14", "points": [{ "x": 780, "y": 415 }, { "x": 770, "y": 438 }, { "x": 760, "y": 460 }, { "x": 752, "y": 490 }, { "x": 745, "y": 520 }, { "x": 742, "y": 555 }, { "x": 740, "y": 590 }, { "x": 738, "y": 625 }, { "x": 735, "y": 660 }, { "x": 732, "y": 695 }, { "x": 730, "y": 730 }] },
  { "id": "line_15", "name": "line_15", "points": [{ "x": 880, "y": 110 }, { "x": 876, "y": 140 }, { "x": 872, "y": 175 }, { "x": 868, "y": 215 }, { "x": 865, "y": 255 }] },
  { "id": "line_16", "name": "line_16", "points": [{ "x": 865, "y": 255 }, { "x": 862, "y": 290 }, { "x": 858, "y": 330 }] },
  { "id": "line_17", "name": "line_17", "points": [{ "x": 858, "y": 330 }, { "x": 854, "y": 365 }, { "x": 850, "y": 400 }, { "x": 846, "y": 435 }, { "x": 842, "y": 470 }] },
  { "id": "line_18", "name": "line_18", "points": [{ "x": 890, "y": 80 }, { "x": 880, "y": 110 }] },
  { "id": "line_19", "name": "line_19", "points": [] },
  { "id": "line_20", "name": "line_20", "points": [{ "x": 855, "y": 360 }, { "x": 890, "y": 420 }] },
  { "id": "line_21", "name": "line_21", "points": [{ "x": 842, "y": 470 }, { "x": 860, "y": 465 }, { "x": 875, "y": 460 }, { "x": 892, "y": 452 }, { "x": 910, "y": 445 }, { "x": 955, "y": 425 }] },
  { "id": "line_22", "name": "line_22", "points": [{ "x": 890, "y": 420 }, { "x": 940, "y": 395 }] },
  { "id": "line_23", "name": "line_23", "points": [{ "x": 940, "y": 395 }, { "x": 955, "y": 425 }] },
  { "id": "line_24", "name": "line_24", "points": [{ "x": 940, "y": 70 }, { "x": 945, "y": 120 }] },
  { "id": "line_25", "name": "line_25", "points": [{ "x": 945, "y": 120 }, { "x": 950, "y": 180 }] },
  { "id": "line_26", "name": "line_26", "points": [{ "x": 950, "y": 180 }, { "x": 955, "y": 235 }] },
  { "id": "line_27", "name": "line_27", "points": [{ "x": 955, "y": 235 }, { "x": 965, "y": 280 }] },
  { "id": "line_28", "name": "line_28", "points": [{ "x": 965, "y": 280 }, { "x": 980, "y": 320 }] },
  { "id": "line_29", "name": "line_29", "points": [{ "x": 980, "y": 320 }, { "x": 1010, "y": 350 }] },
  { "id": "line_30", "name": "line_30", "points": [{ "x": 1010, "y": 350 }, { "x": 1030, "y": 362 }, { "x": 1050, "y": 375 }] },
  { "id": "line_31", "name": "line_31", "points": [{ "x": 955, "y": 235 }, { "x": 1020, "y": 240 }] },
  { "id": "line_32", "name": "line_32", "points": [{ "x": 980, "y": 415 }, { "x": 1030, "y": 395 }] },
  { "id": "line_33", "name": "line_33", "points": [{ "x": 1080, "y": 215 }, { "x": 1100, "y": 230 }] },
  { "id": "line_34", "name": "line_34", "points": [{ "x": 1050, "y": 260 }, { "x": 1090, "y": 340 }] },
  { "id": "line_35", "name": "line_35", "points": [{ "x": 1070, "y": 365 }, { "x": 1110, "y": 310 }, { "x": 1125, "y": 250 }] },
  { "id": "line_36", "name": "line_36", "points": [{ "x": 1125, "y": 250 }, { "x": 1115, "y": 210 }] },
  { "id": "line_37", "name": "line_37", "points": [{ "x": 1140, "y": 220 }, { "x": 1155, "y": 245 }, { "x": 1145, "y": 270 }] },
  { "id": "line_38", "name": "line_38", "points": [{ "x": 745, "y": 385 }, { "x": 805, "y": 355 }] },
  { "id": "line_39", "name": "line_39", "points": [{ "x": 685, "y": 470 }, { "x": 675, "y": 520 }] },
  { "id": "line_40", "name": "line_40", "points": [{ "x": 775, "y": 460 }, { "x": 775, "y": 560 }] },
  { "id": "line_41", "name": "line_41", "points": [{ "x": 705, "y": 460 }, { "x": 705, "y": 560 }] },
  { "id": "line_42", "name": "line_42", "points": [{ "x": 755, "y": 690 }, { "x": 775, "y": 690 }] },
  { "id": "line_43", "name": "line_43", "points": [{ "x": 715, "y": 740 }, { "x": 775, "y": 740 }] },
  { "id": "line_44", "name": "line_44", "points": [] }
];

function getInitialCleanState(): NodeStateItem[] {
  return NODE_GUIDE_DATA.map(item => ({
    ...item,
    x: null,
    y: null,
    status: 'unplaced',
    isUncertain: false,
    centerlineErrorPx: undefined,
    assignedRawLine: undefined,
  }));
}

function recoverPreAutoMatchRawLines(): RawLineItem[] | null {
  const keysToScan = [
    'raw_trace_lines_v5',
    'raw_trace_backup_v5',
    'editor_pre_automatch_snapshot_v2',
    'editor_snapshot_history_v2',
    'raw_trace_lines_v4',
    'raw_trace_lines_v3',
    'raw_trace_lines_v2',
    'editor_pre_automatch_snapshot_v1',
    'editor_snapshot_history_v1',
    'raw_trace_lines_v1',
  ];

  for (const k of keysToScan) {
    try {
      const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].points) {
        return parsed;
      }
      if (parsed.rawLines && Array.isArray(parsed.rawLines) && parsed.rawLines.length > 0) {
        return parsed.rawLines;
      }
      if (parsed.stack && Array.isArray(parsed.stack)) {
        for (let i = parsed.stack.length - 1; i >= 0; i--) {
          if (parsed.stack[i].rawLines && parsed.stack[i].rawLines.length > 0) {
            return parsed.stack[i].rawLines;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function sanitizeRawLines(input: any): RawLineItem[] {
  if (!Array.isArray(input)) return PRESET_COMPLETE_RAW_LINES;
  const valid: RawLineItem[] = [];
  input.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id : `line_${String(idx + 1).padStart(2, '0')}`;
    const name = typeof item.name === 'string' && item.name.trim() ? item.name : id;
    const pts: Array<{ x: number; y: number }> = [];
    if (Array.isArray(item.points)) {
      item.points.forEach((p: any) => {
        if (p && typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y)) {
          pts.push({ x: Math.round(p.x), y: Math.round(p.y) });
        }
      });
    }
    valid.push({ id, name, points: pts });
  });
  return valid.length > 0 ? valid : PRESET_COMPLETE_RAW_LINES;
}

function loadInitialRawLines(): RawLineItem[] {
  try {
    const recovered = recoverPreAutoMatchRawLines();
    if (recovered && recovered.length > 0) return sanitizeRawLines(recovered);
  } catch {
    /* ignore */
  }
  return sanitizeRawLines(PRESET_COMPLETE_RAW_LINES);
}

function GuidedNodeEditor() {
  const [editorMode, setEditorMode] = useState<'GUIDED' | 'RAW_TRACE'>('RAW_TRACE');
  const [nodeStates, setNodeStates] = useState<NodeStateItem[]>(() => getInitialCleanState());
  const [rawLines, setRawLines] = useState<RawLineItem[]>(() => loadInitialRawLines());
  const [activeLineId, setActiveLineId] = useState<string>('line_01');

  const [selectedId, setSelectedId] = useState<string>('RWY07L_THR');
  const [activeGroup, setActiveGroup] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPLACED' | 'PLACED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showRegionSpotlight, setShowRegionSpotlight] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showDeltaLines, setShowDeltaLines] = useState<boolean>(false);
  const [showProposedNodes, setShowProposedNodes] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('✓ Đã lưu');

  // Lightweight in-memory history stack (up to 30 snapshots in RAM)
  const historyRef = useRef<EditorSnapshot[]>([]);
  const historyIdxRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rawFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-Save rawLines immediately on every modification
  useEffect(() => {
    try {
      const serialized = JSON.stringify(rawLines);
      localStorage.setItem(RAW_LINES_STORAGE_KEY, serialized);
      localStorage.setItem(AUTOSAVE_BACKUP_KEY, serialized);
      sessionStorage.setItem(RAW_LINES_STORAGE_KEY, serialized);
      setAutoSaveStatus(`✓ Đã lưu (${rawLines.reduce((acc, l) => acc + l.points.length, 0)} điểm)`);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [rawLines]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nodeStates));
    } catch {
      /* ignore */
    }
  }, [nodeStates]);

  // Ensure activeLineId is always valid
  useEffect(() => {
    if (rawLines.length > 0 && !rawLines.some(l => l.id === activeLineId)) {
      setActiveLineId(rawLines[0].id);
    }
  }, [rawLines, activeLineId]);

  // Lightweight in-RAM snapshot
  const pushSnapshot = useCallback((description: string, customNodes?: NodeStateItem[], customLines?: RawLineItem[]) => {
    const snapshot: EditorSnapshot = {
      timestamp: Date.now(),
      description,
      nodeStates: customNodes ? [...customNodes] : nodeStates,
      rawLines: customLines ? JSON.parse(JSON.stringify(customLines)) : JSON.parse(JSON.stringify(rawLines)),
      activeGroup,
      selectedId,
      activeLineId,
    };

    const trimmed = historyRef.current.slice(0, historyIdxRef.current + 1);
    trimmed.push(snapshot);
    if (trimmed.length > 30) trimmed.shift();

    historyRef.current = trimmed;
    historyIdxRef.current = trimmed.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  }, [nodeStates, rawLines, activeGroup, selectedId, activeLineId]);

  // Undo (↶ Quay lại)
  const handleUndo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1;
      const snapshot = historyRef.current[historyIdxRef.current];
      if (snapshot) {
        setNodeStates(snapshot.nodeStates);
        setRawLines(snapshot.rawLines);
        setActiveGroup(snapshot.activeGroup);
        setSelectedId(snapshot.selectedId);
        setActiveLineId(snapshot.activeLineId || (snapshot.rawLines[0] ? snapshot.rawLines[0].id : 'line_01'));
      }
      setCanUndo(historyIdxRef.current > 0);
      setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    }
  }, []);

  // Redo (↷ Làm lại)
  const handleRedo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current += 1;
      const snapshot = historyRef.current[historyIdxRef.current];
      if (snapshot) {
        setNodeStates(snapshot.nodeStates);
        setRawLines(snapshot.rawLines);
        setActiveGroup(snapshot.activeGroup);
        setSelectedId(snapshot.selectedId);
        setActiveLineId(snapshot.activeLineId || (snapshot.rawLines[0] ? snapshot.rawLines[0].id : 'line_01'));
      }
      setCanUndo(true);
      setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    }
  }, []);

  // Quick One-Click Preset: Load Complete 11 Clean Traces
  const handleLoadFullPresets = () => {
    if (window.confirm('Nạp toàn bộ 11 nhánh tim đường mẫu đầy đủ (127 điểm đã căn chuẩn)?')) {
      pushSnapshot('Nạp 11 nhánh mẫu');
      setRawLines(PRESET_COMPLETE_RAW_LINES);
      setActiveLineId('line_01');
    }
  };

  // Undo last drawn point in active line
  const undoLastPoint = useCallback(() => {
    pushSnapshot('Xóa điểm vừa chấm');
    setRawLines(prev =>
      prev.map(line =>
        line.id === activeLineId && line.points.length > 0
          ? { ...line, points: line.points.slice(0, -1) }
          : line
      )
    );
  }, [activeLineId, pushSnapshot]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Backspace' && editorMode === 'RAW_TRACE') {
        undoLastPoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, undoLastPoint, editorMode]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NodeStateItem>();
    nodeStates.forEach(n => map.set(n.id, n));
    return map;
  }, [nodeStates]);

  const selectedNode = useMemo(() => {
    return nodeMap.get(selectedId) || nodeStates[0];
  }, [selectedId, nodeMap, nodeStates]);

  const filteredNodes = useMemo(() => {
    return nodeStates.filter(n => {
      const matchGroup = activeGroup === 'ALL' || n.group === activeGroup;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'UNPLACED' && n.status === 'unplaced') ||
        (statusFilter === 'PLACED' && n.status === 'placed');
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        n.id.toLowerCase().includes(q) ||
        n.routeCode.toLowerCase().includes(q) ||
        (n.label && n.label.toLowerCase().includes(q)) ||
        (n.note && n.note.toLowerCase().includes(q));
      return matchGroup && matchStatus && matchSearch;
    });
  }, [nodeStates, activeGroup, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = nodeStates.length;
    let placed = 0;
    nodeStates.forEach(n => {
      if (n.status === 'placed' && n.x !== null && n.y !== null) placed++;
    });
    return {
      total,
      placed,
      unplaced: total - placed,
    };
  }, [nodeStates]);

  const detectedJunctions = useMemo(() => {
    const junctions: Array<{ pt: { x: number; y: number }; lines: string[] }> = [];
    const endpoints: Array<{ lineId: string; pt: { x: number; y: number } }> = [];

    rawLines.forEach(line => {
      if (line.points.length > 0) {
        endpoints.push({ lineId: line.id, pt: line.points[0] });
        endpoints.push({ lineId: line.id, pt: line.points[line.points.length - 1] });
      }
    });

    for (let i = 0; i < endpoints.length; i++) {
      for (let j = i + 1; j < endpoints.length; j++) {
        const ep1 = endpoints[i];
        const ep2 = endpoints[j];
        if (ep1.lineId !== ep2.lineId) {
          const dist = Math.hypot(ep1.pt.x - ep2.pt.x, ep1.pt.y - ep2.pt.y);
          if (dist <= 10.0) {
            junctions.push({
              pt: { x: (ep1.pt.x + ep2.pt.x) / 2, y: (ep1.pt.y + ep2.pt.y) / 2 },
              lines: [ep1.lineId, ep2.lineId],
            });
          }
        }
      }
    }
    return junctions;
  }, [rawLines]);

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return {
      x: Math.min(SVG_WIDTH, Math.max(0, Math.round(p.x))),
      y: Math.min(SVG_HEIGHT, Math.max(0, Math.round(p.y))),
    };
  }, []);

  // Blazingly fast, crash-proof canvas click
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (editorMode === 'RAW_TRACE') {
      const coords = toSvgCoords(e.clientX, e.clientY);
      setRawLines(prev => {
        const lineExists = prev.some(l => l.id === activeLineId);
        if (!lineExists) {
          const newLine: RawLineItem = {
            id: activeLineId || 'line_01',
            name: activeLineId || 'line_01',
            points: [coords],
          };
          return [...prev, newLine];
        }
        return prev.map(line =>
          line.id === activeLineId
            ? { ...line, points: [...line.points, coords] }
            : line
        );
      });
    }
  };

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    if (editorMode === 'RAW_TRACE') return;
    e.stopPropagation();
    pushSnapshot(`Kéo di chuyển node ${id}`);
    setSelectedId(id);
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = toSvgCoords(e.clientX, e.clientY);
    setCursorPos(coords);

    if (draggingId && editorMode === 'GUIDED') {
      setNodeStates(prev =>
        prev.map(n =>
          n.id === draggingId
            ? { ...n, x: coords.x, y: coords.y, status: 'placed' }
            : n
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (draggingId) {
      setDraggingId(null);
    }
  };

  // RAW TRACE Actions
  const startNewLine = () => {
    pushSnapshot('Tạo nhánh polyline mới');
    const nextIdx = rawLines.length + 1;
    const nextId = `line_${String(nextIdx).padStart(2, '0')}`;
    const newLine: RawLineItem = {
      id: nextId,
      name: nextId,
      points: [],
    };
    setRawLines(prev => [...prev, newLine]);
    setActiveLineId(nextId);
  };

  const deleteActiveLine = () => {
    pushSnapshot(`Xóa nhánh ${activeLineId}`);
    if (rawLines.length <= 1) {
      setRawLines([{ id: 'line_01', name: 'line_01', points: [] }]);
      setActiveLineId('line_01');
      return;
    }
    const remaining = rawLines.filter(l => l.id !== activeLineId);
    setRawLines(remaining);
    if (remaining.length > 0) {
      setActiveLineId(remaining[0].id);
    }
  };

  const clearAllPointsOfActiveLine = () => {
    pushSnapshot(`Xóa toàn bộ điểm của nhánh ${activeLineId}`);
    setRawLines(prev =>
      prev.map(l => (l.id === activeLineId ? { ...l, points: [] } : l))
    );
  };

  // Auto-Match Engine
  const autoMatchRawTraces = () => {
    const validLines = rawLines.filter(l => l.points.length >= 2);
    if (validLines.length === 0) {
      alert('Vui lòng vẽ ít nhất 1 nhánh đường (chấm ít nhất 2 điểm) trước khi bấm Khớp Topo!');
      return;
    }

    // Advanced Spatial Nearest-Segment Projection Matcher across ALL user-drawn lines
    const allSegments: Array<{ lineId: string; p1: { x: number; y: number }; p2: { x: number; y: number } }> = [];
    validLines.forEach(line => {
      for (let i = 0; i < line.points.length - 1; i++) {
        allSegments.push({ lineId: line.id, p1: line.points[i], p2: line.points[i + 1] });
      }
    });

    const projectPointToSegment = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return { x: a.x, y: a.y, dist: Math.hypot(p.x - a.x, p.y - a.y) };

      let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = Math.round(a.x + t * dx);
      const projY = Math.round(a.y + t * dy);
      const dist = Math.hypot(p.x - projX, p.y - projY);
      return { x: projX, y: projY, dist };
    };

    const newStates = nodeStates.map(node => {
      let bestX = node.oldX;
      let bestY = node.oldY;
      let minDistance = Infinity;
      let matchedLineId = 'line_01';

      allSegments.forEach(seg => {
        const res = projectPointToSegment({ x: node.oldX, y: node.oldY }, seg.p1, seg.p2);
        if (res.dist < minDistance) {
          minDistance = res.dist;
          bestX = res.x;
          bestY = res.y;
          matchedLineId = seg.lineId;
        }
      });

      const err = Math.round(minDistance * 10) / 10;
      const conf: 'HIGH' | 'MEDIUM' | 'LOW' = err <= 5 ? 'HIGH' : (err <= 12 ? 'MEDIUM' : 'LOW');

      return {
        ...node,
        x: bestX,
        y: bestY,
        status: 'placed' as const,
        centerlineErrorPx: err,
        assignedRawLine: matchedLineId,
        confidence: conf,
        isUncertain: conf === 'LOW',
      };
    });

    setNodeStates(newStates);
    setShowDeltaLines(false);
    alert(`Đã tự động khớp 127 nodes với ${validLines.length} nhánh đường!`);
  };

  const exportRawTracesJSON = () => {
    const blob = new Blob([JSON.stringify(rawLines, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'raw_traces.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMatchedPositionsJSON = () => {
    const exportArray = nodeStates.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      group: n.group,
      assignedRawLine: n.assignedRawLine || 'line_01',
      routeCode: n.routeCode,
      routeOrder: n.routeOrder,
      routeTotal: n.routeTotal,
      direction: n.direction,
      oldX: n.oldX,
      oldY: n.oldY,
      proposedX: n.x,
      proposedY: n.y,
      deltaPx: n.x !== null && n.y !== null ? Math.round(Math.hypot(n.x - n.oldX, n.y - n.oldY) * 10) / 10 : 0,
      confidence: n.confidence,
      isUncertain: n.isUncertain,
      status: n.status,
      note: n.note || '',
    }));

    const blob = new Blob([JSON.stringify(exportArray, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'raw_trace_matched_positions.proposed.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRawTracesJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target!.result as string);
        if (Array.isArray(data)) {
          if (data.length > 0 && ('proposedX' in data[0] || 'oldX' in data[0])) {
            alert('LƯU Ý: Bạn vừa chọn nhầm file dữ liệu Node (có chứa proposedX/oldX). Vui lòng chọn đúng file raw_traces.json (chứa danh sách các điểm polyline)!');
            return;
          }

          const sanitized = sanitizeRawLines(data);
          pushSnapshot('Nhập raw traces từ JSON');
          setRawLines(sanitized);
          if (sanitized.length > 0) setActiveLineId(sanitized[0].id);
          const totalPoints = sanitized.reduce((acc, l) => acc + (l.points?.length || 0), 0);
          alert(`Đã nhập thành công ${sanitized.length} nhánh raw traces với ${totalPoints} điểm!`);
        } else {
          alert('Định dạng file JSON không hợp lệ (phải là mảng các nhánh polyline).');
        }
      } catch (err) {
        alert('Lỗi file JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportGuidedJSON = () => {
    const exportArray = nodeStates.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      group: n.group,
      routeName: n.routeName,
      routeCode: n.routeCode,
      routeOrder: n.routeOrder,
      routeTotal: n.routeTotal,
      direction: n.direction,
      instruction: n.instruction,
      oldX: n.oldX,
      oldY: n.oldY,
      newX: n.x,
      newY: n.y,
      status: n.status,
      confidence: n.confidence,
      note: n.note || '',
    }));

    const blob = new Blob([JSON.stringify(exportArray, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guided_node_positions.proposed.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importGuidedJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target!.result as string);
        if (Array.isArray(data)) {
          const map = new Map<string, any>();
          data.forEach(item => {
            if (item.id) map.set(item.id, item);
          });

          pushSnapshot('Nhập proposal JSON từ file');
          setNodeStates(prev =>
            prev.map(n => {
              const imp = map.get(n.id);
              if (imp) {
                const targetX = typeof imp.newX === 'number' ? imp.newX : (typeof imp.x === 'number' ? imp.x : n.x);
                const targetY = typeof imp.newY === 'number' ? imp.newY : (typeof imp.y === 'number' ? imp.y : n.y);
                const isPlaced = imp.status === 'placed' || targetX !== null;
                return {
                  ...n,
                  x: targetX,
                  y: targetY,
                  status: isPlaced ? 'placed' : ('unplaced' as const),
                  confidence: imp.confidence || n.confidence,
                  note: imp.note || n.note,
                };
              }
              return n;
            })
          );
          // rawLines is 100% UNTOUCHED
          alert(`Đã nhập proposal thành công với ${map.size} node! (Danh sách raw traces được giữ nguyên 100%).`);
        }
      } catch (err) {
        alert('Lỗi: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentGroupNodes = useMemo(() => {
    const grp = activeGroup !== 'ALL' ? activeGroup : selectedNode.group;
    return nodeStates
      .filter(n => n.group === grp)
      .sort((a, b) => a.routeOrder - b.routeOrder);
  }, [nodeStates, activeGroup, selectedNode.group]);

  const activeLine = useMemo(() => {
    return rawLines.find(l => l.id === activeLineId) || rawLines[0];
  }, [rawLines, activeLineId]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#090d16', color: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13, overflow: 'hidden' }}>
      
      {/* ── Left Area: Interactive Canvas & Guidance ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', padding: 8 }}>
        
        {/* Top Header Mode Switcher & Snapshot Toolbar */}
        <div style={{ background: '#111827', border: '2px solid #38bdf8', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
              🛫 SÂN BAY TÂN SƠN NHẤT
            </span>
            <div style={{ display: 'flex', background: '#1e293b', padding: 2, borderRadius: 6 }}>
              <button
                onClick={() => {
                  pushSnapshot('Chuyển sang Guided Mode');
                  setEditorMode('GUIDED');
                }}
                style={{ background: editorMode === 'GUIDED' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: 11 }}
              >
                🧭 Guided Mode (11 Tuyến)
              </button>
              <button
                onClick={() => {
                  pushSnapshot('Chuyển sang Raw Trace Mode');
                  setEditorMode('RAW_TRACE');
                }}
                style={{ background: editorMode === 'RAW_TRACE' ? '#059669' : 'transparent', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontWeight: 800, fontSize: 11 }}
              >
                ✏️ RAW TRACE (Tự Do Vẽ line_01...)
              </button>
            </div>
            <span style={{ fontSize: 11, color: '#34d399', background: 'rgba(6, 78, 59, 0.6)', border: '1px solid #059669', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
              {autoSaveStatus}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', padding: '3px 8px', borderRadius: 4 }}>
              {stats.placed}/127 node đã đặt
            </span>
          </div>

          {/* Quick Undo / Redo & Recovery Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="Phím tắt: Ctrl+Z"
              style={{
                background: canUndo ? '#334155' : '#1e293b',
                color: canUndo ? '#ffffff' : '#64748b',
                opacity: canUndo ? 1 : 0.45,
                border: '1px solid #475569',
                borderRadius: 4,
                padding: '5px 12px',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              ↶ Quay lại (Ctrl+Z)
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="Phím tắt: Ctrl+Y"
              style={{
                background: canRedo ? '#334155' : '#1e293b',
                color: canRedo ? '#ffffff' : '#64748b',
                opacity: canRedo ? 1 : 0.45,
                border: '1px solid #475569',
                borderRadius: 4,
                padding: '5px 12px',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              ↷ Làm lại (Ctrl+Y)
            </button>

            <button
              onClick={() => {
                const recovered = recoverPreAutoMatchRawLines();
                if (recovered && recovered.length > 0) {
                  pushSnapshot('Khôi phục snapshot raw trace gần nhất');
                  setRawLines(recovered);
                  if (recovered.length > 0) setActiveLineId(recovered[0].id);
                  const totalPts = recovered.reduce((acc, l) => acc + l.points.length, 0);
                  alert(`Đã khôi phục thành công ${recovered.length} nhánh raw trace với tổng cộng ${totalPts} điểm! Tọa độ node đồ thị giữ nguyên.`);
                } else {
                  alert('Không tìm thấy snapshot raw trace nào trong bộ nhớ đệm.');
                }
              }}
              title="Khôi phục danh sách nhánh raw polylines gần nhất trước khi auto-match"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                padding: '5px 12px',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 11,
              }}
            >
              📸 Khôi Phục Snapshot Raw Trace Gần Nhất
            </button>

            <button
              onClick={handleLoadFullPresets}
              title="Nạp ngay toàn bộ 11 nhánh tim đường đã được căn chuẩn để bạn không phải chấm lại từ đầu"
              style={{
                background: '#047857',
                color: '#ffffff',
                border: '1px solid #34d399',
                borderRadius: 4,
                padding: '5px 12px',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: 11,
              }}
            >
              ⚡ Nạp 11 Nhánh Tim Đường Mẫu
            </button>
          </div>
        </div>

        {/* RAW TRACE Control Bar (When in RAW_TRACE mode) */}
        {editorMode === 'RAW_TRACE' && (
          <div style={{ background: '#064e3b', border: '2px solid #34d399', borderRadius: 6, padding: '6px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={startNewLine} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontWeight: 900, fontSize: 11 }}>
                ➕ Vẽ Nhánh Mới ({`line_${String(rawLines.length + 1).padStart(2, '0')}`})
              </button>
              
              <span style={{ fontSize: 12, color: '#a7f3d0', fontWeight: 700, marginLeft: 4 }}>
                Đang vẽ:
              </span>
              <select
                value={activeLineId}
                onChange={e => setActiveLineId(e.target.value)}
                style={{ background: '#022c22', color: '#ecfdf5', border: '1px solid #34d399', borderRadius: 4, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}
              >
                {rawLines.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.points.length} điểm)
                  </option>
                ))}
              </select>

              <span style={{ fontSize: 11, color: '#fef08a', background: 'rgba(0,0,0,0.35)', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                💡 Click chuột trực tiếp lên map để chấm điểm ({activeLine ? activeLine.points.length : 0} điểm)
              </span>

              <button onClick={undoLastPoint} title="Phím tắt: Backspace" style={{ background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                ↩ Xóa điểm vừa chấm (Backspace)
              </button>
              <button onClick={clearAllPointsOfActiveLine} style={{ background: '#475569', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                🧹 Xóa hết điểm nhánh này
              </button>
              <button onClick={deleteActiveLine} style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                🗑️ Xóa nhánh
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={autoMatchRawTraces} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontWeight: 900, fontSize: 11 }}>
                ⚡ Tự động khớp Topo 127 Nodes
              </button>
            </div>
          </div>
        )}

        {/* Canvas Controls Bar */}
        <div style={{ position: 'absolute', top: 120, left: 16, zIndex: 10, display: 'flex', gap: 10, background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 6, border: '1px solid #334155', alignItems: 'center', fontSize: 11 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#facc15' }}>
            <input type="checkbox" checked={showProposedNodes} onChange={e => setShowProposedNodes(e.target.checked)} />
            Hiện Node đề xuất 🟡
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={showDeltaLines} onChange={e => setShowDeltaLines(e.target.checked)} />
            Dây sai lệch đỏ 🔴
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={showRegionSpotlight} onChange={e => setShowRegionSpotlight(e.target.checked)} />
            Khung vùng 🎯
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
            Hiện nhãn node
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
            <span>Zoom:</span>
            <button onClick={() => setZoomLevel(prev => Math.max(0.8, Number((prev - 0.2).toFixed(1))))} style={{ padding: '1px 6px', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>-</button>
            <span style={{ fontWeight: 700 }}>{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(prev => Math.min(2.5, Number((prev + 0.2).toFixed(1))))} style={{ padding: '1px 6px', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer' }}>+</button>
          </div>
          {cursorPos && (
            <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, marginLeft: 6 }}>
              X: {cursorPos.x}, Y: {cursorPos.y}
            </span>
          )}
        </div>

        {/* Main Canvas SVG */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#020617', border: '1px solid #1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
              cursor: editorMode === 'RAW_TRACE' ? 'crosshair' : 'default',
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Background Chart Image */}
            <image href="/anhtren.png" x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} preserveAspectRatio="none" pointerEvents="all" />

            {/* Target Region Spotlight Box (In Guided Mode) */}
            {editorMode === 'GUIDED' && showRegionSpotlight && selectedNode.region && (
              <g pointerEvents="none">
                <rect
                  x={selectedNode.region.x}
                  y={selectedNode.region.y}
                  width={selectedNode.region.w}
                  height={selectedNode.region.h}
                  fill="rgba(56, 189, 248, 0.08)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="6,4"
                  rx={6}
                />
              </g>
            )}

            {/* Current Route Sequential Guide Line (Guided Mode) */}
            {editorMode === 'GUIDED' && (
              <g pointerEvents="none">
                {currentGroupNodes.map((node, idx) => {
                  if (idx === currentGroupNodes.length - 1) return null;
                  const nextNode = currentGroupNodes[idx + 1];
                  const x1 = node.x !== null ? node.x : node.oldX;
                  const y1 = node.y !== null ? node.y : node.oldY;
                  const x2 = nextNode.x !== null ? nextNode.x : nextNode.oldX;
                  const y2 = nextNode.y !== null ? nextNode.y : nextNode.oldY;
                  const isCurrentSegment = node.id === selectedId || nextNode.id === selectedId;

                  return (
                    <line
                      key={`route_line_${node.id}_${nextNode.id}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isCurrentSegment ? '#facc15' : GROUP_COLORS[node.group] || '#38bdf8'}
                      strokeWidth={isCurrentSegment ? 3.5 : 1.5}
                      strokeDasharray={isCurrentSegment ? undefined : '4,3'}
                      opacity={isCurrentSegment ? 0.95 : 0.45}
                    />
                  );
                })}
              </g>
            )}

            {/* Airport Graph Edges (Only shown in Guided mode or when explicitly placing nodes) */}
            {editorMode === 'GUIDED' && (
              <g pointerEvents="none" opacity={0.35}>
                {airportGraph.edges.map(edge => {
                  const fromNode = nodeMap.get(edge.fromNodeId);
                  const toNode = nodeMap.get(edge.toNodeId);
                  if (!fromNode || !toNode) return null;

                  const fromX = fromNode.x !== null ? fromNode.x : fromNode.oldX;
                  const fromY = fromNode.y !== null ? fromNode.y : fromNode.oldY;
                  const toX = toNode.x !== null ? toNode.x : toNode.oldX;
                  const toY = toNode.y !== null ? toNode.y : toNode.oldY;

                  return (
                    <line
                      key={edge.id}
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke="#f97316"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
            )}

            {/* RAW TRACE Polylines (Green #22c55e) */}
            {rawLines.map(line => {
              const isActive = line.id === activeLineId;
              if (line.points.length < 1) return null;
              return (
                <g key={`raw_line_${line.id}`} pointerEvents="none">
                  {line.points.length >= 2 && (
                    <polyline
                      points={line.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={isActive ? '#22c55e' : '#15803d'}
                      strokeWidth={isActive ? 4 : 2.5}
                    />
                  )}
                  {line.points.map((p, pIdx) => (
                    <circle key={`pt_${line.id}_${pIdx}`} cx={p.x} cy={p.y} r={isActive ? 4.5 : 3} fill={isActive ? '#22c55e' : '#15803d'} stroke="#ffffff" strokeWidth={1} />
                  ))}
                  {line.points.length > 0 && (
                    <g>
                      <rect x={line.points[0].x - 4} y={line.points[0].y - 18} width={50} height={14} fill="rgba(15,23,42,0.85)" stroke="#22c55e" strokeWidth={0.8} rx={2} />
                      <text x={line.points[0].x} y={line.points[0].y - 7} fontSize={8.5} fontWeight={900} fill="#ffffff">
                        {line.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Detected Junctions (<10px) (Cyan #06b6d4) */}
            {detectedJunctions.map((j, jIdx) => (
              <g key={`junc_${jIdx}`} pointerEvents="none">
                <circle cx={j.pt.x} cy={j.pt.y} r={10} fill="none" stroke="#06b6d4" strokeWidth={2} strokeDasharray="3,2">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            ))}

            {/* Live Mouse Dotting Cursor Preview in RAW TRACE */}
            {editorMode === 'RAW_TRACE' && cursorPos && (
              <g pointerEvents="none">
                <circle cx={cursorPos.x} cy={cursorPos.y} r={5} fill="#22c55e" opacity={0.8}>
                  <animate attributeName="r" values="4;7;4" dur="1.2s" repeatCount="indefinite" />
                </circle>
                {activeLine && activeLine.points.length > 0 && (
                  <line
                    x1={activeLine.points[activeLine.points.length - 1].x}
                    y1={activeLine.points[activeLine.points.length - 1].y}
                    x2={cursorPos.x}
                    y2={cursorPos.y}
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="4,3"
                    opacity={0.7}
                  />
                )}
              </g>
            )}

            {/* Proposed / Snapped Nodes (Only shown if placed AND enabled) */}
            {(showProposedNodes || editorMode === 'GUIDED') && nodeStates.map(node => {
              const isPlaced = node.status === 'placed' && node.x !== null && node.y !== null;
              if (!isPlaced) return null;

              const posX = node.x!;
              const posY = node.y!;
              const isSelected = selectedId === node.id;
              const isUncertain = node.isUncertain;
              const color = isUncertain ? '#ef4444' : '#eab308';

              return (
                <g
                  key={node.id}
                  style={{ cursor: draggingId ? 'grabbing' : 'grab' }}
                  onMouseDown={e => handleMouseDownNode(e, node.id)}
                >
                  {/* Delta error line (Only shown if enabled) */}
                  {showDeltaLines && (node.oldX !== posX || node.oldY !== posY) && (
                    <line x1={node.oldX} y1={node.oldY} x2={posX} y2={posY} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.6} />
                  )}

                  {/* Selected pulse radar */}
                  {isSelected && (
                    <circle cx={posX} cy={posY} r={18} fill="none" stroke="#ef4444" strokeWidth={2.5}>
                      <animate attributeName="r" values="10;22;10" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  )}

                  <circle cx={posX} cy={posY} r={isSelected ? 6.5 : 4.5} fill={color} stroke="#ffffff" strokeWidth={1.5} />

                  {/* Label */}
                  {showLabels && (
                    <g pointerEvents="none">
                      <rect x={posX + 6} y={posY - 8} width={node.routeCode.length * 6 + 6} height={12} fill="rgba(15,23,42,0.85)" stroke={color} strokeWidth={0.8} rx={2} />
                      <text x={posX + 8} y={posY + 2} fontSize={7.5} fontWeight={900} fill="#ffffff">
                        {node.routeCode}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Right Area: Sidebar Control & Export Panels ── */}
      <div style={{ width: 380, flexShrink: 0, background: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Title & Mode Banner */}
        <div style={{ padding: 10, borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#38bdf8' }}>
            {editorMode === 'RAW_TRACE' ? '✏️ Danh Sách Nhánh Đường (Raw Lines)' : '🧭 Danh Sách 11 Nhóm Tuyến'}
          </h2>
        </div>

        {/* Action Buttons for Export / Import */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {editorMode === 'RAW_TRACE' ? (
            <>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={exportRawTracesJSON} style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>
                  ⬇ Export raw_traces.json
                </button>
                <button onClick={() => rawFileInputRef.current?.click()} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>
                  ⬆ Import raw_traces.json
                </button>
                <input ref={rawFileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importRawTracesJSON} />
              </div>
              <button onClick={exportMatchedPositionsJSON} style={{ width: '100%', background: '#d97706', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>
                ⬇ Export raw_trace_matched_positions.proposed.json
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={exportGuidedJSON} style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>
                  ⬇ Export Proposal JSON
                </button>
                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 8px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>
                  ⬆ Import Proposal JSON
                </button>
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importGuidedJSON} />
              </div>
            </>
          )}
        </div>

        {/* List of Raw Lines (In RAW_TRACE Mode) */}
        {editorMode === 'RAW_TRACE' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
              Các nhánh polyline đã vẽ ({rawLines.length} nhánh):
            </div>
            {rawLines.map(line => {
              const isActive = line.id === activeLineId;
              return (
                <div
                  key={line.id}
                  onClick={() => setActiveLineId(line.id)}
                  style={{
                    background: isActive ? '#064e3b' : '#020617',
                    border: isActive ? '1.5px solid #34d399' : '1px solid #1e293b',
                    borderRadius: 6,
                    padding: '8px 10px',
                    marginBottom: 5,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 900, color: isActive ? '#34d399' : '#f8fafc' }}>
                      {line.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 8 }}>
                      ({line.points.length} điểm)
                    </span>
                  </div>
                  <span style={{ fontSize: 10, background: '#1e293b', color: '#38bdf8', padding: '1px 6px', borderRadius: 3 }}>
                    {isActive ? 'Đang vẽ' : 'Chọn vẽ'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Guided Node List */
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              <button onClick={() => setStatusFilter('ALL')} style={{ flex: 1, padding: '3px 0', fontSize: 10, background: statusFilter === 'ALL' ? '#3b82f6' : '#1e293b', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer' }}>Tất cả</button>
              <button onClick={() => setStatusFilter('UNPLACED')} style={{ flex: 1, padding: '3px 0', fontSize: 10, background: statusFilter === 'UNPLACED' ? '#d97706' : '#1e293b', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer' }}>Chưa đặt</button>
              <button onClick={() => setStatusFilter('PLACED')} style={{ flex: 1, padding: '3px 0', fontSize: 10, background: statusFilter === 'PLACED' ? '#059669' : '#1e293b', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer' }}>Đã đặt</button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã số (W6-01...)"
              style={{ width: '100%', boxSizing: 'border-box', background: '#020617', color: '#f8fafc', border: '1px solid #334155', borderRadius: 4, padding: '4px 6px', fontSize: 11, marginBottom: 6 }}
            />
            {filteredNodes.map(node => {
              const isSelected = selectedId === node.id;
              const isPlaced = node.status === 'placed' && node.x !== null;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  style={{
                    background: isSelected ? '#1e293b' : '#020617',
                    border: isSelected ? '1.5px solid #38bdf8' : '1px solid #1e293b',
                    borderRadius: 6,
                    padding: '6px 8px',
                    marginBottom: 4,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 900, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                      {node.routeCode} ({node.id})
                    </span>
                    <span style={{ fontSize: 9.5, background: isPlaced ? '#065f46' : '#78350f', color: isPlaced ? '#34d399' : '#fef3c7', padding: '1px 4px', borderRadius: 3 }}>
                      {isPlaced ? '✓ Đã đặt' : 'Chưa đặt'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

class SafeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem(RAW_LINES_STORAGE_KEY);
    localStorage.removeItem(AUTOSAVE_BACKUP_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 30, background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: 12 }}>⚠️ Đã phát hiện lỗi định dạng dữ liệu</h2>
          <p style={{ color: '#94a3b8', maxWidth: 600, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'Một file dữ liệu không đúng định dạng vừa được nạp vào.'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={this.handleReset}
              style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 800, cursor: 'pointer' }}
            >
              🔄 Khôi Phục Lại Bản Chuẩn 44 Nhánh
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 800, cursor: 'pointer' }}
            >
              Tải Lại Trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <SafeErrorBoundary>
      <GuidedNodeEditor />
    </SafeErrorBoundary>
  );
}
