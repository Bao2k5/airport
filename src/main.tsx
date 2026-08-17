import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { airportGraphV2 } from './data/airportGraph.v2'
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
} from './simulation/scenarioRunner'
import { getPresetScenarioDefs } from './data/presetScenarios'
import { findPath, routeToEdges } from './simulation/pathfinding'
import { simulationTick, createDefaultManualFleet } from './simulation/simulator'

// Expose simulation engine for runtime verification
if (typeof window !== 'undefined') {
  (window as any).__SIMULATION_ENGINE__ = {
    airportGraphV2,
    getAirportGraph,
    GRAPH_REGISTRY,
    startScenario,
    scenarioTick,
    simulationTick,
    createDefaultManualFleet,
    recalculateRoutePreservingProgress,
    assertNoTwoAircraftOnSameRunway,
    computeScenarioLightStates,
    PIXELS_PER_METER,
    SEPARATION_TAXIWAY_M,
    SEPARATION_APRON_M,
    SEPARATION_TAXIWAY_PX,
    SEPARATION_APRON_PX,
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

