import type { AirportGraph, SimulationState } from '../../types';
export interface Props {
  graph: AirportGraph;
  state: SimulationState;
  onSelectAircraft: (aircraftId: string) => void;
  onSetControllerRole?: (role: 'GND' | 'TWR') => void;
}

export type CameraPreset = 'overview' | 'northwest' | 'northeast' | 'southeast' | 'southwest' | 'follow' | 'custom';
export type SceneMode = 'airport' | 'room' | 'gnd' | 'twr';

