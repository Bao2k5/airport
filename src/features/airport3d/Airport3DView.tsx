import { getAssetZone } from './assets/assetPlacement';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import { createDefaultLayout, LAYOUT_STORAGE_KEY, LAYOUT_VERSION, validateCameraPose, validateLayoutImport, type AirportLayout, type CameraPose, type LayoutObject } from './layout';
import type { Aircraft } from '../../types';
import { getCurrentWorldPosition } from './sceneCoordinates';
import type { Props, SceneMode, CameraPreset } from './viewTypes';
import AirportScene from './components/AirportScene';
import AirportMap from '../../components/AirportMap';
import SceneSettings, { DEFAULT_SCENE_PREFERENCES } from './components/SceneSettings';
import LayoutInspector from './components/LayoutInspector';
import SurfaceLegend from './surface/SurfaceLegend';
import AirportToolbar from './components/AirportToolbar';
import LayoutUnlockDialog from './components/LayoutUnlockDialog';

const PRESETS: { id: CameraPreset; label: string; position: [number, number, number] }[] = [
  { id: 'overview', label: 'Tổng quan', position: [0, 92, 78] },
  { id: 'northwest', label: 'Góc 1', position: [-78, 68, -62] },
  { id: 'northeast', label: 'Góc 2', position: [78, 68, -62] },
  { id: 'southeast', label: 'Góc 3', position: [78, 68, 62] },
  { id: 'southwest', label: 'Góc 4', position: [-78, 68, 62] },
];

function loadSavedPreset(): CameraPreset {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    const preset = saved ? (JSON.parse(saved) as { cameraPreset?: unknown }).cameraPreset : undefined;
    return preset === 'follow' || PRESETS.some(item => item.id === preset) ? preset as CameraPreset : 'overview';
  } catch {
    return 'overview';
  }
}

export default function Airport3DView(props: Props) {
  const [scenePreferences, setScenePreferences] = useState(DEFAULT_SCENE_PREFERENCES);
  const [workstation, setWorkstation] = useState<'gnd' | 'twr' | null>(null);
  const [preset, setPreset] = useState<CameraPreset>(loadSavedPreset);
  const [sceneMode, setSceneMode] = useState<SceneMode>('airport');
  const defaults = useMemo(() => createDefaultLayout(props.graph), [props.graph]);
  const [layout, setLayout] = useState<AirportLayout>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      return saved ? validateLayoutImport(JSON.parse(saved), defaults) : defaults;
    } catch {
      return defaults;
    }
  });
  const [cameraPose, setCameraPose] = useState<CameraPose>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      const pose = saved ? validateCameraPose((JSON.parse(saved) as { cameraPose?: unknown }).cameraPose) : null;
      return pose ?? { position: [80.09, 16.75, 51.77], target: [0, 0, 0] };
    } catch {
      return { position: [80.09, 16.75, 51.77], target: [0, 0, 0] };
    }
  });
  const [editing, setEditing] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const editingRef = useRef(false);
  editingRef.current = editing;
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>('tower');
  const [editorMessage, setEditorMessage] = useState('');
  const undoStack = useRef<AirportLayout[]>([]);
  const redoStack = useRef<AirportLayout[]>([]);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const camera = PRESETS.find(item => item.id === preset) ?? PRESETS[0];
  const roomPosition: [number, number, number] = sceneMode === 'room' ? [0, 6.5, 15.5] : sceneMode === 'gnd' ? [-4.4, 2.8, 8.2] : [4.4, 2.8, 8.2];
  const roomTarget: [number, number, number] = sceneMode === 'room' ? [0, 1.5, -0.8] : sceneMode === 'gnd' ? [-4.4, 1.8, -5.3] : [4.4, 1.8, -5.3];
  const inAirport = sceneMode === 'airport';
  const flightList = props.state.scenarioAircraft?.length
    ? props.state.scenarioAircraft as Aircraft[]
    : props.state.manualFleet?.length ? props.state.manualFleet : props.state.aircraft ? [props.state.aircraft] : [];
  const visibleFlights = flightList.filter(item => !item.hidden && item.status !== 'departed');
  const followedAircraft = visibleFlights.find(item => item.id === props.state.selectedAircraftId) ?? visibleFlights[0];
  const followedPoint = preset === 'follow' ? getCurrentWorldPosition(followedAircraft, props.graph) : null;
  const airportCameraPosition: [number, number, number] = preset === 'custom'
    ? cameraPose.position
    : followedPoint ? [followedPoint[0] + 12, 15, followedPoint[2] + 15] : camera.position;
  const airportCameraTarget: [number, number, number] = preset === 'custom' ? cameraPose.target : followedPoint ?? [0, 0, 0];
  const handleCameraPoseChange = (pose: CameraPose) => {
    setCameraPose(pose);
    if (preset !== 'follow') setPreset('custom');
  };

  // Tự động quay về góc nhìn "Tổng quan" khi hoàn tất kịch bản hoặc khi tàu bay cất cánh rời khỏi sân bay
  const isScenario = Boolean(props.state.scenario);
  const isScenarioCompleted = Boolean(props.state.scenario?.completed);
  const prevCompletedRef = useRef(false);

  useEffect(() => {
    if (isScenarioCompleted && !prevCompletedRef.current) {
      setPreset('overview');
      setSceneMode('airport');
    }
    prevCompletedRef.current = isScenarioCompleted;
  }, [isScenarioCompleted]);

  useEffect(() => {
    // Nếu đang bật "Theo máy bay" trong kịch bản mà tàu bay đã cất cánh bay đi hoặc kịch bản hoàn tất
    if (isScenario && preset === 'follow' && (visibleFlights.length === 0 || isScenarioCompleted)) {
      setPreset('overview');
    }
  }, [isScenario, preset, visibleFlights.length, isScenarioCompleted]);

  const rememberLayout = (next: AirportLayout) => {
    if (!editingRef.current) return;
    undoStack.current.push(layout);
    if (undoStack.current.length > 60) undoStack.current.shift();
    redoStack.current = [];
    setLayout(next);
    setHistoryState({ canUndo: undoStack.current.length > 0, canRedo: false });
    setEditorMessage('Chưa lưu thay đổi');
  };
  const adjustSelected = (field: 'x' | 'y' | 'z' | 'rotationY' | 'scale', amount: number) => {
    if (!selectedLayoutId) return;
    rememberLayout(layout.map(item => {
      if (item.id !== selectedLayoutId) return item;
      if (field === 'rotationY') return { ...item, rotationY: item.rotationY + amount };
      if (field === 'scale') return { ...item, scale: Math.max(0.35, Math.min(2.5, Number((item.scale + amount).toFixed(2)))) };
      const position = [...item.position] as [number, number, number];
      const axis = field === 'x' ? 0 : field === 'y' ? 1 : 2;
      position[axis] = Math.max(axis === 1 ? -5 : -100, Math.min(axis === 1 ? 12 : 100, Number((position[axis] + amount).toFixed(2))));
      return { ...item, position };
    }));
  };
  const setSelectedValue = (field: 'x' | 'y' | 'z' | 'rotationY' | 'scale', value: number) => {
    if (!selectedLayoutId || !Number.isFinite(value)) return;
    rememberLayout(layout.map(item => {
      if (item.id !== selectedLayoutId) return item;
      if (field === 'rotationY') return { ...item, rotationY: value * Math.PI / 180 };
      if (field === 'scale') return { ...item, scale: Math.max(0.35, Math.min(2.5, Number(value.toFixed(2)))) };
      const position = [...item.position] as [number, number, number];
      const axis = field === 'x' ? 0 : field === 'y' ? 1 : 2;
      position[axis] = Math.max(axis === 1 ? -5 : -100, Math.min(axis === 1 ? 12 : 100, Number(value.toFixed(2))));
      return { ...item, position };
    }));
  };
  const setSelectedColor = (color: string) => {
    if (!selectedLayoutId) return;
    rememberLayout(layout.map(item => item.id === selectedLayoutId ? { ...item, color } : item));
  };
  const handleMoveLayout = (id: string, newPos: [number, number, number]) => {
    rememberLayout(layout.map(item => item.id === id ? { ...item, position: newPos } : item));
  };
  const handleRenameObject = (id: string, name: string) => {
    rememberLayout(layout.map(item => item.id === id ? { ...item, name } : item));
  };
  const handleAddObject = (kind: 'mast' | 'vehicle') => {
    const id = `${kind}_${Date.now()}`;
    const count = layout.filter(o => o.kind === kind).length + 1;
    const defaultName = kind === 'mast' ? `Đèn sân đỗ ${count}` : `Xe phục vụ ${count}`;

    // Place near current camera target or current selected object
    const anchor = layout.find(o => o.id === selectedLayoutId)?.position ?? cameraPose.target ?? [20, 0, 10];
    const newPos: [number, number, number] = [
      Number((anchor[0] + (Math.random() * 4 - 2)).toFixed(1)),
      0,
      Number((anchor[2] + (Math.random() * 4 - 2)).toFixed(1)),
    ];

    const newObj: LayoutObject = {
      id,
      name: defaultName,
      kind,
      position: newPos,
      rotationY: 0,
      scale: 1,
      color: kind === 'mast' ? '#fff0bf' : '#303c43',
    };

    rememberLayout([...layout, newObj]);
    setSelectedLayoutId(id);
    setEditorMessage(`Đã thêm ${defaultName}`);
  };
  const handleDeleteObject = (id: string) => {
    if (id === 'tower' || id === 'terminal_zone') {
      setEditorMessage('Không thể xóa đối tượng chính này');
      return;
    }
    const targetObj = layout.find(o => o.id === id);
    const next = layout.filter(o => o.id !== id);
    rememberLayout(next);
    setSelectedLayoutId(next[0]?.id ?? null);
    setEditorMessage(`Đã xóa ${targetObj?.name ?? id}`);
  };
  const undoLayout = () => {
    if (!editingRef.current) return;
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(layout);
    setLayout(previous);
    setHistoryState({ canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 });
    setEditorMessage('Đã hoàn tác');
  };
  const redoLayout = () => {
    if (!editingRef.current) return;
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(layout);
    setLayout(next);
    setHistoryState({ canUndo: true, canRedo: redoStack.current.length > 0 });
    setEditorMessage('Đã làm lại');
  };
  const saveLayout = () => {
    if (!editingRef.current) return;
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ version: LAYOUT_VERSION, layout, cameraPreset: preset, cameraPose }));
      setEditorMessage('Đã lưu trên thiết bị này');
    } catch {
      setEditorMessage('Không lưu được. Kiểm tra dung lượng trình duyệt.');
    }
  };
  const exportLayout = () => {
    if (!editingRef.current) return;
    const blob = new Blob([JSON.stringify({ version: LAYOUT_VERSION, layout, cameraPreset: preset, cameraPose }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tsn-airport-3d-layout.json';
    link.click();
    URL.revokeObjectURL(url);
    setEditorMessage('Đã xuất file bố cục');
  };
  const importLayout = async (file: File) => {
    if (!editingRef.current) return;
    if (file.size > 512_000) {
      setEditorMessage('File vượt quá giới hạn 500 KB');
      return;
    }
    try {
      const contents = await file.text();
      if (!editingRef.current) return;
      const document = JSON.parse(contents) as { cameraPreset?: unknown; cameraPose?: unknown };
      const imported = validateLayoutImport(document, defaults);
      rememberLayout(imported);
      const importedPose = validateCameraPose(document.cameraPose);
      if (importedPose) setCameraPose(importedPose);
      if (document.cameraPreset === 'follow' || document.cameraPreset === 'custom' || PRESETS.some(item => item.id === document.cameraPreset)) setPreset(document.cameraPreset as CameraPreset);
      setEditorMessage('Đã nhập file. Bấm Lưu bố cục để giữ trên thiết bị.');
    } catch (error) {
      setEditorMessage(error instanceof Error ? error.message : 'File bố cục không hợp lệ');
    }
  };
  const resetLayout = () => {
    rememberLayout(defaults);
    setSelectedLayoutId(defaults[0]?.id ?? null);
    setEditorMessage('Đã khôi phục bố cục mặc định; bấm Lưu để ghi lại');
  };
  const chooseSceneMode = (mode: SceneMode) => {
    setSceneMode(mode);
    if (mode !== 'airport') setEditing(false);
    if (props.state.practiceMode && (mode === 'gnd' || mode === 'twr')) {
      props.onSetControllerRole?.(mode === 'gnd' ? 'GND' : 'TWR');
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#181a1d]">
      <AirportToolbar sceneMode={sceneMode} preset={preset} presets={PRESETS} editing={editing}
        onScene={chooseSceneMode} onPreset={setPreset} onWorkstation={() => setWorkstation('gnd')}
        onEditor={() => editing ? setEditing(false) : setUnlockOpen(true)}
        onTerminal={() => {
          const terminalObj = layout.find(item => item.kind === 'terminal');
          const target: [number, number, number] = terminalObj ? terminalObj.position : getAssetZone(props.graph);
          setCameraPose({ position: [target[0] + 16, target[1] + 24, target[2] + 26], target });
          setPreset('custom');
          setScenePreferences(value => ({ ...value, modelsEnabled: true }));
        }}>
        <SceneSettings value={scenePreferences} onChange={setScenePreferences} />
      </AirportToolbar>
      {unlockOpen && <LayoutUnlockDialog onClose={() => setUnlockOpen(false)} onUnlock={() => { setEditing(true); setUnlockOpen(false); }} />}
      <div className="relative min-h-0 flex-1">
      <Canvas key={sceneMode} shadows={scenePreferences.shadows} gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.12 }} camera={{ position: inAirport ? airportCameraPosition : roomPosition, fov: inAirport ? 43 : sceneMode === 'room' ? 52 : 47, near: 0.1, far: 300 }} dpr={scenePreferences.quality === 'low' ? 1 : [1, 1.25]} onCreated={({ camera: activeCamera }) => activeCamera.lookAt(...(inAirport ? airportCameraTarget : roomTarget))}>
        <Suspense fallback={null}>
          <AirportScene
            {...props}
            layout={layout}
            editing={editing}
            selectedLayoutId={selectedLayoutId}
            onSelectLayout={setSelectedLayoutId}
            onMoveLayout={handleMoveLayout}
            preset={preset}
            cameraPosition={airportCameraPosition}
            cameraTarget={airportCameraTarget}
            cameraPose={cameraPose}
            onCameraPoseChange={handleCameraPoseChange}
            towerMode={inAirport ? undefined : sceneMode}
            showPeople={scenePreferences.people}
            vehicles={scenePreferences.vehicles}
            density={scenePreferences.quality === 'low' ? Math.min(2, scenePreferences.density) : scenePreferences.density}
            reflections={scenePreferences.reflections}
            modelsEnabled={scenePreferences.modelsEnabled}
            lightScale={scenePreferences.lightScale}
            onWorkstation={undefined}
          />
        </Suspense>
      </Canvas>
      {workstation && <div className="absolute inset-8 md:inset-12 z-20 flex flex-col overflow-hidden rounded-xl border border-cyan-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between bg-[#102849] px-4 py-2.5 text-white">
          <span className="font-bold text-xs tracking-wider">MÀN HÌNH {workstation.toUpperCase()} / THEO DÕI HỆ THỐNG FTG</span>
          <button type="button" onClick={() => setWorkstation(null)} className="rounded border border-slate-500 bg-slate-800/80 hover:bg-red-800 px-3 py-1 text-xs font-bold transition cursor-pointer" aria-label="Close workstation">✕ Đóng</button>
        </div>
        <div className="relative min-h-0 flex-1"><AirportMap graph={props.graph} state={props.state} renderMode="ftg" onSelectAircraft={props.onSelectAircraft} /></div>
      </div>}
      {inAirport && !editing && <SurfaceLegend state={props.state} />}
      {editing && inAirport && <LayoutInspector
        objects={layout}
        selectedId={selectedLayoutId}
        onSelect={setSelectedLayoutId}
        onAdjust={adjustSelected}
        onSetValue={setSelectedValue}
        onColor={setSelectedColor}
        onRename={handleRenameObject}
        onAddObject={handleAddObject}
        onDeleteObject={handleDeleteObject}
        onSave={saveLayout}
        onClose={() => setEditing(false)}
        onReset={resetLayout}
        onUndo={undoLayout}
        onRedo={redoLayout}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onExport={exportLayout}
        onImport={importLayout}
        message={editorMessage}
      />}
      <div className="absolute bottom-2 left-2 rounded bg-[#07111de8] px-2.5 py-1.5 text-[10px] text-slate-200 pointer-events-none">
        {inAirport ? 'Chuột trái: xoay · Cuộn: thu phóng · Chuột phải: di chuyển · Chạm/kéo: xoay · Chụm: thu phóng' : `PHIÊN ${props.state.scenario?.name ?? 'MÔ PHỎNG'} · ${props.state.isRunning ? props.state.isPaused ? 'TẠM DỪNG' : 'ĐANG CHẠY' : 'SẴN SÀNG'} · ${Math.floor(props.state.elapsedSeconds)} giây`}
      </div>
      </div>
    </div>
  );
}
