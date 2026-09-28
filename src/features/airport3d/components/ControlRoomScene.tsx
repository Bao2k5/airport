import type { AirportGraph, Aircraft, SimulationState } from '../../../types';
import { useTiledTexture } from '../hooks/useTiledTexture';
import AirportPavement from '../surface/AirportPavement';
import AirportLights from '../surface/AirportLights';
import AirportRestrictions from '../surface/AirportRestrictions';
import AircraftModel from './AircraftModel';
import { Html, OrbitControls } from '@react-three/drei';
import type { SceneMode } from '../viewTypes';
function DeskScreen({ state, position, role, index, onSelectAircraft }: {
  state: SimulationState;
  position: [number, number, number];
  role: 'GND' | 'TWR';
  index: number;
  onSelectAircraft?: (aircraftId: string) => void;
}) {
  const flights = state.scenarioAircraft?.length
    ? state.scenarioAircraft as Aircraft[]
    : state.manualFleet?.length ? state.manualFleet : state.aircraft ? [state.aircraft] : [];
  const visibleFlights = flights.filter(item => !item.hidden && item.status !== 'departed');
  const active = visibleFlights[index % Math.max(1, visibleFlights.length)];
  const node = active?.currentNodeId
    ? active.currentNodeId.replaceAll('_', ' ').toUpperCase()
    : 'CHƯA CÓ TÀU BAY';
  const route = active?.assignedRoute?.length
    ? active.assignedRoute.map(id => id.replaceAll('_', ' ').toUpperCase()).join(' → ')
    : 'Chưa cấp tuyến';
  const status = active?.status?.toUpperCase() ?? 'STANDBY';
  const controller = active ? (state.controllerByAircraft?.[active.id] ?? 'GND') : '—';
  const handoffPending = active ? state.handoffRequests?.[active.id] : undefined;

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.035]}>
        <boxGeometry args={[1.35, 0.86, 0.08]} />
        <meshStandardMaterial color="#080c12" metalness={0.35} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.51, 0]}>
        <boxGeometry args={[0.14, 0.28, 0.13]} />
        <meshStandardMaterial color="#303943" />
      </mesh>
      <Html transform position={[0, 0, 0.012]} distanceFactor={10} style={{ pointerEvents: onSelectAircraft && active ? 'auto' : 'none' }}>
        <button type="button" aria-label={active ? `Chọn chuyến bay ${active.callsign} tại bàn ${role}` : `Màn hình ${role}`} onClick={() => active && onSelectAircraft?.(active.id)} className="h-[76px] w-[120px] cursor-pointer overflow-hidden rounded-sm border border-cyan-900 bg-[#07111a] p-1.5 text-left font-mono text-[7px] leading-[1.35] text-cyan-100 shadow-[0_0_16px_#0e749055]">
          <div className="mb-1 flex justify-between border-b border-cyan-900 pb-1 text-[9px] font-bold text-cyan-300"><span>{role} · SURFACE</span><span>{state.isPaused ? 'PAUSE' : state.isRunning ? 'LIVE' : 'READY'}</span></div>
          <div className="grid grid-cols-[1fr_auto] gap-x-2 text-slate-400"><span>FLIGHT</span><span>STATUS</span><b className="text-white">{active?.callsign ?? '—'}</b><b className="text-emerald-300">{status}</b></div>
          <div className="mt-1 truncate text-amber-200">POS {node}</div>
          {state.practiceMode && <div className="mt-0.5 flex justify-between text-[6px] text-amber-300"><span>CTRL {controller}</span><span>{handoffPending ? `HANDOFF → ${handoffPending}` : active?.holdReason?.startsWith('practice-') ? 'HOLD FOR ATC' : 'NO HANDOFF'}</span></div>}
          <div className="mt-1 h-7 overflow-hidden text-cyan-200">ROUTE {route}</div>
          <div className="mt-1 flex justify-between text-slate-400"><span>ELAPSED</span><span>{Math.floor(state.elapsedSeconds / 60).toString().padStart(2, '0')}:{Math.floor(state.elapsedSeconds % 60).toString().padStart(2, '0')}</span></div>
        </button>
      </Html>
    </group>
  );
}

function WindowAirportBackdrop({ graph, state }: { graph: AirportGraph; state: SimulationState }) {
  const groundTexture = useTiledTexture('/textures/concrete-albedo.jpg', 6, 4);
  const aircraft = state.scenarioAircraft?.length
    ? state.scenarioAircraft as Aircraft[]
    : state.manualFleet?.length ? state.manualFleet : state.aircraft ? [state.aircraft] : [];
  return (
    <group position={[0, 0.1, -9.3]} scale={[0.14, 0.14, 0.14]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[116, 88]} /><meshStandardMaterial map={groundTexture} color="#767f86" roughness={0.92} />
      </mesh>
      <AirportPavement graph={graph} />
      <AirportLights graph={graph} state={state} />
      <AirportRestrictions graph={graph} state={state} />
      {aircraft.filter(item => item && item.currentNodeId && !item.hidden && item.status !== 'departed').map(item => <AircraftModel
        key={item.id} aircraft={item} graph={graph} selected={false} showLabel={false}
      />)}
    </group>
  );
}

export default function ControlRoomScene({ graph, state, mode, onSelectMode, onSelectAircraft }: {
  graph: AirportGraph;
  state: SimulationState;
  mode: Exclude<SceneMode, 'airport'>;
  onSelectMode: (mode: 'gnd' | 'twr') => void;
  onSelectAircraft?: (aircraftId: string) => void;
}) {
  const deskXs = [-4.4, 0, 4.4];
  return (
    <>
      <color attach="background" args={['#111820']} />
      <ambientLight intensity={state.config.timeOfDay === 'night' ? 0.55 : 1.1} />
      <directionalLight position={[-4, 8, 5]} intensity={1.4} />
      <pointLight position={[0, 3.7, 0]} intensity={28} distance={17} color="#fff1d2" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} /><meshStandardMaterial color="#34383c" roughness={0.95} />
      </mesh>
      <mesh position={[0, 5.16, -6.8]}><boxGeometry args={[18, 2.3, 0.25]} /><meshStandardMaterial color="#202832" /></mesh>
      <mesh position={[0, 0.43, -6.8]}><boxGeometry args={[18, 0.85, 0.25]} /><meshStandardMaterial color="#202832" /></mesh>
      <mesh position={[-8.25, 2.85, -6.8]}><boxGeometry args={[1.5, 3.65, 0.25]} /><meshStandardMaterial color="#202832" /></mesh>
      <mesh position={[8.25, 2.85, -6.8]}><boxGeometry args={[1.5, 3.65, 0.25]} /><meshStandardMaterial color="#202832" /></mesh>
      <mesh position={[-8.8, 3.1, 0]}><boxGeometry args={[0.25, 6.4, 14]} /><meshStandardMaterial color="#202832" /></mesh>
      <mesh position={[8.8, 3.1, 0]}><boxGeometry args={[0.25, 6.4, 14]} /><meshStandardMaterial color="#202832" /></mesh>
      <mesh position={[0, 2.75, -6.65]}><boxGeometry args={[15.6, 3.5, 0.08]} /><meshPhysicalMaterial color="#5b7181" transparent opacity={0.2} roughness={0.12} metalness={0.16} /></mesh>
      {[-5.2, -2.6, 0, 2.6, 5.2].map(x => <mesh key={x} position={[x, 2.75, -6.57]}><boxGeometry args={[0.055, 3.65, 0.1]} /><meshStandardMaterial color="#59616b" metalness={0.8} /></mesh>)}
      <mesh position={[0, 4.57, -6.57]}><boxGeometry args={[16, 0.12, 0.1]} /><meshStandardMaterial color="#59616b" metalness={0.8} /></mesh>
      <WindowAirportBackdrop graph={graph} state={state} />
      <mesh position={[0, 6.1, 0]}><boxGeometry args={[18, 0.22, 14]} /><meshStandardMaterial color="#141a20" /></mesh>
      <mesh position={[0, 6.1, 0]}><boxGeometry args={[7.2, 0.08, 0.2]} /><meshBasicMaterial color="#e4b763" /></mesh>
      <Html position={[0, 5.25, -6.48]} transform distanceFactor={5.5} style={{ pointerEvents: 'none' }}>
        <div className="rounded border border-cyan-900 bg-[#07111af0] px-5 py-2 text-center font-mono text-[10px] tracking-[0.18em] text-cyan-100 shadow-lg">
          <b className="block text-[13px] text-cyan-300">TÂN SƠN NHẤT · SURFACE CONTROL</b>
          <span>GROUND CONTROL · LOCAL CONTROL · SIMULATION</span>
        </div>
      </Html>
      {deskXs.map((x, index) => {
        const role: 'GND' | 'TWR' = index === 2 ? 'TWR' : 'GND';
        const selected = mode === 'gnd' ? index === 0 : mode === 'twr' ? index === 2 : true;
        return (
        <group key={x} position={[x, 0, -0.4]} onClick={index !== 1 ? (event) => { event.stopPropagation(); onSelectMode(role.toLowerCase() as 'gnd' | 'twr'); } : undefined}>
            <mesh position={[0, 0.86, 0]} castShadow><boxGeometry args={[3.65, 0.16, 1.3]} /><meshStandardMaterial color={selected ? '#303c47' : '#242b31'} metalness={0.18} roughness={0.42} /></mesh>
            <mesh position={[0, 0.42, 0.42]}><boxGeometry args={[3.25, 0.78, 0.12]} /><meshStandardMaterial color="#222a31" /></mesh>
            {[-1.45, 1.45].map(dx => <mesh key={dx} position={[dx, 0.39, 0]}><boxGeometry args={[0.1, 0.76, 0.12]} /><meshStandardMaterial color="#4a5157" /></mesh>)}
            {[ -1.25, 0, 1.25 ].map((dx, screenIndex) => <DeskScreen key={dx} state={state} position={[dx, 1.55, -0.16]} role={role} index={index + screenIndex} onSelectAircraft={onSelectAircraft} />)}
            <mesh position={[0, 0.7, 1.38]}><cylinderGeometry args={[0.56, 0.56, 0.12, 24]} /><meshStandardMaterial color="#171c22" /></mesh>
            <mesh position={[0, 0.35, 1.38]}><cylinderGeometry args={[0.12, 0.18, 0.62, 12]} /><meshStandardMaterial color="#333b43" /></mesh>
            <mesh position={[0, 1.16, 1.72]} rotation={[-0.12, 0, 0]}><boxGeometry args={[0.94, 0.92, 0.2]} /><meshStandardMaterial color={selected ? '#303943' : '#22272b'} roughness={0.86} /></mesh>
            <mesh position={[0, 1.76, 1.76]}><boxGeometry args={[0.56, 0.24, 0.22]} /><meshStandardMaterial color={selected ? '#303943' : '#22272b'} roughness={0.86} /></mesh>
            {[-0.56, 0.56].map(dx => <mesh key={dx} position={[dx, 0.98, 1.42]}><boxGeometry args={[0.12, 0.12, 0.64]} /><meshStandardMaterial color="#343e47" metalness={0.28} roughness={0.52} /></mesh>)}
            <Html position={[0, 2.08, 0.45]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
              <div className={`rounded px-2 py-1 text-[9px] font-bold tracking-widest ${selected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{index === 1 ? 'COORDINATION' : role + ' POSITION'}</div>
            </Html>
          </group>
        );
      })}
      <OrbitControls makeDefault target={mode === 'room' ? [0, 1.5, -0.8] : mode === 'gnd' ? [-4.4, 1.8, -5.3] : [4.4, 1.8, -5.3]} enableDamping dampingFactor={0.1} minDistance={mode === 'room' ? 5 : 4} maxDistance={mode === 'room' ? 24 : 18} maxPolarAngle={Math.PI * 0.48} />
    </>
  );
}

