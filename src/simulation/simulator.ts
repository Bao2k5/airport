// Simulation tick logic: moves the aircraft along its route,
// updates light states, handles incidents and rerouting.

import type { Aircraft, AirportEdge, SimulationConfig, SimulationState, TrafficLevel } from '../types';
import { airportGraph, RAMP_NODES, HOLDING_NODES, getNode } from '../data/airportGraph';
import { getAircraftSpec } from '../data/aircraftTypes';
import { findPath, routeToEdges, estimateTravelTimeSeconds } from './pathfinding';

const KNOTS_TO_MS = 0.5144;
// How many edges ahead to light green
const GREEN_LIGHT_LOOKAHEAD = 4;

/** Apply weather speed penalty (fraction of max speed to use) */
export function weatherSpeedFactor(config: SimulationConfig): number {
  switch (config.weather) {
    case 'fog':          return 0.45;
    case 'thunderstorm': return 0.35;
    case 'rain':         return 0.70;
    default:             return 1.00;
  }
}

/** Apply traffic speed penalty */
export function trafficSpeedFactor(config: SimulationConfig): number {
  switch (config.trafficLevel) {
    case 'high':   return 0.55;
    case 'medium': return 0.75;
    default:       return 1.00;
  }
}

/**
 * Effective taxi speed (kts) taking aircraft type, weather and traffic into
 * account. The selected aircraft type sets both a speed multiplier and a
 * per-type taxi-speed ceiling, so different types move (and arrive) differently.
 */
export function effectiveTaxiSpeedKts(config: SimulationConfig): number {
  const spec = getAircraftSpec(config.aircraftType);
  const baseSpeed = Math.min(config.taxiSpeedKts, spec.maxTaxiKts);
  return baseSpeed * spec.speedFactor * weatherSpeedFactor(config) * trafficSpeedFactor(config);
}

// ── Background traffic (visual-only) ──────────────────────────────────────────
// Extra aircraft that roam between hot-spots / runway ends to convey congestion.
// They are independent of the primary aircraft's route, lights and incidents.

const NO_BLOCKED: Set<string> = new Set();

// Background traffic should taxi, never roll down a runway — keep runway edges
// out of their routing (the taxiway/apron network alone connects all gates and
// holding points).
const RUNWAY_EDGE_IDS = new Set(
  airportGraph.edges.filter(e => e.type === 'runway').map(e => e.id),
);

/** Edge set background traffic avoids: runways, plus any extra sets (reserved, current edge). */
function bgAvoid(...extra: Set<string>[]): Set<string> {
  const s = new Set(RUNWAY_EDGE_IDS);
  for (const set of extra) for (const id of set) s.add(id);
  return s;
}

/** How many background aircraft to show for a given traffic level. */
function backgroundTrafficCount(level: TrafficLevel): number {
  switch (level) {
    case 'high':   return 2;
    case 'medium': return 1;
    default:       return 0;
  }
}

function pickId(pool: { id: string }[]): string {
  return pool[Math.floor(Math.random() * pool.length)].id;
}

const isHoldingPoint = (id: string) => HOLDING_NODES.some(n => n.id === id);
const isRamp = (id: string) => RAMP_NODES.some(n => n.id === id);

/**
 * Right-of-way priority (lower = higher priority), matching real ground control:
 *   1 = arriving  (taxiing IN to a gate),
 *   2 = departing (taxiing OUT to a runway holding point),
 *   3 = anything else.
 * Lower-priority traffic yields. Planes are stepped in this order each tick so the
 * higher-priority one claims the contested edge first and the other gives way.
 */
function priorityOf(ac: Aircraft): number {
  if (isRamp(ac.targetNodeId)) return 1;
  if (isHoldingPoint(ac.targetNodeId)) return 2;
  return 3;
}

/**
 * A realistic next destination for a background aircraft: gates go to a runway
 * holding point and vice-versa, so each trip is a full cross-field taxi rather
 * than a hop between hot-spots. Mid-field starts (e.g. after a turn-around) head
 * to a holding point.
 */
function oppositeEndpoint(fromId: string): string {
  return isHoldingPoint(fromId) ? pickId(RAMP_NODES) : pickId(HOLDING_NODES);
}

/**
 * Find a realistic gate↔holding route from `fromId`. Prefers a route that avoids
 * `avoid` (the player's reserved corridor) so background traffic keeps clear of
 * the active aircraft's path; falls back to any route if the reservation leaves
 * no option.
 */
function randomRoute(
  fromId: string,
  avoid: Set<string> = NO_BLOCKED,
): { dest: string; route: string[] } | null {
  // Runways AND the player's reserved corridor are always blocked, so background
  // only ever heads to a currently-reachable endpoint and never gets trapped on
  // the player's path. Returns null if nothing's reachable right now (caller waits).
  const blocked = bgAvoid(avoid);
  for (let i = 0; i < 14; i++) {
    const dest = oppositeEndpoint(fromId);
    if (dest === fromId) continue;
    const route = findPath(airportGraph, fromId, dest, blocked);
    if (route && route.length > 1) return { dest, route };
  }
  return null;
}

/**
 * Spawn the background-traffic fleet for the current config. Each aircraft gets
 * a random roaming route and is dropped at a random point along it so the fleet
 * is spread across the map from frame one. Speed bakes in the weather penalty.
 */
export function spawnBackgroundTraffic(
  config: SimulationConfig,
  reserved: Set<string> = NO_BLOCKED,
): Aircraft[] {
  const count = backgroundTrafficCount(config.trafficLevel);
  if (count === 0) return [];

  const weatherFactor = weatherSpeedFactor(config);
  const fleet: Aircraft[] = [];
  let attempts = 0;

  while (fleet.length < count && attempts < count * 20) {
    attempts++;
    // Most start at a gate (departing); some at a holding point (arriving).
    const start = Math.random() < 0.7 ? pickId(RAMP_NODES) : pickId(HOLDING_NODES);
    const plan = randomRoute(start, reserved);
    if (!plan) continue;

    const routeEdgeIds = routeToEdges(plan.route, airportGraph.edges) ?? [];
    if (!routeEdgeIds.length) continue;

    // Drop the aircraft at a random edge along its route so the fleet is spread out.
    const startIdx = Math.floor(Math.random() * routeEdgeIds.length);
    const baseSpeedKts = 10 + Math.random() * 6; // 10–16 kts, varied per aircraft

    const candidate: Aircraft = {
      id: `BG${fleet.length + 1}`,
      callsign: `TFC${100 + fleet.length}`,
      currentNodeId: plan.route[startIdx],
      targetNodeId: plan.dest,
      currentEdgeId: routeEdgeIds[startIdx],
      progressOnEdge: Math.random(),
      speedKts: baseSpeedKts * weatherFactor,
      status: 'taxiing',
      assignedRoute: plan.route,
      routeEdgeIndex: startIdx,
    };

    // Don't spawn two planes on the same edge (would be head-on / stacked) or
    // within SEP_GAP of each other — keeps the no-overlap invariant true from
    // frame one.
    if (candidate.currentEdgeId && reserved.has(candidate.currentEdgeId)) continue; // not on player's path
    const cp = aircraftXY(candidate);
    const clash = fleet.some(f => {
      if (f.currentEdgeId === candidate.currentEdgeId) return true;
      const fp = aircraftXY(f);
      return cp && fp && Math.hypot(cp.x - fp.x, cp.y - fp.y) < SEP_GAP;
    });
    if (clash) continue;

    fleet.push(candidate);
  }

  return fleet;
}

/**
 * Give a background aircraft a fresh roaming route starting at `fromId`
 * (defaults to where it was heading — used both when it arrives and, with the
 * node behind it, to turn it around out of a gridlock).
 */
function reassignBackgroundRoute(
  ac: Aircraft,
  fromId: string = ac.targetNodeId,
  reserved: Set<string> = NO_BLOCKED,
): Aircraft {
  const plan = randomRoute(fromId, reserved);
  if (!plan) return { ...ac, status: 'arrived', currentNodeId: fromId, heldSeconds: 0 };
  const routeEdgeIds = routeToEdges(plan.route, airportGraph.edges) ?? [];
  return {
    ...ac,
    targetNodeId: plan.dest,
    currentNodeId: fromId,
    currentEdgeId: routeEdgeIds[0] ?? null,
    progressOnEdge: 0,
    status: 'taxiing',
    assignedRoute: plan.route,
    routeEdgeIndex: 0,
    heldSeconds: 0,
  };
}

// ── Separation / collision avoidance ──────────────────────────────────────────
// Aircraft must not overlap. Each one checks a short corridor directly ahead;
// if any other aircraft sits in it, the follower holds for this tick.

const SEP_FORWARD = 26; // SVG px ahead to keep clear (~one aircraft length + gap)
const SEP_LATERAL = 13; // SVG px to each side — narrow so parallel taxiways don't trigger
// A background plane blocked at a junction this long (sim-seconds) forces its way
// through congestion (claim still prevents a head-on) — a valve vs minor gridlock.
const GRIDLOCK_SECONDS = 4;
// Minimum spacing (SVG px) background planes keep from each other / from nodes.
const SEP_GAP = 15;
// A plane held by the no-overlap backstop this long (sim-seconds) pushes through
// anyway — last-resort cluster breaker. High because the corridor look-ahead and
// junction re-routing resolve almost everything without ever overlapping.
const BACKSTOP_OVERRIDE = 30;
// How many edges ahead of the active aircraft stay reserved. Long enough to cover
// the single-lane dead-ends it taxis (so background can't get trapped on them),
// short enough not to wall off the whole map and over-crowd the rest.
const RESERVE_LOOKAHEAD = 12;

/** The active aircraft's upcoming route edges (its protected corridor — background
 *  traffic stays off these). */
function playerReservedEdges(player: Aircraft | null, lookahead = RESERVE_LOOKAHEAD): Set<string> {
  const reserved = new Set<string>();
  if (!player) return reserved;
  const rEdges = routeToEdges(player.assignedRoute, airportGraph.edges) ?? [];
  const end = Math.min(rEdges.length, player.routeEdgeIndex + lookahead);
  for (let i = player.routeEdgeIndex; i < end; i++) reserved.add(rEdges[i]);
  return reserved;
}

interface AircraftVec {
  x: number;
  y: number;
  dx: number; // unit heading
  dy: number;
}

/** World position + travel direction of an aircraft, or null if off-route. */
function aircraftVec(ac: Aircraft): AircraftVec | null {
  const from = getNode(ac.assignedRoute[ac.routeEdgeIndex]);
  const to = getNode(ac.assignedRoute[ac.routeEdgeIndex + 1]);
  if (!from || !to) return null;
  const t = ac.progressOnEdge;
  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x, y, dx: dx / len, dy: dy / len };
}

/** The nearest aircraft sitting in `self`'s forward corridor, or null if clear. */
function blockedAhead(self: AircraftVec, others: AircraftVec[]): AircraftVec | null {
  let nearest: AircraftVec | null = null;
  let nearestForward = Infinity;
  for (const o of others) {
    const rx = o.x - self.x;
    const ry = o.y - self.y;
    const forward = rx * self.dx + ry * self.dy;       // distance ahead along heading
    if (forward <= 0 || forward > SEP_FORWARD) continue; // behind, on top of, or too far
    const lateral = Math.abs(rx * -self.dy + ry * self.dx); // perpendicular offset
    if (lateral < SEP_LATERAL && forward < nearestForward) {
      nearestForward = forward;
      nearest = o;
    }
  }
  return nearest;
}

// ── Node-decision movement model for background traffic ───────────────────────
// Planes follow edges, keep spacing, and make routing decisions only AT nodes
// (never mid-edge), so they never teleport. An edge a plane has committed to is
// "claimed" for the tick; others won't enter it head-on. When the way ahead is
// blocked, the plane re-plans toward the same destination from the junction it
// sits on (no snap-back) or waits at the junction.

interface Occupant {
  id: string;
  edgeId: string;
  from: string;     // node it came from
  to: string;       // node it heads to
  progress: number; // 0..1 along from→to
  lenPx: number;
  x: number;
  y: number;
}

interface StepCtx {
  occupants: Occupant[];        // pre-tick positions of every aircraft
  claimed: Map<string, string>; // edgeId → fromNode, for edges entered this tick
  reserved: Set<string>;        // the player's protected corridor
}

/** World (x,y) of an aircraft on its current edge, or null if off-route. */
function aircraftXY(ac: Aircraft): { x: number; y: number } | null {
  const f = getNode(ac.assignedRoute[ac.routeEdgeIndex]);
  const t = getNode(ac.assignedRoute[ac.routeEdgeIndex + 1]);
  if (!f || !t) return null;
  return { x: f.x + (t.x - f.x) * ac.progressOnEdge, y: f.y + (t.y - f.y) * ac.progressOnEdge };
}

/** Snapshot an aircraft as an edge occupant (null if it isn't on an edge). */
function toOccupant(ac: Aircraft): Occupant | null {
  if (!ac.currentEdgeId) return null;
  const from = getNode(ac.assignedRoute[ac.routeEdgeIndex]);
  const to = getNode(ac.assignedRoute[ac.routeEdgeIndex + 1]);
  if (!from || !to) return null;
  const lenPx = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    id: ac.id,
    edgeId: ac.currentEdgeId,
    from: ac.assignedRoute[ac.routeEdgeIndex],
    to: ac.assignedRoute[ac.routeEdgeIndex + 1],
    progress: ac.progressOnEdge,
    lenPx,
    x: from.x + (to.x - from.x) * ac.progressOnEdge,
    y: from.y + (to.y - from.y) * ac.progressOnEdge,
  };
}

/** Gap (px) to the nearest plane ahead on the same edge & direction, or Infinity. */
function leaderGapPx(edgeId: string, fromNode: string, progress: number, selfId: string, ctx: StepCtx): number {
  let gap = Infinity;
  for (const o of ctx.occupants) {
    if (o.id === selfId || o.edgeId !== edgeId || o.from !== fromNode) continue;
    if (o.progress > progress) gap = Math.min(gap, (o.progress - progress) * o.lenPx);
  }
  return gap;
}

/** Is another plane sitting within SEP_GAP of this node? */
function nodeOccupied(nodeId: string, selfId: string, ctx: StepCtx): boolean {
  const n = getNode(nodeId);
  if (!n) return false;
  for (const o of ctx.occupants) {
    if (o.id === selfId) continue;
    if (Math.hypot(o.x - n.x, o.y - n.y) < SEP_GAP) return true;
  }
  return false;
}

// Taxiway/apron adjacency (runways excluded) for corridor analysis.
const TAXI_ADJ: Map<string, { to: string; edgeId: string }[]> = (() => {
  const m = new Map<string, { to: string; edgeId: string }[]>();
  const add = (a: string, to: string, edgeId: string) => {
    if (!m.has(a)) m.set(a, []);
    m.get(a)!.push({ to, edgeId });
  };
  for (const e of airportGraph.edges) {
    if (e.type === 'runway') continue;
    add(e.fromNodeId, e.toNodeId, e.id);
    if (e.bidirectional) add(e.toNodeId, e.fromNodeId, e.id);
  }
  return m;
})();
const taxiDegree = (node: string) => TAXI_ADJ.get(node)?.length ?? 0;

/**
 * Head-on conflict detected FROM AFAR: look down the single-lane corridor that
 * begins at `edgeId` (the chain of pass-through, degree-2 nodes beyond it) and
 * report a conflict if any other aircraft is travelling toward us anywhere along
 * it, or has claimed part of it the other way this tick. This makes a plane wait
 * at the junction *before* committing to a one-lane passage, instead of meeting
 * head-on inside it. Never overridden — two planes can't share a lane.
 */
function corridorHeadOn(edgeId: string, fromNode: string, toNode: string, selfId: string, ctx: StepCtx): boolean {
  let prev = fromNode, cur = toNode, eId = edgeId;
  for (let step = 0; step < 14; step++) {
    // Anyone on this segment heading back toward me (prev), or claimed that way?
    for (const o of ctx.occupants) {
      if (o.id !== selfId && o.edgeId === eId && o.from === cur) return true;
    }
    const claimedFrom = ctx.claimed.get(eId);
    if (claimedFrom && claimedFrom === cur) return true;
    // Continue only while `cur` is a pass-through (a real junction ends the lane).
    if (taxiDegree(cur) !== 2) break;
    const nxt = (TAXI_ADJ.get(cur) ?? []).find(n => n.to !== prev);
    if (!nxt) break;
    prev = cur; cur = nxt.to; eId = nxt.edgeId;
  }
  return false;
}

/** Congestion: the entrance or the far junction is occupied. May be overridden by
 *  the anti-gridlock valve (it only delays, it can't cause a head-on). */
function edgeCongested(edgeId: string, fromNode: string, toNode: string, selfId: string, ctx: StepCtx): boolean {
  for (const o of ctx.occupants) {
    if (o.id === selfId || o.edgeId !== edgeId) continue;
    if (o.from === fromNode && o.progress * o.lenPx < SEP_GAP) return true; // entrance still occupied
  }
  return nodeOccupied(toNode, selfId, ctx);
}

/** Can a plane enter edge (fromNode→toNode)? `force` bypasses congestion only,
 *  never a (corridor) head-on. */
function canEnter(edgeId: string, fromNode: string, toNode: string, selfId: string, ctx: StepCtx, force: boolean): boolean {
  if (corridorHeadOn(edgeId, fromNode, toNode, selfId, ctx)) return false;
  return force || !edgeCongested(edgeId, fromNode, toNode, selfId, ctx);
}

/** Re-plan toward the same destination from `fromNode`, avoiding `avoidEdgeId`. */
function replanFrom(ac: Aircraft, fromNode: string, avoidEdgeId: string | undefined, ctx: StepCtx): string[] | null {
  const extra = avoidEdgeId ? new Set([avoidEdgeId]) : NO_BLOCKED;
  // Runways and the reserved corridor are always blocked — never route through them.
  const route = findPath(airportGraph, fromNode, ac.targetNodeId, bgAvoid(ctx.reserved, extra));
  return route && route.length > 1 ? route : null;
}

/** Enter `edgeId` from `node` as edge index `idx` of the current route. */
function enterEdge(ac: Aircraft, idx: number, node: string, edgeId: string): Aircraft {
  return {
    ...ac,
    routeEdgeIndex: idx,
    progressOnEdge: 0,
    currentNodeId: node,
    currentEdgeId: edgeId,
    status: 'taxiing',
    heldSeconds: 0,
  };
}

/** Adopt a freshly-planned route, starting at `node` (continuous — no teleport). */
function adoptRoute(ac: Aircraft, route: string[], node: string): Aircraft {
  const edgeIds = routeToEdges(route, airportGraph.edges) ?? [];
  return {
    ...ac,
    assignedRoute: route,
    targetNodeId: route[route.length - 1],
    routeEdgeIndex: 0,
    progressOnEdge: 0,
    currentNodeId: node,
    currentEdgeId: edgeIds[0] ?? null,
    status: 'taxiing',
    heldSeconds: 0,
  };
}

/** Advance one background aircraft one tick under the node-decision model. */
function stepBackground(ac: Aircraft, dt: number, ctx: StepCtx): Aircraft {
  const edges = airportGraph.edges;
  const routeEdgeIds = routeToEdges(ac.assignedRoute, edges) ?? [];
  if (ac.routeEdgeIndex >= routeEdgeIds.length) {
    return reassignBackgroundRoute(ac, ac.targetNodeId, ctx.reserved);
  }

  const A = ac.assignedRoute[ac.routeEdgeIndex];
  const B = ac.assignedRoute[ac.routeEdgeIndex + 1];
  const edge = edges.find(e => e.id === routeEdgeIds[ac.routeEdgeIndex]);
  const nA = getNode(A), nB = getNode(B);
  if (!edge || !nA || !nB) return ac;
  const lenPx = Math.hypot(nB.x - nA.x, nB.y - nA.y) || 1;

  const speedMs = ac.speedKts * KNOTS_TO_MS;
  const inc = edge.lengthMeters > 0 ? (speedMs / edge.lengthMeters) * dt : 1;

  // Aircraft only ever move forward — conflicts are resolved by *waiting at
  // junctions* and re-planning there, never by reversing down a taxiway. A plane
  // caught on the player's corridor simply finishes its current edge (it's well
  // ahead of the player) and peels off at the next junction.

  let target = ac.progressOnEdge + inc;

  // Keep spacing behind a leader on the same edge.
  const gap = leaderGapPx(edge.id, A, ac.progressOnEdge, ac.id, ctx);
  if (gap !== Infinity) target = Math.min(target, ac.progressOnEdge + Math.max(0, (gap - SEP_GAP) / lenPx));

  // Still mid-edge → just move (or hold if a leader pinned us). The geometric
  // backstop (in the tick) guarantees we never overlap a plane near the junction.
  if (target < 1) {
    if (target <= ac.progressOnEdge + 1e-6) {
      return { ...ac, status: 'holding', heldSeconds: (ac.heldSeconds ?? 0) + dt };
    }
    return { ...ac, progressOnEdge: target, currentNodeId: A, status: 'taxiing', heldSeconds: 0 };
  }

  // Reached junction B → decide what to do next.
  const held = (ac.heldSeconds ?? 0) + dt;
  const force = held >= GRIDLOCK_SECONDS; // anti-gridlock valve (never bypasses head-on)
  const waitAtB: Aircraft = { ...ac, progressOnEdge: 1, currentNodeId: A, status: 'holding', heldSeconds: held };

  // Arrived at destination → start a new trip if its first leg is clear.
  if (ac.routeEdgeIndex + 1 >= routeEdgeIds.length) {
    const plan = randomRoute(B, ctx.reserved);
    if (plan) {
      const firstEdgeId = (routeToEdges(plan.route, edges) ?? [])[0];
      if (firstEdgeId && canEnter(firstEdgeId, B, plan.route[1], ac.id, ctx, force)) {
        ctx.claimed.set(firstEdgeId, B);
        return adoptRoute(ac, plan.route, B);
      }
    }
    return waitAtB;
  }

  // Preferred: continue along the planned route — unless the next edge is on the
  // player's reserved corridor (peel off it) or is blocked.
  const nextNode = ac.assignedRoute[ac.routeEdgeIndex + 2];
  const nextEdgeId = routeEdgeIds[ac.routeEdgeIndex + 1];
  if (!ctx.reserved.has(nextEdgeId) && canEnter(nextEdgeId, B, nextNode, ac.id, ctx, force)) {
    ctx.claimed.set(nextEdgeId, B);
    return enterEdge(ac, ac.routeEdgeIndex + 1, B, nextEdgeId);
  }

  // Blocked (or reserved) ahead → plan another path to the destination from here.
  const route = replanFrom(ac, B, nextEdgeId, ctx);
  if (route) {
    const firstEdgeId = (routeToEdges(route, edges) ?? [])[0];
    if (firstEdgeId && canEnter(firstEdgeId, B, route[1], ac.id, ctx, force)) {
      ctx.claimed.set(firstEdgeId, B);
      return adoptRoute(ac, route, B);
    }
  }

  // Still blocked after waiting a while → give up on this destination and pick a
  // new trip that leaves this junction a different way (prevents starvation when a
  // busy corridor never clears). Continuous — the plane is sitting at the junction.
  if (force) {
    const fresh = randomRoute(B, ctx.reserved);
    if (fresh) {
      const firstEdgeId = (routeToEdges(fresh.route, edges) ?? [])[0];
      if (firstEdgeId && canEnter(firstEdgeId, B, fresh.route[1], ac.id, ctx, false)) {
        ctx.claimed.set(firstEdgeId, B);
        return adoptRoute(ac, fresh.route, B);
      }
    }
  }

  // Nothing free yet → wait AT the junction (sit at B, no teleport).
  return waitAtB;
}

/** Build the initial set of blocked edge IDs from incident + edge statuses */
export function buildBlockedEdgeIds(
  config: SimulationConfig,
  edges: AirportEdge[]
): Set<string> {
  const blocked = new Set<string>();

  // Edges that are closed/restricted in the graph
  for (const e of edges) {
    if (e.status === 'closed' || e.status === 'restricted') {
      blocked.add(e.id);
    }
  }

  // Incident overlay
  if (config.incidentEdgeId && config.incident !== 'none') {
    blocked.add(config.incidentEdgeId);
  }

  return blocked;
}

/** Compute light states for all edges based on aircraft position and route */
export function computeLightStates(
  aircraft: Aircraft,
  blockedEdgeIds: Set<string>
): Record<string, 'green' | 'red' | 'off'> {
  const lights: Record<string, 'green' | 'red' | 'off'> = {};

  if (!aircraft.assignedRoute.length) return lights;

  const allEdges = airportGraph.edges;

  // Determine which edges are on the route ahead of the aircraft
  const routeEdgeIds = routeToEdges(aircraft.assignedRoute, allEdges) ?? [];

  for (const edge of allEdges) {
    if (blockedEdgeIds.has(edge.id)) {
      lights[edge.id] = 'red';
      continue;
    }

    const idxInRoute = routeEdgeIds.indexOf(edge.id);
    if (idxInRoute === -1) {
      lights[edge.id] = 'off';
      continue;
    }

    // Current edge index the aircraft is on
    const currentEdgeRouteIdx = aircraft.routeEdgeIndex;

    if (idxInRoute < currentEdgeRouteIdx) {
      // Behind aircraft — off
      lights[edge.id] = 'off';
    } else if (idxInRoute >= currentEdgeRouteIdx && idxInRoute < currentEdgeRouteIdx + GREEN_LIGHT_LOOKAHEAD) {
      // Ahead within lookahead window — green
      lights[edge.id] = 'green';
    } else {
      lights[edge.id] = 'off';
    }
  }

  return lights;
}

/**
 * Single simulation tick. dt is elapsed time in seconds.
 * Returns updated SimulationState (immutable-style).
 */
export function simulationTick(
  state: SimulationState,
  dt: number
): SimulationState {
  if (!state.isRunning || state.isPaused) return state;

  // ── Reserved corridor: the active aircraft's entire remaining route. Background
  // traffic never routes onto it (it uses other gates/holding meanwhile), so it
  // can't get trapped on the player's single-lane corridors and deadlock it.
  const reserved = playerReservedEdges(state.aircraft);

  // ── Background traffic: node-decision movement with edge reservations. Snapshot
  // every aircraft's position (incl. the player) as an obstacle, then step each
  // plane; claims accumulate as we go so two planes can't enter an edge head-on.
  const ctx: StepCtx = { occupants: [], claimed: new Map(), reserved };
  if (state.aircraft) { const o = toOccupant(state.aircraft); if (o) ctx.occupants.push(o); }
  for (const ac of state.trafficAircraft) { const o = toOccupant(ac); if (o) ctx.occupants.push(o); }

  // Process planes by right-of-way priority (arriving → departing → normal) so
  // the higher-priority plane claims the contested edge first and the other gives
  // way. A geometric backstop then guarantees no two ever overlap: if a plane's
  // chosen move would bring it within SEP_GAP of another, it holds in place.
  const order = state.trafficAircraft
    .map((_, i) => i)
    .sort((a, b) => priorityOf(state.trafficAircraft[a]) - priorityOf(state.trafficAircraft[b]));
  const placed = new Map<string, { x: number; y: number }>();
  const trafficAircraft = state.trafficAircraft.slice();
  for (const i of order) {
    const ac = state.trafficAircraft[i];
    const next = stepBackground(ac, dt, ctx);
    const np = aircraftXY(next);
    let result = next;
    if (np && (ac.heldSeconds ?? 0) < BACKSTOP_OVERRIDE) {
      for (const o of ctx.occupants) {
        if (o.id === ac.id) continue;
        const op = placed.get(o.id) ?? { x: o.x, y: o.y }; // earlier→new pos, others→pre-tick
        if (Math.hypot(np.x - op.x, np.y - op.y) < SEP_GAP) {
          result = { ...ac, status: 'holding', heldSeconds: (ac.heldSeconds ?? 0) + dt };
          break;
        }
      }
    }
    if (np) placed.set(ac.id, aircraftXY(result) ?? np);
    trafficAircraft[i] = result;
  }

  // Your aircraft holds if a plane is close ahead (never re-routes for traffic —
  // re-routing is reserved for incidents).
  const primaryVec = state.aircraft ? aircraftVec(state.aircraft) : null;
  const bgVecs: AircraftVec[] = [];
  for (const o of ctx.occupants) if (o.id !== state.aircraft?.id) bgVecs.push({ x: o.x, y: o.y, dx: 0, dy: 0 });
  const primaryHold = primaryVec ? blockedAhead(primaryVec, bgVecs) !== null : false;

  return tickPrimaryAircraft({ ...state, trafficAircraft }, dt, primaryHold);
}

function tickPrimaryAircraft(
  state: SimulationState,
  dt: number,
  trafficHold: boolean
): SimulationState {
  const { aircraft, config } = state;
  if (!aircraft || aircraft.status === 'arrived' || aircraft.status === 'stopped') return state;

  // Hold for separation from background traffic ahead (does not consume the route).
  if (trafficHold && (aircraft.status === 'taxiing' || aircraft.status === 'holding' || aircraft.status === 'waiting')) {
    const holding: Aircraft = { ...aircraft, status: 'holding', speedKts: 0 };
    return {
      ...state,
      aircraft: holding,
      elapsedSeconds: state.elapsedSeconds + dt,
      warningMessage: 'Giữ khoảng cách an toàn — có máy bay phía trước.',
      lightStates: computeLightStates(holding, state.blockedEdgeIds),
    };
  }

  const edges = airportGraph.edges;

  // Effective speed (depends on aircraft type, weather and traffic)
  const effectiveSpeed = effectiveTaxiSpeedKts(config);
  const effectiveSpeedMs = effectiveSpeed * KNOTS_TO_MS;

  // Current edge
  const routeEdgeIds = routeToEdges(aircraft.assignedRoute, edges) ?? [];
  if (aircraft.routeEdgeIndex >= routeEdgeIds.length) {
    // Arrived
    const arrived: Aircraft = {
      ...aircraft,
      status: 'arrived',
      currentNodeId: aircraft.assignedRoute[aircraft.assignedRoute.length - 1],
      progressOnEdge: 1,
    };
    return {
      ...state,
      aircraft: arrived,
      isRunning: false,
      elapsedSeconds: state.elapsedSeconds + dt,
      lightStates: computeLightStates(arrived, state.blockedEdgeIds),
    };
  }

  const currentEdgeId = routeEdgeIds[aircraft.routeEdgeIndex];

  // ── Dynamic (A-SMGCS / SMAN-style) handling ─────────────────────────────────
  // Each tick, re-evaluate the *remaining* route against live incidents. If any
  // edge ahead is blocked, re-run Dijkstra from the current position (without
  // resetting the aircraft to the start) — this is the live re-routing layer.
  const remainingEdgeIds = routeEdgeIds.slice(aircraft.routeEdgeIndex);
  const currentBlocked = state.blockedEdgeIds.has(currentEdgeId);
  const blockAhead = remainingEdgeIds.some(id => state.blockedEdgeIds.has(id));

  if (blockAhead) {
    const destinationId = aircraft.targetNodeId;

    if (config.autoReroute) {
      const fromNode = aircraft.assignedRoute[aircraft.routeEdgeIndex];          // start of current edge
      let rerouted: Aircraft | null = null;

      if (currentBlocked) {
        // The edge the aircraft is on is blocked → re-plan from this node.
        const path = findPath(airportGraph, fromNode, destinationId, state.blockedEdgeIds);
        if (path && path.length > 1) {
          rerouted = {
            ...aircraft,
            assignedRoute: path,
            routeEdgeIndex: 0,
            progressOnEdge: 0,
            currentNodeId: fromNode,
            currentEdgeId: null,
            status: 'taxiing',
          };
        }
      } else {
        // Current edge is clear; a block is further ahead → keep finishing the
        // current edge, then follow a fresh route from the next node.
        const nextNode = aircraft.assignedRoute[aircraft.routeEdgeIndex + 1];
        const path = findPath(airportGraph, nextNode, destinationId, state.blockedEdgeIds);
        if (path && path.length > 1) {
          rerouted = {
            ...aircraft,
            assignedRoute: [fromNode, ...path],   // keep current edge as edge 0
            routeEdgeIndex: 0,
            progressOnEdge: aircraft.progressOnEdge,
            currentNodeId: fromNode,
            status: 'taxiing',
          };
        }
      }

      if (rerouted) {
        const eta = estimateTravelTimeSeconds(
          rerouted.assignedRoute.slice(rerouted.routeEdgeIndex), edges, effectiveSpeed,
        );
        return {
          ...state,
          aircraft: rerouted,
          elapsedSeconds: state.elapsedSeconds + dt,
          etaSeconds: eta,
          warningMessage: 'Sự cố trên đường lăn — đã tự động tính lại lộ trình (Dijkstra).',
          lightStates: computeLightStates(rerouted, state.blockedEdgeIds),
        };
      }

      // No alternative path exists → stop.
      const stopped: Aircraft = { ...aircraft, status: 'stopped', speedKts: 0 };
      return {
        ...state,
        aircraft: stopped,
        isRunning: false,
        warningMessage: 'Không tìm được đường vòng. Máy bay dừng lại.',
        lightStates: computeLightStates(stopped, state.blockedEdgeIds),
      };
    }

    if (currentBlocked) {
      // Auto-reroute off and the edge underfoot is blocked → hold position.
      const holding: Aircraft = { ...aircraft, status: 'holding', speedKts: 0 };
      return {
        ...state,
        aircraft: holding,
        warningMessage: 'Đường lăn bị chặn. Máy bay giữ nguyên vị trí.',
        elapsedSeconds: state.elapsedSeconds + dt,
        lightStates: computeLightStates(holding, state.blockedEdgeIds),
      };
    }
    // Auto-reroute off but the block is only ahead → keep taxiing toward it.
  }

  // Advance along edge
  const currentEdge = edges.find(e => e.id === currentEdgeId)!;
  const edgeLengthMs = currentEdge.lengthMeters;
  const progressPerSecond = edgeLengthMs > 0 ? effectiveSpeedMs / edgeLengthMs : 1;

  let newProgress = aircraft.progressOnEdge + progressPerSecond * dt;
  let newEdgeIndex = aircraft.routeEdgeIndex;
  let newCurrentNodeId = aircraft.currentNodeId;

  // Advance through multiple edges if dt is large
  while (newProgress >= 1 && newEdgeIndex < routeEdgeIds.length) {
    newProgress -= 1;
    newEdgeIndex++;
    if (newEdgeIndex < routeEdgeIds.length) {
      // Move to next node
      newCurrentNodeId = aircraft.assignedRoute[newEdgeIndex];
    } else {
      newCurrentNodeId = aircraft.assignedRoute[aircraft.assignedRoute.length - 1];
      newProgress = 1;
    }
  }

  const updatedAircraft: Aircraft = {
    ...aircraft,
    routeEdgeIndex: newEdgeIndex,
    progressOnEdge: Math.min(newProgress, 1),
    currentNodeId: newCurrentNodeId,
    currentEdgeId: newEdgeIndex < routeEdgeIds.length ? routeEdgeIds[newEdgeIndex] : null,
    speedKts: effectiveSpeed,
    status: newEdgeIndex >= routeEdgeIds.length ? 'arrived' : 'taxiing',
  };

  const newEta = estimateTravelTimeSeconds(
    aircraft.assignedRoute.slice(newEdgeIndex),
    edges,
    effectiveSpeed
  );

  return {
    ...state,
    aircraft: updatedAircraft,
    elapsedSeconds: state.elapsedSeconds + dt,
    etaSeconds: Math.max(0, newEta),
    warningMessage: state.warningMessage,
    lightStates: computeLightStates(updatedAircraft, state.blockedEdgeIds),
    isRunning: updatedAircraft.status !== 'arrived',
  };
}

/** Initialize a fresh simulation state from config */
export function initSimulation(config: SimulationConfig): SimulationState {
  const blockedEdgeIds = buildBlockedEdgeIds(config, airportGraph.edges);

  const route = findPath(airportGraph, config.startNodeId, config.destinationNodeId, blockedEdgeIds);

  // Spawn background traffic clear of the active aircraft's whole route corridor.
  const reserved = route
    ? playerReservedEdges({ assignedRoute: route, routeEdgeIndex: 0 } as Aircraft)
    : new Set<string>();
  const trafficAircraft = spawnBackgroundTraffic(config, reserved);

  if (!route) {
    return {
      aircraft: null,
      trafficAircraft,
      config,
      isRunning: false,
      isPaused: false,
      routeStatus: 'pending',
      elapsedSeconds: 0,
      etaSeconds: null,
      warningMessage: 'Không tìm thấy tuyến đường hợp lệ giữa hai điểm đã chọn.',
      lightStates: {},
      blockedEdgeIds,
    };
  }

  const aircraft: Aircraft = {
    id: 'AC001',
    callsign: config.callsign,
    currentNodeId: config.startNodeId,
    targetNodeId: config.destinationNodeId,
    currentEdgeId: null,
    progressOnEdge: 0,
    speedKts: 0,
    status: 'waiting',
    assignedRoute: route,
    routeEdgeIndex: 0,
  };

  const effectiveSpeed = effectiveTaxiSpeedKts(config);
  const eta = estimateTravelTimeSeconds(route, airportGraph.edges, effectiveSpeed);

  return {
    aircraft,
    trafficAircraft,
    config,
    isRunning: false,
    isPaused: false,
    routeStatus: 'pending',
    elapsedSeconds: 0,
    etaSeconds: eta,
    warningMessage: null,
    lightStates: {},
    blockedEdgeIds,
  };
}

/** Activate lights after controller accepts the proposed route */
export function acceptRoute(state: SimulationState): SimulationState {
  if (!state.aircraft) return state;
  return {
    ...state,
    routeStatus: 'accepted',
    lightStates: computeLightStates(state.aircraft, state.blockedEdgeIds),
  };
}

// ── Live incident layer (dynamic, applied mid-taxi without resetting) ──────────

/** Block or unblock a taxiway edge live. The next tick re-routes if needed. */
export function setIncidentEdge(
  state: SimulationState,
  edgeId: string,
  blocked: boolean,
): SimulationState {
  const next = new Set(state.blockedEdgeIds);
  if (blocked) next.add(edgeId);
  else next.delete(edgeId);
  return {
    ...state,
    blockedEdgeIds: next,
    warningMessage: blocked
      ? 'Sự cố mới trên đường lăn — đang tính lại lộ trình…'
      : state.warningMessage,
    lightStates: state.aircraft
      ? computeLightStates(state.aircraft, next)
      : state.lightStates,
  };
}

/** Clear all live incidents (keeps statically closed/restricted edges). */
export function clearIncidents(state: SimulationState): SimulationState {
  const next = new Set<string>();
  for (const e of airportGraph.edges) {
    if (e.status === 'closed' || e.status === 'restricted') next.add(e.id);
  }
  return {
    ...state,
    blockedEdgeIds: next,
    warningMessage: null,
    lightStates: state.aircraft ? computeLightStates(state.aircraft, next) : {},
  };
}

/**
 * Pick a random edge strictly AHEAD of the aircraft on its current route
 * (not the edge underfoot, not already blocked) — a candidate for a live
 * incident the aircraft can still re-route around.
 */
export function randomIncidentEdge(state: SimulationState): string | null {
  const ac = state.aircraft;
  if (!ac) return null;
  const routeEdgeIds = routeToEdges(ac.assignedRoute, airportGraph.edges) ?? [];
  const ahead = routeEdgeIds
    .slice(ac.routeEdgeIndex + 1)
    .filter(id => !state.blockedEdgeIds.has(id));
  if (!ahead.length) return null;

  // Prefer an edge that still leaves a valid detour (so the aircraft re-routes
  // rather than dead-ends). Fall back to any edge ahead if none has an alternative.
  const fromNode = ac.assignedRoute[ac.routeEdgeIndex + 1];
  const reroutable = ahead.filter(id => {
    const test = new Set(state.blockedEdgeIds);
    test.add(id);
    const p = findPath(airportGraph, fromNode, ac.targetNodeId, test);
    return p !== null && p.length > 1;
  });
  const pool = reroutable.length ? reroutable : ahead;
  return pool[Math.floor(Math.random() * pool.length)];
}
