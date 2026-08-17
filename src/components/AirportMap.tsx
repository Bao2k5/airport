// SVG airport map — aeronautical chart style matching TSN reference.
// Completely decoupled renderers:
//   1. Scenario Mode (ScenarioGuidanceRenderer):
//      - Full route is hidden.
//      - Follow-the-Green sliding window (80–120px) ahead of nose only with Neon Green drop-shadow (#00ff66, #39ff88).
//      - Behind the aircraft is completely unlit.
//   2. Manual Mode (ManualRouteRenderer):
//      - Full route from start to destination is rendered clearly in Cyan (#00e5ff, #0284c7).
//      - Independent aircraft movement and markers for all fleet instances.

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { airportGraph, SVG_WIDTH, SVG_HEIGHT } from '../data/airportGraph';
import AirportLighting from './AirportLighting';
import { getAirlineDef } from '../data/airlineTypes';
import { loadImageWithRetry, type AssetLoadState } from '../utils/assetLoader';
import type { AirportGraph, Aircraft, SimulationState } from '../types';

interface Props {
  state: SimulationState;
  graph?: AirportGraph;
  bgImage?: string;
  onNodeClick?: (nodeId: string) => void;
  onSelectAircraft?: (aircraftId: string) => void;
  showPaths?: boolean;
  showGrid?: boolean;
  showGraphV2Overlay?: boolean;
}

const BG_OUTER = '#0c0f12';

function AirportMap({
  state,
  graph = airportGraph,
  bgImage = '/anhtren.png',
  onNodeClick,
  onSelectAircraft,
  showPaths,
  showGrid,
  showGraphV2Overlay,
}: Props) {
  const activeGraph = graph;
  const isScenario = !!state.scenario;

  const isNight = state.config.timeOfDay === 'night';
  const isAfternoon = state.config.timeOfDay === 'afternoon';
  const isFog = state.config.weather === 'fog';
  const isRain = state.config.weather === 'rain';
  const isThunderstorm = state.config.weather === 'thunderstorm';

  // ── Asset Loading & Retry State ──────────────────────────────────────────
  const [bgLoadState, setBgLoadState] = useState<AssetLoadState>({
    status: 'loading',
    retryCount: 0,
    maxRetries: 3,
  });

  const loadBg = useCallback((src: string) => {
    loadImageWithRetry(src, {
      maxRetries: 3,
      initialDelayMs: 500,
      onStatusChange: (s) => setBgLoadState(s),
    }).catch(err => {
      console.warn('[AirportMap] Image load failed:', err);
    });
  }, []);

  useEffect(() => {
    loadBg(bgImage);
  }, [bgImage, loadBg]);

  // ── Continuous animation clock for Follow-the-Green pulsing ──────────────────
  const [animPhase, setAnimPhase] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let lastT = performance.now();
    const frame = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;
      if (state.isRunning && !state.isPaused) {
        setAnimPhase(prev => (prev + dt * 3.5) % (Math.PI * 200));
      }
      animRef.current = requestAnimationFrame(frame);
    };
    animRef.current = requestAnimationFrame(frame);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [state.isRunning, state.isPaused]);

  // ── Pan / zoom (viewBox-based with 1-finger drag & 2-finger pinch zoom) ──
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [dragging, setDragging] = useState(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const pinchRef = useRef<{ initialDist: number; lastDist: number; lastView: { x: number; y: number; w: number; h: number } } | null>(null);

  const ASPECT = SVG_HEIGHT / SVG_WIDTH;
  const MIN_W = SVG_WIDTH * 0.12;
  const MAX_W = SVG_WIDTH;

  const clampView = useCallback((v: { x: number; y: number; w: number; h: number }) => {
    const w = Math.min(MAX_W, Math.max(MIN_W, v.w));
    const h = w * ASPECT;
    const x = Math.min(SVG_WIDTH - w, Math.max(0, v.x));
    const y = Math.min(SVG_HEIGHT - h, Math.max(0, v.y));
    return { x, y, w, h };
  }, [ASPECT, MIN_W, MAX_W]);

  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setView(v => {
      const w = Math.min(MAX_W, Math.max(MIN_W, v.w * factor));
      const h = w * ASPECT;
      const fx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const fy = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const sx = v.x + fx * v.w;
      const sy = v.y + fy * v.h;
      return clampView({ x: sx - fx * w, y: sy - fy * h, w, h });
    });
  }, [clampView, ASPECT, MIN_W, MAX_W]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1 / 1.2 : 1.2);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.target as Element)?.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    if (pointersRef.current.size === 1) {
      dragRef.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
      pinchRef.current = null;
      setDragging(true);
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = {
        initialDist: dist,
        lastDist: dist,
        lastView: { ...view },
      };
      dragRef.current = null;
      setDragging(false);
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    if (pointersRef.current.size === 1 && dragRef.current) {
      const d = dragRef.current;
      const dx = (e.clientX - d.px) / rect.width * view.w;
      const dy = (e.clientY - d.py) / rect.height * view.h;
      setView(v => clampView({
        ...v,
        x: d.vx - dx,
        y: d.vy - dy,
      }));
    } else if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const currDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (currDist > 10 && pinchRef.current.lastDist > 10) {
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const factor = pinchRef.current.lastDist / currDist;
        zoomAt(midX, midY, factor);
        pinchRef.current.lastDist = currDist;
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(e.pointerId);
    try {
      (e.target as Element)?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    if (pointersRef.current.size === 1) {
      const remaining = Array.from(pointersRef.current.values())[0];
      dragRef.current = { px: remaining.x, py: remaining.y, vx: view.x, vy: view.y };
      pinchRef.current = null;
      setDragging(true);
    } else if (pointersRef.current.size === 0) {
      dragRef.current = null;
      pinchRef.current = null;
      setDragging(false);
    }
  };

  const zoomed = view.w < SVG_WIDTH - 0.5;

  const allActiveAircraft: Aircraft[] = isScenario
    ? (state.scenarioAircraft ?? []).filter((ac: any) => {
        if (ac.releaseAtSeconds !== undefined && state.elapsedSeconds < ac.releaseAtSeconds) return false;
        if (ac.status === 'departed' || ac.status === 'arrived') return false;
        return true;
      })
    : (state.manualFleet && state.manualFleet.length
        ? state.manualFleet.filter(ac => ac.status !== 'arrived' && ac.status !== 'departed')
        : (state.aircraft ? [state.aircraft] : []));

  return (
    <div
      data-testid="airport-map-main"
      className="airport-map-container relative w-full h-full rounded-xl overflow-hidden border border-[#223044] touch-none select-none"
      style={{ background: isNight ? '#0a0e18' : isAfternoon ? '#dfc98a' : BG_OUTER }}
    >
      {isAfternoon && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(125deg, rgba(255,145,30,0.17) 0%, rgba(255,190,70,0.09) 50%, rgba(255,110,20,0.14) 100%)',
          }}
        />
      )}
      {isFog && (
        <>
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(220,220,225,0) 35%, rgba(210,212,218,0.4) 100%)',
            }}
          />
          <div className="absolute inset-0 fog-drift pointer-events-none z-10" />
        </>
      )}
      {(isRain || isThunderstorm) && (
        <div
          className={`absolute inset-0 pointer-events-none z-10 ${
            isThunderstorm ? 'rain-fall rain-heavy' : 'rain-fall'
          }`}
        />
      )}
      {isThunderstorm && (
        <>
          <div className="absolute inset-0 bg-slate-800/20 pointer-events-none z-10" />
          <div className="absolute inset-0 storm-flash pointer-events-none z-10 bg-slate-200" />
        </>
      )}

      {/* ── Asset Retry & Error Overlays ── */}
      {bgLoadState.status === 'retrying' && (
        <div className="absolute top-3 left-3 z-30 bg-amber-950/90 border border-amber-600/80 text-amber-200 text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{bgLoadState.errorMessage || `Đang thử tải lại ảnh nền... (Lần ${bgLoadState.retryCount}/${bgLoadState.maxRetries})`}</span>
        </div>
      )}

      {bgLoadState.status === 'error' && (
        <div className="absolute top-3 left-3 z-30 bg-red-950/95 border border-red-600 text-red-100 text-xs p-2.5 rounded-xl shadow-2xl flex items-center gap-2 max-w-sm">
          <span>⚠️</span>
          <span className="flex-1 font-semibold">{bgLoadState.errorMessage || 'Không thể tải ảnh nền bản đồ.'}</span>
          <button
            onClick={() => loadBg(bgImage)}
            className="px-2.5 py-1 bg-red-800 hover:bg-red-700 active:bg-red-900 text-white font-bold rounded-lg transition min-h-[36px] flex items-center gap-1 cursor-pointer"
          >
            ↺ Thử lại
          </button>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          cursor: dragging ? 'grabbing' : zoomed ? 'grab' : 'default',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <filter id="glow-aircraft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="neon-lead-green">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#39ff88" stopOpacity="1" />
            <stop offset="65%" stopColor="#00ff66" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#00cc44" stopOpacity="0" />
          </radialGradient>
        </defs>

        <style>{`
          @keyframes storm-flash {
            0%, 92%, 100% { opacity: 0; }
            94%           { opacity: 0.35; }
            96%           { opacity: 0.05; }
            98%           { opacity: 0.30; }
          }
          .storm-flash { animation: storm-flash 6s ease-out infinite; }
          .rain-fall {
            background-image: repeating-linear-gradient(105deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 8px, rgba(190,205,225,0.28) 9px, rgba(190,205,225,0.28) 10px);
            background-size: 100px 100px;
            animation: rain-fall 0.55s linear infinite;
          }
          .fog-drift {
            background-image: radial-gradient(ellipse 50% 60% at 20% 40%, rgba(225,227,232,0.30), rgba(225,227,232,0) 70%),
                              radial-gradient(ellipse 60% 50% at 80% 60%, rgba(225,227,232,0.25), rgba(225,227,232,0) 70%);
            background-size: 200% 200%;
            animation: fog-drift 22s ease-in-out infinite alternate;
          }
          @keyframes fog-drift {
            0%   { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}</style>

        {/* ── Layer 1: Clean background map ── */}
        <image href={bgImage} x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} preserveAspectRatio="none" />

        {/* Đêm: phủ navy tối lên map */}
        {isNight && (
          <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#0a0e18" fillOpacity={0.92} />
        )}

        {/* Night lighting — render động theo activeGraph */}
        {isNight && <AirportLighting graph={activeGraph} />}

        {/* ── Layer 2: Optional Graph Overlay (When toggled ON) ── */}
        {(showGraphV2Overlay || showPaths) && (
          <g opacity={0.85}>
            {activeGraph.edges.map(edge => {
              const f = activeGraph.nodes.find(n => n.id === edge.fromNodeId);
              const t = activeGraph.nodes.find(n => n.id === edge.toNodeId);
              if (!f || !t) return null;
              const isBlocked = state.blockedEdgeIds.has(edge.id);
              return (
                <g key={`v2-edge-${edge.id}`}>
                  <line
                    x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                    stroke={isBlocked ? '#ef4444' : '#00e5ff'}
                    strokeWidth={isBlocked ? 3.5 : 1.8}
                    strokeDasharray={isBlocked ? '6,4' : undefined}
                    opacity={isBlocked ? 0.95 : 0.6}
                  />
                  {showPaths && (
                    <text
                      x={(f.x + t.x) / 2} y={(f.y + t.y) / 2 - 1}
                      textAnchor="middle" fontSize={3.8} fontWeight={700}
                      fill="#ffffff" stroke="#0f172a" strokeWidth={0.4} paintOrder="stroke"
                    >
                      {edge.id}
                    </text>
                  )}
                </g>
              );
            })}
            {activeGraph.nodes.map(n => {
              const isStart = state.config.startNodeId === n.id;
              const isDest = state.config.destinationNodeId === n.id;
              const isRwy = n.type === 'runway_entry' || n.type === 'runway_exit';
              const isHp = n.type === 'holding_point';
              const fill = isStart ? '#22c55e' : (isDest ? '#ef4444' : (isRwy ? '#f97316' : (isHp ? '#eab308' : '#38bdf8')));
              return (
                <g
                  key={`v2-node-${n.id}`}
                  onClick={() => onNodeClick?.(n.id)}
                  style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                >
                  <circle cx={n.x} cy={n.y} r={isStart || isDest ? 4.5 : 2.5} fill={fill} stroke="#ffffff" strokeWidth={0.8} />
                  {(isStart || isDest || showPaths) && (
                    <text
                      x={n.x} y={n.y - 4}
                      textAnchor="middle" fontSize={4.5} fontWeight={800}
                      fill="#ffffff" stroke="#000000" strokeWidth={0.6} paintOrder="stroke"
                    >
                      {n.label || n.id}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ── Layer 3: Unified Follow-the-Green Guidance Layer (Scenario & Manual) ── */}
        <g className="follow-the-green-layer">
          {allActiveAircraft.map(ac => (
            <FollowTheGreenRenderer
              key={`ftg-guidance-${ac.id}`}
              aircraft={ac}
              graph={activeGraph}
              animPhase={animPhase}
              isScenario={isScenario}
              isSelected={ac.id === (state.selectedAircraftId || state.aircraft?.id)}
            />
          ))}
        </g>

        {/* ── Layer 4.5: Stand Labels (Stand 1, Stand 2, Stand 3, Stand 4, Stand 5, Stand 7) ── */}
        {!isScenario && (
          <g className="stand-labels-layer">
            {[
              { nodeId: 'P1', label: 'Stand 1', offsetY: 15 },
              { nodeId: 'P2', label: 'Stand 2', offsetY: -16 },
              { nodeId: 'P3', label: 'Stand 3', offsetY: 15 },
              { nodeId: 'P4', label: 'Stand 4', offsetY: 15 },
              { nodeId: 'P5', label: 'Stand 5', offsetY: -16 },
              { nodeId: 'T49', label: 'Stand 7', offsetY: 15 },
            ].map(s => {
              const node = activeGraph.nodes.find(n => n.id === s.nodeId);
              if (!node) return null;
              return (
                <g key={`stand-lbl-${s.nodeId}`}>
                  <rect
                    x={node.x - 14}
                    y={node.y + s.offsetY}
                    width={28}
                    height={8}
                    rx={2}
                    fill="#0f172a"
                    fillOpacity={0.9}
                    stroke="#38bdf8"
                    strokeWidth={0.6}
                  />
                  <text
                    x={node.x}
                    y={node.y + s.offsetY + 6}
                    textAnchor="middle"
                    fontSize={5.2}
                    fontWeight={800}
                    fill="#38bdf8"
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ── Layer 5: Holding Bars & Closed Edge Markers ── */}
        {allActiveAircraft.map(ac => {
          if (ac.status !== 'holding' && ac.holdReason !== 'stop-bar') return null;
          const fromNode = activeGraph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex]);
          const toNode = activeGraph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex + 1]);
          if (!fromNode || !toNode) return null;
          return <StopBar key={`hold-bar-${ac.id}`} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} progress={ac.progressOnEdge} />;
        })}

        {Array.from(state.blockedEdgeIds).map(edgeId => {
          const edge = activeGraph.edges.find(e => e.id === edgeId);
          if (!edge) return null;
          const fromNode = activeGraph.nodes.find(n => n.id === edge.fromNodeId);
          const toNode = activeGraph.nodes.find(n => n.id === edge.toNodeId);
          if (!fromNode || !toNode) return null;
          return <ClosedMarker key={`closed-${edge.id}`} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} />;
        })}

        {/* ── Layer 6: Coordinate Grid (Debug) ── */}
        {showGrid && <CoordinateGrid />}

        {/* ── Layer 7: Render All Active Aircraft with Custom Liveries ── */}
        {allActiveAircraft.map(ac => {
          const pos = getPositionForAircraft(ac, activeGraph);
          if (!pos) return null;
          const isSelected = ac.id === (state.selectedAircraftId || state.aircraft?.id);
          const aDef = getAirlineDef(ac.airlineCode || ac.callsign);
          const labelColor = isSelected ? '#38bdf8' : (aDef.accentColor || '#fbbf24');
          const isFacingSouth = pos.heading > 135 && pos.heading < 225;
          const callsignY = isFacingSouth ? pos.y + 19 : pos.y - 17;

          return (
            <g
              key={`aircraft-${ac.id}`}
              onClick={() => onSelectAircraft?.(ac.id)}
              style={{ cursor: 'pointer' }}
            >
              <AircraftIcon
                x={pos.x}
                y={pos.y}
                heading={pos.heading}
                callsign={ac.callsign}
                airlineCode={ac.airlineCode}
                aircraftAsset={ac.aircraftAsset}
                scale={1}
                isEmergency={ac.role === 'emergency' || ac.scenarioLabel === 'KHẨN NGUY'}
                isDeviated={ac.deviated}
                isRadioFailure={ac.radioFailure}
                isSelected={isSelected && !isScenario}
              />
              <text
                x={pos.x} y={callsignY}
                textAnchor="middle" fontSize={6.8} fontWeight={800}
                fill={labelColor}
                stroke="#000000" strokeWidth={0.8} paintOrder="stroke"
              >
                {ac.callsign} {ac.scenarioLabel ? `(${ac.scenarioLabel})` : ''}
              </text>

              {/* Dấu X đỏ phát sáng ngăn máy bay khi holding / stop-bar */}
              {ac.status === 'holding' && (
                <g transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Position X marker in front of aircraft along its heading */}
                  <g transform={`rotate(${pos.heading}) translate(0, -22)`}>
                    {/* Glowing Red X Barrier */}
                    <g className="animate-pulse">
                      {/* Glow backdrop circle */}
                      <circle cx={0} cy={0} r={11} fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth={1.2} strokeDasharray="3,2" />
                      {/* Outer red glow */}
                      <line x1={-7} y1={-7} x2={7} y2={7} stroke="#ff0000" strokeWidth={3.5} strokeLinecap="round" />
                      <line x1={-7} y1={7} x2={7} y2={-7} stroke="#ff0000" strokeWidth={3.5} strokeLinecap="round" />
                      {/* Bright white core */}
                      <line x1={-7} y1={-7} x2={7} y2={7} stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" />
                      <line x1={-7} y1={7} x2={7} y2={-7} stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" />
                    </g>
                    {/* Stop Bar Badge Text */}
                    <g transform={`rotate(${-pos.heading}) translate(0, 16)`}>
                      <rect x={-42} y={-7} width={84} height={13} rx={3} fill="#180404" stroke="#ef4444" strokeWidth={0.9} />
                      <text x={0} y={2.5} textAnchor="middle" fontSize={5.5} fontWeight={900} fill="#fca5a5">
                        {ac.callsign === 'TG302' ? 'STOP BAR — NHƯỜNG VN301' : 'STOP BAR — DỪNG LẠI'}
                      </text>
                    </g>
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Zoom controls (Touch-friendly min 44x44px) ───────────────── */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 select-none">
        <button
          onClick={() => {
            const r = svgRef.current!.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.4);
          }}
          className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-gray-900/90 hover:bg-gray-700 active:bg-blue-600 text-white text-xl font-bold leading-none border border-gray-600 shadow-xl backdrop-blur flex items-center justify-center transition cursor-pointer"
          title="Phóng to"
          aria-label="Phóng to"
        >+</button>
        <button
          onClick={() => {
            const r = svgRef.current!.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.4);
          }}
          className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-gray-900/90 hover:bg-gray-700 active:bg-blue-600 text-white text-xl font-bold leading-none border border-gray-600 shadow-xl backdrop-blur flex items-center justify-center transition cursor-pointer"
          title="Thu nhỏ"
          aria-label="Thu nhỏ"
        >−</button>
        {zoomed && (
          <button
            onClick={() => setView({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT })}
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-gray-900/90 hover:bg-gray-700 active:bg-blue-600 text-white text-sm font-bold leading-none border border-gray-600 shadow-xl backdrop-blur flex items-center justify-center transition cursor-pointer"
            title="Xem toàn bộ"
            aria-label="Xem toàn bộ"
          >⤢</button>
        )}
      </div>
    </div>
  );
}

// ── SEGMENTED FOLLOW-THE-GREEN GUIDANCE RENDERER (Strict Segmented Active Edge) ─────────────
interface GuidanceDot {
  x: number;
  y: number;
  isPreview?: boolean;
}

function computeSegmentedGuidanceDots(
  aircraft: Aircraft,
  graph: AirportGraph,
): { activeDots: GuidanceDot[]; previewDots: GuidanceDot[] } | null {
  if (!aircraft.assignedRoute || aircraft.assignedRoute.length < 2) return null;
  if (aircraft.routeEdgeIndex >= aircraft.assignedRoute.length - 1) return null;

  const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex]);
  const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex + 1]);
  if (!fromNode || !toNode) return null;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const edgePixelLen = Math.hypot(dx, dy) || 1;
  const dotCount = Math.max(1, Math.round(edgePixelLen / 16));

  const activeDots: GuidanceDot[] = [];
  const prog = Math.max(0, Math.min(1, aircraft.progressOnEdge));

  // 1. Current Active Edge: ONLY dots in front of aircraft nose (r >= prog)
  for (let i = 1; i < dotCount; i++) {
    const r = i / dotCount;
    if (r >= prog) {
      activeDots.push({
        x: fromNode.x + dx * r,
        y: fromNode.y + dy * r,
        isPreview: false,
      });
    }
  }

  // 2. Next Edge Preview: Only if progressOnEdge >= 0.75, illuminate first 2-3 dots as preview
  const previewDots: GuidanceDot[] = [];
  if (prog >= 0.75 && aircraft.routeEdgeIndex + 1 < aircraft.assignedRoute.length - 1) {
    const nextToNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex + 2]);
    if (nextToNode) {
      const ndx = nextToNode.x - toNode.x;
      const ndy = nextToNode.y - toNode.y;
      const nextEdgePixelLen = Math.hypot(ndx, ndy) || 1;
      const nextDotCount = Math.max(1, Math.round(nextEdgePixelLen / 16));
      const maxPreviewCount = Math.min(3, Math.max(1, Math.ceil(nextDotCount * 0.25)));

      for (let i = 1; i <= maxPreviewCount; i++) {
        const r = i / nextDotCount;
        previewDots.push({
          x: toNode.x + ndx * r,
          y: toNode.y + ndy * r,
          isPreview: true,
        });
      }
    }
  }

  // Farther edges are strictly OFF (omitted)
  return { activeDots, previewDots };
}

function FollowTheGreenRenderer({
  aircraft,
  graph,
  animPhase: _animPhase,
  isScenario = false,
  isSelected = false,
}: {
  aircraft: Aircraft;
  graph: AirportGraph;
  animPhase?: number;
  isScenario?: boolean;
  isSelected?: boolean;
}) {
  // STRICT RULE: Do not show guidance when aircraft is parked, arrived, departed, or before starting in manual mode
  if (aircraft.status === 'parked' || aircraft.status === 'arrived' || aircraft.status === 'departed') {
    return null;
  }
  if (!isScenario && !aircraft.routeVisible && aircraft.status !== 'taxiing' && aircraft.status !== 'holding') {
    return null;
  }

  const guidance = computeSegmentedGuidanceDots(aircraft, graph);
  if (!guidance || (guidance.activeDots.length === 0 && guidance.previewDots.length === 0)) return null;

  return (
    <g
      className={`ftg-guidance-group-${aircraft.id}`}
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 6px #22c55e) drop-shadow(0 0 14px #16a34a)'
          : 'drop-shadow(0 0 4px #22c55e) drop-shadow(0 0 8px #16a34a)',
      }}
    >
      {/* 1. Active Edge Guidance Dots (In front of aircraft nose) */}
      {guidance.activeDots.map((dot, idx) => (
        <g key={`ftg-act-${aircraft.id}-${idx}`} className="guidance-dot">
          {/* Outer radial halo circle */}
          <circle cx={dot.x} cy={dot.y} r={6.5} fill="url(#neon-lead-green)" />
          {/* Main green body */}
          <circle cx={dot.x} cy={dot.y} r={3.0} fill="#22c55e" />
          {/* Bright core center */}
          <circle cx={dot.x} cy={dot.y} r={1.3} fill="#f0fff6" />
        </g>
      ))}

      {/* 2. Next Edge Preview Dots (When progressOnEdge >= 0.75, first 2-3 dots) */}
      {guidance.previewDots.map((dot, idx) => (
        <g key={`ftg-prev-${aircraft.id}-${idx}`} opacity={0.65} className="guidance-dot-preview">
          <circle cx={dot.x} cy={dot.y} r={5.5} fill="url(#neon-lead-green)" />
          <circle cx={dot.x} cy={dot.y} r={2.5} fill="#22c55e" />
          <circle cx={dot.x} cy={dot.y} r={1.1} fill="#f0fff6" />
        </g>
      ))}
    </g>
  );
}

function StopBar({ x1, y1, x2, y2, progress = 0.5 }: { x1: number; y1: number; x2: number; y2: number; progress?: number }) {
  const t = Math.max(0.05, Math.min(0.95, (Number.isFinite(progress) ? progress : 0.5) + 0.04));
  const mx = x1 + (x2 - x1) * t;
  const my = y1 + (y2 - y1) * t;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = (-dy / len) * 14, py = (dx / len) * 14;
  return (
    <g className="stop-bar-active-group">
      {/* 1. Broad pulsating outer glow */}
      <line
        x1={mx - px}
        y1={my - py}
        x2={mx + px}
        y2={my + py}
        stroke="#ef4444"
        strokeWidth={9}
        strokeLinecap="round"
        opacity={0.45}
        filter="url(#glow-aircraft)"
      />
      {/* 2. Main bright Stop Bar line */}
      <line
        x1={mx - px}
        y1={my - py}
        x2={mx + px}
        y2={my + py}
        stroke="#dc2626"
        strokeWidth={5.5}
        strokeLinecap="round"
      />
      {/* 3. High-contrast core line */}
      <line
        x1={mx - px * 0.85}
        y1={my - py * 0.85}
        x2={mx + px * 0.85}
        y2={my + py * 0.85}
        stroke="#fee2e2"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* 4. Three discrete red flashing stop-bar lights */}
      <circle cx={mx - px * 0.75} cy={my - py * 0.75} r={3.2} fill="#ef4444" stroke="#ffffff" strokeWidth={0.8} />
      <circle cx={mx} cy={my} r={3.6} fill="#ef4444" stroke="#ffffff" strokeWidth={0.8} />
      <circle cx={mx + px * 0.75} cy={my + py * 0.75} r={3.2} fill="#ef4444" stroke="#ffffff" strokeWidth={0.8} />

      {/* 5. Clear prominent badge: STOP BAR */}
      <g transform={`translate(${mx}, ${my - 12})`}>
        <rect
          x={-24}
          y={-5}
          width={48}
          height={10}
          rx={3}
          fill="#b91c1c"
          stroke="#fee2e2"
          strokeWidth={1}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
        />
        <text
          x={0}
          y={2.2}
          textAnchor="middle"
          fontSize={5.8}
          fontWeight={900}
          fill="#ffffff"
          letterSpacing={0.5}
          fontFamily="monospace"
        >
          STOP BAR
        </text>
      </g>
    </g>
  );
}

function ClosedMarker({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = (-dy / len) * 10, py = (dx / len) * 10;
  return (
    <g opacity={0.9}>
      <line x1={mx - px - (dx / len) * 8} y1={my - py - (dy / len) * 8} x2={mx + px + (dx / len) * 8} y2={my + py + (dy / len) * 8} stroke="#ff8c00" strokeWidth={3} />
      <line x1={mx + px - (dx / len) * 8} y1={my - py - (dy / len) * 8} x2={mx - px + (dx / len) * 8} y2={my + py - (dy / len) * 8} stroke="#ff8c00" strokeWidth={3} />
    </g>
  );
}

// ── Realistic Transparent Aircraft Sprite ──────────────────────────────────────
function AircraftIcon({
  x,
  y,
  heading,
  scale = 1,
  callsign = '',
  airlineCode,
  aircraftAsset,
  isEmergency = false,
  isDeviated = false,
  isRadioFailure = false,
  isSelected = false,
}: {
  x: number;
  y: number;
  heading: number;
  scale?: number;
  callsign?: string;
  airlineCode?: string;
  aircraftAsset?: string;
  isEmergency?: boolean;
  isDeviated?: boolean;
  isRadioFailure?: boolean;
  isSelected?: boolean;
}) {
  const aDef = getAirlineDef(airlineCode || callsign);
  const assetSrc = aircraftAsset || aDef.asset;

  // The user raw asset is cropped with its nose aligned at 67.1 deg.
  const rotationDeg = heading - 67.1;
  const size = 36 * scale;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Invisible broad touch hit area for easy tapping on mobile */}
      <circle cx={0} cy={0} r={34 * scale} fill="transparent" pointerEvents="all" />

      {isSelected && (
        <g>
          {/* Distinct high-contrast glowing halo for selected aircraft */}
          <circle cx={0} cy={0} r={30 * scale} fill="rgba(56, 189, 248, 0.28)" stroke="#38bdf8" strokeWidth={2.8} strokeDasharray="6,4" opacity={0.95} />
          <circle cx={0} cy={0} r={38 * scale} fill="none" stroke="#00e5ff" strokeWidth={1.8} opacity={0.8} />
          <circle cx={0} cy={0} r={22 * scale} fill="rgba(0, 229, 255, 0.15)" stroke="#67e8f9" strokeWidth={1.2} />
        </g>
      )}
      {isEmergency && (
        <circle cx={0} cy={0} r={28 * scale} fill="none" stroke="#ef4444" strokeWidth={2.5} opacity={0.85} className="animate-ping" />
      )}
      {isDeviated && (
        <circle cx={0} cy={0} r={28 * scale} fill="none" stroke="#f97316" strokeWidth={2.5} opacity={0.85} className="animate-ping" />
      )}
      {isRadioFailure && (
        <circle cx={0} cy={0} r={28 * scale} fill="none" stroke="#c084fc" strokeWidth={2.5} opacity={0.85} className="animate-ping" />
      )}
      <g transform={`rotate(${rotationDeg})`} filter="url(#glow-aircraft)">
        <image
          href={assetSrc}
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </g>
  );
}

// ── Coordinate Grid (Debug tool) ───────────────────────────────────────────────
function CoordinateGrid() {
  const lines = [];
  for (let x = 0; x <= SVG_WIDTH; x += 50) {
    const bold = x % 100 === 0;
    lines.push(<line key={`gx${x}`} x1={x} y1={0} x2={x} y2={SVG_HEIGHT} stroke={bold ? '#dc2626' : '#f8a8a8'} strokeWidth={bold ? 0.5 : 0.25} opacity={0.55} />);
  }
  for (let y = 0; y <= SVG_HEIGHT; y += 50) {
    const bold = y % 100 === 0;
    lines.push(<line key={`gy${y}`} x1={0} y1={y} x2={SVG_WIDTH} y2={y} stroke={bold ? '#dc2626' : '#f8a8a8'} strokeWidth={bold ? 0.5 : 0.25} opacity={0.55} />);
  }
  const labels = [];
  for (let x = 0; x <= SVG_WIDTH; x += 100) {
    for (let y = 100; y <= SVG_HEIGHT; y += 100) {
      labels.push(
        <text key={`gl${x}-${y}`} x={x + 1} y={y - 1} fontSize={5} fontWeight={800} fill="#b91c1c" opacity={0.9}>{x},{y}</text>,
      );
    }
  }
  return <g>{lines}{labels}</g>;
}

const STAND_PARKING_HEADINGS: Record<string, number> = {
  P1: 0,    // Stand 1: quay thẳng lên (North 0°)
  P2: 180,  // Stand 2: quay thẳng xuống (South 180°), quay đầu vào Stand 1
  P3: 0,    // Stand 3: quay thẳng lên (North 0°)
  P4: 0,    // Stand 4: quay thẳng lên (North 0°)
  P5: 180,  // Stand 5: quay thẳng xuống (South 180°), quay đầu vào Stand 4
  T49: 270, // Stand 7: quay sang trái về hướng đường lăn (West 270°)
};

// ── Interpolate aircraft position along its route ──────────────────────────────
function getPositionForAircraft(aircraft: Aircraft | null, graph: AirportGraph = airportGraph) {
  if (!aircraft) return null;

  const isMoving = (aircraft.status === 'taxiing' || aircraft.status === 'holding') &&
    (aircraft.routeEdgeIndex > 0 || aircraft.progressOnEdge > 0.001);

  if (isMoving && aircraft.assignedRoute && aircraft.assignedRoute.length >= 2 && aircraft.routeEdgeIndex < aircraft.assignedRoute.length - 1) {
    const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex]);
    const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex + 1]);
    if (fromNode && toNode) {
      const t = aircraft.progressOnEdge;
      const x = fromNode.x + (toNode.x - fromNode.x) * t;
      const y = fromNode.y + (toNode.y - fromNode.y) * t;

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const heading = (Math.atan2(dx, -dy) * 180) / Math.PI;

      return { x, y, heading };
    }
  }

  // Fallback to currentNodeId (e.g. idle/waiting at stand)
  const node = graph.nodes.find(n => n.id === aircraft.currentNodeId);
  if (node) {
    const defaultHeading = STAND_PARKING_HEADINGS[node.id] ?? 67.1;
    return { x: node.x, y: node.y, heading: defaultHeading };
  }

  return null;
}

export default memo(AirportMap);
