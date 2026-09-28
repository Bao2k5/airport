import StandDisplays from './StandDisplays';
import GroundEquipment, { ServiceVehicle } from './GroundEquipment';
import SkyEnvironment from './SkyEnvironment';
import type { AirportGraph, Aircraft, SimulationState } from '../../../types';
import UnifiedAirportGround from './UnifiedAirportGround';
import AirportPavement from '../surface/AirportPavement';
import AirportLights from '../surface/AirportLights';
import AirportRestrictions from '../surface/AirportRestrictions';
import AircraftModel from './AircraftModel';
import { lazy, Suspense, memo, useMemo, useRef } from 'react';
import type { Group } from 'three';
const DecorativeTerminal = lazy(() => import('../assets/DecorativeTerminal'));
const AirportBannerPlaque = lazy(() => import('./AirportBannerPlaque'));
import { Html, TransformControls } from '@react-three/drei';
import type { AirportLayout, LayoutObject, CameraPose } from '../layout';
import type { Props, CameraPreset, SceneMode } from '../viewTypes';
import TowerCutaway from '../TowerCutaway';
import { toWorld } from '../sceneCoordinates';
import AirportCameraControls from './AirportCameraControls';
import TowerCameraControls from './TowerCameraControls';

function AirportProp({
  item,
  editing,
  selected,
  onSelect,
  onMove,
  state,
  graph,
  onWorkstation,
  interior,
  showPeople,
  modelsEnabled = true,
  modelDetail = true,
}: {
  onWorkstation?: (role: 'gnd' | 'twr') => void;
  interior?: boolean;
  showPeople?: boolean;
  item: LayoutObject;
  editing: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove?: (id: string, newPos: [number, number, number]) => void;
  state: SimulationState;
  graph: AirportGraph;
  modelsEnabled?: boolean;
  modelDetail?: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const click = editing ? (event: { stopPropagation: () => void }) => { event.stopPropagation(); onSelect(item.id); } : undefined;
  return (
    <>
      {editing && selected && (
        <TransformControls
          object={groupRef as any}
          mode="translate"
          onMouseUp={() => {
            if (groupRef.current && onMove) {
              const p = groupRef.current.position;
              onMove(item.id, [Number(p.x.toFixed(2)), Number(p.y.toFixed(2)), Number(p.z.toFixed(2))]);
            }
          }}
        />
      )}
      <group ref={groupRef} position={item.position} rotation={[0, item.rotationY, 0]} scale={item.scale} onClick={click}>
        {item.kind === 'tower' && <TowerCutaway state={state} graph={graph} onWorkstation={onWorkstation} interior={interior} showPeople={showPeople} />}
        {item.kind === 'mast' && <>
          <mesh position={[0, 3.3, 0]} castShadow><cylinderGeometry args={[0.1, 0.16, 6.6, 8]} /><meshStandardMaterial color="#aab4bb" metalness={0.55} /></mesh>
          <mesh position={[0, 6.65, 0]}><boxGeometry args={[1.65, 0.12, 0.32]} /><meshStandardMaterial color="#737f87" metalness={0.5} /></mesh>
          {[-0.56, 0, 0.56].map(x => <mesh key={x} position={[x, 6.54, 0]}><boxGeometry args={[0.36, 0.1, 0.26]} /><meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={selected ? 2.8 : 1.2} toneMapped={false} /></mesh>)}
          <pointLight position={[0, 6.4, 0]} color={item.color} intensity={item.scale * 25} distance={35} decay={2} />
        </>}
        {item.kind === 'vehicle' && <group scale={1.1}><ServiceVehicle kind={0} /></group>}
        {item.kind === 'sign' && (
          <Suspense fallback={null}>
            <AirportBannerPlaque color={item.color} selected={selected} editing={editing} />
          </Suspense>
        )}
        {item.kind === 'terminal' && modelsEnabled && (
          <Suspense fallback={null}>
            <DecorativeTerminal detailed={modelDetail} editing={editing} selected={selected} />
          </Suspense>
        )}
        {editing && item.kind !== 'terminal' && item.kind !== 'sign' && <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[item.kind === 'tower' ? 1.4 : 0.6, item.kind === 'tower' ? 1.7 : 0.85, 40]} />
          <meshBasicMaterial color={selected ? '#28d8ff' : '#e6b85c'} side={2} />
        </mesh>}
      </group>
    </>
  );
}

const MemoAirportProp = memo(AirportProp, (previous, next) =>
  previous.showPeople === next.showPeople &&
  previous.onWorkstation === next.onWorkstation && previous.interior === next.interior &&
  previous.item === next.item &&
  previous.editing === next.editing &&
  previous.selected === next.selected &&
  previous.onSelect === next.onSelect &&
  previous.onMove === next.onMove &&
  previous.modelsEnabled === next.modelsEnabled &&
  previous.modelDetail === next.modelDetail &&
  previous.graph === next.graph &&
  (previous.item.kind !== 'tower' || previous.state === next.state)
);

const AirportMarkers = memo(function AirportMarkers({ graph }: { graph: AirportGraph }) {
  return <>
    {graph.nodes.filter(node => ['stand', 'gate', 'holding_point', 'runway_entry'].includes(node.type) || /^STAND[_ -]?\d+/i.test(node.label) || /^STOP BAR/i.test(node.label)).map(node => {
      const p = toWorld(node);
      const stand = node.type === 'stand' || node.type === 'gate' || /^STAND[_ -]?\d+/i.test(node.label);
      const operationalLabel = stand || node.type === 'holding_point' || node.type === 'runway_entry' || /^STOP BAR/i.test(node.label);
      return (
        <group key={node.id}>
          {node.label && operationalLabel && (
            <Html position={[p[0], 0.76, p[2]]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
              <span className={`whitespace-nowrap rounded-xs border px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold shadow-xs select-none ${stand ? 'border-amber-300/50 bg-[#211c0de8] text-amber-200' : 'border-red-300/40 bg-[#200c10dd] text-rose-100'}`}>
                {node.label}
              </span>
            </Html>
          )}
        </group>
      );
    })}
  </>;
});

export default function AirportScene({ graph, state, onSelectAircraft, layout, editing, selectedLayoutId, onSelectLayout, onMoveLayout, preset, cameraPosition, cameraTarget, cameraPose, onCameraPoseChange, towerMode, onWorkstation, showPeople = true, lightScale = 1, vehicles = false, density = 0, reflections = true, modelsEnabled = true, modelDetail = true }: Props & {
  modelsEnabled?: boolean;
  modelDetail?: boolean;
  vehicles?: boolean;
  density?: number;
  reflections?: boolean;
  lightScale?: number;
  towerMode?: Exclude<SceneMode, 'airport'>;
  onWorkstation?: (role: 'gnd' | 'twr') => void;
  showPeople?: boolean;
  layout: AirportLayout;
  editing: boolean;
  selectedLayoutId: string | null;
  onSelectLayout: (id: string) => void;
  onMoveLayout?: (id: string, newPos: [number, number, number]) => void;
  preset: CameraPreset;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPose: CameraPose;
  onCameraPoseChange: (pose: CameraPose) => void;
}) {
  const night = state.config.timeOfDay === 'night';
  const lowVisibility = state.config.weather === 'fog' || state.config.weather === 'thunderstorm';
  const aircraft = useMemo(() => {
    const source = state.scenarioAircraft?.length
      ? state.scenarioAircraft as Aircraft[]
      : state.manualFleet?.length
        ? state.manualFleet
        : state.aircraft ? [state.aircraft] : [];
    return source.filter(item => item && item.currentNodeId);
  }, [state.aircraft, state.manualFleet, state.scenarioAircraft]);
  const visibleAircraft = aircraft.filter(item => !item.hidden && item.status !== 'departed');

  return (
    <>
      <color attach="background" args={[lowVisibility ? '#737c83' : night ? '#081426' : '#a6aaad']} />
      <fog attach="fog" args={[lowVisibility ? '#899298' : night ? '#101c2c' : '#a6aaad', lowVisibility ? 100 : 130, lowVisibility ? 280 : 290]} />
      <hemisphereLight args={[night ? '#7893b3' : '#f2f4f6', night ? '#222830' : '#4a4e52', night ? 0.72 : 1.18]} />
      <ambientLight intensity={night ? 0.48 : 0.38} />
      <directionalLight position={[-28, 46, 22]} intensity={night ? 0.52 : 2.15} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-68} shadow-camera-right={105} shadow-camera-top={70} shadow-camera-bottom={-85} shadow-bias={-0.0002} />
      <UnifiedAirportGround graph={graph} layout={layout} />
      {reflections && <SkyEnvironment night={night} />}
      {vehicles && density > 0 && <GroundEquipment graph={graph} state={state} layout={layout} density={density} people={showPeople} />}
      <AirportPavement graph={graph} />
      <AirportLights graph={graph} state={state} lightScale={lightScale} />
      <AirportRestrictions graph={graph} state={state} />
      {!towerMode && <AirportMarkers graph={graph} />}
      {!towerMode && <StandDisplays graph={graph} state={state} />}
      {layout.map(item => (
        <MemoAirportProp
          key={item.id}
          item={item}
          editing={editing}
          selected={item.id === selectedLayoutId}
          onSelect={onSelectLayout}
          onMove={onMoveLayout}
          state={state}
          graph={graph}
          onWorkstation={onWorkstation}
          interior={!!towerMode}
          showPeople={showPeople}
          modelsEnabled={modelsEnabled}
          modelDetail={modelDetail}
        />
      ))}
      {aircraft.map(item => <AircraftModel key={item.id} aircraft={item} graph={graph} selected={item.id === state.selectedAircraftId} onSelect={onSelectAircraft} />)}
      {towerMode && layout.find(item => item.kind === 'tower') ? <TowerCameraControls tower={layout.find(item => item.kind === 'tower')!} mode={towerMode} /> : <AirportCameraControls preset={preset} aircraft={visibleAircraft.find(item => item.id === state.selectedAircraftId) ?? visibleAircraft[0]} graph={graph} initialPosition={cameraPosition} initialTarget={cameraTarget} cameraPose={cameraPose} onPoseChange={onCameraPoseChange} />}
    </>
  );
}
