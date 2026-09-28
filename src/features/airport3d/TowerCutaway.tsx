import { useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, DoubleSide, SRGBColorSpace } from 'three';
import type { Aircraft, AirportGraph, SimulationState } from '../../types';
import TowerOperator from './components/TowerOperator';
import { useSafeDispose } from './hooks/useSafeDispose';
import { getPositionForAircraft } from '../../presentation/aircraftPose';
import { computeSegmentedGuidanceDots } from '../../presentation/ftgGuidance';
import { AIRPORT_VISUAL } from './visualTokens';

/**
 * Procedural control tower for the airport diorama. The base sits at y=0;
 * its footprint is about 6 world units wide and the antenna reaches y=11.8.
 * The open side faces local +Z, so the furnished cab can be seen from the
 * default airport camera without a separate interior scene.
 */
export interface TowerCutawayProps {
  state: SimulationState;
  graph?: AirportGraph;
  onWorkstation?: (role: 'gnd' | 'twr') => void;
  interior?: boolean;
  showPeople?: boolean;
}

const TAU = Math.PI * 2;
const FLOOR_Y = 8.12;
const WINDOW_BOTTOM = 8.34;
const WINDOW_HEIGHT = 2.16;
const CAB_RADIUS = 2.76;
const OPEN_HALF_ANGLE = 1.05;
const GLAZED_START = OPEN_HALF_ANGLE;
const GLAZED_LENGTH = TAU - OPEN_HALF_ANGLE * 2;
const WINDOW_COUNT = 11;

// The monitor uses the same green/red/off states stored by the 2D simulator.
const DISPLAY = {
  background: '#07131e',
  grid: '#193343',
  runway: '#8b9cab',
  taxiway: '#3e6576',
  green: AIRPORT_VISUAL.ftgCenterline,
  red: AIRPORT_VISUAL.stopBar,
  off: '#516477',
  aircraft: '#facc6b',
  text: '#d7ecf4',
};

function activeFlights(state: SimulationState): Aircraft[] {
  const fleet = state.scenarioAircraft?.length
    ? state.scenarioAircraft as Aircraft[]
    : state.manualFleet?.length
      ? state.manualFleet
      : state.aircraft ? [state.aircraft] : [];
  return fleet.filter(aircraft => aircraft && !aircraft.hidden && aircraft.status !== 'departed');
}

function paintMonitor(canvas: HTMLCanvasElement, state: SimulationState, graph?: AirportGraph) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = DISPLAY.background;
  ctx.fillRect(0, 0, w, h);

  // Subtle radar grid
  ctx.strokeStyle = DISPLAY.grid;
  ctx.lineWidth = 1;
  for (let x = 20; x < w; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, 252); ctx.stroke();
  }
  for (let y = 42; y < 252; y += 32) {
    ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(w - 12, y); ctx.stroke();
  }

  // Header
  const status = state.isPaused ? 'PAUSE' : state.isRunning ? 'LIVE' : 'READY';
  ctx.fillStyle = DISPLAY.text;
  ctx.font = 'bold 12px monospace';
  ctx.fillText('SGN  ·  FOLLOW THE GREEN (FTG)', 14, 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = state.warningMessage ? '#ef4444' : '#22c55e';
  ctx.fillText(status, w - 14, 22);
  ctx.textAlign = 'left';

  const fleet = activeFlights(state);
  const selected = fleet.find(aircraft => aircraft.id === state.selectedAircraftId) ?? fleet[0];

  if (graph?.nodes.length && graph.edges.length) {
    const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
    const minX = Math.min(...graph.nodes.map(node => node.x));
    const maxX = Math.max(...graph.nodes.map(node => node.x));
    const minY = Math.min(...graph.nodes.map(node => node.y));
    const maxY = Math.max(...graph.nodes.map(node => node.y));
    const mapX = (x: number) => 20 + (x - minX) / Math.max(1, maxX - minX) * (w - 40);
    const mapY = (y: number) => 40 + (y - minY) / Math.max(1, maxY - minY) * 198;

    // 1. Base runways and taxiways
    for (const edge of graph.edges) {
      const from = nodeById.get(edge.fromNodeId);
      const to = nodeById.get(edge.toNodeId);
      if (!from || !to) continue;
      const isRunway = edge.type === 'runway';
      ctx.strokeStyle = isRunway ? '#8b9cab' : '#2a4d62';
      ctx.lineWidth = isRunway ? 3.5 : 1.3;
      ctx.beginPath();
      ctx.moveTo(mapX(from.x), mapY(from.y));
      ctx.lineTo(mapX(to.x), mapY(to.y));
      ctx.stroke();
    }

    // 2. Active Stop Bars (red edges and perpendicular hold bars)
    for (const edge of graph.edges) {
      const isBlocked = state.blockedEdgeIds.has(edge.id) || state.lightStates[edge.id] === 'red';
      if (!isBlocked) continue;
      const from = nodeById.get(edge.fromNodeId);
      const to = nodeById.get(edge.toNodeId);
      if (!from || !to) continue;

      const fx = mapX(from.x), fy = mapY(from.y);
      const tx = mapX(to.x), ty = mapY(to.y);

      // Red edge segment
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Perpendicular stop bar at midpoint
      const mx = (fx + tx) / 2;
      const my = (fy + ty) / 2;
      const edx = tx - fx, edy = ty - fy;
      const elen = Math.hypot(edx, edy) || 1;
      const nx = -edy / elen * 4.5;
      const ny = edx / elen * 4.5;

      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(mx - nx, my - ny);
      ctx.lineTo(mx + nx, my + ny);
      ctx.stroke();
    }

    // 3. Tuyến xanh nước trước (Assigned Route Preview - Blue/Cyan dashed line)
    for (const aircraft of fleet) {
      if (!aircraft.assignedRoute || aircraft.assignedRoute.length < 2 || aircraft.status === 'arrived' || aircraft.status === 'departed') continue;

      const curIdx = Math.max(0, Math.min(aircraft.assignedRoute.length - 2, aircraft.routeEdgeIndex ?? 0));
      const curPos = getPositionForAircraft(aircraft, graph);
      const startPt = curPos ? { x: mapX(curPos.x), y: mapY(curPos.y) } : null;

      const points: { x: number; y: number }[] = [];
      if (startPt) points.push(startPt);
      for (let i = curIdx + (startPt ? 1 : 0); i < aircraft.assignedRoute.length; i++) {
        const node = nodeById.get(aircraft.assignedRoute[i]);
        if (node) points.push({ x: mapX(node.x), y: mapY(node.y) });
      }

      if (points.length >= 2) {
        // Soft cyan glow backdrop
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        // Main dashed blue/cyan route line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 4. Đèn FTG xanh lá chạy trước mũi tàu bay (Dynamic Follow-the-Green lights)
    for (const aircraft of fleet) {
      if (aircraft.status === 'arrived' || aircraft.status === 'departed') continue;
      const isAtInitialStand = (aircraft.routeEdgeIndex === 0 || aircraft.routeEdgeIndex === undefined) &&
        (aircraft.role === 'pushback' || aircraft.role === 'departing' || aircraft.status === 'queued' || (aircraft.scenarioLabel && aircraft.scenarioLabel.toUpperCase().includes('STAND')));
      if (isAtInitialStand && aircraft.status === 'holding') continue;

      const guidance = computeSegmentedGuidanceDots(aircraft, graph, state.blockedEdgeIds);
      if (guidance?.activeDots?.length) {
        const isHolding = aircraft.status === 'holding' || aircraft.holdReason === 'stop-bar';
        const haloColor = isHolding ? 'rgba(239, 68, 68, 0.45)' : 'rgba(34, 197, 94, 0.55)';
        const bodyColor = isHolding ? '#ef4444' : '#22c55e';

        // Connect active guidance dots with green glow line
        if (!isHolding && guidance.activeDots.length >= 2) {
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(mapX(guidance.activeDots[0].x), mapY(guidance.activeDots[0].y));
          for (let i = 1; i < guidance.activeDots.length; i++) {
            ctx.lineTo(mapX(guidance.activeDots[i].x), mapY(guidance.activeDots[i].y));
          }
          ctx.stroke();
        }

        // Draw glowing FTG lights ahead of aircraft nose
        for (const dot of guidance.activeDots) {
          const dx = mapX(dot.x);
          const dy = mapY(dot.y);

          // Outer halo
          ctx.beginPath();
          ctx.arc(dx, dy, 3.8, 0, TAU);
          ctx.fillStyle = haloColor;
          ctx.fill();

          // Main body
          ctx.beginPath();
          ctx.arc(dx, dy, 2.1, 0, TAU);
          ctx.fillStyle = bodyColor;
          ctx.fill();

          // Bright white center core
          ctx.beginPath();
          ctx.arc(dx, dy, 0.9, 0, TAU);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
    }

    // 5. Máy bay (Aircraft marker & callsign badge)
    for (const aircraft of fleet) {
      const point = getPositionForAircraft(aircraft, graph);
      if (!point) continue;
      const x = mapX(point.x);
      const y = mapY(point.y);
      const isSel = aircraft.id === selected?.id;

      // Glow ring for selected aircraft
      if (isSel) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, TAU);
        ctx.fillStyle = 'rgba(250, 204, 107, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#facc6b';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Aircraft circle
      ctx.fillStyle = isSel ? '#facc6b' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x, y, isSel ? 3.5 : 2.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Callsign label with background badge
      ctx.font = isSel ? 'bold 9px monospace' : '8px monospace';
      const label = aircraft.callsign;
      const metrics = ctx.measureText(label);
      const lx = x + 5;
      const ly = y - 4;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(lx - 2, ly - 8, metrics.width + 4, 10);
      ctx.strokeStyle = isSel ? '#facc6b' : '#475569';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(lx - 2, ly - 8, metrics.width + 4, 10);

      ctx.fillStyle = isSel ? '#facc6b' : '#d7ecf4';
      ctx.fillText(label, lx, ly);
    }
  } else {
    ctx.font = '14px monospace';
    ctx.fillStyle = DISPLAY.text;
    ctx.fillText('SURFACE CONTROL · SGN', 24, 100);
    ctx.fillText('GRAPH DATA UNAVAILABLE', 24, 120);
  }

  // 6. Bottom Information Panel
  ctx.fillStyle = '#0c1a27';
  ctx.fillRect(0, 252, w, 68);
  ctx.strokeStyle = '#1d3b53';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 252);
  ctx.lineTo(w, 252);
  ctx.stroke();

  ctx.fillStyle = DISPLAY.text;
  ctx.font = 'bold 12px monospace';
  ctx.fillText(selected ? `${selected.callsign} · ${selected.status.toUpperCase()}` : 'NO ACTIVE AIRCRAFT', 14, 274);

  ctx.fillStyle = state.warningMessage ? '#ef4444' : '#22c55e';
  ctx.font = 'bold 10px monospace';
  const routeStatus = selected?.assignedRoute?.length
    ? `ROUTE ${selected.assignedRoute.length} NODES · ${selected.currentNodeId ?? 'STAND'} · FTG ACTIVE`
    : 'FTG STANDBY';
  ctx.fillText((state.warningMessage ?? routeStatus).slice(0, 48), 14, 296);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px monospace';
  ctx.fillText('TWR / GND SIMULATION', w - 14, 274);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  const minutes = Math.floor(state.elapsedSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(state.elapsedSeconds % 60).toString().padStart(2, '0');
  ctx.fillText(`${minutes}:${seconds}`, w - 14, 296);
  ctx.textAlign = 'left';
}

function FTGMonitor({ state, graph, interior }: TowerCutawayProps) {
  const [texture] = useState(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  });

  useEffect(() => {
    paintMonitor(texture.image as HTMLCanvasElement, state, graph);
    texture.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);

  useSafeDispose(texture);
  const elapsed = useMemo(() => ({ value: 0 }), []);
  useFrame((_, delta) => {
    if (!interior) return;
    elapsed.value += delta;
    if (elapsed.value < 0.25) return;
    elapsed.value = 0;
    paintMonitor(texture.image as HTMLCanvasElement, state, graph);
    texture.needsUpdate = true;
  });

  return <group position={[0, 9.33, -0.47]}>
    <mesh castShadow><boxGeometry args={[1.62, 1.12, 0.12]} /><meshStandardMaterial color="#111923" metalness={0.3} roughness={0.38} /></mesh>
    <mesh position={[0, 0, 0.067]}><planeGeometry args={[1.47, 0.92]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
    <mesh position={[0, -0.7, -0.01]} castShadow><cylinderGeometry args={[0.055, 0.08, 0.3, 10]} /><meshStandardMaterial color="#596b77" metalness={0.5} /></mesh>
    <mesh position={[0, -0.84, 0.06]} castShadow><cylinderGeometry args={[0.22, 0.22, 0.04, 16]} /><meshStandardMaterial color="#374650" metalness={0.4} /></mesh>
  </group>;
}

function AnalogClock({ elapsedSeconds }: { elapsedSeconds: number }) {
  const minute = (elapsedSeconds / 60) % 60;
  const hour = (7 + elapsedSeconds / 3600) % 12;
  return <group position={[0, 9.92, -2.39]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.37, 0.37, 0.08, 32]} /><meshStandardMaterial color="#d4d0c5" roughness={0.68} /></mesh>
    <mesh position={[0, 0, 0.052]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.32, 0.32, 0.012, 32]} /><meshBasicMaterial color="#f8f4e8" /></mesh>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(index => {
      const angle = index / 12 * TAU;
      return <mesh key={index} position={[Math.sin(angle) * 0.25, Math.cos(angle) * 0.25, 0.064]}><sphereGeometry args={[0.015, 6, 6]} /><meshBasicMaterial color="#16232d" /></mesh>;
    })}
    <group rotation={[0, 0, -hour / 12 * TAU]} position={[0, 0, 0.08]}>
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.029, 0.2, 0.015]} /><meshBasicMaterial color="#16232d" /></mesh>
    </group>
    <group rotation={[0, 0, -minute / 60 * TAU]} position={[0, 0, 0.09]}>
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.019, 0.28, 0.012]} /><meshBasicMaterial color="#d74c45" /></mesh>
    </group>
    <mesh position={[0, 0, 0.104]}><sphereGeometry args={[0.027, 8, 8]} /><meshBasicMaterial color="#16232d" /></mesh>
  </group>;
}

function OperatorChair({ x, z }: { x: number; z: number }) {
  return <group position={[x, FLOOR_Y + 0.12, z]}>
    <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.38, 0.36, 0.14, 20]} /><meshStandardMaterial color="#26313a" roughness={0.82} /></mesh>
    <mesh position={[0, 0.7, 0.33]} rotation={[0.1, 0, 0]} castShadow>
      <cylinderGeometry args={[0.43, 0.42, 0.64, 20, 1, true, -0.7, 1.4]} />
      <meshStandardMaterial color="#30404b" roughness={0.78} side={DoubleSide} />
    </mesh>
    <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.055, 0.075, 0.4, 10]} /><meshStandardMaterial color="#77838b" metalness={0.62} /></mesh>
    {Array.from({ length: 5 }, (_, index) => {
      const angle = index / 5 * TAU;
      return <group key={index} rotation={[0, angle, 0]}>
        <mesh position={[0, 0.05, 0.26]}><boxGeometry args={[0.07, 0.06, 0.5]} /><meshStandardMaterial color="#38434a" metalness={0.35} /></mesh>
        <mesh position={[0, 0.027, 0.49]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.055, 0.055, 0.09, 8]} /><meshStandardMaterial color="#171d22" /></mesh>
      </group>;
    })}
    {[-0.38, 0.38].map(dx => <mesh key={dx} position={[dx, 0.52, 0.05]}><boxGeometry args={[0.08, 0.07, 0.45]} /><meshStandardMaterial color="#53636c" /></mesh>)}
  </group>;
}

function RadioConsole() {
  return <group position={[1.57, 8.94, 0.54]} rotation={[0, -0.33, -0.17]}>
    <mesh castShadow><boxGeometry args={[0.91, 0.3, 0.47]} /><meshStandardMaterial color="#242c34" metalness={0.42} roughness={0.45} /></mesh>
    <mesh position={[0, 0.16, 0.235]}><planeGeometry args={[0.45, 0.11]} /><meshBasicMaterial color="#67b4bc" /></mesh>
    {[-0.29, -0.08, 0.13, 0.34].map((x, index) => <mesh key={x} position={[x, -0.05, 0.246]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.053, 0.053, 0.028, 12]} /><meshStandardMaterial color={index === 3 ? '#c8a661' : '#778c96'} metalness={0.55} />
    </mesh>)}
    <mesh position={[0.4, 0.29, -0.22]} rotation={[0, 0, -0.37]}><capsuleGeometry args={[0.065, 0.28, 4, 8]} /><meshStandardMaterial color="#141b22" /></mesh>
    <mesh position={[-0.48, 0.16, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshBasicMaterial color="#66ec8e" /></mesh>
  </group>;
}

export default function TowerCutaway({ state, graph, onWorkstation, interior, showPeople = true }: TowerCutawayProps) {
  const windowAngles = Array.from({ length: WINDOW_COUNT + 1 }, (_, index) => GLAZED_START + index / WINDOW_COUNT * GLAZED_LENGTH);
  return <group>
    {/* Octagonal foot and narrowing reinforced-concrete shaft. */}
    <mesh position={[0, 0.16, 0]} castShadow receiveShadow><cylinderGeometry args={[1.58, 1.78, 0.32, 8]} /><meshStandardMaterial color="#8a969c" roughness={0.85} /></mesh>
    <mesh position={[0, 4.07, 0]} castShadow receiveShadow><cylinderGeometry args={[0.69, 1.15, 7.82, 12]} /><meshStandardMaterial color="#b5bbba" roughness={0.87} /></mesh>
    {Array.from({ length: 12 }, (_, index) => {
      const a = index / 12 * TAU;
      return <mesh key={index} position={[Math.sin(a) * 0.88, 4.11, Math.cos(a) * 0.88]} rotation={[0, a, 0]} castShadow>
        <boxGeometry args={[0.095, 7.58, 0.11]} /><meshStandardMaterial color="#9aa6a9" roughness={0.82} />
      </mesh>;
    })}
    <mesh position={[0, 1.03, 1.09]} castShadow><boxGeometry args={[0.66, 1.56, 0.08]} /><meshStandardMaterial color="#596a72" metalness={0.4} roughness={0.58} /></mesh>
    <mesh position={[0.22, 1.02, 1.15]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#d0bc75" metalness={0.7} /></mesh>
    {[2.5, 5.15, 7.85].map(y => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.22 - y * 0.066, 0.06, 8, 48]} /><meshStandardMaterial color="#e1e0d7" roughness={0.76} />
    </mesh>)}

    {/* Console floor is a solid, flat cylinder; the front walls and roof are cut away. */}
    <mesh position={[0, FLOOR_Y, 0]} receiveShadow castShadow><cylinderGeometry args={[CAB_RADIUS, 2.48, 0.27, 48]} /><meshStandardMaterial color="#626e73" roughness={0.73} /></mesh>
    <mesh position={[0, FLOOR_Y + 0.145, 0]} receiveShadow><cylinderGeometry args={[2.52, 2.52, 0.018, 48]} /><meshStandardMaterial color="#9da6a3" roughness={0.92} /></mesh>
    <mesh position={[0, WINDOW_BOTTOM + WINDOW_HEIGHT / 2, 0]}>
      <cylinderGeometry args={[CAB_RADIUS, CAB_RADIUS, WINDOW_HEIGHT, 48, 1, true, GLAZED_START, GLAZED_LENGTH]} />
      <meshPhysicalMaterial color="#8caebd" transparent opacity={0.19} depthWrite={false} roughness={0.12} metalness={0.14} side={DoubleSide} />
    </mesh>
    {windowAngles.map((a, index) => <mesh key={index} position={[Math.sin(a) * CAB_RADIUS, WINDOW_BOTTOM + WINDOW_HEIGHT / 2, Math.cos(a) * CAB_RADIUS]} castShadow>
      <cylinderGeometry args={[0.044, 0.044, WINDOW_HEIGHT, 8]} /><meshStandardMaterial color="#485962" metalness={0.65} roughness={0.34} />
    </mesh>)}
    {[WINDOW_BOTTOM, WINDOW_BOTTOM + WINDOW_HEIGHT].map(y => <mesh key={y} position={[0, y, 0]}>
      <cylinderGeometry args={[CAB_RADIUS + 0.08, CAB_RADIUS + 0.08, 0.09, 48, 1, true, GLAZED_START, GLAZED_LENGTH]} />
      <meshStandardMaterial color="#384850" metalness={0.52} roughness={0.42} side={DoubleSide} />
    </mesh>)}
    <mesh position={[0, 10.7, 0]} castShadow>
      <cylinderGeometry args={[2.83, 3.03, 0.32, 48, 1, false, GLAZED_START, GLAZED_LENGTH]} />
      <meshStandardMaterial color="#5c656a" metalness={0.2} roughness={0.72} side={DoubleSide} />
    </mesh>
    <mesh position={[0, 10.89, -1.45]}><cylinderGeometry args={[0.1, 0.14, 0.18, 12]} /><meshStandardMaterial color="#929da2" metalness={0.54} /></mesh>
    <mesh position={[0, 11.29, -1.45]}><cylinderGeometry args={[0.025, 0.025, 0.7, 8]} /><meshStandardMaterial color="#a5b1b5" metalness={0.7} /></mesh>
    <mesh position={[0, 11.66, -1.45]}><sphereGeometry args={[0.105, 12, 8]} /><meshStandardMaterial color="#f75c52" emissive="#d42c22" emissiveIntensity={1.3} /></mesh>

    {/* The cab furniture is fixed to the floor and all displays read shared simulation state. */}
    <mesh position={[0, FLOOR_Y + 0.76, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <ringGeometry args={[0.74, 2.25, 40, 1, 0.12, Math.PI - 0.24]} />
      <meshStandardMaterial color="#394b55" metalness={0.2} roughness={0.48} side={DoubleSide} />
    </mesh>
    <mesh position={[0, FLOOR_Y + 0.76, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.24, 0.052, 8, 42, Math.PI - 0.24]} /><meshStandardMaterial color="#a4a799" metalness={0.4} roughness={0.44} />
    </mesh>
    {[-1.55, 0, 1.55].map(x => <mesh key={x} position={[x, FLOOR_Y + 0.38, 0.72]} castShadow><cylinderGeometry args={[0.07, 0.09, 0.77, 10]} /><meshStandardMaterial color="#586670" metalness={0.36} /></mesh>)}
    <group onClick={onWorkstation ? event => { event.stopPropagation(); onWorkstation('gnd'); } : undefined}><FTGMonitor state={state} graph={graph} interior={interior} /></group>
    {showPeople && <><TowerOperator x={-0.87} role="GND" state={state} /><TowerOperator x={0.91} role="TWR" state={state} /></>}
    {[-1.35, 1.35].map((x, index) => <group key={x} onClick={onWorkstation ? event => { event.stopPropagation(); onWorkstation(index ? 'twr' : 'gnd'); } : undefined} position={[x, 9.25, -0.12]} rotation={[0, index ? -0.3 : 0.3, 0]}>
      <mesh castShadow><boxGeometry args={[0.82, 0.58, 0.09]} /><meshStandardMaterial color="#15232d" metalness={0.35} roughness={0.4} /></mesh>
      <mesh position={[0, 0, 0.052]}><planeGeometry args={[0.72, 0.48]} /><meshBasicMaterial color={index ? '#163c48' : '#234d54'} /></mesh>
      {[0, 1, 2, 3].map(line => <mesh key={line} position={[0, 0.15 - line * 0.1, 0.056]}><boxGeometry args={[0.56 - line * 0.06, 0.012, 0.005]} /><meshBasicMaterial color={line === 2 ? '#5ee79c' : '#64acc0'} /></mesh>)}
      <mesh position={[0, -0.39, 0]}><cylinderGeometry args={[0.035, 0.045, 0.22, 8]} /><meshStandardMaterial color="#5b6973" /></mesh>
    </group>)}
    <OperatorChair x={-0.87} z={1.55} />
    <OperatorChair x={0.91} z={1.52} />
    <RadioConsole />
    <AnalogClock elapsedSeconds={state.elapsedSeconds} />
    <mesh position={[-1.8, 8.72, -1.3]} castShadow><boxGeometry args={[0.7, 0.72, 0.46]} /><meshStandardMaterial color="#64747d" metalness={0.28} roughness={0.58} /></mesh>
    {[-0.18, 0.12].map(y => <mesh key={y} position={[-1.8, 8.72 + y, -1.06]}><boxGeometry args={[0.54, 0.04, 0.018]} /><meshStandardMaterial color="#a1abb1" metalness={0.58} /></mesh>)}
    <pointLight position={[0, 10.27, 0]} color="#ffe8c5" intensity={1.1} distance={5.5} decay={2} />
  </group>;
}
