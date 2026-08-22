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
import { airportGraphV2 } from '../data/airportGraph.v2';
import { airportGraphV3 } from '../data/airportGraph.v3';
import AirportLighting from './AirportLighting';
import { getAirlineDef } from '../data/airlineTypes';
import { loadImageWithRetry, type AssetLoadState } from '../utils/assetLoader';
import type { AirportGraph, AirportNode, Aircraft, SimulationState } from '../types';

interface Props {
  state: SimulationState;
  graph?: AirportGraph;
  bgImage?: string;
  /** traditional = no route preview / no Follow-the-Green visual guidance */
  renderMode?: 'normal' | 'traditional' | 'ftg';
  onSelectAircraft?: (aircraftId: string) => void;
  showGraphV2Overlay?: boolean;
  showGraphV3Overlay?: boolean;
  showGrid?: boolean;
  showPaths?: boolean;
  inspectingPathAircraftId?: string | null;
}

const BG_OUTER = '#0c0f12';

function AirportMap({
  state,
  graph = airportGraph,
  bgImage = '/anhtren.png',
  renderMode = 'normal',
  onSelectAircraft,
  showGraphV2Overlay = false,
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
        if (ac.status === 'queued' || ac.hidden) return false;
        if (ac.releaseAtSeconds !== undefined && state.elapsedSeconds < ac.releaseAtSeconds) return false;
        if (ac.status === 'departed') return false;
        // Máy bay về bến đỗ (arrived) như BAV456 tại Stand 17 và BAV315 tại W5 luôn hiển thị đứng yên, không biến mất
        return true;
      })
    : (state.manualFleet && state.manualFleet.length
        ? state.manualFleet.filter(ac => ac.status !== 'departed')
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

        {/* ── Layer 2.7: Graph V2 Overlay (Reference & Comparison Only) ── */}
        {showGraphV2Overlay && <GraphV2OverlayRenderer />}

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
                isFireExtinguished={ac.isFireExtinguished}
              />
              <text
                x={pos.x} y={callsignY}
                textAnchor="middle" fontSize={6.8} fontWeight={800}
                fill={labelColor}
                stroke="#000000" strokeWidth={0.8} paintOrder="stroke"
              >
                {ac.callsign}
              </text>

              {/* Dấu X STOP đỏ phát sáng trước mũi tất cả các tàu khi dừng xếp hàng (OUT01-OUT04, INB01-INB02, PUSH01-PUSH02) */}
              {(ac.status === 'holding' || ac.status === 'waiting' || (ac.speedKts === 0 && !ac.hidden && ac.status !== 'parked' && ac.status !== 'arrived')) && ac.callsign !== 'BAV315' && ac.callsign !== 'RESCUE01' && !ac.aircraftAsset?.includes('xecuuhoa') && (
                <g transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Position X marker in front of aircraft along its heading */}
                  <g transform={`rotate(${pos.heading}) translate(0, -22)`}>
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
                      <rect x={-28} y={-6} width={56} height={12} rx={3} fill="#180404" stroke="#ef4444" strokeWidth={1} />
                      <text x={0} y={2.5} textAnchor="middle" fontSize={5.5} fontWeight={900} fill="#fca5a5" fontFamily="monospace">
                        {ac.callsign === 'OUT01' || ac.callsign === 'INB01' ? '⛔ STOP BAR' : '⛔ STOP'}
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

        {/* ── Stop indicator / Arrow at HS_NS in Scenario 5 Traditional mode (Chỉ hiện khi INB01 đã chạy đến HS_NS, chỉ hiện hình tròn KHÔNG ghi chữ) ── */}
        {(renderMode === 'traditional' || state.scenario?.id === 'lvc_peak_runway_direction_change') && state.scenarioAircraft?.some(a => a.callsign === 'INB01' && (a.routeEdgeIndex >= 15 || a.currentNodeId === 'v3_line_17_p09' || (a.status === 'holding' && a.routeEdgeIndex >= 14))) && (
          <g transform="translate(809, 476)">
            {/* Pulsing red warning aura */}
            <circle cx={0} cy={0} r={16} fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,2" className="animate-ping" />
            <circle cx={0} cy={0} r={10} fill="#7f1d1d" stroke="#ef4444" strokeWidth={1.8} />
            
            {/* Stop Bar Line */}
            <line x1={-10} y1={0} x2={10} y2={0} stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" />
            
            {/* Red Arrow pointing directly to HS NS */}
            <polygon points="0,7 -4,1 4,1" fill="#ef4444" stroke="#ffffff" strokeWidth={0.8} />
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

// ── GRAPH V2 OVERLAY RENDERER (Layer 2.7: Reference and Comparison Only) ────────────────
function GraphV2OverlayRenderer() {
  return (
    <g className="graph-v2-overlay-layer" opacity={0.65} pointerEvents="none">
      {/* V2 Edges */}
      {airportGraphV2.edges.map(edge => {
        const from = airportGraphV2.nodes.find(n => n.id === edge.fromNodeId);
        const to = airportGraphV2.nodes.find(n => n.id === edge.toNodeId);
        if (!from || !to) return null;
        return (
          <line
            key={`v2-edge-${edge.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#ec4899"
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        );
      })}

      {/* V2 Nodes */}
      {airportGraphV2.nodes.map(node => (
        <g key={`v2-node-${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
          <circle cx={0} cy={0} r={2.5} fill="#ec4899" stroke="#ffffff" strokeWidth={0.5} />
          {node.label && (
            <text x={0} y={-4} textAnchor="middle" fontSize={3.8} fill="#f472b6" fontWeight={700}>
              {node.label}
            </text>
          )}
        </g>
      ))}
    </g>
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
  // In Scenario Mode: render for all scenario aircraft with routeVisible === true and already released
  const targetAircraft = isScenario
    ? aircraftList.filter(a => {
        if (!a.routeVisible || a.status === 'queued' || (a as any).hidden || a.status === 'departed') return false;
        if ((a as any).releaseAtSeconds !== undefined && elapsedSeconds < (a as any).releaseAtSeconds) return false;
        if (a.status === 'arrived' && a.callsign !== 'BAV315' && a.role !== 'emergency') return false;
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

        // Build array of line segments ONLY for remaining path (Google Maps navigation style)
        const segments: { f: { x: number; y: number }; t: { x: number; y: number }; edgeId: string }[] = [];
        for (let i = curIdx; i < ac.assignedRoute.length - 1; i++) {
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

  const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex]);
  const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex + 1]);
  if (!fromNode || !toNode) return null;

  const currentEdge = graph.edges.find(
    e => (e.fromNodeId === fromNode.id && e.toNodeId === toNode.id) ||
         (e.bidirectional && e.fromNodeId === toNode.id && e.toNodeId === fromNode.id)
  );

  // If current edge is blocked, extinguish guidance
  if (currentEdge && blockedEdgeIds.has(currentEdge.id)) {
    return null;
  }

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
      const nextEdge = graph.edges.find(
        e => (e.fromNodeId === toNode.id && e.toNodeId === nextToNode.id) ||
             (e.bidirectional && e.fromNodeId === nextToNode.id && e.toNodeId === toNode.id)
      );

      // Only show preview if next edge is NOT blocked
      if (!nextEdge || !blockedEdgeIds.has(nextEdge.id)) {
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
  }

  // Farther edges are strictly OFF (omitted)
  return { activeDots, previewDots };
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
  // STRICT RULE: Do not show guidance when aircraft is parked, arrived, departed, waiting, holding at a stop bar, or guidanceVisible is false
  if (aircraft.status === 'parked' || aircraft.status === 'arrived' || aircraft.status === 'departed' || aircraft.status === 'waiting' || aircraft.status === 'holding' || aircraft.guidanceVisible === false) {
    return null;
  }
  if (!isScenario && !aircraft.routeVisible && aircraft.status !== 'taxiing') {
    return null;
  }

  const guidance = computeSegmentedGuidanceDots(aircraft, graph, blockedEdgeIds);
  if (!guidance || (guidance.activeDots.length === 0 && guidance.previewDots.length === 0)) return null;

  return (
    <g
      className={`guidance-green guidance-active-edge ftg-guidance-group-${aircraft.id}`}
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 6px #22c55e) drop-shadow(0 0 14px #16a34a)'
          : 'drop-shadow(0 0 4px #22c55e) drop-shadow(0 0 8px #16a34a)',
      }}
    >
      {/* 1. Active Edge Guidance Dots (In front of aircraft nose) */}
      {guidance.activeDots.map((dot, idx) => {
        const phase = animPhase * 3 + idx * 0.45;
        const pulse = 0.86 + 0.18 * Math.sin(phase);
        return (
          <g key={`ftg-act-${aircraft.id}-${idx}`} className="guidance-dot">
            {/* Outer radial halo circle */}
            <circle cx={dot.x} cy={dot.y} r={6.5 * pulse} fill="url(#neon-lead-green)" opacity={0.92} />
            {/* Main green body */}
            <circle cx={dot.x} cy={dot.y} r={3.0 * pulse} fill="#22c55e" />
            {/* Bright core center */}
            <circle cx={dot.x} cy={dot.y} r={1.3} fill="#f0fff6" />
          </g>
        );
      })}

      {/* 2. Next Edge Preview Dots (When progressOnEdge >= 0.75, first 2-3 dots) */}
      {guidance.previewDots.map((dot, idx) => {
        const phase = animPhase * 3 + (idx + 4) * 0.45;
        const pulse = 0.85 + 0.15 * Math.sin(phase);
        return (
          <g key={`ftg-prev-${aircraft.id}-${idx}`} opacity={0.65} className="guidance-dot guidance-dot-preview">
            <circle cx={dot.x} cy={dot.y} r={5.5 * pulse} fill="url(#neon-lead-green)" />
            <circle cx={dot.x} cy={dot.y} r={2.5 * pulse} fill="#22c55e" />
            <circle cx={dot.x} cy={dot.y} r={1.1} fill="#f0fff6" />
          </g>
        );
      })}
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
  const size = (isVehicle ? 48 : 36) * scale;

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
      {isEmergency && isPlane && !isFireExtinguished && (
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

        {/* Ngọn lửa cháy ở đuôi / động cơ máy bay khẩn nguy BAV315 - sẽ biến mất sau khi xe cứu hỏa dập lửa 10s */}
        {(callsign === 'BAV315' || (isEmergency && isPlane)) && !isFireExtinguished && (
          <g transform={`translate(${-size * 0.28}, ${size * 0.22})`}>
            <image
              href="/lua.png"
              x={-12 * scale}
              y={-12 * scale}
              width={24 * scale}
              height={24 * scale}
              preserveAspectRatio="xMidYMid meet"
              className="animate-pulse"
              filter="drop-shadow(0 0 10px #ff3b00)"
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
  if (!node && !nodeId) return 265;
  const label = (node?.label || '').toUpperCase();
  const id = nodeId.toLowerCase();

  // Stands 1, 2, 3, 4, 5 (Phía Nam bến đỗ - Stand 3: v3_line_34_p02):
  // Mũi quay đầu vào trong về phía Nam (180°), đuôi quay ra ngoài phía Bắc (0°) để de đít
  if (label.includes('STAND_3') || label.includes('STAND_1') || label.includes('STAND_2') || label.includes('STAND_4') || label.includes('STAND_5') ||
      id.includes('line_34_p02') || id === 'p1' || id === 'p2' || id === 'p3' || id === 'p4' || id === 'p5') {
    return 180;
  }

  // Stands 10, 11, 12, 13 (Phía Tây của Line 12): Mũi quay đầu vào trong về hướng Tây (265°)
  if (id.includes('line_33') || id.includes('line_32') || id.includes('line_31') || id.includes('line_30') ||
      label.includes('STAND_10') || label.includes('STAND_11') || label.includes('STAND_12') || label.includes('STAND_13')) {
    return 265;
  }
  // Stands 7, 8, 9 (Phía Đông của Line 12): Mũi quay đầu vào trong về hướng Đông (95°)
  if (id.includes('line_27') || id.includes('line_28') || id.includes('line_29') ||
      label.includes('STAND_7') || label.includes('STAND_8') || label.includes('STAND_9') || id === 't49') {
    return 95;
  }
  // Stands 16, 17, 18, 20, 21, 22 (Apron Đông/Quốc tế): Mũi quay đầu vào trong về hướng Đông Nam (145°)
  if (id.includes('line_21') || id.includes('line_22') || id.includes('line_23') || id.includes('line_24') || id.includes('line_25') || id.includes('line_26')) {
    return 145;
  }

  return 265;
}

// ── Interpolate aircraft position along its route ──────────────────────────────
function getPositionForAircraft(aircraft: Aircraft | null, graph: AirportGraph = airportGraph) {
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

      if (aircraft.callsign === 'PUSH02' || fromNode.label?.includes('STAND_3') || fromNode.id.includes('line_34_p02')) {
        if (curIdx === 0) {
          // Giai đoạn 1: Đẩy lùi rời Stand 3, đuôi quẹo trái hướng Tây (270°), mũi xoay từ 180° sang 90° (hướng Đông)
          heading = 180 - 90 * t;
        } else if (curIdx >= 1 && curIdx <= 4) {
          // Giai đoạn 2: Lùi de đít dọc theo tuyến lăn nội bộ về hướng Tây -> mũi tàu luôn hướng Đông (90°)
          heading = 90;
        } else if (curIdx === 5) {
          // Giai đoạn 3: De đít vào tim Line 12 tại nút v3_line_34_p00 -> đuôi quẹo trái vào tim Line 12, mũi xoay từ 90° sang thẳng đứng 0°
          heading = 90 - 90 * t;
        } else {
          // Giai đoạn 4: Đã căn thẳng hàng 0° trên Line 12 -> chỉ việc nổ máy lăn thẳng tiến về phía Bắc (0°)
          heading = 0;
        }
      } else if (curIdx === 0 && (
        fromNode.id.includes('p00') ||
        fromNode.id.includes('p02') ||
        fromNode.label?.includes('STAND') ||
        (fromNode.type as any) === 'stand' ||
        fromNode.type === 'gate' ||
        aircraft.role === 'pushback'
      )) {
        const parkHeading = getStandParkingHeading(fromNode.id, fromNode); // 265°
        let targetHeading = 0; // Hướng trục chính Line 12
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
