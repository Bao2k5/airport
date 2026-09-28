import type { AirportGraph, SimulationState } from '../types';

export function getStopBarDefinitions(graph: AirportGraph) {
  return graph.nodes.flatMap(node => {
    if (!(/^STOP[ _-]?BAR/i.test(node.label) || node.type === 'holding_point' || node.type === 'runway_entry')) return [];
    const edges = graph.edges.filter(e => e.fromNodeId === node.id || e.toNodeId === node.id);
    const approaches = edges.filter(e => e.type !== 'runway').flatMap(edge => {
      const other = graph.nodes.find(n => n.id === (edge.fromNodeId === node.id ? edge.toNodeId : edge.fromNodeId));
      if (!other) return [];
      const length = Math.hypot(other.x - node.x, other.y - node.y);
      return length > 0.01 ? [{ other, length }] : [];
    }).sort((a, b) => b.length - a.length);
    const approach = approaches[0];
    if (!approach) return [];
    return [{ id: node.id, x: node.x, y: node.y, nx: -(approach.other.y - node.y) / approach.length, ny: (approach.other.x - node.x) / approach.length, edgeIds: edges.map(e => e.id) }];
  });
}

export function isStopBarOn(bar: ReturnType<typeof getStopBarDefinitions>[number], state: SimulationState): boolean {
  if (bar.edgeIds.some(id => state.blockedEdgeIds.has(id) || state.lightStates[id] === 'red')) return true;
  const fleet = state.scenarioAircraft?.length ? state.scenarioAircraft : state.manualFleet ?? [];
  return fleet.some(aircraft => {
    if (aircraft.hidden || aircraft.status === 'departed' || aircraft.flight) return false;
    const next = aircraft.assignedRoute[aircraft.routeEdgeIndex + 1];
    const atBar = aircraft.currentNodeId === bar.id || (next === bar.id && aircraft.progressOnEdge >= 0.9);
    return atBar && (aircraft.status === 'holding' || (state.practiceMode && !state.runwayClearanceGranted?.[aircraft.id]));
  });
}
