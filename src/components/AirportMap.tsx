// SVG airport map — aeronautical chart style matching TSN reference.
// Completely decoupled renderers:
//   1. Scenario Mode (ScenarioGuidanceRenderer):
//      - Full route is hidden.
//      - Follow-the-Green sliding window (80–120px) ahead of nose only with Neon Green drop-shadow (#00ff66, #39ff88).
//      - Behind the aircraft is completely unlit.
//   2. Manual Mode (ManualRouteRenderer):
//      - Full route from start to destination is rendered clearly in Cyan (#00e5ff, #0284c7).
//      - Independent aircraft movement and markers for all fleet instances.

import { useEffect, useRef, useState } from 'react';
import { airportGraph, SVG_WIDTH, SVG_HEIGHT } from '../data/airportGraph';
import AirportLighting from './AirportLighting';
import { getAirlineDef } from '../data/airlineTypes';
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
const GUIDANCE_WINDOW_PX = 100;
const GUIDANCE_MAX_NODES = 4;

export default function AirportMap({
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

  // ── Pan / zoom (viewBox-based) ────────────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const ASPECT = SVG_HEIGHT / SVG_WIDTH;
  const MIN_W = SVG_WIDTH * 0.12;
  const MAX_W = SVG_WIDTH;

  const clampView = (v: { x: number; y: number; w: number; h: number }) => {
    const w = Math.min(MAX_W, Math.max(MIN_W, v.w));
    const h = w * ASPECT;
    const x = Math.min(SVG_WIDTH - w, Math.max(0, v.x));
    const y = Math.min(SVG_HEIGHT - h, Math.max(0, v.y));
    return { x, y, w, h };
  };

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setView(v => {
      const w = Math.min(MAX_W, Math.max(MIN_W, v.w * factor));
      const h = w * ASPECT;
      const fx = (clientX - rect.left) / rect.width;
      const fy = (clientY - rect.top) / rect.height;
      const sx = v.x + fx * v.w;
      const sy = v.y + fy * v.h;
      return clampView({ x: sx - fx * w, y: sy - fy * h, w, h });
    });
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1 / 1.15 : 1.15);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
    setDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    const svg = svgRef.current;
    if (!d || !svg) return;
    const rect = svg.getBoundingClientRect();
    setView(v => clampView({
      ...v,
      x: d.vx - (e.clientX - d.px) / rect.width * v.w,
      y: d.vy - (e.clientY - d.py) / rect.height * v.h,
    }));
  };
  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = null;
    setDragging(false);
    try { svgRef.current?.releasePointerCapture(e.pointerId); } catch { /* noop */ }
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
      className="relative w-full h-full rounded-xl overflow-hidden border border-[#223044]"
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

      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        shapeRendering="geometricPrecision"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          cursor: dragging ? 'grabbing' : zoomed ? 'grab' : 'default',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
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

        {/* ── Layer 3: RENDERER 1 - SCENARIO MODE (Sliding Neon Green FTG Only) ── */}
        {isScenario && (
          <g className="scenario-guidance-layer">
            {allActiveAircraft.map(ac => (
              <ScenarioGuidanceRenderer
                key={`sc-guidance-${ac.id}`}
                aircraft={ac}
                graph={activeGraph}
                animPhase={animPhase}
              />
            ))}
          </g>
        )}

        {/* ── Layer 4: RENDERER 2 - MANUAL MODE (Full Route from Start to Dest in Cyan) ── */}
        {!isScenario && (
          <g className="manual-full-route-layer">
            {allActiveAircraft.map(ac => (
              <ManualRouteRenderer
                key={`manual-route-${ac.id}`}
                aircraft={ac}
                graph={activeGraph}
                isSelected={ac.id === (state.selectedAircraftId || state.aircraft?.id)}
              />
            ))}
          </g>
        )}

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
          if (ac.status !== 'holding') return null;
          const fromNode = activeGraph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex]);
          const toNode = activeGraph.nodes.find(n => n.id === ac.assignedRoute[ac.routeEdgeIndex + 1]);
          if (!fromNode || !toNode) return null;
          return <StopBar key={`hold-bar-${ac.id}`} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} />;
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

      {/* ── Zoom controls ─────────────────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 select-none">
        <button
          onClick={() => {
            const r = svgRef.current!.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.4);
          }}
          className="w-8 h-8 rounded-md bg-gray-900/80 hover:bg-gray-700 text-white text-lg font-bold leading-none border border-gray-600 shadow"
          title="Phóng to"
        >+</button>
        <button
          onClick={() => {
            const r = svgRef.current!.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.4);
          }}
          className="w-8 h-8 rounded-md bg-gray-900/80 hover:bg-gray-700 text-white text-lg font-bold leading-none border border-gray-600 shadow"
          title="Thu nhỏ"
        >−</button>
        {zoomed && (
          <button
            onClick={() => setView({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT })}
            className="w-8 h-8 rounded-md bg-gray-900/80 hover:bg-gray-700 text-white text-xs font-bold leading-none border border-gray-600 shadow"
            title="Xem toàn bộ"
          >⤢</button>
        )}
      </div>
    </div>
  );
}

// ── RENDERER 1: SCENARIO MODE (Sliding Neon Green Follow-the-Green Window 80-120px)
interface PolylinePoint {
  x: number;
  y: number;
  distFromStart: number;
}

function getForwardRoutePolyline(
  aircraft: Aircraft,
  graph: AirportGraph,
  maxWindowPx = GUIDANCE_WINDOW_PX,
  maxNodes = GUIDANCE_MAX_NODES,
): { points: PolylinePoint[]; totalLen: number } | null {
  if (!aircraft.assignedRoute || aircraft.assignedRoute.length < 2) return null;
  if (aircraft.routeEdgeIndex >= aircraft.assignedRoute.length - 1) return null;

  const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex]);
  const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex + 1]);
  if (!fromNode || !toNode) return null;

  const t = aircraft.progressOnEdge;
  const currX = fromNode.x + (toNode.x - fromNode.x) * t;
  const currY = fromNode.y + (toNode.y - fromNode.y) * t;

  const points: PolylinePoint[] = [{ x: currX, y: currY, distFromStart: 0 }];
  let accumDist = 0;

  // 1. Remaining segment on current edge
  const remDx = toNode.x - currX;
  const remDy = toNode.y - currY;
  const remLen = Math.hypot(remDx, remDy);

  if (remLen > 0.5) {
    if (accumDist + remLen >= maxWindowPx) {
      const frac = (maxWindowPx - accumDist) / remLen;
      points.push({
        x: currX + remDx * frac,
        y: currY + remDy * frac,
        distFromStart: maxWindowPx,
      });
      return { points, totalLen: maxWindowPx };
    }
    accumDist += remLen;
    points.push({ x: toNode.x, y: toNode.y, distFromStart: accumDist });
  }

  // 2. Subsequent edges along the polyline up to maxNodes and maxWindowPx
  let prevNode = toNode;
  let nodesCount = 1;

  for (let i = aircraft.routeEdgeIndex + 1; i < aircraft.assignedRoute.length - 1 && nodesCount < maxNodes; i++) {
    const nextNodeId = aircraft.assignedRoute[i + 1];
    const nextNode = graph.nodes.find(n => n.id === nextNodeId);
    if (!nextNode) break;

    const segDx = nextNode.x - prevNode.x;
    const segDy = nextNode.y - prevNode.y;
    const segLen = Math.hypot(segDx, segDy);
    nodesCount++;

    if (segLen <= 0.5) {
      prevNode = nextNode;
      continue;
    }

    if (accumDist + segLen >= maxWindowPx) {
      const frac = (maxWindowPx - accumDist) / segLen;
      points.push({
        x: prevNode.x + segDx * frac,
        y: prevNode.y + segDy * frac,
        distFromStart: maxWindowPx,
      });
      accumDist = maxWindowPx;
      break;
    }

    accumDist += segLen;
    points.push({ x: nextNode.x, y: nextNode.y, distFromStart: accumDist });
    prevNode = nextNode;
  }

  return { points, totalLen: accumDist };
}

function ScenarioGuidanceRenderer({
  aircraft,
  graph,
  animPhase,
}: {
  aircraft: Aircraft;
  graph: AirportGraph;
  animPhase: number;
}) {
  if (aircraft.status === 'arrived' || aircraft.status === 'departed') return null;
  const poly = getForwardRoutePolyline(aircraft, graph, GUIDANCE_WINDOW_PX, GUIDANCE_MAX_NODES);
  if (!poly || poly.points.length < 2 || poly.totalLen < 2) return null;

  // Compute discrete glowing circular dots along forward guidance polyline (Nét đứt hình tròn)
  const dots: { x: number; y: number; dist: number; phase: number }[] = [];
  const dotSpacing = 11;
  const numDots = Math.floor(poly.totalLen / dotSpacing);

  for (let i = 1; i <= numDots; i++) {
    const targetDist = i * dotSpacing;
    let pt: { x: number; y: number } | null = null;
    for (let j = 0; j < poly.points.length - 1; j++) {
      const p1 = poly.points[j];
      const p2 = poly.points[j + 1];
      if (targetDist >= p1.distFromStart && targetDist <= p2.distFromStart) {
        const segLen = p2.distFromStart - p1.distFromStart;
        const t = segLen > 0 ? (targetDist - p1.distFromStart) / segLen : 0;
        pt = {
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        };
        break;
      }
    }
    if (pt) {
      const p = (targetDist / 15 - animPhase) % (Math.PI * 2);
      dots.push({ x: pt.x, y: pt.y, dist: targetDist, phase: p });
    }
  }

  return (
    <g
      className="scenario-ftg-neon-dots"
      style={{
        filter: 'drop-shadow(0 0 6px #00ff66) drop-shadow(0 0 14px #00ff66)',
      }}
    >
      {/* Chuỗi chấm tròn sáng màu xanh lá neon chạy tuần tự (Nét đứt hình tròn ● ● ●) */}
      {dots.map((dot, idx) => {
        const pulse = 0.8 + 0.3 * Math.sin(dot.phase);
        const fade = Math.max(0.3, 1 - dot.dist / (GUIDANCE_WINDOW_PX * 1.15));
        return (
          <g key={`sc-dot-${idx}`} opacity={fade}>
            <circle cx={dot.x} cy={dot.y} r={7.0 * pulse} fill="url(#neon-lead-green)" />
            <circle cx={dot.x} cy={dot.y} r={3.4 * pulse} fill="#00ff66" />
            <circle cx={dot.x} cy={dot.y} r={1.4} fill="#ffffff" />
          </g>
        );
      })}
    </g>
  );
}

// ── RENDERER 2: MANUAL MODE (Full Route in Cyan Minus Dashes - - - -) ─────────
function ManualRouteRenderer({
  aircraft,
  graph,
  isSelected = false,
}: {
  aircraft: Aircraft;
  graph: AirportGraph;
  isSelected?: boolean;
}) {
  // STRICT RULE: Hide route when parked / before Start is clicked
  if (!aircraft.routeVisible && aircraft.status !== 'taxiing' && aircraft.status !== 'holding') {
    return null;
  }
  if (aircraft.status === 'parked' || aircraft.status === 'arrived' || aircraft.status === 'departed') return null;
  if (!aircraft.assignedRoute || aircraft.assignedRoute.length < 2) return null;

  const nodeObjs = aircraft.assignedRoute
    .map(id => graph.nodes.find(n => n.id === id))
    .filter((n): n is typeof graph.nodes[0] => n !== undefined);

  if (nodeObjs.length < 2) return null;

  const pathD = nodeObjs.map((n, i) => `${i === 0 ? 'M' : 'L'}${n.x},${n.y}`).join(' ');
  const opacity = isSelected ? 1.0 : 0.55;
  const startNode = nodeObjs[0];
  const destNode = nodeObjs[nodeObjs.length - 1];

  return (
    <g
      className="manual-full-route-group"
      opacity={opacity}
      style={{
        filter: isSelected
          ? 'drop-shadow(0 0 5px #00e5ff) drop-shadow(0 0 12px #0284c7)'
          : undefined,
      }}
    >
      {/* Outer Cyan Dash Glow (- - - -) */}
      <path
        d={pathD}
        stroke="#0284c7"
        strokeWidth={isSelected ? 6.5 : 4.5}
        strokeDasharray="9,6"
        strokeLinecap="butt"
        fill="none"
        opacity={0.5}
        strokeLinejoin="round"
      />
      {/* Solid Cyan Dash Line (- - - -) */}
      <path
        d={pathD}
        stroke="#00e5ff"
        strokeWidth={isSelected ? 3.2 : 2.2}
        strokeDasharray="9,6"
        strokeLinecap="butt"
        fill="none"
        opacity={0.95}
        strokeLinejoin="round"
      />
      {/* Bright Core White/Sky Dash Line */}
      <path
        d={pathD}
        stroke="#e0f2fe"
        strokeWidth={isSelected ? 1.4 : 1.0}
        strokeDasharray="9,6"
        strokeLinecap="butt"
        fill="none"
        opacity={0.9}
        strokeLinejoin="round"
      />

      {/* Start Node Marker (Green) */}
      <circle cx={startNode.x} cy={startNode.y} r={4.5} fill="#22c55e" stroke="#ffffff" strokeWidth={1.2} />
      {/* Destination Node Marker (Red) */}
      <circle cx={destNode.x} cy={destNode.y} r={4.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.2} />

      {/* Intermediate Route Node Waypoints (when selected) */}
      {isSelected &&
        nodeObjs.slice(1, -1).map((n, i) => (
          <circle
            key={`wp-${i}`}
            cx={n.x}
            cy={n.y}
            r={2.2}
            fill="#38bdf8"
            stroke="#0f172a"
            strokeWidth={0.8}
          />
        ))}
    </g>
  );
}

function StopBar({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = (-dy / len) * 12, py = (dx / len) * 12;
  return (
    <line x1={mx - px} y1={my - py} x2={mx + px} y2={my + py} stroke="#ef4444" strokeWidth={4.5} strokeLinecap="round" />
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
      {isSelected && (
        <g>
          <circle cx={0} cy={0} r={28 * scale} fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="5,3" opacity={0.95} />
          <circle cx={0} cy={0} r={33 * scale} fill="none" stroke="#00e5ff" strokeWidth={1} opacity={0.6} />
        </g>
      )}
      {isEmergency && (
        <circle cx={0} cy={0} r={26 * scale} fill="none" stroke="#ef4444" strokeWidth={2.5} opacity={0.85} className="animate-ping" />
      )}
      {isDeviated && (
        <circle cx={0} cy={0} r={26 * scale} fill="none" stroke="#f97316" strokeWidth={2.5} opacity={0.85} className="animate-ping" />
      )}
      {isRadioFailure && (
        <circle cx={0} cy={0} r={26 * scale} fill="none" stroke="#c084fc" strokeWidth={2.5} opacity={0.85} className="animate-ping" />
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
  T49: 90,  // Stand 7: quay sang phải theo làn đỗ (East 90°)
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
