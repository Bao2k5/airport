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
  sanitizeManualFleet,
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
      if (saved.blockedEdgeIds && Array.isArray(saved.blockedEdgeIds)) {
        base.blockedEdgeIds = new Set(saved.blockedEdgeIds);
      }
      if (saved.manualFleet && Array.isArray(saved.manualFleet) && saved.manualFleet.length > 0) {
        base.manualFleet = sanitizeManualFleet(saved.manualFleet, baseGraph);
        const selectedId = saved.selectedAircraftId || 'VN001';
        const found = base.manualFleet.find((a: any) => a.id === selectedId) || base.manualFleet[0];
        base.aircraft = found;
        base.selectedAircraftId = found.id;
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
      const sanitized = sanitizeManualFleet(prev.manualFleet, currentGraph);
      const selectedAc = sanitized.find(a => a.id === aircraftId) || sanitized[0];
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
        manualFleet: sanitized,
        selectedAircraftId: selectedAc ? selectedAc.id : 'VN001',
        aircraft: selectedAc || prev.aircraft,
      };
    });
  }, [currentGraph]);

  const handleConfigChange = useCallback((patch: Partial<SimulationConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      setSimState(prevSim => {
        const sanitized = sanitizeManualFleet(prevSim.manualFleet, currentGraph);
        const selectedId = prevSim.selectedAircraftId || 'VN001';
        const blockedEdgeIds = prevSim.blockedEdgeIds;
        const updatedFleet = sanitized.map(ac => {
          if (ac.id !== selectedId) return ac;
          const newStart = patch.startNodeId ?? ac.currentNodeId;
          const newDest = patch.destinationNodeId ?? ac.targetNodeId;
          const newRoute = findPath(currentGraph, newStart, newDest, blockedEdgeIds) || [newStart];
          const newEdges = routeToEdges(newRoute, currentGraph.edges);
          const newAirlineCode = patch.airlineCode ?? ac.airlineCode ?? 'VN';
          const aDef = getAirlineDef(newAirlineCode);
          return {
            ...ac,
            // id is IMMUTABLE - never changes with form edit
            callsign: patch.callsign ? patch.callsign.toUpperCase() : ac.callsign,
            airlineCode: newAirlineCode as any,
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
      <div className="w-full h-full min-h-screen bg-[#F4F6F9] text-[#172033] flex flex-col overflow-x-hidden">
        {/* ── 1. Cảnh báo giáo dục VAA ── */}
        <header className="bg-[#0A1B36] border-b border-[#163363] text-[#BFDBFE] text-center py-1 px-3 text-[11px] sm:text-xs font-semibold tracking-wide flex-shrink-0 flex items-center justify-center gap-2">
          <span className="inline-block px-1.5 py-0.2 rounded bg-[#1E3A8A] text-white text-[10px] font-extrabold">VAA</span>
          <span>HỌC VIỆN HÀNG KHÔNG VIỆT NAM — MÔ PHỎNG GIÁO DỤC (KHÔNG DÙNG TRONG HOẠT ĐỘNG THỰC TẾ)</span>
        </header>

        {/* ── Watchdog Recovery Bar (Khi loop bị nghẽn) ── */}
        {watchdogStalled && (
          <div className="bg-[#FFFBEB] border-b border-[#FCD34D] text-[#92400E] px-4 py-2 text-xs flex items-center justify-between z-50 shadow-sm flex-shrink-0 animate-pulse">
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
              className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg transition text-xs shadow-sm cursor-pointer min-h-[36px] flex items-center gap-1"
            >
              <span>▶</span> Tiếp tục mô phỏng
            </button>
          </div>
        )}

        {/* ── 2. Thanh tiêu đề Header chuẩn VAA ── */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#0D254C] border-b border-[#193B70] text-white flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* VAA Wing Emblem SVG Logo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#0D254C] p-1 flex items-center justify-center border border-[#3B82F6]/30 flex-shrink-0 shadow-2xs">
              <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                <path d="M12 44L28 20L34 29L20 44H12Z" fill="#FFFFFF"/>
                <path d="M26 44L42 16L52 30L34 44H26Z" fill="#25C6CB"/>
                <path d="M16 48H48L52 52H12L16 48Z" fill="#E8A72B"/>
              </svg>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm text-[#E8A72B] tracking-wider">VAA</span>
                <span className="text-gray-400 text-xs">|</span>
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                  <span className="hidden sm:inline">Mô Phỏng Mặt Đất Sân Bay</span>
                  <span className="sm:hidden">Mô Phỏng Sân Bay</span>
                </h1>
                <span className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#173A73] text-[#93C5FD] border border-[#2563EB]/40 font-semibold">
                  FtG Simulator
                </span>
              </div>
              <span className="text-[10px] text-[#CBD5E1] truncate hidden sm:block">
                Học viện Hàng không Việt Nam · Hệ thống huấn luyện A-SMGCS & Follow-the-Green
              </span>
            </div>
          </div>

          {/* Bộ chọn Đồ thị & Nút Hành Động */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Bộ chọn Model/Graph */}
            <div className="flex items-center gap-1 bg-[#0A1B36] px-2 py-1 rounded-lg border border-[#1E3A8A]">
              <span className="text-[11px] text-[#93C5FD] font-medium hidden md:inline">Mô hình:</span>
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
                className="bg-[#173A73] text-xs font-bold text-white rounded px-2 py-0.5 border border-[#3B82F6]/50 focus:outline-none focus:border-[#60A5FA] cursor-pointer"
              >
                <option value="v1">Graph V1 (127 nodes)</option>
                <option value="v2">Graph V2 (162 nodes)</option>
              </select>
            </div>

            {/* Desktop Overlay Toggles */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setShowGraphV2Overlay(v => !v)}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  showGraphV2Overlay
                    ? 'bg-[#1C67DA] text-white border-[#3B82F6]'
                    : 'bg-[#173A73] hover:bg-[#1E4A8E] text-[#CBD5E1] border-[#1E3A8A]'
                }`}
                title="Bật/Tắt hiển thị lớp phủ mạng lưới Graph V2"
              >
                {showGraphV2Overlay ? '👁️ Ẩn V2' : '🌐 Overlay V2'}
              </button>
              
              <button
                onClick={() => setShowGrid(v => !v)}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  showGrid ? 'bg-[#E8A72B] text-black border-[#FDE047]' : 'bg-[#173A73] hover:bg-[#1E4A8E] text-[#CBD5E1] border-[#1E3A8A]'
                }`}
                title="Lưới tọa độ"
              >
                Grid
              </button>

              <button
                onClick={() => setShowPaths(v => !v)}
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                  showPaths ? 'bg-[#16845B] text-white border-[#86EFAC]' : 'bg-[#173A73] hover:bg-[#1E4A8E] text-[#CBD5E1] border-[#1E3A8A]'
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
                className="px-2 py-1 rounded-lg bg-[#173A73] border border-[#1E3A8A] text-white text-xs font-bold flex items-center gap-1"
              >
                <span>⚙ Lớp phủ</span>
              </button>
              {showMobileMapMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#CBD5E1] rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1.5 text-[#172033]">
                  <button
                    onClick={() => { setShowGraphV2Overlay(v => !v); setShowMobileMapMenu(false); }}
                    className="text-left text-xs p-1.5 rounded hover:bg-[#F1F5F9] font-medium"
                  >
                    {showGraphV2Overlay ? '✓ Ẩn Overlay V2' : '🌐 Hiện Overlay V2'}
                  </button>
                  <button
                    onClick={() => { setShowGrid(v => !v); setShowMobileMapMenu(false); }}
                    className="text-left text-xs p-1.5 rounded hover:bg-[#F1F5F9] font-medium"
                  >
                    {showGrid ? '✓ Tắt Lưới Grid' : '📐 Hiện Lưới Grid'}
                  </button>
                  <button
                    onClick={() => { setShowPaths(v => !v); setShowMobileMapMenu(false); }}
                    className="text-left text-xs p-1.5 rounded hover:bg-[#F1F5F9] font-medium"
                  >
                    {showPaths ? '✓ Tắt Hiện Tuyến Paths' : '🛣 Hiện Tuyến Paths'}
                  </button>
                </div>
              )}
            </div>

            {/* Nút Hướng dẫn */}
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 bg-[#1C67DA] hover:bg-[#1558BC] active:bg-[#0F4499] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              <span className="leading-none font-bold">?</span>
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>
          </div>
        </div>

        {/* ── 3. Bố cục Desktop & Tablet (>= 768px) ── */}
        <div className="hidden md:flex flex-1 gap-3 p-3 overflow-hidden min-h-0">
          {/* Bản đồ sân bay bọc Error Boundary & Card sáng */}
          <div className="flex-1 min-w-0 min-h-0 relative bg-white rounded-xl border border-[#E6ECF0] shadow-sm p-1 flex flex-col">
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
              <div className="flex bg-[#E2E8F0] p-1 rounded-xl">
                <button
                  data-testid="desktop-tab-control"
                  onClick={() => {
                    if (simState.scenario) {
                      setSimState(prev => resetToManualMode(prev, currentGraph));
                    }
                    setDesktopTab('control');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    desktopTab === 'control'
                      ? 'bg-[#0D254C] text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#0D254C]'
                  }`}
                >
                  Điều khiển
                </button>
                <button
                  data-testid="desktop-tab-scenarios"
                  onClick={() => setDesktopTab('scenarios')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    desktopTab === 'scenarios'
                      ? 'bg-[#0D254C] text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#0D254C]'
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
                  <ScenarioPanel state={simState} graph={currentGraph} />
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
          <div className="w-full bg-white border-t border-[#E2E8F0] flex flex-col z-30 shadow-2xl flex-shrink-0">
            {/* Header Tab Bar của Mobile Bottom Sheet */}
            <div className="flex items-center justify-between p-1.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <div className="flex flex-1 gap-1">
                <button
                  data-testid="mobile-tab-control"
                  onClick={() => {
                    if (simState.scenario) {
                      setSimState(prev => resetToManualMode(prev, currentGraph));
                    }
                    setMobileTab('control');
                    setSheetExpanded(true);
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === 'control' && sheetExpanded
                      ? 'bg-[#0D254C] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#0D254C]'
                  }`}
                >
                  Điều khiển
                </button>
                <button
                  data-testid="mobile-tab-status"
                  onClick={() => {
                    setMobileTab('status');
                    setSheetExpanded(true);
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === 'status' && sheetExpanded
                      ? 'bg-[#0D254C] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#0D254C]'
                  }`}
                >
                  Trực tiếp
                  {simState.isRunning && (
                    <span className="w-2 h-2 rounded-full bg-[#16845B] animate-ping ml-1" />
                  )}
                </button>
                <button
                  data-testid="mobile-tab-scenarios"
                  onClick={() => {
                    setMobileTab('scenarios');
                    setSheetExpanded(true);
                  }}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    mobileTab === 'scenarios' && sheetExpanded
                      ? 'bg-[#0D254C] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#0D254C]'
                  }`}
                >
                  Kịch bản mẫu
                </button>
              </div>

              {/* Nút Thu gọn / Mở rộng Bottom Sheet */}
              <button
                onClick={() => setSheetExpanded(v => !v)}
                className="ml-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F1F5F9] text-[#334155] text-xs font-bold border border-[#CBD5E1] transition flex items-center gap-1 cursor-pointer shadow-2xs"
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
                className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] cursor-pointer hover:bg-[#F1F5F9] transition"
              >
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#0D254C] font-bold">{activeAircraft?.callsign || 'VN001'}</span>
                  <span className="text-[#CBD5E1]">|</span>
                  <span className="text-[#16845B] font-bold">{activeAircraft?.speedKts.toFixed(0) || 0} kts</span>
                  <span className="text-[#CBD5E1]">|</span>
                  <span className="text-[#D97706] font-bold uppercase">{activeAircraft?.status || 'PARKED'}</span>
                </div>
                <span className="text-xs text-[#1C67DA] font-bold flex items-center gap-1">
                  Chạm để mở rộng ▲
                </span>
              </div>
            )}

            {/* Nội dung Tab Panel */}
            {sheetExpanded && (
              <div className="max-h-[52vh] overflow-y-auto p-3 flex flex-col gap-3 bg-[#F4F6F9]">
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
                      <ScenarioPanel state={simState} graph={currentGraph} />
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

