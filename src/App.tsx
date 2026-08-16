import { useState, useEffect, useRef, useCallback } from 'react';
import AirportMap from './components/AirportMap';
import ControlPanel from './components/ControlPanel';
import StatusPanel from './components/StatusPanel';
import ScenarioPanel from './components/ScenarioPanel';
import HuongDanModal from './components/HuongDanModal';
import ErrorBoundary from './components/ErrorBoundary';
import {
  initSimulation,
  simulationTick,
  acceptRoute,
  setIncidentEdge,
  clearIncidents,
  randomIncidentEdge,
  startManualAircraft,
  resetManualAircraft,
  resetToManualMode,
} from './simulation/simulator';
import { findPath, routeToEdges } from './simulation/pathfinding';
import { getAirlineDef } from './data/airlineTypes';
import {
  saveStateToStorage,
  loadStateFromStorage,
  checkReloadGuard,
} from './utils/persistence';
import type { SimulationConfig, SimulationState } from './types';

import PresetScenariosPanel from './components/PresetScenariosPanel';
import { startScenario, scenarioTick } from './simulation/scenarioRunner';
import {
  GRAPH_REGISTRY,
  DEFAULT_GRAPH_ID,
  type GraphId,
  getAirportGraph,
} from './data/graphRegistry';

const DEFAULT_CONFIG: SimulationConfig = {
  startNodeId:       'P1',
  destinationNodeId: 'RWY07L_THR',
  callsign:          'VN001',
  airlineCode:       'VJ',
  aircraftType:      'A321',
  weather:           'clear',
  timeOfDay:         'morning',
  trafficLevel:      'low',
  taxiSpeedKts:      15,
  incident:          'none',
  incidentEdgeId:    null,
  autoReroute:       true,
};

// Số giây mô phỏng trên mỗi giây thực
const TIME_SCALE = 8;

export default function App() {
  // Check reload guard on start
  useEffect(() => {
    checkReloadGuard();
  }, []);

  const [selectedGraphId, setSelectedGraphId] = useState<GraphId>(() => {
    const saved = loadStateFromStorage();
    return (saved?.selectedGraphId === 'v2' || saved?.selectedGraphId === 'v1')
      ? saved.selectedGraphId
      : DEFAULT_GRAPH_ID;
  });

  const [config, setConfig] = useState<SimulationConfig>(() => {
    const saved = loadStateFromStorage();
    return saved?.config ? { ...DEFAULT_CONFIG, ...saved.config } : DEFAULT_CONFIG;
  });

  const [simState, setSimState] = useState<SimulationState>(() => {
    const saved = loadStateFromStorage();
    const graphId = (saved?.selectedGraphId === 'v2' || saved?.selectedGraphId === 'v1')
      ? saved.selectedGraphId
      : DEFAULT_GRAPH_ID;
    const baseGraph = getAirportGraph(graphId);
    const initialConfig = saved?.config ? { ...DEFAULT_CONFIG, ...saved.config } : DEFAULT_CONFIG;
    const base = initSimulation(initialConfig, baseGraph);
    if (saved) {
      if (saved.selectedAircraftId) base.selectedAircraftId = saved.selectedAircraftId;
      if (saved.blockedEdgeIds && Array.isArray(saved.blockedEdgeIds)) {
        base.blockedEdgeIds = new Set(saved.blockedEdgeIds);
      }
      if (saved.manualFleet && Array.isArray(saved.manualFleet) && saved.manualFleet.length > 0) {
        base.manualFleet = saved.manualFleet;
        const found = saved.manualFleet.find((a: any) => a.id === saved.selectedAircraftId) || saved.manualFleet[0];
        base.aircraft = found;
      }
      if (saved.elapsedSeconds) base.elapsedSeconds = saved.elapsedSeconds;
    }
    return base;
  });
  
  // Desktop tabs: 'control' | 'scenarios'
  const [desktopTab, setDesktopTab] = useState<'control' | 'scenarios'>('control');
  
  // Mobile tabs: 'control' | 'status' | 'scenarios'
  const [mobileTab, setMobileTab] = useState<'control' | 'status' | 'scenarios'>('control');
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [showMobileMapMenu, setShowMobileMapMenu] = useState(false);

  const [showGuide, setShowGuide] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showGraphV2Overlay, setShowGraphV2Overlay] = useState(false);
  const [autoIncidents, setAutoIncidents] = useState(false);

  // Watchdog state
  const [watchdogStalled, setWatchdogStalled] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  const currentGraphEntry = GRAPH_REGISTRY[selectedGraphId] ?? GRAPH_REGISTRY.v1;
  const currentGraph = getAirportGraph(selectedGraphId);

  // Auto-save state to localStorage (debounced 600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStateToStorage(selectedGraphId, config, simState);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedGraphId, config, simState]);

  // Vòng lặp mô phỏng qua requestAnimationFrame có hỗ trợ tạm dừng khi tab bị ẩn
  useEffect(() => {
    if (!simState.isRunning || simState.isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }

    const frame = (now: number) => {
      // Cập nhật timestamp tick cho Watchdog
      lastTickTimeRef.current = Date.now();
      if (watchdogStalled) {
        setWatchdogStalled(false);
      }

      // Khi tab bị ẩn hoặc màn hình khóa, không tính toán step thừa
      if (document.hidden) {
        lastTimeRef.current = now;
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      if (lastTimeRef.current !== null) {
        const wallDt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        const dt = wallDt * TIME_SCALE;
        setSimState(prev => {
          if (prev.scenario) {
            return scenarioTick(prev, dt, currentGraph);
          }
          return simulationTick(prev, dt, currentGraph);
        });
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(frame);
    };

    lastTickTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [simState.isRunning, simState.isPaused, simState.scenario, currentGraph, watchdogStalled]);

  // ── SIMULATION WATCHDOG TIMER ──────────────────────────────────────────────
  // Giám sát requestAnimationFrame: nếu không có tick trong >2 giây khi đang chạy:
  // 1. Ghi cảnh báo vào nhật ký sự kiện
  // 2. Tự khởi động lại animation loop một lần
  // 3. Nếu vẫn không phục hồi sau 4s, hiển thị thanh "Tiếp tục mô phỏng" mà KHÔNG reset máy bay/tuyến đường.
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      if (simState.isRunning && !simState.isPaused && !document.hidden) {
        const timeSinceLastTick = Date.now() - lastTickTimeRef.current;
        if (timeSinceLastTick > 2000) {
          console.warn(`[Simulation-Watchdog] No tick in ${timeSinceLastTick}ms. Attempting safe loop restart...`);
          
          setSimState(prev => {
            const warningText = 'Cảnh báo Watchdog: Vòng lặp mô phỏng bị gián đoạn (>2s). Đang tự động khôi phục animation loop...';
            const logItem = {
              id: `wd-${Date.now()}`,
              atSeconds: prev.elapsedSeconds,
              message: warningText,
              severity: 'warning' as const,
            };
            return {
              ...prev,
              warningMessage: warningText,
              liveEventLog: [logItem, ...prev.liveEventLog.slice(0, 49)],
            };
          });

          // Restart animation loop safely
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          lastTimeRef.current = performance.now();
          lastTickTimeRef.current = Date.now();
          rafRef.current = requestAnimationFrame((now) => {
            lastTimeRef.current = now;
          });

          if (timeSinceLastTick > 4000) {
            setWatchdogStalled(true);
          }
        } else {
          if (watchdogStalled) {
            setWatchdogStalled(false);
          }
        }
      }
    }, 500);

    return () => clearInterval(watchdogInterval);
  }, [simState.isRunning, simState.isPaused, watchdogStalled]);

  const handleSelectAircraft = useCallback((aircraftId: string) => {
    setSimState(prev => {
      const fleet = prev.manualFleet || [];
      const selectedAc = fleet.find(a => a.id === aircraftId);
      if (selectedAc) {
        setConfig(c => ({
          ...c,
          callsign: selectedAc.callsign,
          airlineCode: selectedAc.airlineCode || 'VN',
          aircraftType: selectedAc.aircraftType || 'A321',
          startNodeId: selectedAc.currentNodeId,
          destinationNodeId: selectedAc.targetNodeId,
        }));
      }
      return {
        ...prev,
        selectedAircraftId: aircraftId,
        aircraft: selectedAc || prev.aircraft,
      };
    });
  }, []);

  const handleConfigChange = useCallback((patch: Partial<SimulationConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      setSimState(prevSim => {
        const selectedId = prevSim.selectedAircraftId || 'VN001';
        const blockedEdgeIds = prevSim.blockedEdgeIds;
        const updatedFleet = (prevSim.manualFleet || []).map(ac => {
          if (ac.id !== selectedId) return ac;
          const newStart = patch.startNodeId ?? ac.currentNodeId;
          const newDest = patch.destinationNodeId ?? ac.targetNodeId;
          const newRoute = findPath(currentGraph, newStart, newDest, blockedEdgeIds) || [newStart];
          const newEdges = routeToEdges(newRoute, currentGraph.edges);
          const aDef = getAirlineDef(patch.airlineCode || patch.callsign || ac.airlineCode || 'VN');
          return {
            ...ac,
            callsign: patch.callsign ?? ac.callsign,
            airlineCode: (patch.airlineCode ?? ac.airlineCode ?? 'VN') as any,
            airlineName: aDef.name,
            aircraftAsset: aDef.asset,
            aircraftType: patch.aircraftType ?? ac.aircraftType ?? 'A321',
            currentNodeId: newStart,
            targetNodeId: newDest,
            assignedRoute: newRoute,
            routeEdgeIndex: 0,
            progressOnEdge: 0,
            currentEdgeId: newEdges ? newEdges[0] : null,
            routeVisible: ac.status === 'taxiing',
            guidanceVisible: ac.status === 'taxiing',
            isMoving: ac.status === 'taxiing',
            status: ac.status === 'taxiing' ? ('taxiing' as const) : ('parked' as const),
          };
        });
        const activeAc = updatedFleet.find(a => a.id === selectedId) || updatedFleet[0] || null;
        return {
          ...prevSim,
          manualFleet: updatedFleet,
          aircraft: activeAc,
          config: next,
        };
      });
      return next;
    });
  }, [currentGraph]);

  const handleStart = useCallback(() => {
    setSimState(prev => {
      const selectedId = prev.selectedAircraftId || 'VN001';
      return startManualAircraft(prev, selectedId, currentGraph);
    });
    // Tự động chuyển về tab trạng thái trực tiếp trên mobile
    setMobileTab('status');
    setSheetExpanded(true);
  }, [currentGraph]);

  const handlePause = useCallback(() => {
    setSimState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const handleAcceptRoute = useCallback(() => {
    setSimState(prev => acceptRoute(prev, currentGraph));
  }, [currentGraph]);

  const handleTriggerIncident = useCallback(() => {
    setSimState(prev => {
      const edgeId = randomIncidentEdge(prev, currentGraph);
      if (!edgeId) return prev;
      return setIncidentEdge(prev, edgeId, true, currentGraph);
    });
    setConfig(prev => (prev.incident === 'none' ? { ...prev, incident: 'blocked_taxiway' } : prev));
  }, [currentGraph]);

  const handleClearIncidents = useCallback(() => {
    setSimState(prev => clearIncidents(prev, currentGraph));
    setConfig(prev => ({ ...prev, incident: 'none', incidentEdgeId: null }));
  }, [currentGraph]);

  useEffect(() => {
    if (!autoIncidents || !simState.isRunning || simState.isPaused) return;
    const interval = setInterval(() => {
      setSimState(prev => {
        if (!prev.isRunning || prev.isPaused || !prev.aircraft) return prev;
        if (prev.aircraft.status !== 'taxiing') return prev;
        const edgeId = randomIncidentEdge(prev, currentGraph);
        if (!edgeId) return prev;
        return setIncidentEdge(prev, edgeId, true, currentGraph);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [autoIncidents, simState.isRunning, simState.isPaused, currentGraph]);

  const handleReset = useCallback(() => {
    setSimState(prev => {
      if (prev.scenario) {
        return resetToManualMode(prev, currentGraph);
      }
      const selectedId = prev.selectedAircraftId || 'VN001';
      return resetManualAircraft(prev, selectedId, currentGraph);
    });
  }, [currentGraph]);

  const handleExitScenario = useCallback(() => {
    setSimState(prev => resetToManualMode(prev, currentGraph));
    setDesktopTab('control');
    setMobileTab('control');
    setSheetExpanded(true);
  }, [currentGraph]);

  const handleStartScenario = useCallback((scId: string) => {
    setSimState(startScenario(scId, currentGraph));
    setMobileTab('status');
    setSheetExpanded(true);
  }, [currentGraph]);

  const activeAircraft = (simState.manualFleet && simState.manualFleet.length > 0)
    ? (simState.manualFleet.find(a => a.id === (simState.selectedAircraftId || 'VN001')) || simState.manualFleet[0])
    : simState.aircraft;


  return (
    <ErrorBoundary name="Ứng dụng mô phỏng sân bay" fallbackTitle="Đã xảy ra sự cố trong ứng dụng">
      <div className="w-full h-full min-h-screen bg-[#0c0f12] text-gray-100 flex flex-col overflow-x-hidden">
        {/* ── 1. Cảnh báo giáo dục ── */}
        <header className="bg-amber-950 border-b border-amber-800 text-amber-200 text-center py-1 px-3 text-[11px] sm:text-xs font-semibold tracking-wide flex-shrink-0">
          CHỈ DÙNG CHO MỤC ĐÍCH GIÁO DỤC — KHÔNG SỬ DỤNG TRONG HOẠT ĐỘNG HÀNG KHÔNG THỰC TẾ
        </header>

        {/* ── Watchdog Recovery Bar (Khi loop bị nghẽn) ── */}
        {watchdogStalled && (
          <div className="bg-amber-900 border-b border-amber-600 text-amber-100 px-4 py-2 text-xs flex items-center justify-between z-50 shadow-lg flex-shrink-0 animate-pulse">
            <span className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span> Mô phỏng bị gián đoạn vòng lặp. Vị trí và tuyến đường đã được bảo toàn.
            </span>
            <button
              onClick={() => {
                lastTickTimeRef.current = Date.now();
                lastTimeRef.current = performance.now();
                setWatchdogStalled(false);
                setSimState(prev => ({ ...prev, isRunning: true, isPaused: false }));
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold rounded-lg transition text-xs shadow cursor-pointer min-h-[36px] flex items-center gap-1"
            >
              <span>▶</span> Tiếp tục mô phỏng
            </button>
          </div>
        )}

        {/* ── 2. Thanh tiêu đề Header ── */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#111620] border-b border-[#1e2838] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logotruong.png" alt="Logo" className="w-6 h-6 object-contain inline-block rounded-sm flex-shrink-0" />
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
              <span className="hidden sm:inline">Mô Phỏng Di Chuyển Mặt Đất Sân Bay</span>
              <span className="sm:hidden">Mô Phỏng Sân Bay</span>
            </h1>
          </div>

          {/* Bộ chọn Đồ thị & Nút Hành Động */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Bộ chọn Model/Graph (Bảo toàn Graph V2 khi chọn, không âm thầm fallback) */}
            <div className="flex items-center gap-1 bg-[#0a0e14] px-2 py-1 rounded-lg border border-[#223044]">
              <span className="text-[11px] text-gray-400 font-medium hidden md:inline">Mô hình:</span>
              <select
                value={selectedGraphId}
                onChange={(e) => {
                  const newId = e.target.value as GraphId;
                  setSelectedGraphId(newId);
                  const newGraph = getAirportGraph(newId);
                  if (simState.scenario) {
                    setSimState(startScenario(simState.scenario.id, newGraph));
                  } else {
                    const hasStart = newGraph.nodes.some(n => n.id === config.startNodeId);
                    const hasDest = newGraph.nodes.some(n => n.id === config.destinationNodeId);
                    const nextConfig: SimulationConfig = {
                      ...config,
                      startNodeId: hasStart ? config.startNodeId : (newId === 'v2' ? 'HS3' : 'DOM_S1'),
                      destinationNodeId: hasDest ? config.destinationNodeId : (newId === 'v2' ? 'RWY07L_THR' : 'RWY07L_THR'),
                    };
                    setConfig(nextConfig);
                    setSimState(initSimulation(nextConfig, newGraph));
                  }
                }}
                className="bg-[#151c28] text-xs font-semibold text-cyan-300 rounded px-1.5 py-0.5 border border-cyan-500/40 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="v1">Graph V1 (127 nodes)</option>
                <option value="v2">Graph V2 (162 nodes)</option>
              </select>
            </div>

            {/* Desktop Overlay Toggles (Hidden on mobile < 768px) */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setShowGraphV2Overlay(v => !v)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  showGraphV2Overlay
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400'
                    : 'bg-[#151c28] hover:bg-[#1e2838] text-gray-300 border-[#223044]'
                }`}
                title="Bật/Tắt hiển thị lớp phủ mạng lưới Graph V2"
              >
                {showGraphV2Overlay ? '👁️ Ẩn V2' : '🌐 Overlay V2'}
              </button>
              
              <button
                onClick={() => setShowGrid(v => !v)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  showGrid ? 'bg-red-500 hover:bg-red-400 text-black border-red-400' : 'bg-[#151c28] hover:bg-[#1e2838] text-gray-400 border-[#223044]'
                }`}
                title="Lưới tọa độ"
              >
                Grid
              </button>

              <button
                onClick={() => setShowPaths(v => !v)}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border transition cursor-pointer ${
                  showPaths ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400' : 'bg-[#151c28] hover:bg-[#1e2838] text-gray-400 border-[#223044]'
                }`}
                title="Tất cả tuyến đường"
              >
                Paths
              </button>
            </div>

            {/* Mobile Map Options Dropdown Toggle */}
            <div className="relative md:hidden">
              <button
                onClick={() => setShowMobileMapMenu(v => !v)}
                className="px-2 py-1 rounded-lg bg-[#151c28] border border-[#223044] text-gray-300 text-xs font-semibold flex items-center gap-1"
              >
                <span>⚙ Lớp phủ</span>
              </button>
              {showMobileMapMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#111620] border border-[#223044] rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1.5">
                  <button
                    onClick={() => { setShowGraphV2Overlay(v => !v); setShowMobileMapMenu(false); }}
                    className="text-left text-xs p-1.5 rounded hover:bg-[#1f293d] text-gray-200"
                  >
                    {showGraphV2Overlay ? '✓ Ẩn Overlay V2' : '🌐 Hiện Overlay V2'}
                  </button>
                  <button
                    onClick={() => { setShowGrid(v => !v); setShowMobileMapMenu(false); }}
                    className="text-left text-xs p-1.5 rounded hover:bg-[#1f293d] text-gray-200"
                  >
                    {showGrid ? '✓ Tắt Lưới Grid' : '📐 Hiện Lưới Grid'}
                  </button>
                  <button
                    onClick={() => { setShowPaths(v => !v); setShowMobileMapMenu(false); }}
                    className="text-left text-xs p-1.5 rounded hover:bg-[#1f293d] text-gray-200"
                  >
                    {showPaths ? '✓ Tắt Hiện Tuyến Paths' : '🛣 Hiện Tuyến Paths'}
                  </button>
                </div>
              )}
            </div>

            {/* Nút Hướng dẫn */}
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              <span className="leading-none font-bold">?</span>
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>
          </div>
        </div>

        {/* ── 3. Bố cục Desktop & Tablet (>= 768px) ── */}
        <div className="hidden md:flex flex-1 gap-3 p-3 overflow-hidden min-h-0">
          {/* Bản đồ sân bay bọc Error Boundary */}
          <div className="flex-1 min-w-0 min-h-0 relative">
            <ErrorBoundary name="Bản đồ sân bay" fallbackTitle="Lỗi hiển thị bản đồ">
              <AirportMap
                state={simState}
                graph={currentGraph}
                bgImage={currentGraphEntry.bgImage}
                onSelectAircraft={handleSelectAircraft}
                showPaths={showPaths}
                showGrid={showGrid}
                showGraphV2Overlay={showGraphV2Overlay}
              />
            </ErrorBoundary>
          </div>

          {/* Thanh bên phải bọc Error Boundary */}
          <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
            <ErrorBoundary name="Thanh điều khiển bên phải" fallbackTitle="Lỗi bảng điều khiển">
              {/* Tab Switcher */}
              <div className="flex bg-[#111620] p-1 rounded-xl border border-[#1e2838]">
                <button
                  onClick={() => {
                    if (simState.scenario) {
                      setSimState(prev => resetToManualMode(prev, currentGraph));
                    }
                    setDesktopTab('control');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    desktopTab === 'control'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Điều khiển
                </button>
                <button
                  onClick={() => setDesktopTab('scenarios')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    desktopTab === 'scenarios'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Kịch bản mẫu
                </button>
              </div>

              {desktopTab === 'control' ? (
                <>
                  <ControlPanel
                    config={config}
                    graph={currentGraph}
                    manualFleet={simState.manualFleet}
                    selectedAircraftId={simState.selectedAircraftId}
                    onSelectAircraft={handleSelectAircraft}
                    onConfigChange={handleConfigChange}
                    onAcceptRoute={handleAcceptRoute}
                    onStart={handleStart}
                    onPause={handlePause}
                    onReset={handleReset}
                    routeStatus={simState.routeStatus}
                    isRunning={simState.isRunning}
                    isPaused={simState.isPaused}
                    canStart={!!simState.aircraft || (simState.manualFleet?.length ?? 0) > 0}
                    blockedCount={simState.blockedEdgeIds.size}
                    autoIncidents={autoIncidents}
                    onToggleAutoIncidents={() => setAutoIncidents(v => !v)}
                    onTriggerIncident={handleTriggerIncident}
                    onClearIncidents={handleClearIncidents}
                  />
                  <StatusPanel state={simState} graph={currentGraph} />
                  <ScenarioPanel state={simState} />
                </>
              ) : (
                <>
                  <PresetScenariosPanel
                    state={simState}
                    graph={currentGraph}
                    onStartScenario={handleStartScenario}
                    onExitScenario={handleExitScenario}
                  />
                  <StatusPanel state={simState} graph={currentGraph} />
                </>
              )}
            </ErrorBoundary>
          </div>
        </div>

        {/* ── 4. Bố cục Điện Thoại Di Động (< 768px) ── */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden relative min-h-0">
          {/* Bản đồ chiếm toàn bộ chiều rộng màn hình */}
          <div className="flex-1 w-full relative min-h-[220px]">
            <ErrorBoundary name="Bản đồ sân bay (Mobile)" fallbackTitle="Lỗi hiển thị bản đồ">
              <AirportMap
                state={simState}
                graph={currentGraph}
                bgImage={currentGraphEntry.bgImage}
                onSelectAircraft={handleSelectAircraft}
                showPaths={showPaths}
                showGrid={showGrid}
                showGraphV2Overlay={showGraphV2Overlay}
              />
            </ErrorBoundary>
          </div>

          {/* Mobile Bottom Dock / Bottom Sheet */}
          <div className="w-full bg-[#111620] border-t border-[#1e2838] flex flex-col z-30 shadow-2xl flex-shrink-0">
            {/* Header Tab Bar của Mobile Bottom Sheet */}
            <div className="flex items-center justify-between p-1.5 bg-[#0a0e14] border-b border-[#1e2838]">
              <div className="flex flex-1 gap-1">
                <button
                  onClick={() => {
                    if (simState.scenario) {
                      setSimState(prev => resetToManualMode(prev, currentGraph));
                    }
                    setMobileTab('control');
                    setSheetExpanded(true);
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === 'control' && sheetExpanded
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Điều khiển
                </button>
                <button
                  onClick={() => {
                    setMobileTab('status');
                    setSheetExpanded(true);
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === 'status' && sheetExpanded
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Trực tiếp
                  {simState.isRunning && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setMobileTab('scenarios');
                    setSheetExpanded(true);
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === 'scenarios' && sheetExpanded
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Kịch bản mẫu
                </button>
              </div>

              {/* Nút Thu gọn / Mở rộng Bottom Sheet */}
              <button
                onClick={() => setSheetExpanded(v => !v)}
                className="ml-2 px-2.5 py-1.5 rounded-lg bg-[#151c28] hover:bg-[#1e2838] text-gray-300 text-xs font-bold border border-[#223044] transition flex items-center gap-1 cursor-pointer"
                title={sheetExpanded ? 'Thu gọn bảng điều khiển' : 'Mở rộng bảng điều khiển'}
                aria-label={sheetExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                <span>{sheetExpanded ? '▼ Ẩn' : '▲ Mở'}</span>
              </button>
            </div>

            {/* Peek Mini Bar khi Thu Gọn */}
            {!sheetExpanded && (
              <div
                onClick={() => setSheetExpanded(true)}
                className="flex items-center justify-between px-3 py-2 bg-[#111620] cursor-pointer hover:bg-[#151c28] transition"
              >
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-cyan-300 font-bold">{activeAircraft?.callsign || 'VN001'}</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-green-400 font-semibold">{activeAircraft?.speedKts.toFixed(0) || 0} kts</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-amber-400 font-bold uppercase">{activeAircraft?.status || 'PARKED'}</span>
                </div>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  Chạm để mở rộng ▲
                </span>
              </div>
            )}

            {/* Nội dung Tab Panel */}
            {sheetExpanded && (
              <div className="max-h-[52vh] overflow-y-auto p-3 flex flex-col gap-3">
                <ErrorBoundary name="Bảng điều khiển Mobile" fallbackTitle="Lỗi bảng điều khiển">
                  {mobileTab === 'control' && (
                    <>
                      <ControlPanel
                        config={config}
                        graph={currentGraph}
                        manualFleet={simState.manualFleet}
                        selectedAircraftId={simState.selectedAircraftId}
                        onSelectAircraft={handleSelectAircraft}
                        onConfigChange={handleConfigChange}
                        onAcceptRoute={handleAcceptRoute}
                        onStart={handleStart}
                        onPause={handlePause}
                        onReset={handleReset}
                        routeStatus={simState.routeStatus}
                        isRunning={simState.isRunning}
                        isPaused={simState.isPaused}
                        canStart={!!simState.aircraft || (simState.manualFleet?.length ?? 0) > 0}
                        blockedCount={simState.blockedEdgeIds.size}
                        autoIncidents={autoIncidents}
                        onToggleAutoIncidents={() => setAutoIncidents(v => !v)}
                        onTriggerIncident={handleTriggerIncident}
                        onClearIncidents={handleClearIncidents}
                      />
                      <ScenarioPanel state={simState} />
                    </>
                  )}

                  {mobileTab === 'status' && (
                    <StatusPanel state={simState} graph={currentGraph} />
                  )}

                  {mobileTab === 'scenarios' && (
                    <PresetScenariosPanel
                      state={simState}
                      graph={currentGraph}
                      onStartScenario={handleStartScenario}
                      onExitScenario={handleExitScenario}
                    />
                  )}
                </ErrorBoundary>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. Modal Hướng Dẫn ── */}
        {showGuide && <HuongDanModal onClose={() => setShowGuide(false)} />}
      </div>
    </ErrorBoundary>
  );
}

