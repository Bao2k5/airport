import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getAirportGraph, GRAPH_REGISTRY } from './data/graphRegistry'
import {
  startScenario,
  scenarioTick,
  recalculateRoutePreservingProgress,
  assertNoTwoAircraftOnSameRunway,
  computeScenarioLightStates,
  PIXELS_PER_METER,
  SEPARATION_TAXIWAY_M,
  SEPARATION_APRON_M,
  SEPARATION_TAXIWAY_PX,
  SEPARATION_APRON_PX,
  SCENARIO_TAXI_SPEED_KTS,
  SCENARIO_APRON_SPEED_KTS,
  SCENARIO_JUNCTION_SPEED_KTS,
  SCENARIO_STOP_SPEED_KTS,
  MAX_ACCEL_KTS_PER_S,
  MAX_DECEL_KTS_PER_S,
} from './simulation/scenarioRunner'
import { getPresetScenarioDefs } from './data/presetScenarios'
import { findPath, routeToEdges } from './simulation/pathfinding'
import { simulationTick, createDefaultManualFleet, acceptRoute, startManualAircraft, resetManualAircraft } from './simulation/simulator'

// Expose simulation engine for runtime verification
if (typeof window !== 'undefined') {
  (window as any).__SIMULATION_ENGINE__ = {
    getAirportGraph,
    GRAPH_REGISTRY,
    startScenario,
    scenarioTick,
    simulationTick,
    createDefaultManualFleet,
    acceptRoute,
    startManualAircraft,
    resetManualAircraft,
    recalculateRoutePreservingProgress,
    assertNoTwoAircraftOnSameRunway,
    computeScenarioLightStates,
    PIXELS_PER_METER,
    SEPARATION_TAXIWAY_M,
    SEPARATION_APRON_M,
    SEPARATION_TAXIWAY_PX,
    SEPARATION_APRON_PX,
    SCENARIO_TAXI_SPEED_KTS,
    SCENARIO_APRON_SPEED_KTS,
    SCENARIO_JUNCTION_SPEED_KTS,
    SCENARIO_STOP_SPEED_KTS,
    MAX_ACCEL_KTS_PER_S,
    MAX_DECEL_KTS_PER_S,
    getPresetScenarioDefs,
    findPath,
    routeToEdges,
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

