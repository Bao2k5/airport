import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import type { PresetScenarioDef } from './common';
import { scenario1WrongTurn } from './scenario1_wrongTurn';
import { scenario2EmergencyFire } from './scenario2_emergencyFire';
import { scenario3HsnsConflict } from './scenario3_hsnsConflict';
import { scenario4FodClosure } from './scenario4_fodClosure';
import { scenario5RunwayChange, setupScenario5Traditional, setupScenario5FTG } from './scenario5_runwayChange';

export * from './common';
export * from './scenario1_wrongTurn';
export * from './scenario2_emergencyFire';
export * from './scenario3_hsnsConflict';
export * from './scenario4_fodClosure';
export * from './scenario5_runwayChange';

export function getPresetScenarioDefs(graph: AirportGraph = airportGraphV3): Record<string, PresetScenarioDef> {
  void graph;
  return {
    lvc_wrong_turn_radio_failure: scenario1WrongTurn,
    emergency_priority_engine_fire: scenario2EmergencyFire,
    lvc_hsns_intersection_conflict: scenario3HsnsConflict,
    lvc_w7a_sudden_closure: scenario4FodClosure,
    lvc_peak_runway_direction_change: scenario5RunwayChange,
  };
}
export { setupScenario5Traditional, setupScenario5FTG };
