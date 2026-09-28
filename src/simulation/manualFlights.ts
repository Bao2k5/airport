import type { Aircraft, AircraftType, AirlineCode, AirportGraph, SimulationState } from '../types';
import { findPath, routeToEdges } from './pathfinding';
import { getAirlineDef } from '../data/airlineTypes';
import { isLanding25RNode } from '../data/v3OperationalNodes';

export interface NewFlightInput {
  callsign: string;
  aircraftType: AircraftType;
  airlineCode: AirlineCode;
  startNodeId: string;
  destinationNodeId: string;
}

export function addManualFlight(state: SimulationState, input: NewFlightInput, graph: AirportGraph): SimulationState {
  const fleet = state.manualFleet ?? [];
  const callsign = input.callsign.trim().toUpperCase();
  const reject = (warningMessage: string) => ({ ...state, warningMessage });
  if (state.scenario) return reject('Kết thúc kịch bản trước khi tạo chuyến bay.');
  if (!/^[A-Z0-9-]{2,12}$/.test(callsign)) return reject('Hiệu gọi cần 2–12 chữ cái hoặc chữ số.');
  if (fleet.some(a => a.callsign === callsign)) return reject('Hiệu gọi đã tồn tại.');
  if (fleet.length >= 20) return reject('Phiên mô phỏng hỗ trợ tối đa 20 tàu bay.');
  const start = graph.nodes.find(n => n.id === input.startNodeId), end = graph.nodes.find(n => n.id === input.destinationNodeId);
  if (!start || !end || start.id === end.id) return reject('Điểm xuất phát và điểm đến không hợp lệ.');
  if (fleet.some(a => a.status !== 'departed' && a.currentNodeId === start.id && !isLanding25RNode(start.id, graph.nodes))) return reject('Vị trí xuất phát đang có tàu bay.');
  if (/^STAND/i.test(end.label) && fleet.some(a => a.status !== 'departed' && (a.currentNodeId === end.id || a.targetNodeId === end.id))) return reject('Stand đến đã được sử dụng.');
  const route = findPath(graph, start.id, end.id, state.blockedEdgeIds);
  const edges = route && routeToEdges(route, graph.edges);
  if (!route || !edges?.length) return reject('Không có tuyến khả dụng giữa hai điểm.');
  const airline = getAirlineDef(input.airlineCode);
  const id = `manual-${callsign}`;
  const aircraft: Aircraft = { id, callsign, airlineCode: input.airlineCode, airlineName: airline.name, aircraftAsset: airline.asset, aircraftType: input.aircraftType,
    currentNodeId: start.id, targetNodeId: end.id, currentEdgeId: edges[0], assignedRoute: route, routeEdgeIndex: 0, progressOnEdge: 0,
    speedKts: 0, status: 'parked', fullFlight: true, routeVisible: false, guidanceVisible: false };
  const owner = isLanding25RNode(start.id, graph.nodes) ? 'TWR' : 'GND';
  return { ...state, manualFleet: [...fleet, aircraft], aircraft, selectedAircraftId: id, routeStatus: 'pending', warningMessage: null,
    controllerByAircraft: { ...state.controllerByAircraft, [id]: owner },
    config: { ...state.config, ...input, callsign },
    liveEventLog: [...state.liveEventLog, { id: `spawn-${id}-${state.elapsedSeconds}`, atSeconds: state.elapsedSeconds, callsign, message: `Tạo chuyến ${callsign}: ${start.label} → ${end.label}; chờ ${owner} cấp lệnh.`, severity: 'info' as const }].slice(-200) };
}
