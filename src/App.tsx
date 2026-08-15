// Application entry point — layout, simulation loop, state orchestration.

import { useState, useEffect, useRef, useCallback } from 'react';
import AirportMap from './components/AirportMap';
import ControlPanel from './components/ControlPanel';
import StatusPanel from './components/StatusPanel';
import ScenarioPanel from './components/ScenarioPanel';
import HuongDanModal from './components/HuongDanModal';
import {
  initSimulation,
  simulationTick,
  acceptRoute,
  setIncidentEdge,
  clearIncidents,
  randomIncidentEdge,
  startManualAircraft,
  resetManualAircraft,
} from './simulation/simulator';
import { findPath, routeToEdges } from './simulation/pathfinding';
import { getAirlineDef } from './data/airlineTypes';
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
  const [selectedGraphId, setSelectedGraphId] = useState<GraphId>(DEFAULT_GRAPH_ID);
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [simState, setSimState] = useState<SimulationState>(() => initSimulation(DEFAULT_CONFIG));
  const [activeTab, setActiveTab] = useState<'control' | 'scenarios'>('control');
  const [showGuide, setShowGuide] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showGraphV2Overlay, setShowGraphV2Overlay] = useState(false);
  const [autoIncidents, setAutoIncidents] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const currentGraphEntry = GRAPH_REGISTRY[selectedGraphId] ?? GRAPH_REGISTRY.v1;
  const currentGraph = getAirportGraph(selectedGraphId);

  // Vòng lặp mô phỏng qua requestAnimationFrame
  useEffect(() => {
    if (!simState.isRunning || simState.isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }

    const frame = (now: number) => {
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

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [simState.isRunning, simState.isPaused, simState.scenario, currentGraph]);

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
  }, [currentGraph]);

  const handlePause = useCallback(() => {
    setSimState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const handleAcceptRoute = useCallback(() => {
    setSimState(prev => acceptRoute(prev, currentGraph));
  }, [currentGraph]);

  // Inject a live incident: block a random edge ahead on the current route.
  // The simulation tick then re-routes (Dijkstra) from the aircraft's position.
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

  // Auto-incident mode: every few seconds, while taxiing, throw a new incident
  // on the road ahead so the live re-routing runs continuously.
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
      const selectedId = prev.selectedAircraftId || 'VN001';
      return resetManualAircraft(prev, selectedId, currentGraph);
    });
  }, [currentGraph]);

  return (
    <div className="min-h-screen bg-[#0c0f12] text-gray-100 flex flex-col">
      {/* Cảnh báo giáo dục */}
      <header className="bg-amber-950 border-b border-amber-800 text-amber-200 text-center py-1.5 text-xs font-semibold tracking-wide px-4">
        CHỈ DÙNG CHO MỤC ĐÍCH GIÁO DỤC — KHÔNG SỬ DỤNG TRONG HOẠT ĐỘNG HÀNG KHÔNG THỰC TẾ
      </header>

      {/* Thanh tiêu đề */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111620] border-b border-[#1e2838]">
        <h1 className="text-base font-bold text-white">
          Mô Phỏng Di Chuyển Mặt Đất Sân Bay
        </h1>
        <span className="text-xs text-gray-500 hidden sm:inline">
          · Sơ đồ đơn giản hóa lấy cảm hứng từ Sân bay Tân Sơn Nhất
        </span>

        {/* Bộ chọn Đồ thị (Graph Selector) */}
        <div className="flex items-center gap-1.5 ml-4 bg-[#0a0e14] px-2.5 py-1 rounded-lg border border-[#223044]">
          <span className="text-xs text-gray-400 font-medium">📊 Mô hình:</span>
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
            className="bg-[#151c28] text-xs font-semibold text-cyan-300 rounded px-2 py-1 border border-cyan-500/40 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="v1">Graph V1 (Gốc 127 nodes)</option>
            <option value="v2">Graph V2 (Bản đồ mới anhtren.png - 162 nodes)</option>
          </select>
        </div>

        {/* Controls: Overlay Graph V2, Debug, Hướng dẫn */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowGraphV2Overlay(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
              showGraphV2Overlay
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400'
                : 'bg-[#151c28] hover:bg-[#1e2838] text-gray-300 border-[#223044]'
            }`}
            title="Bật/Tắt hiển thị lớp phủ mạng lưới Graph V2"
          >
            {showGraphV2Overlay ? '👁️ Ẩn overlay Graph V2' : '🌐 Hiện overlay Graph V2'}
          </button>
          
          <button
            onClick={() => setShowGrid(v => !v)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
              showGrid ? 'bg-red-500 hover:bg-red-400 text-black border-red-400' : 'bg-[#151c28] hover:bg-[#1e2838] text-gray-400 border-[#223044]'
            }`}
            title="Lưới tọa độ"
          >
            Grid
          </button>

          <button
            onClick={() => setShowPaths(v => !v)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
              showPaths ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400' : 'bg-[#151c28] hover:bg-[#1e2838] text-gray-400 border-[#223044]'
            }`}
            title="Tất cả tuyến đường"
          >
            Paths
          </button>

          {/* Nút Hướng dẫn */}
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition ml-1 shadow-sm"
          >
            <span className="text-sm leading-none">?</span>
            Hướng dẫn
          </button>
        </div>
      </div>

      {/* Bố cục chính */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden min-h-0">
        {/* Bản đồ sân bay */}
        <div className="flex-1 min-w-0 min-h-0">
          <AirportMap
            state={simState}
            graph={currentGraph}
            bgImage={currentGraphEntry.bgImage}
            onSelectAircraft={handleSelectAircraft}
            showPaths={showPaths}
            showGrid={showGrid}
            showGraphV2Overlay={showGraphV2Overlay}
          />
        </div>

        {/* Thanh bên phải */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          {/* Tab Switcher */}
          <div className="flex bg-[#111620] p-1 rounded-xl border border-[#1e2838]">
            <button
              onClick={() => setActiveTab('control')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'control'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Điều khiển
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'scenarios'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Kịch bản mẫu
            </button>
          </div>

          {activeTab === 'control' ? (
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
                onStartScenario={(scId) => {
                  setSimState(startScenario(scId, currentGraph));
                }}
                onExitScenario={() => {
                  handleReset();
                  setActiveTab('control');
                }}
              />
              <StatusPanel state={simState} graph={currentGraph} />
            </>
          )}
        </div>
      </div>

      {/* Modal hướng dẫn */}
      {showGuide && <HuongDanModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
