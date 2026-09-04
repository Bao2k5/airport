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
import { airportGraphV3, SVG_WIDTH, SVG_HEIGHT } from '../data/airportGraph.v3';
import AirportLighting from './AirportLighting';
import { getAirlineDef } from '../data/airlineTypes';
import { loadImageWithRetry, type AssetLoadState } from '../utils/assetLoader';
import type { AirportGraph, AirportNode, Aircraft, SimulationState } from '../types';
import { Radio } from 'lucide-react';

interface Props {
  state: SimulationState;
  graph?: AirportGraph;
  bgImage?: string;
  /** traditional = no route preview / no Follow-the-Green visual guidance */
  renderMode?: 'normal' | 'traditional' | 'ftg';
  aircraftScale?: number;
  onSelectAircraft?: (aircraftId: string) => void;
  showGraphV3Overlay?: boolean;
  showGrid?: boolean;
  showPaths?: boolean;
  inspectingPathAircraftId?: string | null;
}

const BG_OUTER = '#0c0f12';

function AirportMap({
  state,
  graph = airportGraphV3,
  bgImage = '/anhchinh.png?v=3',
  renderMode = 'normal',
  aircraftScale,
  onSelectAircraft,
  showGraphV3Overlay = false,
  showGrid = false,
  showPaths = false,
  inspectingPathAircraftId = null,
}: Props) {
  const activeGraph = graph;
  const isScenario = !!state.scenario || Boolean(state.scenarioAircraft && state.scenarioAircraft.length > 0);

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
      setAnimPhase(prev => (prev + dt * 3.5) % (Math.PI * 200));
      animRef.current = requestAnimationFrame(frame);
    };
    animRef.current = requestAnimationFrame(frame);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Pan / zoom (viewBox-based with 1-finger drag & 2-finger pinch zoom) ──
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [dragging, setDragging] = useState(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const pinchRef = useRef<{ initialDist: number; lastDist: number; lastView: { x: number; y: number; w: number; h: number } } | null>(null);
  const departedAnimMap = useRef<Map<string, { startTime: number; startX: number; startY: number; heading: number }>>(new Map());

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

  // Reset departed animation cache when scenario or simulation resets/restarts
  useEffect(() => {
    if (state.elapsedSeconds === 0 || !state.isRunning) {
      departedAnimMap.current.clear();
    }
  }, [state.elapsedSeconds, state.isRunning, state.scenario?.id]);

  const zoomed = view.w < SVG_WIDTH - 0.5;
  const nowMs = performance.now();
  const allActiveAircraft: Aircraft[] = isScenario
    ? (state.scenarioAircraft ?? []).filter((ac: any) => {
        if (ac.hidden) return false;
        
        // Tàu đến và xe cứu hỏa giữ nguyên hiện trường
        const isInboundOrFixed = ac.callsign === 'BAV315' || ac.callsign === 'RESCUE01' || ac.callsign === 'HVN123' || ac.callsign === 'HVN301' || ac.callsign === 'INB01' || ac.callsign === 'HVN401';
        if (isInboundOrFixed) {
          departedAnimMap.current.delete(ac.id);
          return true;
        }

        // Tàu rẽ sai ở màn truyền thống thì dừng lại không cất cánh
        if (ac.callsign === 'HVN216' && renderMode === 'traditional') {
          departedAnimMap.current.delete(ac.id);
          return true;
        }

        const targetNode = ac.assignedRoute?.[ac.assignedRoute.length - 1] || ac.targetNodeId;
        const isAtRouteEnd = (ac.routeEdgeIndex ?? 0) >= (ac.assignedRoute?.length ?? 1) - 1;
        
        const isDeparting07R = targetNode === 'v3_line_16_p00' && (ac.status === 'departed' || (isAtRouteEnd && ac.currentNodeId === 'v3_line_16_p00'));
        const isDeparting25L = targetNode === 'v3_line_17_p16' && (ac.status === 'departed' || (isAtRouteEnd && ac.currentNodeId === 'v3_line_17_p16'));
        const isTakeoffTarget = isDeparting07R || isDeparting25L || (ac.status === 'departed' && ac.role === 'departing');

        if (isTakeoffTarget) {
          if (!departedAnimMap.current.has(ac.id)) {
            let startX = 1136, startY = 176, heading = 247.5;
            if (isDeparting07R || targetNode === 'v3_line_16_p00') {
              startX = 67; startY = 704; heading = 67.5;
            }
            departedAnimMap.current.set(ac.id, { startTime: performance.now(), startX, startY, heading });
          }
          const anim = departedAnimMap.current.get(ac.id)!;
          const elapsed = (nowMs - anim.startTime) / 1000;
          if (elapsed >= 1.3) {
            return false; // Hết 1.3 giây chạy đà và cất cánh nhanh thì biến mất hoàn toàn
          }
          return true; // Trong 1.3 giây này vẽ hiệu ứng chạy đà cất cánh nhanh
        } else {
          // Xóa khỏi danh sách departed nếu máy bay đang chạy chuyến mới / chạy lại / quay đầu
          departedAnimMap.current.delete(ac.id);
        }

        if (ac.status === 'departed') return false;
        return true;
      })
    : (state.manualFleet && state.manualFleet.length
        ? state.manualFleet.filter(ac => {
            if (ac.status === 'departed') return false;
            departedAnimMap.current.delete(ac.id);
            return true;
          })
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

      {/* ── Real-time ICAO ATC Clearance HUD ── */}
      {(() => {
        const events = state.scenario?.events || [];
        const latestClearance = events
          .filter((e: any) => typeof e?.message === 'string' && e.message.includes('ATC CLEARANCE'))
          .slice(-1)[0];
        const elapsed = state.scenario?.elapsedSeconds || 0;
        const isRecentClearance = latestClearance && (elapsed - latestClearance.atSeconds) < 5.0 && (elapsed - latestClearance.atSeconds) >= 0;

        if (!isRecentClearance) return null;
        return (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#0E1523]/95 border border-[#38BDF8] text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fadeIn pointer-events-none max-w-xl">
            <span className="text-lg animate-pulse">🎙️</span>
            <div>
              <div className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider">
                HUẤN LỆNH KSVKL (ATC CLEARANCE):
              </div>
              <div className="font-mono font-bold text-xs sm:text-sm text-white">
                {latestClearance.message.replace(/📻\s*\[ATC CLEARANCE\]\s*/i, '')}
              </div>
            </div>
          </div>
        );
      })()}

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

          <filter id="neon-cyan-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="cyanBlur" />
            <feMerge>
              <feMergeNode in="cyanBlur" />
              <feMergeNode in="cyanBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="neon-lead-green">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#39ff88" stopOpacity="1" />
            <stop offset="65%" stopColor="#00ff66" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#00cc44" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="neon-lead-red">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#ff6b6b" stopOpacity="1" />
            <stop offset="65%" stopColor="#ef4444" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
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

        {/* Night lighting — render động theo activeGraph khi ở chế độ ban đêm */}
        {isNight && <AirportLighting graph={activeGraph} />}

        {/* ── Phát sáng các chấm đèn tròn màu đỏ đúng tim 2 đường băng từ Bản đồ V3 trong Kịch bản 2 Khẩn nguy ── */}
        {isScenario && (state.scenario?.id === 'emergency_priority_engine_fire' || allActiveAircraft.some(a => a.role === 'emergency' || a.callsign === 'BAV315')) && (
          <V3RunwayCenterlineEmergencyLights />
        )}

        {/* ── Layer 2.75: Graph V3 Overlay (Reference & Comparison Only - Only khi người dùng bật) ── */}
        {showGraphV3Overlay && <GraphV3OverlayRenderer />}

        {/* ── Layer 2.8: Route Preview Blue Layer (Full Trip Planned Route - Manual & Scenario) ── */}
        {renderMode !== 'traditional' && (
          <RoutePreviewBlueRenderer
            aircraftList={isScenario ? (state.scenarioAircraft ?? []) : (state.manualFleet ?? (state.aircraft ? [state.aircraft] : []))}
            selectedAircraftId={state.selectedAircraftId || state.aircraft?.id}
            isScenario={isScenario}
            graph={activeGraph}
            elapsedSeconds={state.elapsedSeconds}
          />
        )}

        {/* ── Layer 2.9: Path Debug Overlay (When Paths toggle is ON or Inspecting Path modal is active) ── */}
        {renderMode !== 'traditional' && (showPaths || inspectingPathAircraftId) && (
          <PathDebugOverlayRenderer
            aircraft={
              isScenario
                ? (state.scenarioAircraft?.find(a => a.id === state.selectedAircraftId) || state.scenarioAircraft?.[0] || null)
                : (state.manualFleet?.find(a => a.id === (inspectingPathAircraftId || state.selectedAircraftId || 'VN001')) || state.aircraft || null)
            }
            graph={activeGraph}
          />
        )}

        {/* ── Layer 3: Unified Follow-the-Green Guidance Layer (Scenario & Manual) ── */}
        {renderMode !== 'traditional' && (
          <g className="follow-the-green-layer">
            {allActiveAircraft.map(ac => (
              <FollowTheGreenRenderer
                key={`ftg-guidance-${ac.id}`}
                aircraft={ac}
                graph={activeGraph}
                animPhase={animPhase}
                isScenario={isScenario}
                isSelected={ac.id === (state.selectedAircraftId || state.aircraft?.id)}
                blockedEdgeIds={state.blockedEdgeIds}
              />
            ))}
          </g>
        )}

        {/* ── Layer 5: Holding Bars & Closed Edge Markers (Chỉ render cho màn truyền thống) ── */}
        {renderMode === 'traditional' && allActiveAircraft.map(ac => {
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
          let pos = getPositionForAircraft(ac, activeGraph);
          if (!pos) return null;

          let renderOpacity = 1.0;
          let liftScaleFactor = 1.0;
          let isTakingOff = false;

          if (isScenario && departedAnimMap.current.has(ac.id)) {
            const anim = departedAnimMap.current.get(ac.id)!;
            const elapsed = (nowMs - anim.startTime) / 1000;
            if (elapsed < 1.3) {
              isTakingOff = true;
              const progress = Math.min(1.0, elapsed / 1.3);
              const rollDist = Math.pow(progress, 2.0) * 180; // Chạy đà nhanh và dứt khoát trên đường băng
              const rad = (anim.heading * Math.PI) / 180;
              const dx = Math.sin(rad);
              const dy = -Math.cos(rad);

              pos = {
                x: anim.startX + dx * rollDist,
                y: anim.startY + dy * rollDist,
                heading: anim.heading,
              };
              // Phóng to nhẹ (+40%) khi nhấc bánh và mờ dần vào không gian
              liftScaleFactor = 1.0 + 0.40 * Math.pow(progress, 1.3);
              renderOpacity = progress < 0.55 ? 1.0 : Math.max(0, 1.0 - (progress - 0.55) / 0.45);
            } else {
              departedAnimMap.current.delete(ac.id);
            }
          }

          const isSelected = ac.id === (state.selectedAircraftId || state.aircraft?.id);
          const aDef = getAirlineDef(ac.airlineCode || ac.callsign);
          const labelColor = isSelected ? '#38bdf8' : (aDef.accentColor || '#fbbf24');
          const planeScale = (aircraftScale ?? (renderMode !== 'normal' ? 1.5 : 1.1)) * liftScaleFactor;
          const isFacingSouth = pos.heading > 135 && pos.heading < 225;
          const callsignOffset = 26 * planeScale;
          const callsignY = isFacingSouth ? pos.y + callsignOffset : pos.y - callsignOffset;
          const labelFontSize = 8.5 * Math.min(1.3, planeScale);

          return (
            <g
              key={`aircraft-${ac.id}`}
              onClick={() => onSelectAircraft?.(ac.id)}
              style={{ cursor: 'pointer', opacity: renderOpacity, transition: 'opacity 0.1s linear' }}
            >
              <AircraftIcon
                x={pos.x}
                y={pos.y}
                heading={pos.heading}
                callsign={ac.callsign}
                airlineCode={ac.airlineCode}
                aircraftAsset={ac.aircraftAsset}
                scale={planeScale}
                isEmergency={ac.role === 'emergency' || ac.scenarioLabel === 'KHẨN NGUY'}
                isDeviated={ac.deviated}
                isRadioFailure={ac.radioFailure}
                isSelected={isSelected && !isScenario}
                isFireExtinguished={ac.isFireExtinguished}
              />
              <text
                x={pos.x} y={callsignY}
                textAnchor="middle" fontSize={labelFontSize} fontWeight={900}
                fill={labelColor}
                stroke="#000000" strokeWidth={1.5} paintOrder="stroke"
              >
                {ac.callsign}
              </text>

              {/* Dấu X STOP & Đèn đỏ Stop Bar phát sáng trước mũi các tàu khi dừng chờ trên đường lăn hoặc cách ly */}
              {(() => {
                if (isTakingOff) return false;
                if (ac.hidden || ac.callsign === 'RESCUE01' || ac.aircraftAsset?.includes('xecuuhoa')) return false;

                // Trong chế độ FTG, truyền thống, kịch bản 5 và kịch bản 2, không dùng dấu X đỏ che bản đồ (tàu dùng dải đèn dẫn hướng đỏ dừng trước vạch)
                if (
                  renderMode === 'ftg' ||
                  renderMode === 'traditional' ||
                  state.scenario?.id === 'lvc_peak_runway_direction_change' ||
                  state.scenario?.id === 'lvc_hsns_intersection_conflict'
                ) return false;

                // Tàu đang đỗ trong bến (Stand) trước khi khởi hành -> KHÔNG HIỆN ĐÈN ĐỎ TRƯỚC MŨI
                const isAtInitialStand = (ac.routeEdgeIndex === 0 || ac.routeEdgeIndex === undefined) &&
                  (ac.role === 'pushback' || ac.role === 'departing' || ac.status === 'queued' || (ac.scenarioLabel && ac.scenarioLabel.toUpperCase().includes('STAND')));
                if (isAtInitialStand) return false;

                // Tàu đã về bến an toàn hoặc đã cất cánh
                if (ac.status === 'arrived' || ac.status === 'departed' || ac.status === 'parked') {
                  // Riêng BAV315 cháy động cơ dừng cô lập ở giữa W4 thì hiện đèn đỏ cảnh báo cách ly
                  if (ac.callsign === 'BAV315' && (ac.currentNodeId === 'v3_line_04_p02' || ac.currentNodeId === 'v3_line_04_p01')) {
                    return true;
                  }
                  return false;
                }

                // Khi tàu đã ra đường lăn và cần dừng chờ nhường đường hoặc giữ vị trí:
                const isHoldingOnTaxiway = (ac.status === 'holding' || ac.status === 'waiting' || ac.holdReason === 'stop-bar' || ac.holdReason === 'deviation');
                if (isHoldingOnTaxiway && (ac.routeEdgeIndex ?? 0) > 0) {
                  return true;
                }

                // Tàu BAV315 dừng tại W4 sau khi thoát khỏi đường băng
                if (ac.callsign === 'BAV315' && ac.speedKts === 0 && (ac.routeEdgeIndex ?? 0) >= 3) {
                  return true;
                }

                return false;
              })() && (
                <g transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Position X marker in front of aircraft along its heading */}
                  <g transform={`rotate(${pos.heading}) translate(0, -22)`}>
                    {/* Glowing Red Stop Light Bar across path */}
                    <line x1={-16} y1={0} x2={16} y2={0} stroke="#ff0000" strokeWidth={4} strokeLinecap="round" opacity={0.95} />
                    <line x1={-16} y1={0} x2={16} y2={0} stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" />

                    {/* Glowing Red X Barrier */}
                    <g className="animate-pulse">
                      {/* Glow backdrop circle */}
                      <circle cx={0} cy={0} r={12} fill="rgba(239, 68, 68, 0.40)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,2" />
                      {/* Outer red glow */}
                      <line x1={-8} y1={-8} x2={8} y2={8} stroke="#ff0000" strokeWidth={4} strokeLinecap="round" />
                      <line x1={-8} y1={8} x2={8} y2={-8} stroke="#ff0000" strokeWidth={4} strokeLinecap="round" />
                      {/* Bright white core */}
                      <line x1={-8} y1={-8} x2={8} y2={8} stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" />
                      <line x1={-8} y1={8} x2={8} y2={-8} stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" />
                    </g>
                    {/* Stop Bar Badge Text */}
                    <g transform={`rotate(${-pos.heading}) translate(0, 16)`}>
                      <rect x={-32} y={-6} width={64} height={12} rx={3} fill="#180404" stroke="#ef4444" strokeWidth={1} />
                      <text x={0} y={2.5} textAnchor="middle" fontSize={5.5} fontWeight={900} fill="#fca5a5" fontFamily="monospace">
                        {ac.callsign === 'BAV315' ? '⛔ ISOLATED STOP' : ac.callsign === 'BAV456' || ac.callsign === 'THA101' ? '⛔ HOLD POSITION' : ac.callsign === 'OUT01' || ac.callsign === 'INB01' ? '⛔ STOP BAR' : '⛔ STOP'}
                      </text>
                    </g>
                  </g>
                </g>
              )}
            </g>
          );
        })}
        {/* ── FOD Obstacle Marker on W7A MID (Scenario 4) ── */}
        {(state.blockedEdgeIds?.has('E_v3_line_18_p01_v3_line_18_p02') || (state.scenario?.id === 'lvc_w7a_sudden_closure' && state.comicBubble?.active)) && (
          <g transform="translate(256, 682)">
            {/* Pulsing red hazard aura */}
            <circle cx={0} cy={0} r={22} fill="rgba(239, 68, 68, 0.35)" stroke="#ef4444" strokeWidth={2} strokeDasharray="4,3" className="animate-ping" />
            <circle cx={0} cy={0} r={18} fill="#ffffff" stroke="#ef4444" strokeWidth={2.5} />
            
            {/* User FOD.png Image */}
            <image href="/FOD.png" x={-15} y={-15} width={30} height={30} preserveAspectRatio="xMidYMid meet" />
            
            {/* Red Stop Bar Barrier Icon */}
            <line x1={-12} y1={-12} x2={12} y2={12} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
            <line x1={-12} y1={12} x2={12} y2={-12} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
          </g>
        )}


      </svg>

      {/* ── ATC Radio Transmission Panel (Chỉ hiển thị cho Kịch bản 4 sự cố FOD) ── */}
      {state.scenario?.id === 'lvc_w7a_sudden_closure' && state.comicBubble?.active && (
        <div className="absolute top-14 left-6 z-30 max-w-md animate-in fade-in slide-in-from-top-3 duration-300 select-none pointer-events-auto font-mono">
          <div className="relative bg-[#0b1320]/95 text-slate-100 border border-amber-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md ring-1 ring-white/10">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
                  🎙️ TWR 118.1 MHz | ATC TRANSMISSION
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                A-SMGCS ALERT
              </span>
            </div>
            
            {/* Body */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img src="/FOD.png" alt="FOD" className="w-12 h-12 rounded-lg border border-red-500/50 object-contain bg-slate-900/80 p-1" />
                <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-red-600 text-white px-1 rounded">FOD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs md:text-[13px] leading-snug text-amber-200">
                  {state.comicBubble.text}
                </p>
                {state.comicBubble.subText && (
                  <p className="mt-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded px-2 py-1 leading-relaxed">
                    {state.comicBubble.subText}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Comic Speech Bubble cho lệnh KSKL "Runway Change 07R" trên màn FTG ── */}
      {renderMode === 'ftg' && state.comicBubble?.active && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in zoom-in-95 duration-200 select-none pointer-events-none">
          {/* Comic speech bubble with comic tail */}
          <div className="relative bg-amber-300 text-slate-950 border-4 border-black rounded-2xl p-3 shadow-[0_10px_25px_rgba(0,0,0,0.5),6px_6px_0px_#000000] rotate-[-1deg]">
            {/* Comic Header */}
            <div className="flex items-center justify-between border-b-2 border-black/80 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-red-950">
                {/* Nút bấm kiểu truyện tranh thay cho icon loa */}
                <span className="inline-flex items-center justify-center bg-red-700 text-white text-[9px] font-black px-2 py-0.5 rounded border-2 border-black shadow-[2px_2px_0px_#000] uppercase tracking-wider">BTN</span>
                KSKL BẤM LỆNH DUY NHẤT:
              </div>
              <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full border border-black uppercase animate-pulse">
                AUTO-FREEZE 0.5s
              </span>
            </div>

            {/* Comic Bubble Text - chỉ giữ lại lệnh chính, xóa dòng mô tả phụ */}
            <div className="flex items-center gap-3">
              <div className="text-3xl filter drop-shadow">⚡</div>
              <div className="text-sm md:text-base font-black tracking-wide text-red-700 uppercase drop-shadow-sm font-mono">
                &quot;RUNWAY CHANGE 07R&quot;
              </div>
            </div>

            {/* Comic Bubble Tail */}
            <div className="absolute -bottom-3.5 left-12 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-amber-300 filter drop-shadow-[0_3px_0_#000000]"></div>
          </div>
        </div>
      )}

      {/* ── Floating ATC Dialogue & Event Log HUD Overlay cho Kịch bản 2, 3, 4 ── */}
      {renderMode === 'normal' && state.scenario && (
        <ScenarioAtcHudOverlay state={state} />
      )}

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

// ── HUD NHẬT KÝ THOẠI & HUẤN LỆNH KSVKL NỔI TRÊN BẢN ĐỒ (CHO KỊCH BẢN 2, 3, 4) ───
interface AtcToastMessage {
  id: string;
  text: string;
  time: number;
  severity?: string;
  createdAt: number;
}

function ScenarioAtcHudOverlay({ state }: { state: SimulationState }) {
  const [toasts, setToasts] = useState<AtcToastMessage[]>([]);
  const prevEventsLengthRef = useRef(0);

  const scenario = state.scenario;
  const events = scenario?.events ?? [];

  // Reset khi đổi kịch bản hoặc khi kịch bản chạy lại từ đầu
  useEffect(() => {
    setToasts([]);
    prevEventsLengthRef.current = 0;
  }, [scenario?.id, state.elapsedSeconds === 0]);

  // Mỗi câu thoại tự động biến mất sau đúng 8s kể từ khi xuất hiện
  useEffect(() => {
    if (toasts.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(t => now - t.createdAt < 8000));
    }, 1000);
    return () => clearInterval(interval);
  }, [toasts.length]);

  // Khi có huấn lệnh mới: lập tức bung câu thoại nổi tại đúng thời điểm phát lệnh
  useEffect(() => {
    if (!scenario) return;

    // Nếu kịch bản vừa được restart lại từ đầu (số lượng event giảm đi)
    if (events.length < prevEventsLengthRef.current) {
      prevEventsLengthRef.current = 0;
      setToasts([]);
    }

    if (events.length <= prevEventsLengthRef.current) {
      return;
    }

    const newEvents = events.slice(prevEventsLengthRef.current);
    prevEventsLengthRef.current = events.length;

    // Lọc bỏ thông báo ban đầu của hệ thống "Kịch bản bắt đầu."
    const actionableEvents = newEvents.filter((ev: any) => ev.message && !ev.message.includes('Kịch bản bắt đầu'));
    if (actionableEvents.length === 0) return;

    const now = Date.now();
    const newToasts: AtcToastMessage[] = actionableEvents.map((ev: any, i: number) => ({
      id: `${now}-${i}-${Math.random()}`,
      text: ev.message,
      time: ev.atSeconds,
      severity: ev.severity,
      createdAt: now,
    }));

    // Giữ tối đa 2 tin nhắn mới nhất đồng thời để tránh che màn hình
    setToasts(prev => [...prev.slice(-1), ...newToasts]);
  }, [events, events.length, scenario?.id]);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Nếu không có kịch bản hoặc không có câu thoại nào cần hiển thị thì màn hình hoàn toàn sạch
  if (!scenario || toasts.length === 0) return null;

  return (
    <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 w-full max-w-[340px] sm:max-w-[380px] pointer-events-none select-none font-mono">
      {toasts.map(toast => {
        const isWarning = toast.severity === 'warning' || toast.severity === 'critical' || toast.text?.includes('🛑') || toast.text?.includes('⚠️');
        const isSuccess = toast.severity === 'info' && (toast.text?.includes('🟢') || toast.text?.includes('CLEARANCE'));

        return (
          <div
            key={toast.id}
            onClick={() => handleDismissToast(toast.id)}
            className={`pointer-events-auto w-full bg-[#0b1320]/95 border shadow-2xl shadow-black/90 rounded-xl p-2.5 text-xs text-slate-100 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 cursor-pointer select-none ${
              isWarning
                ? 'border-amber-500/60 shadow-amber-950/40 ring-1 ring-amber-500/30'
                : isSuccess
                ? 'border-emerald-500/60 shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                : 'border-cyan-500/50 shadow-cyan-950/40 ring-1 ring-cyan-500/30'
            }`}
            title="Bấm để đóng tin nhắn này"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider">
                <span className={`w-2 h-2 rounded-full animate-ping inline-block ${
                  isWarning ? 'bg-amber-400' : isSuccess ? 'bg-emerald-400' : 'bg-cyan-400'
                }`} />
                <Radio className={`w-3.5 h-3.5 ${
                  isWarning ? 'text-amber-400' : isSuccess ? 'text-emerald-400' : 'text-cyan-400'
                }`} />
                <span className={
                  isWarning ? 'text-amber-300' : isSuccess ? 'text-emerald-300' : 'text-cyan-300'
                }>
                  KSVKL / Huấn lệnh ATC
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismissToast(toast.id);
                }}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 hover:bg-white/10 rounded transition-colors"
                title="Đóng"
              >
                ✕
              </button>
            </div>
            <div className={`font-mono text-[12px] leading-relaxed pl-2 border-l-2 py-1.5 pr-2 rounded-r ${
              isWarning
                ? 'border-amber-400 bg-amber-950/30 text-amber-100'
                : isSuccess
                ? 'border-emerald-400 bg-emerald-950/30 text-emerald-100'
                : 'border-cyan-400 bg-cyan-950/30 text-cyan-50'
            }`}>
              {toast.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── RẢI CÁC CHẤM TRÒN PHÁT QUANG ĐỎ TRỰC TIẾP THEO TIM ĐƯỜNG BĂNG BẢN ĐỒ V3 ───
const V3_RUNWAY_CENTERLINES = [
  // 1. Runway Bắc (07L -> STOP BAR 25R)
  [
    { x: 56, y: 486 },
    { x: 225, y: 400 },
    { x: 843, y: 97 },
    { x: 933, y: 55 },
  ],
  // 2. Runway Nam (07R -> W9A -> W7A -> ... -> STOP BAR 25L)
  [
    { x: 53, y: 708 },
    { x: 232, y: 620 },
    { x: 445, y: 514 },
    { x: 633, y: 421 },
    { x: 819, y: 331 },
    { x: 919, y: 282 },
    { x: 965, y: 260 },
    { x: 1136, y: 177 },
  ],
];

function V3RunwayCenterlineEmergencyLights() {
  const dots: { x: number; y: number; key: string }[] = [];
  const visited = new Set<string>();

  V3_RUNWAY_CENTERLINES.forEach((linePts, lineIdx) => {
    for (let segIdx = 0; segIdx < linePts.length - 1; segIdx++) {
      const from = linePts[segIdx];
      const to = linePts[segIdx + 1];

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len < 4) continue;

      const step = 26; // Khoảng cách đều giữa các chấm đèn tim
      const count = Math.max(1, Math.round(len / step));

      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const x = Math.round((from.x + dx * t) * 10) / 10;
        const y = Math.round((from.y + dy * t) * 10) / 10;

        const coordKey = `${Math.round(x / 4) * 4}_${Math.round(y / 4) * 4}`;
        if (!visited.has(coordKey)) {
          visited.add(coordKey);
          dots.push({ x, y, key: `rwy-v3-dot-${lineIdx}-${segIdx}-${i}-${coordKey}` });
        }
      }
    }
  });

  return (
    <g className="v3-runway-emergency-red-dots" pointerEvents="none">
      {dots.map(dot => (
        <g key={dot.key} className="animate-pulse">
          {/* Quầng sáng đỏ dịu nhẹ vừa mắt */}
          <circle cx={dot.x} cy={dot.y} r={5.8} fill="rgba(239, 68, 68, 0.42)" />
          {/* Chấm tròn đèn đỏ chuẩn */}
          <circle cx={dot.x} cy={dot.y} r={2.5} fill="#ef4444" stroke="#991b1b" strokeWidth={0.5} />
          {/* Lõi phát quang sáng ở tâm */}
          <circle cx={dot.x} cy={dot.y} r={1.0} fill="#ffffff" />
        </g>
      ))}
    </g>
  );
}

// ── GRAPH V3 OVERLAY RENDERER (Layer 2.75: Ultra-Bright Glowing Cyan Raw Traces & Named Nodes from Graph V3) ──────
function GraphV3OverlayRenderer() {
  const nodeMap = new Map(airportGraphV3.nodes.map(n => [n.id, n]));

  return (
    <g className="graph-v3-overlay-layer" opacity={1.0} pointerEvents="none">
      {/* 1. All Edges from airportGraph.v3.ts - Ultra-Bright Neon Cyan */}
      {airportGraphV3.edges.map(edge => {
        const from = nodeMap.get(edge.fromNodeId);
        const to = nodeMap.get(edge.toNodeId);
        if (!from || !to) return null;

        return (
          <g key={`v3_overlay_edge_${edge.id}`}>
            {/* Outer Glow */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(0, 245, 255, 0.45)"
              strokeWidth={7.0}
              strokeLinecap="round"
            />
            {/* Core Cyan Line */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#00ffff"
              strokeWidth={2.5}
              strokeDasharray={edge.type === 'runway' ? 'none' : '6,4'}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* 2. All Nodes from airportGraph.v3.ts */}
      {airportGraphV3.nodes.map(node => {
        const isNamed = !!node.label && node.label.trim().length > 0;

        return (
          <g key={`v3_overlay_node_${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
            {/* Outer ring for named nodes */}
            {isNamed && (
              <circle
                cx={0}
                cy={0}
                r={5.5}
                fill="#0284c7"
                stroke="#00ffff"
                strokeWidth={2.0}
              />
            )}

            {/* Center dot */}
            <circle
              cx={0}
              cy={0}
              r={isNamed ? 3.5 : 2.0}
              fill={isNamed ? '#ffffff' : '#00ffff'}
              stroke="#020617"
              strokeWidth={0.8}
            />

            {/* Label for named operational nodes */}
            {isNamed && (
              <g transform="translate(0, -7)">
                <rect
                  x={-Math.max(14, node.label.length * 4.2) / 2}
                  y={-6}
                  width={Math.max(14, node.label.length * 4.2)}
                  height={12}
                  rx={3}
                  fill="#090d16"
                  fillOpacity={0.94}
                  stroke="#00ffff"
                  strokeWidth={0.9}
                />
                <text
                  x={0}
                  y={2.2}
                  textAnchor="middle"
                  fontSize={4.8}
                  fill="#38bdf8"
                  fontWeight={900}
                  fontFamily="monospace"
                >
                  {node.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* 3. Audit Debug Banner on SVG Map Canvas */}
      <g className="overlay-v3-audit-banner" transform="translate(10, 24)">
        <rect
          x={0}
          y={0}
          width={760}
          height={22}
          rx={5}
          fill="#020617"
          fillOpacity={0.92}
          stroke="#00f5ff"
          strokeWidth={1.2}
        />
        <text
          x={10}
          y={15}
          fontSize={8.5}
          fontWeight={900}
          fill="#00f5ff"
          fontFamily="monospace"
        >
          RAW SOURCE SHA: 30B8A929FCB6... | RAW LINES: 38 | RAW POINTS: 121 | GRAPH V3 NODES: 120 | EDGES: 133
        </text>
      </g>
    </g>
  );
}



// ── FULL-TRIP ROUTE PREVIEW BLUE RENDERER (Layer 2.8: Single Clean Dashed Line) ─────────
function RoutePreviewBlueRenderer({
  aircraftList,
  selectedAircraftId,
  isScenario,
  graph,
  elapsedSeconds = 0,
}: {
  aircraftList: Aircraft[];
  selectedAircraftId?: string;
  isScenario: boolean;
  graph: AirportGraph;
  elapsedSeconds?: number;
}) {
  // In Manual Mode: only render for the selected aircraft with routeVisible === true
  // In Scenario Mode: render for all scenario aircraft with routeVisible === true and already active
  const targetAircraft = isScenario
    ? aircraftList.filter(a => {
        if (!a.routeVisible || a.status === 'queued' || (a as any).hidden || a.status === 'departed' || a.status === 'arrived') return false;
        if ((a as any).releaseAtSeconds !== undefined && elapsedSeconds < (a as any).releaseAtSeconds) return false;
        return true;
      })
    : aircraftList.filter(a => (a.id === selectedAircraftId || (aircraftList.length === 1 && a.id === aircraftList[0].id)) && a.routeVisible);

  return (
    <g className="route-preview-blue-layer">
      {targetAircraft.map(ac => {
        if (!ac.routeVisible || !ac.assignedRoute || ac.assignedRoute.length < 2) return null;
        if (ac.status === 'arrived') return null;
        const isSelected = ac.id === selectedAircraftId;

        const curIdx = Math.max(0, Math.min(ac.assignedRoute.length - 2, ac.routeEdgeIndex ?? 0));
        const curPos = getPositionForAircraft(ac, graph);

        // Nếu là OUT01 hoặc OUT02 ở Kịch bản 5 và chưa có thông báo đổi chiều RUNWAY CHANGE 07R: chỉ vẽ đường xanh dương tới RW 25L (v3_line_17_p16)
        let maxRouteIndex = ac.assignedRoute.length - 1;
        const isRunwayChangeAc = (ac.callsign === 'OUT01' || ac.callsign === 'OUT02');
        const hasRunwayChanged = ac.scenarioLabel?.includes('RUNWAY CHANGE 07R') || ac.scenarioLabel?.includes('RW 07R');
        if (isRunwayChangeAc && !hasRunwayChanged) {
          const idx25L = ac.assignedRoute.indexOf('v3_line_17_p16');
          if (idx25L !== -1) {
            maxRouteIndex = idx25L;
          }
        }

        // Build array of line segments ONLY for remaining path (Google Maps navigation style)
        const segments: { f: { x: number; y: number }; t: { x: number; y: number }; edgeId: string }[] = [];
        for (let i = curIdx; i < maxRouteIndex; i++) {
          const fromNode = graph.nodes.find(n => n.id === ac.assignedRoute[i]);
          const toNode = graph.nodes.find(n => n.id === ac.assignedRoute[i + 1]);
          if (fromNode && toNode) {
            const edge = graph.edges.find(
              e => (e.fromNodeId === fromNode.id && e.toNodeId === toNode.id) ||
                   (e.bidirectional && e.fromNodeId === toNode.id && e.toNodeId === fromNode.id)
            );

            // On the current segment, start from current aircraft position so the blue line disappears behind the plane
            const fromPt = (i === curIdx && curPos)
              ? { x: curPos.x, y: curPos.y }
              : { x: fromNode.x, y: fromNode.y };

            segments.push({
              f: fromPt,
              t: { x: toNode.x, y: toNode.y },
              edgeId: edge ? edge.id : `seg_${i}`,
            });
          }
        }

        if (segments.length === 0) return null;

        return (
          <g
            key={`route-preview-${ac.id}`}
            className={`route-preview-blue route-preview-aircraft-${ac.id}`}
            opacity={!isScenario || isSelected ? 0.95 : 0.65}
          >
            {/* 1. Backdrop soft cyan glow */}
            {segments.map((seg, idx) => (
              <line
                key={`rpb-glow-${ac.id}-${idx}`}
                x1={seg.f.x}
                y1={seg.f.y}
                x2={seg.t.x}
                y2={seg.t.y}
                stroke="rgba(2, 132, 199, 0.35)"
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* 2. Main dashed Blue Route Preview Line */}
            {segments.map((seg, idx) => (
              <line
                key={`rpb-line-${ac.id}-${idx}`}
                className="route-preview-edge"
                x1={seg.f.x}
                y1={seg.f.y}
                x2={seg.t.x}
                y2={seg.t.y}
                stroke="#0284c7"
                strokeWidth={2.8}
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

// ── PATH DEBUG OVERLAY RENDERER (Layer 2.9: Numbered nodes & Edge IDs) ───────────────────
function PathDebugOverlayRenderer({
  aircraft,
  graph,
}: {
  aircraft: Aircraft | null;
  graph: AirportGraph;
}) {
  if (!aircraft || !aircraft.assignedRoute || aircraft.assignedRoute.length < 2) return null;

  const routeNodeIds = aircraft.assignedRoute;
  const segments: { f: { x: number; y: number; id: string }; t: { x: number; y: number; id: string }; edgeId: string }[] = [];

  for (let i = 0; i < routeNodeIds.length - 1; i++) {
    const fromNode = graph.nodes.find(n => n.id === routeNodeIds[i]);
    const toNode = graph.nodes.find(n => n.id === routeNodeIds[i + 1]);
    if (fromNode && toNode) {
      const edge = graph.edges.find(
        e => (e.fromNodeId === fromNode.id && e.toNodeId === toNode.id) ||
             (e.bidirectional && e.fromNodeId === toNode.id && e.toNodeId === fromNode.id)
      );
      if (edge) {
        segments.push({ f: fromNode, t: toNode, edgeId: edge.id });
      }
    }
  }

  return (
    <g className="path-debug-overlay-layer">
      {/* 1. Highlight line with amber glow */}
      {segments.map((seg, idx) => (
        <g key={`debug-seg-${idx}`}>
          <line
            x1={seg.f.x}
            y1={seg.f.y}
            x2={seg.t.x}
            y2={seg.t.y}
            stroke="#f59e0b"
            strokeWidth={4.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          <line
            x1={seg.f.x}
            y1={seg.f.y}
            x2={seg.t.x}
            y2={seg.t.y}
            stroke="#ffffff"
            strokeWidth={1.8}
            strokeDasharray="4,3"
            strokeLinecap="round"
          />
          {/* Edge ID badge at midpoint */}
          <g transform={`translate(${(seg.f.x + seg.t.x) / 2}, ${(seg.f.y + seg.t.y) / 2})`}>
            <rect
              x={-Math.max(16, seg.edgeId.length * 3.4) / 2}
              y={-5}
              width={Math.max(16, seg.edgeId.length * 3.4)}
              height={10}
              rx={2}
              fill="#0f172a"
              fillOpacity={0.95}
              stroke="#f59e0b"
              strokeWidth={0.6}
            />
            <text
              x={0}
              y={2.2}
              textAnchor="middle"
              fontSize={4.2}
              fontWeight={800}
              fill="#fde047"
              fontFamily="monospace"
            >
              {seg.edgeId}
            </text>
          </g>
        </g>
      ))}

      {/* 2. Numbered waypoint badges: 01, 02, 03... */}
      {routeNodeIds.map((nodeId, idx) => {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return null;
        const isStart = idx === 0;
        const isEnd = idx === routeNodeIds.length - 1;
        const stepNum = String(idx + 1).padStart(2, '0');
        const badgeColor = isStart ? '#22c55e' : (isEnd ? '#ef4444' : '#38bdf8');

        return (
          <g key={`debug-node-${nodeId}-${idx}`} transform={`translate(${node.x}, ${node.y})`}>
            <circle cx={0} cy={0} r={5} fill="#0f172a" stroke={badgeColor} strokeWidth={1.2} />
            <text
              x={0}
              y={2.6}
              textAnchor="middle"
              fontSize={4.4}
              fontWeight={900}
              fill="#ffffff"
              fontFamily="monospace"
            >
              {stepNum}
            </text>
            <rect
              x={-Math.max(18, nodeId.length * 3.5) / 2}
              y={-14}
              width={Math.max(18, nodeId.length * 3.5)}
              height={8}
              rx={2}
              fill="#0f172a"
              fillOpacity={0.92}
              stroke={badgeColor}
              strokeWidth={0.6}
            />
            <text
              x={0}
              y={-8.5}
              textAnchor="middle"
              fontSize={4}
              fontWeight={800}
              fill={badgeColor}
              fontFamily="monospace"
            >
              {nodeId}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── SEGMENTED FOLLOW-THE-GREEN GUIDANCE RENDERER (Layer 2: Localized Active Edge Guidance) ───
interface GuidanceDot {
  x: number;
  y: number;
  isPreview?: boolean;
}

function computeSegmentedGuidanceDots(
  aircraft: Aircraft,
  graph: AirportGraph,
  blockedEdgeIds: Set<string> = new Set(),
): { activeDots: GuidanceDot[]; previewDots: GuidanceDot[] } | null {
  if (!aircraft.assignedRoute || aircraft.assignedRoute.length < 2) return null;
  if (aircraft.routeEdgeIndex >= aircraft.assignedRoute.length - 1) return null;

  const currentIdx = Math.max(0, Math.min(aircraft.assignedRoute.length - 2, aircraft.routeEdgeIndex ?? 0));
  const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[currentIdx]);
  const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[currentIdx + 1]);
  if (!fromNode || !toNode) return null;

  // Check if current edge is blocked
  const currentEdge = graph.edges.find(
    e => (e.fromNodeId === fromNode.id && e.toNodeId === toNode.id) ||
         (e.bidirectional && e.fromNodeId === toNode.id && e.toNodeId === fromNode.id)
  );
  if (currentEdge && blockedEdgeIds.has(currentEdge.id)) {
    return null;
  }

  const DOT_STEP_PX = 14; // Khoảng cách cố định chuẩn giữa các bóng đèn tim đường (~40m)
  const MAX_LOOKAHEAD_PX = 142; // Tầm nhìn chiếu sáng 10 bóng đèn phía trước mũi tàu (~400m)
  const MAX_BLOCK_EDGES = 5; // Cho phép chiếu sáng xuyên qua tối đa 5 phân đoạn cạnh tiếp theo

  const activeDots: GuidanceDot[] = [];
  const prog = Math.max(0, Math.min(1, aircraft.progressOnEdge ?? 0));

  // 1. Phân đoạn hiện tại (Current Edge)
  const curDx = toNode.x - fromNode.x;
  const curDy = toNode.y - fromNode.y;
  const curLen = Math.hypot(curDx, curDy);
  const curNumLights = Math.max(1, Math.round(curLen / DOT_STEP_PX));

  for (let k = 0; k < curNumLights; k++) {
    const t = (k + 0.5) / curNumLights;
    const distFromNose = curLen * (t - prog);
    // Chỉ sáng các đèn ngay phía trước mũi tàu trong phạm vi MAX_LOOKAHEAD_PX (4-5 đèn)
    if (distFromNose >= -2 && distFromNose <= MAX_LOOKAHEAD_PX) {
      activeDots.push({
        x: fromNode.x + curDx * t,
        y: fromNode.y + curDy * t,
        isPreview: false,
      });
    }
  }

  // 2. Các phân đoạn tiếp theo nếu đoạn hiện tại ngắn hơn phạm vi MAX_LOOKAHEAD_PX
  let accumulatedDist = Math.max(0, curLen * (1 - prog));

  for (let step = 1; step <= MAX_BLOCK_EDGES && accumulatedDist < MAX_LOOKAHEAD_PX; step++) {
    const nextIdx = currentIdx + step;
    if (nextIdx >= aircraft.assignedRoute.length - 1) break;

    const sNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[nextIdx]);
    const eNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[nextIdx + 1]);
    if (!sNode || !eNode) break;

    const segEdge = graph.edges.find(
      e => (e.fromNodeId === sNode.id && e.toNodeId === eNode.id) ||
           (e.bidirectional && e.fromNodeId === eNode.id && e.toNodeId === sNode.id)
    );

    // Dừng phân đoạn nếu phía trước có Stop Bar hoặc cạnh bị đóng
    if (segEdge && blockedEdgeIds.has(segEdge.id)) {
      break;
    }

    const sdx = eNode.x - sNode.x;
    const sdy = eNode.y - sNode.y;
    const slen = Math.hypot(sdx, sdy);
    if (slen < 1) continue;

    const segNumLights = Math.max(1, Math.round(slen / DOT_STEP_PX));
    for (let k = 0; k < segNumLights; k++) {
      const t = (k + 0.5) / segNumLights;
      const totalDist = accumulatedDist + slen * t;
      if (totalDist <= MAX_LOOKAHEAD_PX) {
        activeDots.push({
          x: sNode.x + sdx * t,
          y: sNode.y + sdy * t,
          isPreview: false,
        });
      }
    }

    accumulatedDist += slen;
  }

  return { activeDots, previewDots: [] };
}

function FollowTheGreenRenderer({
  aircraft,
  graph,
  animPhase = 0,
  isScenario = false,
  isSelected = false,
  blockedEdgeIds = new Set(),
}: {
  aircraft: Aircraft;
  graph: AirportGraph;
  animPhase?: number;
  isScenario?: boolean;
  isSelected?: boolean;
  blockedEdgeIds?: Set<string>;
}) {
  // STRICT RULE: Do not show guidance when aircraft is parked, arrived, departed, waiting, or guidanceVisible is false
  if (aircraft.status === 'parked' || aircraft.status === 'arrived' || aircraft.status === 'departed' || aircraft.status === 'waiting' || aircraft.guidanceVisible === false) {
    return null;
  }
  // Tàu đang đỗ ở bến ban đầu chưa pushback thì không hiện đèn FTG
  const isAtInitialStand = (aircraft.routeEdgeIndex === 0 || aircraft.routeEdgeIndex === undefined) &&
    (aircraft.role === 'pushback' || aircraft.role === 'departing' || aircraft.status === 'queued' || (aircraft.scenarioLabel && aircraft.scenarioLabel.toUpperCase().includes('STAND')));
  if (isAtInitialStand && aircraft.status === 'holding') {
    return null;
  }

  if (!isScenario && !aircraft.routeVisible && aircraft.status !== 'taxiing' && aircraft.status !== 'holding') {
    return null;
  }

  const isHolding = aircraft.status === 'holding' || aircraft.holdReason === 'stop-bar';

  const guidance = computeSegmentedGuidanceDots(aircraft, graph, blockedEdgeIds);
  if (!guidance || (guidance.activeDots.length === 0 && guidance.previewDots.length === 0)) return null;

  const haloUrl = isHolding ? 'url(#neon-lead-red)' : 'url(#neon-lead-green)';
  const bodyColor = isHolding ? '#ef4444' : '#22c55e';
  const glowDrop = isHolding
    ? (isSelected ? 'drop-shadow(0 0 6px #ef4444) drop-shadow(0 0 14px #dc2626)' : 'drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px #dc2626)')
    : (isSelected ? 'drop-shadow(0 0 6px #22c55e) drop-shadow(0 0 14px #16a34a)' : 'drop-shadow(0 0 4px #22c55e) drop-shadow(0 0 8px #16a34a)');

  return (
    <g
      className={`guidance-active-edge ftg-guidance-group-${aircraft.id} ${isHolding ? 'guidance-red-stop' : 'guidance-green'}`}
      style={{ filter: glowDrop }}
    >
      {/* Guidance Dots (Màu ĐỎ khi dừng chờ Stop Bar, màu XANH LÁ khi được giải phóng lăn) */}
      {guidance.activeDots.map((dot, idx) => {
        const phase = animPhase * 3 + idx * 0.45;
        const pulse = 0.86 + 0.18 * Math.sin(phase);
        return (
          <g key={`ftg-act-${aircraft.id}-${idx}`} className="guidance-dot">
            {/* Outer radial halo circle */}
            <circle cx={dot.x} cy={dot.y} r={6.5 * pulse} fill={haloUrl} opacity={0.92} />
            {/* Main body */}
            <circle cx={dot.x} cy={dot.y} r={3.0 * pulse} fill={bodyColor} />
            {/* Bright core center */}
            <circle cx={dot.x} cy={dot.y} r={1.3} fill="#ffffff" />
          </g>
        );
      })}

      {/* Khi dừng chờ trong chế độ FTG: Vẽ vạch đèn Stop Bar đỏ ngang đường lăn báo hiệu điểm cần dừng */}
      {isHolding && guidance.activeDots.length > 0 && (() => {
        const stopDot = guidance.activeDots[0];
        const nextDot = guidance.activeDots[1] || stopDot;
        const dx = nextDot.x - stopDot.x;
        const dy = nextDot.y - stopDot.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = (-dy / len) * 14;
        const py = (dx / len) * 14;

        return (
          <g className="ftg-stop-bar-active">
            {/* Đèn vạch dừng Stop Bar ngang qua đường lăn */}
            <line
              x1={stopDot.x - px}
              y1={stopDot.y - py}
              x2={stopDot.x + px}
              y2={stopDot.y + py}
              stroke="#ef4444"
              strokeWidth={4.5}
              strokeLinecap="round"
              opacity={0.95}
            />
            <line
              x1={stopDot.x - px}
              y1={stopDot.y - py}
              x2={stopDot.x + px}
              y2={stopDot.y + py}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            {/* 3 bóng đèn LED Stop Bar đỏ báo hiệu điểm dừng */}
            <circle cx={stopDot.x - px * 0.75} cy={stopDot.y - py * 0.75} r={3.0} fill="#ef4444" stroke="#ffffff" strokeWidth={0.8} />
            <circle cx={stopDot.x} cy={stopDot.y} r={3.6} fill="#ef4444" stroke="#ffffff" strokeWidth={0.8} />
            <circle cx={stopDot.x + px * 0.75} cy={stopDot.y + py * 0.75} r={3.0} fill="#ef4444" stroke="#ffffff" strokeWidth={0.8} />
          </g>
        );
      })()}
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
  isFireExtinguished = false,
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
  isFireExtinguished?: boolean;
}) {
  const aDef = getAirlineDef(airlineCode || callsign);
  const assetSrc = aircraftAsset || aDef.asset;

  const isVehicle = assetSrc.includes('xecuuhoa') || callsign.includes('RESCUE');
  const isPlane = !isVehicle;

  // Máy bay TSN được crop chéo 67.1 deg, xe cộ trên mặt đất xoay thẳng theo 0 deg
  const rotationDeg = isPlane ? heading - 67.1 : 0;
  const size = (isVehicle ? 64 : 58) * scale;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Invisible broad touch hit area for easy tapping on mobile */}
      <circle cx={0} cy={0} r={46 * scale} fill="transparent" pointerEvents="all" />

      {isSelected && (
        <g>
          {/* Distinct high-contrast glowing halo for selected aircraft */}
          <circle cx={0} cy={0} r={38 * scale} fill="rgba(56, 189, 248, 0.28)" stroke="#38bdf8" strokeWidth={2.8} strokeDasharray="6,4" opacity={0.95} />
          <circle cx={0} cy={0} r={48 * scale} fill="none" stroke="#00e5ff" strokeWidth={1.8} opacity={0.8} />
          <circle cx={0} cy={0} r={30 * scale} fill="rgba(0, 229, 255, 0.15)" stroke="#67e8f9" strokeWidth={1.2} />
        </g>
      )}
      {isEmergency && isPlane && !isFireExtinguished && (
        <circle cx={0} cy={0} r={38 * scale} fill="none" stroke="#ef4444" strokeWidth={3} opacity={0.85} className="animate-ping" />
      )}
      {isDeviated && (
        <g>
          <circle cx={0} cy={0} r={34 * scale} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth={3.5} opacity={0.9} className="animate-ping" />
          <g transform={`translate(0, ${-size * 0.7})`}>
            <rect x={-42} y={-11} width={84} height={22} rx={4} fill="#991B1B" stroke="#FCA5A5" strokeWidth={1.5} />
            <text x={0} y={3.5} textAnchor="middle" fontSize={8} fontWeight={900} fill="#FFFFFF">
              ⛔ ĐI SAI ĐƯỜNG
            </text>
          </g>
        </g>
      )}
      {isRadioFailure && (
        <circle cx={0} cy={0} r={34 * scale} fill="none" stroke="#c084fc" strokeWidth={2.5} opacity={0.85} className="animate-ping" />
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

        {/* Ngọn lửa cháy ở đuôi / động cơ máy bay khẩn nguy BAV315 */}
        {(callsign === 'BAV315' || (isEmergency && isPlane)) && !isFireExtinguished && (
          <g transform={`translate(${-size * 0.28}, ${size * 0.22})`}>
            <image
              href="/lua.png"
              x={-14 * scale}
              y={-14 * scale}
              width={28 * scale}
              height={28 * scale}
              preserveAspectRatio="xMidYMid meet"
              className="animate-pulse"
              filter="drop-shadow(0 0 12px #ff3b00)"
            />
          </g>
        )}
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

function getStandParkingHeading(nodeId: string, node?: AirportNode | null): number {
  if (!node && !nodeId) return 270;
  const label = (node?.label || '').toUpperCase();
  const id = (nodeId || '').toLowerCase();

  // Stands 10, 11, 12, 13 (Phía Tây của Line 12): Mũi quay thẳng qua trái vào bến (270° / West)
  if (label === 'STAND_10' || label === 'STAND_11' || label === 'STAND_12' || label === 'STAND_13' ||
      id.includes('line_33_p00') || id.includes('line_32_p00') || id.includes('line_31_p00') || id.includes('line_30_p00')) {
    return 270;
  }

  // Stands 7, 8, 9 (Phía Đông của Line 12): Mũi quay thẳng qua phải vào bến (90° / East)
  if (label === 'STAND_7' || label === 'STAND_8' || label === 'STAND_9' ||
      id.includes('line_27_p01') || id.includes('line_28_p01') || id.includes('line_29_p01') || id === 't49') {
    return 90;
  }

  // Stands 1, 2, 3, 4, 5 (Phía Nam bến đỗ - Stand 3: v3_line_34_p02): Mũi quay thẳng xuống phía Nam (180°)
  if (label === 'STAND_1' || label === 'STAND_2' || label === 'STAND_3' || label === 'STAND_4' || label === 'STAND_5' ||
      id.includes('line_34_p02') || ['p1', 'p2', 'p3', 'p4', 'p5'].includes(id)) {
    return 180;
  }

  // Stands 16, 17, 18, 20, 21, 22 (Apron Đông/Quốc tế): Mũi quay hướng Đông Nam (135°)
  if (label.includes('STAND_17') || id.includes('line_21') || id.includes('line_22') || id.includes('line_23') || id.includes('line_24') || id.includes('line_25') || id.includes('line_26')) {
    return 135;
  }

  return 270;
}

// ── Interpolate aircraft position along its route ──────────────────────────────
function getPositionForAircraft(aircraft: Aircraft | null, graph: AirportGraph = airportGraphV3) {
  if (!aircraft) return null;

  if (aircraft.assignedRoute && aircraft.assignedRoute.length >= 2) {
    const maxIdx = aircraft.assignedRoute.length - 2;
    const curIdx = Math.max(0, Math.min(maxIdx, aircraft.routeEdgeIndex ?? 0));
    const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[curIdx]);
    const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[curIdx + 1]);

    if (fromNode && toNode) {
      const isArrivedAtFinal = aircraft.status === 'arrived' || (aircraft.routeEdgeIndex >= maxIdx && aircraft.progressOnEdge >= 0.999);
      const t = isArrivedAtFinal ? 1 : Math.max(0, Math.min(1, aircraft.progressOnEdge ?? 0));
      const x = fromNode.x + (toNode.x - fromNode.x) * t;
      const y = fromNode.y + (toNode.y - fromNode.y) * t;

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const forwardHeading = (Math.atan2(dx, -dy) * 180) / Math.PI;

      // Xử lý đẩy lùi (Pushback) rời bến đỗ:
      let heading = forwardHeading;

      const isActualStand = fromNode.label?.toUpperCase().includes('STAND') ||
                            fromNode.id.includes('line_33_p00') || fromNode.id.includes('line_32_p00') ||
                            fromNode.id.includes('line_31_p00') || fromNode.id.includes('line_30_p00') ||
                            fromNode.id.includes('line_34_p02');

      if (aircraft.callsign === 'PUSH02' || fromNode.label?.includes('STAND_3') || fromNode.id.includes('line_34_p02')) {
        if (curIdx === 0) {
          // Giai đoạn 1: Đẩy lùi rời Stand 3 (mũi giữ hướng Nam 180°)
          heading = 180;
        } else if (curIdx >= 1 && curIdx <= 3) {
          // Giai đoạn 2: Lùi đuôi sang Tây -> mũi tàu hướng Đông (90°)
          heading = 90;
        } else if (curIdx === 4) {
          // Giai đoạn 3: Lùi đuôi lên Bắc -> mũi tàu hướng Nam (180°)
          heading = 180;
        } else if (curIdx === 5) {
          // Giai đoạn 4: Cua vào tim Line 12 -> mũi xoay mượt từ 90° sang thẳng Bắc 0°
          heading = (90 - 90 * t + 360) % 360;
        } else {
          // Giai đoạn 5: Đã vào tim đường lăn -> Mũi và đuôi tàu LUÔN LUÔN đi song song chuẩn theo tim đường
          heading = forwardHeading;
        }
      } else if (curIdx === 0 && (aircraft.role === 'pushback' || isActualStand)) {
        const parkHeading = getStandParkingHeading(fromNode.id, fromNode); // 270° cho Stand 10
        let targetHeading = 0; // Hướng trục chính Line 12 (thẳng đứng 0°)
        if (aircraft.assignedRoute.length > 2) {
          const nextNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[2]);
          if (nextNode) {
            targetHeading = (Math.atan2(nextNode.x - toNode.x, -(nextNode.y - toNode.y)) * 180) / Math.PI;
          }
        }
        let delta = targetHeading - parkHeading;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        heading = (parkHeading + delta * t + 360) % 360;
      }

      return { x, y, heading };
    }
  }

  // Fallback to currentNodeId (e.g. idle/waiting at stand or single-node rescue vehicle)
  const node = graph.nodes.find(n => n.id === aircraft.currentNodeId);
  if (node) {
    const defaultHeading = (aircraft.aircraftAsset?.includes('xecuuhoa') || aircraft.callsign === 'RESCUE01')
      ? 0
      : getStandParkingHeading(node.id, node);
    return { x: node.x, y: node.y, heading: defaultHeading };
  }

  return null;
}

export default memo(AirportMap);
