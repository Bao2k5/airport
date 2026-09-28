import { startFtgScenario } from './features/airport3d/ftgScenarios';
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import AirportMap from './components/AirportMap';
import ControlPanel from './components/ControlPanel';
import StatusPanel from './components/StatusPanel';
import ScenarioPanel from './components/ScenarioPanel';
import HuongDanModal from './components/HuongDanModal';
import PathInspectorModal from './components/PathInspectorModal';
import VaaLogo from './components/VaaLogo';
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
  resetAllManualAircraft,
  resetToManualMode,
  sanitizeManualFleet,
  computeLightStates,
} from './simulation/simulator';
import { findPath, routeToEdges } from './simulation/pathfinding';
import { getAirlineDef } from './data/airlineTypes';
import {
  saveStateToStorage,
  loadStateFromStorage,
  clearPersistedState,
  checkReloadGuard,
} from './utils/persistence';
import type { SimulationConfig, SimulationState } from './types';

import PresetScenariosPanel from './components/PresetScenariosPanel';
import Scenario5ComparisonView from './components/ScenarioComparisonView';
import Scenario1ComparisonView from './components/Scenario1ComparisonView';
import ScenarioAtcHudBar from './components/ScenarioAtcHudBar';
import { startScenario, scenarioTick } from './simulation/scenarioRunner';
import { prepareScenario5FtgTick } from './simulation/scenario5FtgController';
import {
  GRAPH_REGISTRY,
  DEFAULT_GRAPH_ID,
  type GraphId,
  getAirportGraph,
} from './data/graphRegistry';
import { isStandNode, isTakeoffRunwayNode, isLanding25RNode } from './data/v3OperationalNodes';

const Airport3DView = lazy(() => import('./features/airport3d/Airport3DView'));

const DEFAULT_CONFIG: SimulationConfig = {
  startNodeId:       'v3_line_37_p00', // STAND_1
  destinationNodeId: 'v3_line_05_p07', // STOP BAR 25L (via E6)
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

function appendPracticeEvent(state: SimulationState, message: string, callsign?: string): SimulationState {
  return {
    ...state,
    liveEventLog: [...state.liveEventLog, {
      id: `practice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      atSeconds: state.elapsedSeconds,
      callsign,
      message,
      severity: 'info' as const,
    }].slice(-160),
  };
}

// Số giây mô phỏng trên mỗi giây thực (Đồng bộ chuẩn 5.0 cho toàn bộ 5 kịch bản)
const TIME_SCALE = 5.0;

export default function App() {
  const [mapView, setMapView] = useState<'2d' | '3d'>(() => window.location.pathname.startsWith('/3d') ? '3d' : '2d');
  // Check reload guard on start
  useEffect(() => {
    checkReloadGuard();
  }, []);

  const [selectedGraphId, setSelectedGraphId] = useState<GraphId>(() => {
    const saved = loadStateFromStorage();
    return saved?.selectedGraphId === 'v3' ? saved.selectedGraphId : DEFAULT_GRAPH_ID;
  });

  const [config, setConfig] = useState<SimulationConfig>(() => {
    const saved = loadStateFromStorage();
    let initialConfig = saved?.config ? { ...DEFAULT_CONFIG, ...saved.config } : DEFAULT_CONFIG;
    if (initialConfig.startNodeId === 'v3_line_29_p01') {
      initialConfig.startNodeId = 'v3_line_28_p01';
    }
    if (initialConfig.callsign === 'VN004' && (initialConfig.startNodeId === 'v3_line_29_p01' || !initialConfig.startNodeId)) {
      initialConfig.startNodeId = 'v3_line_28_p01';
    }
    return initialConfig;
  });

  const [simState, setSimState] = useState<SimulationState>(() => {
    const saved = loadStateFromStorage();
    const baseGraph = getAirportGraph(DEFAULT_GRAPH_ID);
    let initialConfig = saved?.config ? { ...DEFAULT_CONFIG, ...saved.config } : DEFAULT_CONFIG;
    if (initialConfig.startNodeId === 'v3_line_29_p01') {
      initialConfig.startNodeId = 'v3_line_28_p01';
    }
    if (initialConfig.callsign === 'VN004' && (initialConfig.startNodeId === 'v3_line_29_p01' || !initialConfig.startNodeId)) {
      initialConfig.startNodeId = 'v3_line_28_p01';
    }
    const base = initSimulation(initialConfig, baseGraph);
    if (saved) {
      if (saved.blockedEdgeIds && Array.isArray(saved.blockedEdgeIds)) {
        base.blockedEdgeIds = new Set([...base.blockedEdgeIds, ...saved.blockedEdgeIds]);
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
    if (base.aircraft && base.aircraft.status !== 'taxiing') {
      base.routeStatus = 'pending';
      base.aircraft.routeVisible = false;
      base.aircraft.guidanceVisible = false;
      base.lightStates = {};
    }
    return base;
  });
  
  // Unified responsive tabs: 'control' | 'status' | 'scenarios'
  const [activeTab, setActiveTab] = useState<'control' | 'status' | 'scenarios'>('control');
  const desktopTab = activeTab === 'scenarios' ? 'scenarios' : 'control';
  const mobileTab = activeTab;
  const setDesktopTab = (tab: 'control' | 'scenarios') => setActiveTab(tab);
  const setMobileTab = (tab: 'control' | 'status' | 'scenarios') => setActiveTab(tab);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [autoIncidents, setAutoIncidents] = useState(false);
  const [showGraphV3Overlay, setShowGraphV3Overlay] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [inspectingPathAircraftId, setInspectingPathAircraftId] = useState<string | null>(null);
  const [showScenario5Comparison, setShowScenario5Comparison] = useState(false);
  const [showScenario1Comparison, setShowScenario1Comparison] = useState(false);
  const [isCapturingAudit, setIsCapturingAudit] = useState<boolean>(false);

  // Watchdog state
  const [watchdogStalled, setWatchdogStalled] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  const currentGraphEntry = GRAPH_REGISTRY.v3;
  const currentGraph = getAirportGraph(selectedGraphId);
  const [tabSwitchWarning, setTabSwitchWarning] = useState<string | null>(null);
  const tabWarningTimerRef = useRef<number | null>(null);

  const showTabWarning = useCallback((msg: string) => {
    if (tabWarningTimerRef.current) clearTimeout(tabWarningTimerRef.current);
    setTabSwitchWarning(msg);
    tabWarningTimerRef.current = window.setTimeout(() => {
      setTabSwitchWarning(null);
      tabWarningTimerRef.current = null;
    }, 4500);
  }, []);

  const navigatePage = useCallback((view: '2d' | '3d') => {
    if (mapView === '3d' && view === '2d' && simState.scenario) {
      showTabWarning('Bạn phải thoát kịch bản đang chạy');
      return;
    }
    setMapView(view);
    const path = view === '3d' ? '/3d' : '/2d';
    if (window.location.pathname !== path) window.history.pushState({ view }, '', path);
    if (view === '2d' && simState.scenario) {
      setDesktopTab('scenarios');
      setMobileTab('scenarios');
    }
  }, [mapView, simState.scenario, desktopTab, showTabWarning]);

  useEffect(() => {
    const onPopState = () => {
      const targetView = window.location.pathname.startsWith('/3d') ? '3d' : '2d';
      if (mapView === '3d' && targetView === '2d' && simState.scenario) {
        window.history.pushState({ view: '3d' }, '', '/3d');
        showTabWarning('Bạn phải thoát kịch bản đang chạy');
        return;
      }
      setMapView(targetView);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [mapView, simState.scenario, showTabWarning]);

  // Mandatory logging per specification
  useEffect(() => {
    console.log(`GRAPH_SELECTED=${selectedGraphId}; NODES=${currentGraph.nodes.length}; EDGES=${currentGraph.edges.length}; BACKGROUND=${currentGraphEntry.bgImage}`);
    console.log(`ROUTE_ACCEPTED: ${simState.routeStatus === 'accepted'}`);
  }, [selectedGraphId, currentGraph, currentGraphEntry, simState.routeStatus]);

  // Auto-save state to localStorage (debounced 600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStateToStorage(selectedGraphId, config, simState);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedGraphId, config, simState]);

  const [simSpeed, setSimSpeed] = useState<number>(1);
  const simSpeedRef = useRef<number>(1);
  simSpeedRef.current = simSpeed;

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
        const currentMultiplier = simSpeedRef.current || 1;
        const dt = wallDt * TIME_SCALE * currentMultiplier;
        setSimState(prev => {
          if (prev.scenario) {
            if (prev.scenario.id === 'lvc_peak_runway_direction_change' && (mapView === '3d' || (prev as any).renderMode === 'ftg')) {
              const prepared = prepareScenario5FtgTick(prev, currentGraph, dt);
              return scenarioTick(prepared, dt, currentGraph);
            }
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
        let safeDest = selectedAc.targetNodeId;
        // Chỉ clamp về 25L khi tàu bay ở Stand (cất cánh), KHÔNG clamp khi đang ở STOP BAR 25R (hạ cánh)
        if (isStandNode(selectedAc.currentNodeId, currentGraph.nodes)
            && !isLanding25RNode(selectedAc.currentNodeId, currentGraph.nodes)
            && !isTakeoffRunwayNode(safeDest, currentGraph.nodes)) {
          const stopBar25L = currentGraph.nodes.find(n => n.label === 'STOP BAR 25L' || n.id === 'v3_line_17_p16' || n.id === 'v3_line_05_p07');
          safeDest = stopBar25L ? stopBar25L.id : 'v3_line_05_p07';
        }
        // Nếu tàu đang ở STOP BAR 25R (hạ cánh) mà targetNodeId vẫn là runway cất cánh (lỗi state) → reset về STAND_10
        if (isLanding25RNode(selectedAc.currentNodeId, currentGraph.nodes) && isTakeoffRunwayNode(safeDest, currentGraph.nodes)) {
          const defaultStand = currentGraph.nodes.find(n => n.id === 'v3_line_33_p00' || n.label === 'STAND_10')
            || currentGraph.nodes.find(n => n.label && n.label.startsWith('STAND_'));
          safeDest = defaultStand ? defaultStand.id : 'v3_line_33_p00';
        }
        setConfig(c => ({
          ...c,
          callsign: selectedAc.callsign,
          airlineCode: selectedAc.airlineCode || 'VN',
          aircraftType: selectedAc.aircraftType || 'A321',
          startNodeId: selectedAc.currentNodeId,
          destinationNodeId: safeDest,
        }));
      }

      const isTaxiing = selectedAc?.status === 'taxiing';
      // A practice flight can be held for handoff while its accepted route remains active.
      const hasAcceptedRoute = isTaxiing || Boolean(prev.practiceMode && selectedAc?.routeVisible);
      const newRouteStatus = hasAcceptedRoute ? 'accepted' : 'pending';

      const updatedFleet = sanitized.map(ac => {
        if (ac.id === (selectedAc?.id || aircraftId) && !hasAcceptedRoute) {
          let safeDest = ac.targetNodeId;
          // Chỉ clamp về 25L khi tàu bay ở Stand (cất cánh), KHÔNG clamp khi đang ở STOP BAR 25R (hạ cánh)
          if (isStandNode(ac.currentNodeId, currentGraph.nodes)
              && !isLanding25RNode(ac.currentNodeId, currentGraph.nodes)
              && !isTakeoffRunwayNode(safeDest, currentGraph.nodes)) {
            const stopBar25L = currentGraph.nodes.find(n => n.label === 'STOP BAR 25L' || n.id === 'v3_line_17_p16' || n.id === 'v3_line_05_p07');
            safeDest = stopBar25L ? stopBar25L.id : 'v3_line_05_p07';
          }
          // Nếu tàu đang ở STOP BAR 25R (hạ cánh) mà safeDest vẫn là runway cất cánh → reset về STAND_10
          if (isLanding25RNode(ac.currentNodeId, currentGraph.nodes) && isTakeoffRunwayNode(safeDest, currentGraph.nodes)) {
            const defaultStand = currentGraph.nodes.find(n => n.id === 'v3_line_33_p00' || n.label === 'STAND_10')
              || currentGraph.nodes.find(n => n.label && n.label.startsWith('STAND_'));
            safeDest = defaultStand ? defaultStand.id : 'v3_line_33_p00';
          }
          const freshRoute = findPath(currentGraph, ac.currentNodeId, safeDest, prev.blockedEdgeIds) || ac.assignedRoute;
          return {
            ...ac,
            targetNodeId: safeDest,
            assignedRoute: freshRoute,
            routeVisible: false,
            guidanceVisible: false,
          };
        }
        return ac;
      });

      const updatedSelectedAc = updatedFleet.find(a => a.id === (selectedAc?.id || aircraftId)) || selectedAc;

      const runningAc = updatedFleet.find(a => a.status === 'taxiing' || a.status === 'holding');
      const lightTargetAc = runningAc || (hasAcceptedRoute && updatedSelectedAc ? updatedSelectedAc : null);
      const activeLights = lightTargetAc
        ? computeLightStates(lightTargetAc, prev.blockedEdgeIds, currentGraph)
        : (newRouteStatus === 'accepted' && updatedSelectedAc ? computeLightStates(updatedSelectedAc, prev.blockedEdgeIds, currentGraph) : {});

      return {
        ...prev,
        manualFleet: updatedFleet,
        selectedAircraftId: updatedSelectedAc ? updatedSelectedAc.id : 'VN001',
        aircraft: updatedSelectedAc || prev.aircraft,
        routeStatus: newRouteStatus,
        lightStates: activeLights,
      };
    });
  }, [currentGraph]);

  const handleConfigChange = useCallback((patch: Partial<SimulationConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      const isRouteEndpointsChanged =
        (patch.startNodeId !== undefined && patch.startNodeId !== prev.startNodeId) ||
        (patch.destinationNodeId !== undefined && patch.destinationNodeId !== prev.destinationNodeId);

      setSimState(prevSim => {
        const sanitized = sanitizeManualFleet(prevSim.manualFleet, currentGraph);
        const selectedId = prevSim.selectedAircraftId || 'VN001';
        const blockedEdgeIds = prevSim.blockedEdgeIds;

        if (isRouteEndpointsChanged) {
          const updatedFleet = sanitized.map(ac => {
            if (ac.id !== selectedId) return ac;
            const newStart = patch.startNodeId ?? ac.currentNodeId;
            let newDest = patch.destinationNodeId ?? ac.targetNodeId;

            // Nếu tàu bay ở Stand (cất cánh): mặc định chỉ đi 25L qua E6 (hoặc 07R khi có sự cố đổi chiều)
            // KHÔNG áp dụng nếu điểm xuất phát là STOP BAR 25R (máy bay đang hạ cánh → phải về Stand)
            if (isStandNode(newStart, currentGraph.nodes)
                && !isLanding25RNode(newStart, currentGraph.nodes)
                && !isTakeoffRunwayNode(newDest, currentGraph.nodes)) {
              const stopBar25L = currentGraph.nodes.find(n => n.label === 'STOP BAR 25L' || n.id === 'v3_line_17_p16' || n.id === 'v3_line_05_p07');
              newDest = stopBar25L ? stopBar25L.id : 'v3_line_05_p07';
              next.destinationNodeId = newDest;
            }

            // Ngược lại: Nếu start là STOP BAR 25R (hạ cánh) mà dest vẫn là runway cất cánh (25L/07R) →
            // đây là trạng thái lỗi (tàu trước đó ở Stand), phải reset về Stand mặc định STAND_10
            if (isLanding25RNode(newStart, currentGraph.nodes) && isTakeoffRunwayNode(newDest, currentGraph.nodes)) {
              const freeStand = (nodeId: string) => !sanitized.some(other => other.id !== selectedId && (
                (other.currentNodeId === nodeId && other.status !== 'departed') ||
                (other.targetNodeId === nodeId && ['parked', 'waiting', 'taxiing', 'holding', 'arrived'].includes(other.status))
              ));
              const defaultStand = currentGraph.nodes.find(n => (n.id === 'v3_line_33_p00' || n.label === 'STAND_10') && freeStand(n.id))
                || currentGraph.nodes.find(n => isStandNode(n.id, currentGraph.nodes) && freeStand(n.id));
              newDest = defaultStand ? defaultStand.id : 'v3_line_33_p00';
              // Đồng bộ config.destinationNodeId để dropdown hiển thị đúng
              next.destinationNodeId = newDest;
            }

            const newRoute = findPath(currentGraph, newStart, newDest, blockedEdgeIds) || [newStart];
            const newEdges = routeToEdges(newRoute, currentGraph.edges);
            const newAirlineCode = patch.airlineCode ?? ac.airlineCode ?? 'VN';
            const aDef = getAirlineDef(newAirlineCode);
            return {
              ...ac,
              callsign: patch.callsign ? patch.callsign.toUpperCase() : ac.callsign,
              airlineCode: newAirlineCode as any,
              airlineName: aDef.name,
              aircraftAsset: aDef.asset,
              aircraftType: patch.aircraftType ?? ac.aircraftType ?? 'A321',
              flight: undefined,
              currentNodeId: newStart,
              targetNodeId: newDest,
              assignedRoute: newRoute,
              routeEdgeIndex: 0,
              progressOnEdge: 0,
              currentEdgeId: newEdges ? newEdges[0] : null,
              routeVisible: false,
              guidanceVisible: false,
              isMoving: false,
              status: 'parked' as const,
            };
          });
          const activeAc = updatedFleet.find(a => a.id === selectedId) || updatedFleet[0] || null;
          const nextStart = activeAc?.currentNodeId;
          const controllerByAircraft = prevSim.practiceMode && nextStart
            ? { ...prevSim.controllerByAircraft, [selectedId]: isLanding25RNode(nextStart, currentGraph.nodes) ? 'TWR' as const : 'GND' as const }
            : prevSim.controllerByAircraft;
          const readbackConfirmed = { ...prevSim.readbackConfirmed };
          const runwayClearancePending = { ...prevSim.runwayClearancePending };
          const runwayClearanceGranted = { ...prevSim.runwayClearanceGranted };
          const handoffRequests = { ...prevSim.handoffRequests };
          delete readbackConfirmed[selectedId];
          delete runwayClearancePending[selectedId];
          delete runwayClearanceGranted[selectedId];
          delete handoffRequests[selectedId];
          return {
            ...prevSim,
            routeStatus: 'pending',
            manualFleet: updatedFleet,
            aircraft: activeAc,
            config: next,
            controllerByAircraft,
            readbackConfirmed,
            runwayClearancePending,
            runwayClearanceGranted,
            handoffRequests,
          };
        }

        // Real-time property update (speed slider, callsign, livery, weather) without resetting motion
        const updatedFleet = sanitized.map(ac => {
          if (ac.id !== selectedId) return ac;
          const newAirlineCode = patch.airlineCode ?? ac.airlineCode ?? 'VN';
          const aDef = getAirlineDef(newAirlineCode);
          const newSpeed = patch.taxiSpeedKts ?? ac.speedKts ?? next.taxiSpeedKts;
          return {
            ...ac,
            callsign: patch.callsign ? patch.callsign.toUpperCase() : ac.callsign,
            airlineCode: newAirlineCode as any,
            airlineName: aDef.name,
            aircraftAsset: aDef.asset,
            aircraftType: patch.aircraftType ?? ac.aircraftType ?? 'A321',
            speedKts: ac.status === 'taxiing' ? newSpeed : ac.speedKts,
            speedLimitKts: newSpeed,
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

  const handleTogglePractice = useCallback(() => {
    setSimState(prev => {
      if (prev.scenario) return { ...prev, warningMessage: 'End the auto-run scenario before entering GND/TWR practice.' };
      if (prev.practiceMode) {
        const manualFleet = prev.manualFleet?.map(ac => ac.holdReason?.startsWith('practice-') ? { ...ac, status: 'taxiing' as const, holdReason: undefined } : ac);
        return { ...prev, practiceMode: false, controllerRole: undefined, controllerByAircraft: undefined, handoffRequests: undefined, readbackConfirmed: undefined, runwayClearancePending: undefined, runwayClearanceGranted: undefined, manualFleet, aircraft: manualFleet?.find(ac => ac.id === prev.selectedAircraftId) ?? prev.aircraft };
      }
      const fleet = prev.manualFleet ?? [];
      const controllerByAircraft = Object.fromEntries(fleet.map(ac => {
        const node = currentGraph.nodes.find(candidate => candidate.id === ac.currentNodeId);
        const role = node?.type === 'runway_entry' || node?.type === 'runway_exit' ? 'TWR' : 'GND';
        return [ac.id, role];
      })) as Record<string, 'GND' | 'TWR'>;
      return { ...prev, practiceMode: true, controllerRole: 'GND', controllerByAircraft, handoffRequests: {}, readbackConfirmed: {}, runwayClearancePending: {}, runwayClearanceGranted: {}, warningMessage: null };
    });
  }, [currentGraph]);

  const handleSelect3DAircraft = useCallback((aircraftId: string) => {
    if (!simState.scenario) {
      handleSelectAircraft(aircraftId);
      return;
    }
    setSimState(prev => prev.scenarioAircraft?.some(aircraft => aircraft.id === aircraftId)
      ? { ...prev, selectedAircraftId: aircraftId }
      : prev);
  }, [handleSelectAircraft, simState.scenario]);

  const handleSetControllerRole = useCallback((role: 'GND' | 'TWR') => {
    setSimState(prev => ({ ...prev, controllerRole: role }));
  }, []);

  const handleRequestHandoff = useCallback(() => {
    setSimState(prev => {
      const id = prev.selectedAircraftId;
      const aircraft = prev.manualFleet?.find(item => item.id === id);
      const owner = id ? prev.controllerByAircraft?.[id] ?? 'GND' : 'GND';
      if (!id || !aircraft || !prev.practiceMode || prev.controllerRole !== owner || aircraft.status !== 'holding' || !aircraft.holdReason?.startsWith('practice-handoff-to-')) {
        return { ...prev, warningMessage: 'Handoff is available only to the controller holding the aircraft at a handoff point.' };
      }
      const target = owner === 'GND' ? 'TWR' : 'GND';
      return appendPracticeEvent({ ...prev, handoffRequests: { ...prev.handoffRequests, [id]: target }, warningMessage: null }, `${owner} đề nghị bàn giao ${aircraft.callsign} cho ${target} tại ${aircraft.currentNodeId}.`, aircraft.callsign);
    });
  }, []);

  const handleAcceptHandoff = useCallback(() => {
    setSimState(prev => {
      const id = prev.selectedAircraftId;
      const aircraft = prev.manualFleet?.find(item => item.id === id);
      const target = id ? prev.handoffRequests?.[id] : undefined;
      if (!id || !aircraft || !target || prev.controllerRole !== target || aircraft.status !== 'holding') {
        return { ...prev, warningMessage: 'Switch to the receiving position and select a flight with a pending handoff.' };
      }
      const handoffRequests = { ...prev.handoffRequests };
      delete handoffRequests[id];
      // Keep the aircraft held until the receiving controller confirms a new instruction.
      const nextHoldReason = aircraft.holdReason === 'practice-handoff-to-twr'
        ? 'practice-runway-clearance'
        : 'practice-await-controller-command';
      const manualFleet = prev.manualFleet?.map(item => item.id === id
        ? { ...item, holdReason: nextHoldReason, speedKts: 0, isMoving: false }
        : item);
      return appendPracticeEvent({
        ...prev,
        controllerByAircraft: { ...prev.controllerByAircraft, [id]: target },
        handoffRequests,
        readbackConfirmed: { ...prev.readbackConfirmed, [id]: false },
        manualFleet,
        aircraft: manualFleet?.find(item => item.id === id) ?? prev.aircraft,
        warningMessage: null,
      }, `${target} tiếp nhận ${aircraft.callsign} tại ${aircraft.currentNodeId}.`, aircraft.callsign);
    });
  }, []);

  const handleClearRunway = useCallback(() => {
    setSimState(prev => {
      const id = prev.selectedAircraftId;
      const aircraft = prev.manualFleet?.find(item => item.id === id);
      if (!id || !aircraft || prev.controllerRole !== 'TWR' || prev.controllerByAircraft?.[id] !== 'TWR' || aircraft.holdReason !== 'practice-runway-clearance') {
        return { ...prev, warningMessage: 'Only TWR can confirm runway entry for a flight held at the runway entry point.' };
      }
      const runwayOccupied = Object.values(prev.runwayOccupancy ?? {}).some(owner => !!owner && owner !== id);
      const routeEdges = routeToEdges(aircraft.assignedRoute ?? [], currentGraph.edges) ?? [];
      const runwayBlocked = routeEdges.some(edgeId => currentGraph.edges.some(edge => edge.id === edgeId && edge.type === 'runway' && prev.blockedEdgeIds.has(edgeId)));
      if (runwayOccupied || runwayBlocked) return { ...prev, warningMessage: runwayOccupied ? 'Runway is occupied in the simulation. TWR clearance is held.' : 'The route has a closed runway segment. Recheck the route before clearance.' };
      return appendPracticeEvent({ ...prev, runwayClearancePending: { ...prev.runwayClearancePending, [id]: true }, runwayClearanceGranted: { ...prev.runwayClearanceGranted, [id]: false }, readbackConfirmed: { ...prev.readbackConfirmed, [id]: false }, warningMessage: null }, `TWR cấp phép mô phỏng vào đường băng cho ${aircraft.callsign}; chờ xác nhận readback.`, aircraft.callsign);
    });
  }, [currentGraph]);

  const handleConfirmReadback = useCallback(() => {
    setSimState(prev => {
      const id = prev.selectedAircraftId;
      if (!id || !prev.practiceMode || prev.controllerRole !== (prev.controllerByAircraft?.[id] ?? 'GND')) {
        return { ...prev, warningMessage: 'The readback must be confirmed by the controller currently responsible for this flight.' };
      }
      const readbackConfirmed = { ...prev.readbackConfirmed, [id]: true };
      const runwayClearancePending = { ...prev.runwayClearancePending };
      const runwayClearanceGranted = { ...prev.runwayClearanceGranted };
      if (runwayClearancePending[id]) runwayClearanceGranted[id] = true;
      const manualFleet = prev.manualFleet?.map(item => item.id === id && runwayClearancePending[id]
        ? { ...item, holdReason: 'practice-runway-clearance-granted', speedKts: 0, isMoving: false }
        : item);
      delete runwayClearancePending[id];
      const aircraft = prev.manualFleet?.find(item => item.id === id);
      return appendPracticeEvent({ ...prev, readbackConfirmed, runwayClearancePending, runwayClearanceGranted, manualFleet, aircraft: manualFleet?.find(item => item.id === id) ?? prev.aircraft, warningMessage: null }, `${aircraft?.callsign ?? id}: readback được xác nhận bởi ${prev.controllerRole}.`, aircraft?.callsign);
    });
  }, []);

  const handleAcceptRoute = useCallback(() => {
    console.log(`GRAPH_SELECTED: ${selectedGraphId}`);
    console.log(`ROUTE_SOURCE: v3_coordinates_new.json`);
    console.log(`ROUTE_ACCEPTED: true`);
    setSimState(prev => {
      const next = acceptRoute(prev, currentGraph);
      if (!prev.practiceMode || next.warningMessage) return next;
      const selected = prev.manualFleet?.find(ac => ac.id === prev.selectedAircraftId);
      return appendPracticeEvent(next, `${prev.controllerRole ?? 'GND'} accepted proposed route for ${selected?.callsign ?? prev.selectedAircraftId ?? 'selected flight'}.`, selected?.callsign);
    });
  }, [currentGraph, selectedGraphId]);

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
    clearPersistedState();
    console.log(`GRAPH_SELECTED: ${selectedGraphId}`);
    console.log(`ROUTE_SOURCE: v3_coordinates_new.json`);
    console.log(`ROUTE_ACCEPTED: false`);
    setInspectingPathAircraftId(null);
    lastTimeRef.current = null;
    setSimSpeed(1);
    simSpeedRef.current = 1;
    setAutoIncidents(false);
    setConfig(prev => ({ ...prev, incident: 'none', incidentEdgeId: null }));

    setSimState(prev => {
      if (prev.scenario) {
        return resetToManualMode(prev, currentGraph);
      }
      const selectedId = prev.selectedAircraftId || 'VN001';
      const reset = resetManualAircraft(prev, selectedId, currentGraph);
      if (!prev.practiceMode) return reset;
      return { ...reset, practiceMode: true, controllerRole: 'GND', controllerByAircraft: { ...prev.controllerByAircraft, [selectedId]: 'GND' }, handoffRequests: {}, readbackConfirmed: {}, runwayClearancePending: {}, runwayClearanceGranted: {} };
    });
  }, [currentGraph, selectedGraphId]);

  const handleResetAll = useCallback(() => {
    clearPersistedState();
    setInspectingPathAircraftId(null);
    lastTimeRef.current = null;
    setSimSpeed(1);
    simSpeedRef.current = 1;
    setAutoIncidents(false);
    setConfig(prev => ({ ...prev, incident: 'none', incidentEdgeId: null }));

    setSimState(prev => {
      if (prev.scenario) {
        return resetToManualMode(prev, currentGraph);
      }
      const reset = resetAllManualAircraft(prev, currentGraph);
      if (!prev.practiceMode) return reset;
      return { ...reset, practiceMode: true, controllerRole: 'GND', controllerByAircraft: Object.fromEntries((reset.manualFleet ?? []).map(ac => [ac.id, 'GND'])) as Record<string, 'GND' | 'TWR'>, handoffRequests: {}, readbackConfirmed: {}, runwayClearancePending: {}, runwayClearanceGranted: {} };
    });
  }, [currentGraph]);

  const handleCaptureAudit = useCallback(() => {
    setIsCapturingAudit(true);
    setTimeout(() => {
      setIsCapturingAudit(false);
    }, 1500);
  }, []);

  const handleExitScenario = useCallback(() => {
    clearPersistedState();
    lastTimeRef.current = null;
    setSimSpeed(1);
    simSpeedRef.current = 1;
    setSimState(prev => resetToManualMode(prev, currentGraph));
    setDesktopTab('control');
    setMobileTab('control');
    setSheetExpanded(true);
  }, [currentGraph]);

  const handleAircraftSpeedChange = useCallback((aircraftId: string, speedKts: number) => {
    setSimState(prev => {
      if (!prev.scenarioAircraft) return prev;
      return {
        ...prev,
        scenarioAircraft: prev.scenarioAircraft.map(ac =>
          ac.id === aircraftId || ac.callsign === aircraftId
            ? { ...ac, speedKts, speedLimitKts: Math.max(ac.speedLimitKts, speedKts) }
            : ac
        ),
      };
    });
  }, []);

  const handleStartScenario = useCallback((scId: string) => {
    clearPersistedState();
    lastTimeRef.current = null;
    setSimSpeed(1);
    simSpeedRef.current = 1;

    if (mapView === '2d' && scId === 'lvc_peak_runway_direction_change') {
      if (selectedGraphId !== 'v3') {
        setSelectedGraphId('v3');
      }
      setShowScenario5Comparison(true);
      return;
    }
    if (mapView === '2d' && scId === 'lvc_wrong_turn_radio_failure') {
      if (selectedGraphId !== 'v3') {
        setSelectedGraphId('v3');
      }
      setShowScenario1Comparison(true);
      return;
    }
    const next = mapView === '3d' ? startFtgScenario(scId, currentGraph) : startScenario(scId, currentGraph);
    if (mapView === '3d') {
      const selected = next.scenarioAircraft?.find((aircraft: any) => !aircraft.hidden && aircraft.status === 'taxiing')
        ?? next.scenarioAircraft?.find((aircraft: any) => !aircraft.hidden);
      next.selectedAircraftId = selected?.id;
    }
    setSimState(next);
    setMobileTab('status');
    setSheetExpanded(true);
  }, [currentGraph, selectedGraphId, mapView]);

  const activeAircraft = (simState.manualFleet && simState.manualFleet.length > 0)
    ? (simState.manualFleet.find(a => a.id === (simState.selectedAircraftId || 'VN001')) || simState.manualFleet[0])
    : simState.aircraft;


  return (
    <ErrorBoundary name="Ứng dụng mô phỏng sân bay" fallbackTitle="Đã xảy ra sự cố trong ứng dụng">
      <div className="w-full h-full min-h-screen md:h-screen bg-[#F8FAFC] text-[#202224] flex flex-col overflow-x-hidden md:overflow-hidden">
        {/* ── Scenario 5 Dual Map Comparison Mode ── */}
        {showScenario5Comparison && (
          <Scenario5ComparisonView
            graph={getAirportGraph('v3')}
            bgImage={GRAPH_REGISTRY.v3.bgImage}
            onExit={() => {
              setShowScenario5Comparison(false);
              setSimState(prev => resetToManualMode(prev, getAirportGraph('v3')));
            }}
          />
        )}

        {/* ── Scenario 1 Dual Map Comparison Mode ── */}
        {showScenario1Comparison && (
          <Scenario1ComparisonView
            graph={getAirportGraph('v3')}
            bgImage={GRAPH_REGISTRY.v3.bgImage}
            onExit={() => {
              setShowScenario1Comparison(false);
              setSimState(prev => resetToManualMode(prev, getAirportGraph('v3')));
            }}
          />
        )}

        {/* ── 1. Cảnh báo giáo dục VAA ── */}
        <header className="bg-[#08182E] border-b border-[#0C2444] text-[#93C5FD] text-center py-1 px-3 text-[11px] sm:text-xs font-semibold tracking-wide flex-shrink-0 flex items-center justify-center">
          <span>HỌC VIỆN HÀNG KHÔNG VIỆT NAM — MÔ PHỎNG GIÁO DỤC (KHÔNG DÙNG TRONG HOẠT ĐỘNG THỰC TẾ)</span>
        </header>

        {/* ── Watchdog Recovery Bar (Khi loop bị nghẽn) ── */}
        {watchdogStalled && (
          <div className="bg-[#FFFBEB] border-b border-[#FCD34D] text-[#92400E] px-4 py-2 text-xs flex items-center justify-between z-50 shadow-sm flex-shrink-0 animate-pulse">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /> Mô phỏng bị gián đoạn vòng lặp. Vị trí và tuyến đường đã được bảo toàn.
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

        {/* ── Thông báo ngăn chuyển tab khi kịch bản 3D đang chạy ── */}
        {tabSwitchWarning && (
          <div
            role="alert"
            className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 sm:gap-3 px-4 py-2.5 sm:py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl border-2 border-amber-300 backdrop-blur-md animate-bounce"
          >
            <AlertTriangle className="w-5 h-5 text-amber-950 shrink-0" />
            <span>{tabSwitchWarning}</span>
            <button
              type="button"
              onClick={() => {
                handleExitScenario();
                setTabSwitchWarning(null);
              }}
              className="ml-2 px-2.5 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-bold cursor-pointer transition shadow-xs"
            >
              Thoát kịch bản ngay
            </button>
            <button
              type="button"
              onClick={() => setTabSwitchWarning(null)}
              className="ml-1 p-1 rounded-md text-amber-950/70 hover:text-amber-950 hover:bg-amber-400/50 cursor-pointer transition"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── 2. Thanh tiêu đề Header chuẩn VAA (Primary: #0c2444) ── */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#0C2444] border-b border-[#163660] text-white flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* VAA Official Vector Logo */}
            <div className="w-8 h-8 rounded-lg bg-[#163660] p-1 flex items-center justify-center border border-[#3B82F6]/30 flex-shrink-0 shadow-2xs">
              <VaaLogo className="w-6 h-6" fill="#F59E0B" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                  <span className="hidden sm:inline">Mô Phỏng Mặt Đất Sân Bay</span>
                  <span className="sm:hidden">Mô Phỏng Sân Bay</span>
                </h1>
                <span className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#163660] text-[#93C5FD] border border-[#3B82F6]/30 font-semibold">
                  FtG Simulator
                </span>
              </div>
              <span className="text-[10px] text-[#CBD5E1] truncate hidden sm:block font-medium">
                Học viện Hàng không Việt Nam · Hệ thống huấn luyện A-SMGCS & Follow-the-Green
              </span>
            </div>
          </div>

          {/* Bộ chọn Đồ thị & Nút Hành Động */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <nav aria-label="Trang làm việc" className="flex items-center gap-0.5 rounded-lg border border-[#1E3A8A] bg-[#071a30] p-1">
              <button
                type="button"
                onClick={() => navigatePage('2d')}
                aria-current={mapView === '2d' ? 'page' : undefined}
                title={mapView === '3d' && simState.scenario ? 'Bạn phải thoát kịch bản đang chạy' : undefined}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${mapView === '2d' ? 'bg-[#0C2444] text-white border border-[#3B82F6]/50 shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              >
                Trang 2D
              </button>
              <button type="button" onClick={() => navigatePage('3d')} aria-current={mapView === '3d' ? 'page' : undefined} className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${mapView === '3d' ? 'bg-[#0C2444] text-white border border-[#3B82F6]/50 shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>Trang 3D</button>
            </nav>
            {/* Model Badge */}
            <div
              data-testid="graph-meta"
              data-graph-id={selectedGraphId}
              data-graph-name={currentGraphEntry.name}
              data-nodes={currentGraph.nodes.length}
              data-edges={currentGraph.edges.length}
              data-bg={currentGraphEntry.bgImage}
              className="flex items-center gap-1 bg-[#0A1B36] px-2.5 py-1 rounded-lg border border-[#1E3A8A]"
            >
              <span className="text-[11px] text-[#93C5FD] font-medium hidden md:inline">Mô hình:</span>
              <span className="text-xs font-bold text-white bg-[#0C2444] px-2 py-0.5 rounded border border-[#3B82F6]/50">
                Sân bay TSN (v3)
              </span>
            </div>

            {/* ── Nút Debug: Overlay V3, Grid, Paths (Hiển thị trên Desktop/Tablet) ── */}
            <div className={`${mapView === '2d' ? 'hidden md:flex' : 'hidden'} items-center gap-1 bg-[#071a30] px-1.5 py-1 rounded-lg border border-[#1E3A8A]`}>
              <button
                data-testid="toggle-overlay-v3"
                onClick={() => setShowGraphV3Overlay(v => !v)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                  showGraphV3Overlay ? 'bg-[#0C2444] text-white shadow-xs border border-[#38BDF8]' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Bật/tắt lớp overlay Graph V3 (Nét đứt xanh dương sáng) để đối chiếu"
              >
                Overlay V3
              </button>
              <button
                data-testid="toggle-grid"
                onClick={() => setShowGrid(v => !v)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                  showGrid ? 'bg-[#0C2444] text-white shadow-xs border border-[#3B82F6]/50' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Bật/tắt lưới tọa độ"
              >
                Grid
              </button>
              <button
                data-testid="toggle-paths"
                onClick={() => setShowPaths(v => !v)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                  showPaths ? 'bg-[#0C2444] text-white shadow-xs border border-[#F59E0B]/50' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Bật/tắt hiển thị path & Edge ID của máy bay hiện tại"
              >
                Paths
              </button>
            </div>

            {/* Nút Hướng dẫn */}
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 bg-[#0C2444] hover:bg-[#163660] active:bg-[#08182E] text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-[#3B82F6]/40 transition shadow-xs cursor-pointer"
            >
              <span className="leading-none font-bold">?</span>
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>
          </div>
        </div>

        {/* ── 3. Bố Cục Chính Hợp Nhất (Chỉ 1 Bản Đồ Duy Nhất Cho Mọi Viewport) ── */}
        <main className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-2.5 xl:gap-3 p-0 lg:p-2 xl:p-3 overflow-hidden min-h-0 relative">
          {/* Bản đồ sân bay tương tác chính — Duy nhất trong toàn bộ DOM */}
          <div className="flex-1 w-full min-w-0 min-h-[220px] lg:min-h-0 relative bg-[#070B13] lg:rounded-[10px] lg:border lg:border-[#1E293B] shadow-xs flex flex-col overflow-hidden">
            {/* Viewport Bản đồ 100% Thông Thoáng — Không bị che bởi thanh thông báo */}
            <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
              {mapView === '2d' ? (
                <ErrorBoundary name="Bản đồ sân bay 2D" fallbackTitle="Lỗi hiển thị bản đồ">
                  <AirportMap
                    state={simState}
                    graph={currentGraph}
                    bgImage={currentGraphEntry.bgImage}
                    onSelectAircraft={handleSelectAircraft}
                    showGraphV3Overlay={showGraphV3Overlay}
                    showGrid={showGrid}
                    showPaths={showPaths}
                    inspectingPathAircraftId={inspectingPathAircraftId}
                  />
                </ErrorBoundary>
              ) : (
                <ErrorBoundary name="Bản đồ sân bay 3D" fallbackTitle="Lỗi hiển thị 3D">
                  <Suspense fallback={<div className="absolute inset-0 grid place-items-center bg-[#181a1d] text-sm text-slate-200">Đang tải sa bàn 3D…</div>}>
                    <Airport3DView graph={currentGraph} state={simState} onSelectAircraft={handleSelect3DAircraft} onSetControllerRole={handleSetControllerRole} />
                  </Suspense>
                </ErrorBoundary>
              )}
            </div>

            {/* Chừa riêng 1 ô bên dưới bản đồ cho thông báo chạy theo đúng từng tàu bay (Kịch bản 2, 3, 4) giống Kịch bản 1 & 5 */}
            {simState.scenario && (
              <ScenarioAtcHudBar state={simState} />
            )}
          </div>

          <>
          {/* ── 3A. Bảng Điều Khiển Desktop & Laptop Các Loại Kích Cỡ ── */}
          <aside className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 flex-col gap-2.5 lg:gap-3 overflow-y-auto">
            <ErrorBoundary
              name="Thanh điều khiển bên phải"
              fallbackTitle="Lỗi bảng điều khiển"
              onReset={() => setSimState(prev => resetToManualMode(prev, currentGraph))}
            >
              {/* Tab Switcher */}
              <div className="flex bg-[#E4E4E7]/60 p-1 rounded-[10px]">
                <button
                  data-testid="control-tab"
                  onClick={() => {
                    if (simState.scenario) {
                      setSimState(prev => resetToManualMode(prev, currentGraph));
                    }
                    setDesktopTab('control');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    desktopTab === 'control'
                      ? 'bg-[#0C2444] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#0C2444]'
                  }`}
                >
                  Điều khiển
                </button>
                <button
                  data-testid="scenario-tab"
                  onClick={() => setDesktopTab('scenarios')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    desktopTab === 'scenarios'
                      ? 'bg-[#0C2444] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#0C2444]'
                  }`}
                >
                  Kịch bản mẫu
                </button>
              </div>

              {desktopTab === 'control' ? (
                <>
                  <ControlPanel
                    showPracticeControls={false}
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
                    onResetAll={handleResetAll}
                    routeStatus={simState.routeStatus}
                    isRunning={simState.isRunning}
                    isPaused={simState.isPaused}
                    canStart={!!simState.aircraft || (simState.manualFleet?.length ?? 0) > 0}
                    blockedCount={simState.blockedEdgeIds.size}
                    autoIncidents={autoIncidents}
                    onToggleAutoIncidents={() => setAutoIncidents(v => !v)}
                    onTriggerIncident={handleTriggerIncident}
                    onClearIncidents={handleClearIncidents}
                    practiceMode={simState.practiceMode}
                    practiceDisabled={!!simState.scenario}
                    controllerRole={simState.controllerRole}
                    selectedController={simState.controllerByAircraft?.[simState.selectedAircraftId ?? ''] ?? 'GND'}
                    controllerByAircraft={simState.controllerByAircraft}
                    handoffTo={simState.handoffRequests?.[simState.selectedAircraftId ?? '']}
                    selectedHoldReason={simState.manualFleet?.find(ac => ac.id === simState.selectedAircraftId)?.holdReason}
                    readbackConfirmed={simState.readbackConfirmed?.[simState.selectedAircraftId ?? '']}
                    runwayClearancePending={simState.runwayClearancePending?.[simState.selectedAircraftId ?? '']}
                    onTogglePractice={handleTogglePractice}
                    onSetControllerRole={handleSetControllerRole}
                    onRequestHandoff={handleRequestHandoff}
                    onAcceptHandoff={handleAcceptHandoff}
                    onClearRunway={handleClearRunway}
                    onConfirmReadback={handleConfirmReadback}
                  />
                  <StatusPanel state={simState} graph={currentGraph} />
                  <ScenarioPanel state={simState} graph={currentGraph} />
                </>
              ) : (
                <>
                  <PresetScenariosPanel
                    ftgOnly={mapView === '3d'}
                    state={simState}
                    graph={currentGraph}
                    onStartScenario={handleStartScenario}
                    onExitScenario={handleExitScenario}
                    onPause={handlePause}
                    isPaused={simState.isPaused}
                    onSimSpeedChange={setSimSpeed}
                    onAircraftSpeedChange={handleAircraftSpeedChange}
                    simSpeed={simSpeed}
                  />
                  <StatusPanel state={simState} graph={currentGraph} />
                </>
              )}
            </ErrorBoundary>
          </aside>

          {/* ── 3B. Thanh Bảng Điều Khiển Mobile & Tablet Dọc (< 1024px) ── */}
          <aside className="flex lg:hidden w-full bg-white border-t border-[#E4E4E7] flex-col z-30 shadow-2xl flex-shrink-0">
            {/* Header Tab Bar của Mobile Bottom Sheet */}
            <div className="flex items-center justify-between p-1.5 bg-[#F8FAFC] border-b border-[#E4E4E7]">
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
                      ? 'bg-[#0C2444] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0C2444]'
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
                      ? 'bg-[#0C2444] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0C2444]'
                  }`}
                >
                  Trực tiếp
                  {simState.isRunning && (
                    <span className="w-2 h-2 rounded-full bg-[#00A544] animate-ping ml-1" />
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
                      ? 'bg-[#0C2444] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0C2444]'
                  }`}
                >
                  Kịch bản mẫu
                </button>
              </div>

              {/* Mobile Debug Toggles */}
              <div className="flex items-center gap-0.5 ml-1 mr-1">
                <button
                  onClick={() => setShowGrid(v => !v)}
                  className={`text-[10px] font-bold px-1.5 py-1 rounded transition ${
                    showGrid ? 'bg-[#3B82F6] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                  title="Grid"
                >
                  Grid
                </button>
                <button
                  onClick={() => setShowPaths(v => !v)}
                  className={`text-[10px] font-bold px-1.5 py-1 rounded transition ${
                    showPaths ? 'bg-[#F59E0B] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                  title="Paths"
                >
                  Paths
                </button>
              </div>

              {/* Nút Thu gọn / Mở rộng Bottom Sheet */}
              <button
                onClick={() => setSheetExpanded(v => !v)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F1F5F9] text-[#202224] text-xs font-bold border border-[#E4E4E7] transition flex items-center gap-1 cursor-pointer shadow-2xs"
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
                  <span className="text-[#0C2444] font-bold">{activeAircraft?.callsign || 'VN001'}</span>
                  <span className="text-[#E4E4E7]">|</span>
                  <span className="text-[#00A544] font-bold">{activeAircraft?.speedKts.toFixed(0) || 0} kts</span>
                  <span className="text-[#E4E4E7]">|</span>
                  <span className="text-[#E6AF31] font-bold uppercase">{activeAircraft?.status || 'PARKED'}</span>
                </div>
                <span className="text-xs text-[#155DFC] font-bold flex items-center gap-1">
                  Chạm để mở rộng ▲
                </span>
              </div>
            )}

            {/* Nội dung Tab Panel */}
            {sheetExpanded && (
              <div className="max-h-[46vh] sm:max-h-[52vh] overflow-y-auto p-3 flex flex-col gap-3 bg-[#F8FAFC]">
                <ErrorBoundary
                  name="Bảng điều khiển Mobile"
                  fallbackTitle="Lỗi bảng điều khiển"
                  onReset={() => setSimState(prev => resetToManualMode(prev, currentGraph))}
                >
                  {mobileTab === 'control' && (
                    <>
                      <ControlPanel
                    showPracticeControls={false}
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
                        onResetAll={handleResetAll}
                        routeStatus={simState.routeStatus}
                        isRunning={simState.isRunning}
                        isPaused={simState.isPaused}
                        canStart={!!simState.aircraft || (simState.manualFleet?.length ?? 0) > 0}
                        blockedCount={simState.blockedEdgeIds.size}
                        autoIncidents={autoIncidents}
                        onToggleAutoIncidents={() => setAutoIncidents(v => !v)}
                        onTriggerIncident={handleTriggerIncident}
                        onClearIncidents={handleClearIncidents}
                        practiceMode={simState.practiceMode}
                        practiceDisabled={!!simState.scenario}
                        controllerRole={simState.controllerRole}
                        selectedController={simState.controllerByAircraft?.[simState.selectedAircraftId ?? ''] ?? 'GND'}
                        controllerByAircraft={simState.controllerByAircraft}
                        handoffTo={simState.handoffRequests?.[simState.selectedAircraftId ?? '']}
                        selectedHoldReason={simState.manualFleet?.find(ac => ac.id === simState.selectedAircraftId)?.holdReason}
                        readbackConfirmed={simState.readbackConfirmed?.[simState.selectedAircraftId ?? '']}
                        runwayClearancePending={simState.runwayClearancePending?.[simState.selectedAircraftId ?? '']}
                        onTogglePractice={handleTogglePractice}
                        onSetControllerRole={handleSetControllerRole}
                        onRequestHandoff={handleRequestHandoff}
                        onAcceptHandoff={handleAcceptHandoff}
                        onClearRunway={handleClearRunway}
                        onConfirmReadback={handleConfirmReadback}
                      />
                      <ScenarioPanel state={simState} graph={currentGraph} />
                    </>
                  )}

                  {mobileTab === 'status' && (
                    <StatusPanel state={simState} graph={currentGraph} />
                  )}

                  {mobileTab === 'scenarios' && (
                    <PresetScenariosPanel
                    ftgOnly={mapView === '3d'}
                      state={simState}
                      graph={currentGraph}
                      onStartScenario={handleStartScenario}
                      onExitScenario={handleExitScenario}
                      onPause={handlePause}
                      isPaused={simState.isPaused}
                      onSimSpeedChange={setSimSpeed}
                      onAircraftSpeedChange={handleAircraftSpeedChange}
                      simSpeed={simSpeed}
                    />
                  )}
                </ErrorBoundary>
              </div>
            )}
          </aside>
          </>
        </main>

        {/* ── 4. Modals (Hướng Dẫn & Path Inspector) ── */}
        {showGuide && <HuongDanModal onClose={() => setShowGuide(false)} />}
        
        {inspectingPathAircraftId && (
          <PathInspectorModal
            isOpen={!!inspectingPathAircraftId}
            onClose={() => setInspectingPathAircraftId(null)}
            aircraft={
              (simState.manualFleet?.find(a => a.id === inspectingPathAircraftId)) ||
              (simState.aircraft?.id === inspectingPathAircraftId ? simState.aircraft : null)
            }
            graph={currentGraph}
            graphId={selectedGraphId}
            onCaptureAuditImages={handleCaptureAudit}
            isCapturing={isCapturingAudit}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

