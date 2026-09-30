import { getStopBarDefinitions, isStopBarOn } from '../../../presentation/stopBars';
import type { Aircraft, AirportGraph, SimulationState } from '../../../types';
import { computeSegmentedGuidanceDots } from '../../../presentation/ftgGuidance';
import { AIRPORT_VISUAL } from '../visualTokens';
import { fixtureColor, type Fixture } from './lightLayout';

/** Fixed hardware, shared 2D sliding window. Red always wins shared occupancy. */
export function guidanceColors(fixtures: Fixture[], graph: AirportGraph, state: SimulationState): Map<string, string> {
  const colors = new Map(fixtures.map(f => [f.id, f.kind === 'guidance' ? AIRPORT_VISUAL.unlitFixture : fixtureColor(f, state)]));
  for (const bar of getStopBarDefinitions(graph)) {
    const color = isStopBarOn(bar, state) ? AIRPORT_VISUAL.stopBar : AIRPORT_VISUAL.unlitFixture;
    for (const fixture of fixtures) if (fixture.id.startsWith(`stop:${bar.id}:`)) colors.set(fixture.id, color);
  }
  const fleet: Aircraft[] = state.scenarioAircraft?.length ? state.scenarioAircraft : state.manualFleet?.length ? state.manualFleet : state.aircraft ? [state.aircraft] : [];
  const scenario = !!state.scenario;
  for (const aircraft of fleet) {
    // Đã chạm bánh (rollout) thì máy bay đã gắn vào route, bật FTG ngay; còn
    // đang bay (approach/flare/cất cánh) thì chưa.
    if ((aircraft.flight && aircraft.flight.phase !== 'rollout') || aircraft.hidden || ['arrived', 'departed', 'waiting'].includes(aircraft.status) || aircraft.guidanceVisible === false || (aircraft.status === 'parked' && !aircraft.routeVisible)) continue;
    if (aircraft.releaseAtSeconds !== undefined && aircraft.releaseAtSeconds > state.elapsedSeconds) continue;
    const initial = !aircraft.routeEdgeIndex && (['pushback', 'departing'].includes(aircraft.role ?? '') || aircraft.status === 'queued' || aircraft.scenarioLabel?.toUpperCase().includes('STAND'));
    if (initial && aircraft.status === 'holding') continue;
    if (!scenario && !aircraft.routeVisible && !['taxiing', 'holding'].includes(aircraft.status)) continue;
    const dots = computeSegmentedGuidanceDots(aircraft, graph, state.blockedEdgeIds)?.activeDots ?? [];
    const holding = aircraft.status === 'holding' || aircraft.holdReason === 'stop-bar';
    for (const fixture of fixtures) {
      if (fixture.kind !== 'guidance') continue;
      if (!dots.some(dot => Math.hypot((dot.x - 600) * 0.075 - fixture.point.x, (dot.y - 430) * 0.075 - fixture.point.z) < 0.002)) continue;
      const red = holding || fixture.edgeIds.some(id => state.lightStates[id] === 'red' || state.blockedEdgeIds.has(id));
      if (red) colors.set(fixture.id, AIRPORT_VISUAL.stopBar);
      else if (colors.get(fixture.id) !== AIRPORT_VISUAL.stopBar) colors.set(fixture.id, AIRPORT_VISUAL.ftgCenterline);
    }
  }
  return colors;
}
