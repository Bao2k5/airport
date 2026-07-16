// SVG airport map — aeronautical chart style matching TSN reference.

import { type JSX, useEffect, useRef, useState } from 'react';
import { airportGraph, SVG_WIDTH, SVG_HEIGHT } from '../data/airportGraph';
import { getAircraftSpec } from '../data/aircraftTypes';
import AirportLighting from './AirportLighting';
import { routeToEdges } from '../simulation/pathfinding';
import type { Aircraft, SimulationState } from '../types';

// Reference image calibration: ref(0,0)→SVG(-192,-665), ref(2048,1430)→SVG(1308,1417)
const PINK_X = -192, PINK_Y = -665, PINK_W = 1500, PINK_H = 2082;

interface Props {
  state: SimulationState;
  onNodeClick?: (nodeId: string) => void;
  showPinkOverlay?: boolean;
  pinkOpacity?: number;
  showPaths?: boolean;
  showGrid?: boolean;
}

const STAND_HEADINGS: Record<string, number> = {
  DOM_S1: 90, DOM_S2: 90, DOM_S3: 90, DOM_S4: 90, DOM_S5: 90,
  INTL_S1: 90, INTL_S2: 90, INTL_S3: 90, INTL_S4: 90,
};

// ── Palette ───────────────────────────────────────────────────────────────────
const ASPHALT  = '#444444';
const BG_OUTER = '#ebebeb';

const EDGE_STYLES: Record<string, { stroke: string; width: number }> = {
  runway:  { stroke: ASPHALT, width: 26 },
  taxiway: { stroke: ASPHALT, width: 0  },
  apron:   { stroke: ASPHALT, width: 0  },
  holding: { stroke: ASPHALT, width: 0  },
};

export default function AirportMap({ state, onNodeClick, showPinkOverlay, pinkOpacity = 0.45, showPaths, showGrid }: Props) {
  const { aircraft, lightStates } = state;

  const aircraftPos = getAircraftPosition(state);

  const occupiedStands = new Set([
    state.config.startNodeId,
    state.config.destinationNodeId,
  ]);

  const isNight     = state.config.timeOfDay === 'night';
  const isAfternoon = state.config.timeOfDay === 'afternoon';
  const isFog = state.config.weather === 'fog';
  const isRain = state.config.weather === 'rain';
  const isThunderstorm = state.config.weather === 'thunderstorm';

  // ── Pan / zoom (viewBox-based) ────────────────────────────────────────────────
  // A stateful viewBox lets the user cuộn để phóng to vào khu vực sân đỗ (apron)
  // and kéo để di chuyển. Full view = {0,0,SVG_WIDTH,SVG_HEIGHT}.
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const ASPECT = SVG_HEIGHT / SVG_WIDTH;
  const MIN_W = SVG_WIDTH * 0.12;   // phóng to tối đa ~8×
  const MAX_W = SVG_WIDTH;          // không thu nhỏ quá khung đầy đủ

  // Kẹp viewBox nằm trong ranh giới chart để không lộ vùng trống.
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
      // Giữ điểm dưới con trỏ đứng yên khi phóng to/thu nhỏ.
      const fx = (clientX - rect.left) / rect.width;
      const fy = (clientY - rect.top) / rect.height;
      const sx = v.x + fx * v.w;
      const sy = v.y + fy * v.h;
      return clampView({ x: sx - fx * w, y: sy - fy * h, w, h });
    });
  };

  // Wheel listener gắn thủ công để preventDefault (React onWheel là passive).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1 / 1.15 : 1.15);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#bbb]"
      style={{ background: isNight ? '#0a0e18' : isAfternoon ? '#dfc98a' : BG_OUTER }}>
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
        shapeRendering="crispEdges"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif', cursor: dragging ? 'grabbing' : zoomed ? 'grab' : 'default', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <defs>
          <filter id="glow-green" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Soft green bead for the discrete guidance (lead-on) lights: bright centre
              fading out to a transparent halo — reads as a glowing lamp, not a band. */}
          <radialGradient id="lead-green">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
            <stop offset="28%"  stopColor="#86efac" stopOpacity="1" />
            <stop offset="60%"  stopColor="#22c55e" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#15a34a" stopOpacity="0" />
          </radialGradient>
          <filter id="glow-aircraft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <style>{`
          @keyframes guidance-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.78; }
          }
          .guidance-dot { animation: guidance-pulse 1.8s ease-in-out infinite; }
          @keyframes storm-flash {
            0%, 92%, 100% { opacity: 0; }
            94%           { opacity: 0.35; }
            96%           { opacity: 0.05; }
            98%           { opacity: 0.30; }
          }
          .storm-flash { animation: storm-flash 6s ease-out infinite; }

          .rain-fall {
            background-image:
              repeating-linear-gradient(105deg,
                rgba(255,255,255,0) 0px,
                rgba(255,255,255,0) 8px,
                rgba(190,205,225,0.28) 9px,
                rgba(190,205,225,0.28) 10px);
            background-size: 100px 100px;
            animation: rain-fall 0.55s linear infinite;
          }
          .rain-fall.rain-heavy {
            background-image:
              repeating-linear-gradient(102deg,
                rgba(255,255,255,0) 0px,
                rgba(255,255,255,0) 5px,
                rgba(200,212,230,0.38) 6px,
                rgba(200,212,230,0.38) 7px);
            background-size: 70px 70px;
            animation-duration: 0.4s;
          }
          @keyframes rain-fall {
            0%   { background-position: 0 0; }
            100% { background-position: -26px 100px; }
          }

          .fog-drift {
            background-image:
              radial-gradient(ellipse 50% 60% at 20% 40%, rgba(225,227,232,0.30), rgba(225,227,232,0) 70%),
              radial-gradient(ellipse 60% 50% at 80% 60%, rgba(225,227,232,0.25), rgba(225,227,232,0) 70%);
            background-size: 200% 200%;
            animation: fog-drift 22s ease-in-out infinite alternate;
          }
          @keyframes fog-drift {
            0%   { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}</style>

        {/* ── Layer 1: reference image base — 1309×875 at SVG 1200×860 = perfect 1:1 CMP mapping */}
        <image href="/ref_full.png" x={0} y={0} width={1200} height={860} preserveAspectRatio="none" />

        {/* Đêm: phủ navy rất tối lên chart để làm mờ pavement — đèn vẽ TRÊN lớp này */}
        {isNight && (
          <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#0a0e18" fillOpacity={0.92} />
        )}

        {/* ── Pink path overlay (allowed_paths.jpg, toggled via showPinkOverlay prop) ── */}
        {showPinkOverlay && (
          <image
            href="/allowed_paths.jpg"
            x={PINK_X} y={PINK_Y} width={PINK_W} height={PINK_H}
            preserveAspectRatio="none"
            opacity={pinkOpacity}
          />
        )}

        {/* ── Lớp đèn sân bay ban đêm (tĩnh, có glow) ────────────────────── */}
        {isNight && <AirportLighting />}

        {/* ── Layer 2: planned route preview (remaining path, dashed blue) ── */}
        {aircraft && aircraft.status !== 'arrived' && aircraft.assignedRoute.length > 1 && (
          <RoutePlanLine route={aircraft.assignedRoute.slice(aircraft.routeEdgeIndex)} />
        )}

        {/* ── Layer 4: parked aircraft at stands ────────────────────────── */}
        {Object.entries(STAND_HEADINGS).map(([id, heading]) => {
          if (occupiedStands.has(id)) return null;
          const node = airportGraph.nodes.find(n => n.id === id);
          if (!node) return null;
          // INTL stands in the infield (y<265) create wrong-color pixels — skip parked aircraft there
          if (node.y < 265) return null;
          return <ParkedAircraft key={id} x={node.x} y={node.y} heading={heading} />;
        })}

        {/* ── Layer 5: taxiway / apron edges ────────────────────────────── */}
        {airportGraph.edges.map(edge => {
          if (edge.type === 'runway') return null;
          // Stand / parking edges: hide when not lit (no dark marking in chart)
          const isStandEdge = edge.fromNodeId.startsWith('DOM_S') || edge.toNodeId.startsWith('DOM_S')
            || edge.fromNodeId.startsWith('INTL_S') || edge.toNodeId.startsWith('INTL_S')
            || edge.fromNodeId.startsWith('P') || edge.toNodeId.startsWith('P');
          if (isStandEdge && (lightStates[edge.id] ?? 'off') === 'off') return null;
          const fromNode = airportGraph.nodes.find(n => n.id === edge.fromNodeId);
          const toNode   = airportGraph.nodes.find(n => n.id === edge.toNodeId);
          if (!fromNode || !toNode) return null;

          const lightState = lightStates[edge.id] ?? 'off';
          const style      = EDGE_STYLES[edge.type] ?? EDGE_STYLES.taxiway;

          let stroke = style.stroke;
          let strokeWidth = style.width;
          // Green route is drawn as individual centreline lights (GuidanceLights below),
          // NOT a solid green band — so keep the base pavement stroke. Only red (stop)
          // paints the edge line itself.
          if (lightState === 'red') { stroke = '#ef4444'; strokeWidth = Math.max(strokeWidth, 3); }

          // On the edge the aircraft is currently traversing, the portion it has
          // ALREADY PASSED must go dark immediately (rather than staying green until
          // the whole edge falls behind) — so split the highlight at the aircraft's
          // position. This is direction-aware: the route may traverse an edge either
          // fromNode→toNode or toNode→fromNode, and the "passed" side is whichever end
          // the aircraft came from. `aircraftT` is measured from fromNode (0=fromNode,
          // 1=toNode) regardless of travel direction.
          const onThisEdge = lightState === 'green' && aircraft && aircraft.currentEdgeId === edge.id;
          const isForward = !!onThisEdge && aircraft!.assignedRoute[aircraft!.routeEdgeIndex] === edge.fromNodeId;
          const aircraftT = onThisEdge
            ? (isForward ? aircraft!.progressOnEdge : 1 - aircraft!.progressOnEdge)
            : undefined;
          const splitX = aircraftT !== undefined ? fromNode.x + (toNode.x - fromNode.x) * aircraftT : null;
          const splitY = aircraftT !== undefined ? fromNode.y + (toNode.y - fromNode.y) * aircraftT : null;
          // Entry node = where the aircraft came from (its side is the dark, passed
          // segment); exit node = where it's heading (its side stays green).
          const entryNode = isForward ? fromNode : toNode;
          const exitNode  = isForward ? toNode : fromNode;

          return (
            <g key={edge.id}>
              {splitX !== null && splitY !== null && (
                <line
                  x1={entryNode.x} y1={entryNode.y}
                  x2={splitX}      y2={splitY}
                  stroke={style.stroke}
                  strokeWidth={style.width}
                  strokeLinecap="round"
                  opacity={edge.status === 'closed' ? 0.3 : 1}
                />
              )}
              <line
                x1={splitX ?? fromNode.x} y1={splitY ?? fromNode.y}
                x2={splitX !== null ? exitNode.x : toNode.x}
                y2={splitY !== null ? exitNode.y : toNode.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={edge.status === 'closed' ? 0.3 : 1}
              />
              {lightState === 'green' && (
                <GuidanceLights
                  x1={fromNode.x} y1={fromNode.y}
                  x2={toNode.x}   y2={toNode.y}
                  aircraftT={aircraftT}
                  aircraftForward={isForward}
                />
              )}
              {lightState === 'red' && (
                <StopBar
                  x1={fromNode.x} y1={fromNode.y}
                  x2={toNode.x}   y2={toNode.y}
                />
              )}
              {edge.status === 'closed' && (
                <ClosedMarker
                  x1={fromNode.x} y1={fromNode.y}
                  x2={toNode.x}   y2={toNode.y}
                />
              )}
            </g>
          );
        })}

        {/* ── Debug: glow every taxi/apron/holding edge + its id, to vet the network ── */}
        {showPaths && <AllowedPathsOverlay />}

        {/* ── Debug: coordinate grid (read x,y to guide edits) ── */}
        {showGrid && <CoordinateGrid />}

        {/* ── Layer 6: visual-only E-series / NS-series taxiway lines ──── */}
        <ExtraTaxiwayLines />

        {/* ── Layer 7: taxiway name labels + all map annotations ────────── */}
        <TaxiwayLabels />
        <AreaLabels />
        {/* ClosedTaxiwayMarkers removed — reference shows clean white infield */}
        <HoldingSpotMarkers />
        <ParkingPositionMarkers />

        {/* ── Layer 8: nodes ────────────────────────────────────────────── */}
        {airportGraph.nodes.map(node => {
          const isStart = state.config.startNodeId === node.id;
          const isDest  = state.config.destinationNodeId === node.id;

          if (node.type === 'intersection' && !isStart && !isDest) return null;
          // H25L holding point is mispositioned in the white infield — suppress visual unless active
          if (node.id === 'H25L' && !isStart && !isDest) return null;
          // INTL stands are in the infield zone (y<265) — suppress circles to avoid wrong color pixels
          if (node.type === 'stand' && node.y < 265 && !isStart && !isDest) return null;

          // Hot-spots: the only travel-to/from points — draw them as labelled markers.
          if (node.type === 'hotspot') {
            const active = isStart || isDest;
            return (
              <g
                key={node.id}
                onClick={() => onNodeClick?.(node.id)}
                style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
              >
                <circle
                  cx={node.x} cy={node.y} r={5}
                  fill={active ? '#f59e0b' : '#9ca3af'}
                  stroke="#1f2937" strokeWidth={1} opacity={0.95}
                />
                <text
                  x={node.x} y={node.y - 7}
                  textAnchor="middle" fontSize={7} fontWeight={700}
                  fill="#111827" stroke="#ffffff" strokeWidth={0.4}
                  paintOrder="stroke"
                >
                  {node.label}
                </text>
              </g>
            );
          }

          return (
            <g
              key={node.id}
              onClick={() => onNodeClick?.(node.id)}
              style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
            >
              {node.type !== 'runway_entry' && (
                <circle
                  cx={node.x} cy={node.y}
                  r={node.type === 'stand' ? 3.5 : 3}
                  fill="#ebebeb"
                  stroke="none"
                  strokeWidth={0}
                  opacity={0.75}
                />
              )}
            </g>
          );
        })}

        {/* ── Layer 8.5: background traffic (visual-only, grey) ──────────── */}
        {state.trafficAircraft.map(ac => {
          const pos = getPositionForAircraft(ac);
          if (!pos) return null;
          return <BackgroundAircraftIcon key={ac.id} x={pos.x} y={pos.y} heading={pos.heading} />;
        })}

        {/* ── Layer 9: active aircraft ───────────────────────────────────── */}
        {aircraft && aircraftPos && (
          <AircraftIcon
            x={aircraftPos.x}
            y={aircraftPos.y}
            heading={aircraftPos.heading}
            scale={getAircraftSpec(state.config.aircraftType).sizeScale}
          />
        )}

        {/* ── Layer 10: compass rose + chart border ─────────────────────── */}
        <CompassRose x={1148} y={28} />

        {/* ── Layer 11: legend ──────────────────────────────────────────── */}
        <MapLegend />
      </svg>

      {/* ── Zoom controls ─────────────────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 select-none">
        <button
          onClick={() => { const r = svgRef.current!.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.4); }}
          className="w-8 h-8 rounded-md bg-gray-900/80 hover:bg-gray-700 text-white text-lg font-bold leading-none border border-gray-600 shadow"
          title="Phóng to"
        >+</button>
        <button
          onClick={() => { const r = svgRef.current!.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.4); }}
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



// ── Route plan preview ────────────────────────────────────────────────────────

function RoutePlanLine({ route }: { route: string[] }) {
  const nodes = route.map(id => airportGraph.nodes.find(n => n.id === id));
  if (nodes.some(n => !n)) return null;
  const d = nodes.map((n, i) => `${i === 0 ? 'M' : 'L'}${n!.x},${n!.y}`).join(' ');
  return (
    <>
      {/* dark halo for contrast on any background */}
      <path d={d} stroke="#0f172a" strokeWidth={5} fill="none" opacity={0.4}
        strokeLinecap="round" strokeLinejoin="round" />
      {/* mảnh & dịu hơn đèn để không át bản đồ */}
      <path d={d} stroke="#38bdf8" strokeWidth={2.2} fill="none" opacity={0.6}
        strokeDasharray="10,7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

// ── Taxiway marking components ────────────────────────────────────────────────

function GuidanceLights({
  x1, y1, x2, y2, aircraftT, aircraftForward,
}: {
  x1: number; y1: number; x2: number; y2: number;
  // Aircraft's position along this edge, 0 (=x1,y1) to 1 (=x2,y2). When set, this is
  // the edge the aircraft is currently on — dots behind it (already passed) go dark
  // immediately instead of staying lit until the whole edge falls behind.
  aircraftT?: number;
  // Travel direction along this edge: true = fromNode→toNode (forward), false =
  // toNode→fromNode (reverse). Determines which side of `aircraftT` is "passed".
  aircraftForward?: boolean;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const spacing = 16;                              // gap between lights (px)
  const count   = Math.max(1, Math.round(len / spacing));
  const dots: JSX.Element[] = [];
  for (let i = 1; i < count; i++) {
    const t = i / count;
    // Skip lights the aircraft has already passed (direction-aware): forward → lights
    // before it (t < aircraftT); reverse → lights after it (t > aircraftT).
    if (aircraftT !== undefined && (aircraftForward ? t < aircraftT : t > aircraftT)) continue;
    const cx = x1 + dx * t, cy = y1 + dy * t;
    // Each light = bright glowing halo (gradient) + a solid vivid-green core → a big,
    // punchy discrete lamp rather than a continuous stripe.
    dots.push(
      <g key={i} className="guidance-dot" filter="url(#glow-green)">
        <circle cx={cx} cy={cy} r={6.5} fill="url(#lead-green)" />
        <circle cx={cx} cy={cy} r={3}   fill="#22c55e" />
        <circle cx={cx} cy={cy} r={1.3} fill="#f0fff6" />
      </g>,
    );
  }
  return <g>{dots}</g>;
}

function StopBar({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = (-dy / len) * 12, py = (dx / len) * 12;
  return (
    <line x1={mx - px} y1={my - py} x2={mx + px} y2={my + py}
      stroke="#ef4444" strokeWidth={4.5} strokeLinecap="round" />
  );
}

function ClosedMarker({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = (-dy / len) * 10, py = (dx / len) * 10;
  return (
    <g opacity={0.85}>
      <line x1={mx - px - (dx / len) * 8} y1={my - py - (dy / len) * 8}
            x2={mx + px + (dx / len) * 8} y2={my + py + (dy / len) * 8}
            stroke="#ff8c00" strokeWidth={2.5} />
      <line x1={mx + px - (dx / len) * 8} y1={my - py + (dy / len) * 8}
            x2={mx - px + (dx / len) * 8} y2={my + py - (dy / len) * 8}
            stroke="#ff8c00" strokeWidth={2.5} />
    </g>
  );
}

// ── Aircraft ──────────────────────────────────────────────────────────────────

function ParkedAircraft(_props: { x: number; y: number; heading: number }) {
  return null;
}

function AircraftIcon({ x, y, heading, scale = 1 }: { x: number; y: number; heading: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${heading}) scale(${scale})`} filter="url(#glow-aircraft)">
      <ellipse cx={0} cy={0} rx={3} ry={12} fill="#f59e0b" stroke="#1e293b" strokeWidth={1.2} />
      <polygon points="0,-1 13,6 7,8 0,5 -7,8 -13,6" fill="#fbbf24" stroke="#1e293b" strokeWidth={1.2} />
      <polygon points="0,9 4,12 0,11 -4,12" fill="#f59e0b" stroke="#1e293b" strokeWidth={1.2} />
    </g>
  );
}

// Background traffic: blue with a dark outline — visible on the light chart yet
// clearly distinct from the amber active aircraft.
function BackgroundAircraftIcon({ x, y, heading }: { x: number; y: number; heading: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${heading}) scale(0.9)`} opacity={0.95}>
      <ellipse cx={0} cy={0} rx={3} ry={12} fill="#2563eb" stroke="#0b1220" strokeWidth={1.3} />
      <polygon points="0,-1 13,6 7,8 0,5 -7,8 -13,6" fill="#60a5fa" stroke="#0b1220" strokeWidth={1.3} />
      <polygon points="0,9 4,12 0,11 -4,12" fill="#2563eb" stroke="#0b1220" strokeWidth={1.3} />
    </g>
  );
}

// ── Labels ────────────────────────────────────────────────────────────────────

function TaxiwayLabels() {
  return null;
}

function AreaLabels() {
  return null;
}


// ── Holding spot markers ─────────────────────────────────────────────────────
function HoldingSpotMarkers() {
  return null;
}

// ── Parking position markers ─────────────────────────────────────────────────
function ParkingPositionMarkers() {
  return null;
}

// ── Visual-only extra taxiway lines ──────────────────────────────────────────
function ExtraTaxiwayLines() {
  return null;
}

// ── Debug: coordinate grid so paths can be specified by (x,y) ─────────────────
function CoordinateGrid() {
  const lines = [];
  for (let x = 0; x <= SVG_WIDTH; x += 50) {
    const bold = x % 100 === 0;
    lines.push(<line key={`gx${x}`} x1={x} y1={0} x2={x} y2={SVG_HEIGHT}
      stroke={bold ? '#dc2626' : '#f8a8a8'} strokeWidth={bold ? 0.5 : 0.25} opacity={0.55} />);
  }
  for (let y = 0; y <= SVG_HEIGHT; y += 50) {
    const bold = y % 100 === 0;
    lines.push(<line key={`gy${y}`} x1={0} y1={y} x2={SVG_WIDTH} y2={y}
      stroke={bold ? '#dc2626' : '#f8a8a8'} strokeWidth={bold ? 0.5 : 0.25} opacity={0.55} />);
  }
  const labels = [];
  for (let x = 0; x <= SVG_WIDTH; x += 100) {
    for (let y = 100; y <= SVG_HEIGHT; y += 100) {
      labels.push(
        <text key={`gl${x}-${y}`} x={x + 1} y={y - 1} fontSize={5} fontWeight={800}
          fill="#b91c1c" opacity={0.9}>{x},{y}</text>,
      );
    }
  }
  return <g>{lines}{labels}</g>;
}

// ── Debug overlay: glow every routable (non-runway) edge + label its id ───────
// Use this to vet the graph and decide which edges to delete.
function AllowedPathsOverlay() {
  return (
    <g>
      {airportGraph.edges.map(edge => {
        if (edge.type === 'runway') return null;
        const f = airportGraph.nodes.find(n => n.id === edge.fromNodeId);
        const t = airportGraph.nodes.find(n => n.id === edge.toNodeId);
        if (!f || !t) return null;
        const mx = (f.x + t.x) / 2, my = (f.y + t.y) / 2;
        return (
          <g key={`path-${edge.id}`}>
            <line
              x1={f.x} y1={f.y} x2={t.x} y2={t.y}
              stroke="#00e5ff" strokeWidth={2.5} opacity={0.9}
              strokeLinecap="round" filter="url(#glow-green)"
            />
            <text
              x={mx} y={my - 1} textAnchor="middle" fontSize={4.2} fontWeight={700}
              fill="#0b3d4d" stroke="#e0ffff" strokeWidth={0.5} paintOrder="stroke"
            >
              {edge.id}
            </text>
          </g>
        );
      })}
      {airportGraph.nodes.map(n => (
        <circle key={`pn-${n.id}`} cx={n.x} cy={n.y} r={1.6} fill="#ff1493" stroke="#fff" strokeWidth={0.4} />
      ))}
    </g>
  );
}

function CompassRose(_props: { x: number; y: number }) {
  return null;
}

function MapLegend() {
  return null;
}

// ── Helper: interpolate aircraft position along its route ─────────────────────
function getAircraftPosition(state: SimulationState) {
  return getPositionForAircraft(state.aircraft);
}

function getPositionForAircraft(aircraft: Aircraft | null) {
  if (!aircraft) return null;

  const routeEdgeIds = routeToEdges(aircraft.assignedRoute, airportGraph.edges);
  if (!routeEdgeIds) return null;
  const edgeId = routeEdgeIds[aircraft.routeEdgeIndex];
  if (!edgeId) return null;

  if (!airportGraph.edges.find(e => e.id === edgeId)) return null;

  // Use route node order (not stored edge direction) so bidirectional edges interpolate correctly
  const fromNode = airportGraph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex]);
  const toNode   = airportGraph.nodes.find(n => n.id === aircraft.assignedRoute[aircraft.routeEdgeIndex + 1]);
  if (!fromNode || !toNode) return null;

  const t = aircraft.progressOnEdge;
  const x = fromNode.x + (toNode.x - fromNode.x) * t;
  const y = fromNode.y + (toNode.y - fromNode.y) * t;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const heading = (Math.atan2(dx, -dy) * 180) / Math.PI;

  return { x, y, heading };
}
