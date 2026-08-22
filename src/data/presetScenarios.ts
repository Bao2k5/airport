import type { AircraftStatus, AirportGraph, AirlineCode, AircraftType } from '../types';
import { airportGraphV3 } from './airportGraph.v3';
import { getAirlineDef } from './airlineTypes';
import { findPath, routeToEdges } from '../simulation/pathfinding';

export interface ScenarioAircraft {
  id: string;
  callsign: string;
  airlineCode?: AirlineCode;
  airlineName?: string;
  aircraftAsset?: string;
  aircraftType?: AircraftType;
  currentNodeId: string;
  targetNodeId: string;
  currentEdgeId: string | null;
  progressOnEdge: number;
  speedKts: number;
  status: AircraftStatus;
  assignedRoute: string[];
  routeEdgeIndex: number;
  role?: 'emergency' | 'departing' | 'arriving' | 'pushback';
  priority?: number;
  clearedRoute?: string[];
  scenarioLabel?: string;
  releaseAtSeconds?: number;
  arrivedAtSeconds?: number;
  radioFailure?: boolean;
  deviated?: boolean;
  holdReason?: 'stop-bar' | 'separation' | 'deviation';
  heldSeconds?: number;
  queueOrder?: number;
  queueRunway?: 'NORTH' | 'SOUTH';
  speedLimitKts?: number;
  speedReason?: string;
  routeVisible?: boolean;
  guidanceVisible?: boolean;
  isMoving?: boolean;
  hidden?: boolean;
}

export interface ScenarioEvent {
  atSeconds: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ScenarioTrigger {
  atSeconds: number;
  apply: (state: any) => any;
}

export interface ScenarioObservation {
  id: string;
  text: string;
  required: boolean;
  status: 'pending' | 'pass' | 'fail';
  checkedAtSeconds: number | null;
  evidence: string;
  relatedAircraft?: string[];
  relatedEdgeIds?: string[];
  check?: (state: any, graph: AirportGraph) => { pass: boolean; evidence?: string; fail?: boolean };
}

export interface ScenarioState {
  id: string;
  title: string;
  situation: string;
  challenges: string[];
  watchFor: string[];
  observations: ScenarioObservation[];
  startedAtSeconds: number;
  events: ScenarioEvent[];
  pendingTriggers: ScenarioTrigger[];
  completed: boolean;
}

export interface QueuedAircraftEntry {
  id: string;
  runway: 'NORTH' | 'SOUTH';
  order: number;
  releaseDelaySeconds?: number;
}

export interface PresetScenarioDef {
  id: string;
  title: string;
  teaser: string;
  situation: string;
  challenges: string[];
  watchFor: string[];
  aircraftQueue?: QueuedAircraftEntry[];
  observations?: ScenarioObservation[];
  setup: (graph?: AirportGraph) => {
    weather: 'clear' | 'fog' | 'thunderstorm';
    aircraft: ScenarioAircraft[];
    triggers: ScenarioTrigger[];
    aircraftQueue?: QueuedAircraftEntry[];
    observations?: ScenarioObservation[];
  };
}

export function resolveV3NodeId(idOrLabel: string, graph: AirportGraph = airportGraphV3): string {
  const norm = (idOrLabel || '').trim().toLowerCase();
  const normClean = norm.replace(/[\s_\/]/g, '');

  // 1. Direct label or ID match (exact and normalized)
  const found = graph.nodes.find(n => {
    const idClean = n.id.toLowerCase().replace(/[\s_\/]/g, '');
    const labelClean = (n.label || '').trim().toLowerCase().replace(/[\s_\/]/g, '');
    return n.id.toLowerCase() === norm ||
           (n.label && n.label.trim().toLowerCase() === norm) ||
           idClean === normClean ||
           labelClean === normClean;
  });
  if (found) return found.id;

  const standMap: Record<string, string> = {
    'stand_1': 'v3_line_37_p00',
    'stand_2': 'v3_line_38_p00',
    'stand_3': 'v3_line_34_p02',
    'stand_4': 'v3_line_35_p00',
    'stand_5': 'v3_line_36_p00',
    'stand_7': 'v3_line_29_p01',
    'stand_8': 'v3_line_28_p01',
    'stand_9': 'v3_line_27_p01',
    'stand_10': 'v3_line_33_p00',
    'stand_11': 'v3_line_32_p00',
    'stand_12': 'v3_line_31_p00',
    'stand_13': 'v3_line_30_p00',
    'stand_14': 'v3_line_15_p00',
    'stand_15': 'v3_line_15_p01',
    'stand_16': 'v3_line_21_p01',
    'stand_17': 'v3_line_22_p01',
    'stand_18': 'v3_line_23_p01',
    'stand_19': 'v3_line_24_p00',
    'stand_20': 'v3_line_24_p01',
    'stand_21': 'v3_line_25_p01',
    'stand_22': 'v3_line_26_p04',
    'w4/25r': 'v3_line_04_p01',
    'w4/25l': 'v3_line_04_p03',
  };

  if (standMap[norm]) return standMap[norm];
  if (standMap[norm.replace(/\s+/g, '_')]) return standMap[norm.replace(/\s+/g, '_')];

  if (norm.includes('stop bar 25l') || norm.includes('25l')) return 'v3_line_05_p05';
  if (norm.includes('stop bar 25r') || norm.includes('25r')) return 'v3_line_01_p03';
  if (norm.includes('w5/07r') || norm.includes('w5/07l') || norm.includes('w5')) return 'v3_line_03_p00';
  if (norm.includes('w11/07r') || norm.includes('w11')) return 'v3_line_16_p01';
  if (norm.includes('w9a') || norm.includes('w9b') || norm.includes('w9')) return 'v3_line_17_p04';
  if (norm.includes('e6/e4') || norm.includes('e6') || norm.includes('e4') || norm.includes('e2')) return 'v3_line_26_p03';
  if (norm.includes('07l')) return 'v3_line_01_p00';
  if (norm.includes('07r')) return 'v3_line_05_p00';

  return idOrLabel;
}

export function createScenarioAircraft(
  opts: {
    id: string;
    callsign: string;
    from: string;
    to: string;
    aircraftType?: AircraftType;
    airlineCode?: AirlineCode;
    role?: 'emergency' | 'departing' | 'arriving' | 'pushback';
    priority?: number;
    label?: string;
    releaseAtSeconds?: number;
    queueOrder?: number;
    queueRunway?: 'NORTH' | 'SOUTH';
  },
  graph: AirportGraph = airportGraphV3
): ScenarioAircraft | null {
  const fromId = resolveV3NodeId(opts.from, graph);
  const toId = resolveV3NodeId(opts.to, graph);

  const route = findPath(graph, fromId, toId, new Set());
  if (!route || route.length < 2) {
    console.error(`[scenario] ${opts.callsign}: no route ${fromId} (${opts.from}) -> ${toId} (${opts.to})`);
    return null;
  }
  const edges = routeToEdges(route, graph.edges) ?? [];
  const airlineDef = getAirlineDef(opts.airlineCode || opts.callsign);
  const isWaiting = Boolean(opts.releaseAtSeconds && opts.releaseAtSeconds > 0);
  const isQueued = Boolean(opts.queueOrder && opts.queueOrder > 1);

  let aircraftType: AircraftType = opts.aircraftType || 'A321';
  if (!opts.aircraftType) {
    if (airlineDef.code === 'SQ' || airlineDef.code === 'TG') {
      aircraftType = 'A350';
    } else if (airlineDef.code === 'QH' && opts.callsign.includes('315')) {
      aircraftType = 'B737';
    } else {
      aircraftType = 'A321';
    }
  }

  return {
    id: opts.id,
    callsign: opts.callsign,
    airlineCode: airlineDef.code,
    airlineName: airlineDef.name,
    aircraftAsset: airlineDef.asset,
    aircraftType,
    currentNodeId: fromId,
    targetNodeId: toId,
    currentEdgeId: edges[0] ?? null,
    progressOnEdge: 0,
    speedKts: isWaiting || isQueued ? 0 : 15,
    speedLimitKts: 15,
    status: isQueued ? 'queued' : (isWaiting ? 'waiting' : 'taxiing'),
    assignedRoute: route,
    routeEdgeIndex: 0,
    role: opts.role,
    priority: opts.priority,
    clearedRoute: route,
    scenarioLabel: opts.label,
    releaseAtSeconds: opts.releaseAtSeconds,
    queueOrder: opts.queueOrder,
    queueRunway: opts.queueRunway,
    routeVisible: true,
  };
}

function filterNonNull<T>(arr: (T | null)[]): T[] {
  return arr.filter((x): x is T => x !== null);
}

export function getPresetScenarioDefs(graph: AirportGraph = airportGraphV3): Record<string, PresetScenarioDef> {
  return {
    // ── KỊCH BẢN 1 ─────────────────────────────────────────────────────────────
    lvc_wrong_turn_radio_failure: {
      id: 'lvc_wrong_turn_radio_failure',
      title: 'Kịch bản 1 — Khởi hành STAND_10 qua HS NS, E6/E4, E6 đến STOP BAR 25L',
      teaser: 'HVN216 đẩy lùi từ STAND_10 quẹo phải ra Line 12, qua HS NS, rẽ phải ra E6/E4, tới E6 và đến STOP BAR 25L.',
      situation: 'Tàu bay HVN216 xuất phát tại bến đỗ STAND_10 (quay đầu vào trong), thực hiện đẩy lùi và quẹo phải ra đường lăn trục chính (Line 12). Sau đó tiếp tục lăn lên giao điểm HS NS, quẹo phải hướng ra E6/E4, tiếp tục hành trình đến E6 và di chuyển an toàn đến điểm dừng chờ cất cánh STOP BAR 25L.',
      challenges: [
        'Điều khiển đẩy lùi quẹo phải chính xác từ STAND_10 ra trục Line 12.',
        'Hệ thống Follow the Greens bật đèn tim đường xanh dẫn hướng qua ngã tư HS NS và quẹo phải ra E6/E4.',
        'Duy trì lộ trình liên tục thông suốt qua E6 đến vạch dừng STOP BAR 25L.'
      ],
      watchFor: [
        'HVN216 xuất phát từ STAND_10 ra Line 12 và lăn về phía Bắc.',
        'Tại giao điểm HS NS, đèn xanh FtG dẫn hướng rẽ phải sang E6/E4.',
        'Tàu bay tiếp tục hành trình qua E6 và đến dừng an toàn tại STOP BAR 25L.'
      ],
      setup: (g = graph) => {
        const fullRoute = [
          'v3_line_33_p00', // STAND_10
          'v3_line_33_p01',
          'v3_line_32_p01',
          'v3_line_12_p03', // T69
          'v3_line_31_p01',
          'v3_line_30_p01', // L28_ENT
          'v3_line_28_p00',
          'v3_line_27_p00',
          'v3_line_17_p09', // HS_NS
          'v3_line_17_p10', // QUẸO PHẢI TẠI HS NS RA PHÍA ĐÔNG
          'v3_line_21_p00',
          'v3_line_13_p03',
          'v3_line_22_p00',
          'v3_line_15_p01', // INTL_S2
          'v3_line_23_p00', // INTL_S3
          'v3_line_24_p00', // INTL_S4
          'v3_line_25_p00', // T38
          'v3_line_17_p11',
          'v3_line_17_p12', // T39 / E6/E4
          'v3_line_17_p13', // E6
          'v3_line_17_p14',
          'v3_line_17_p15', // L03_P18
          'v3_line_05_p07',
          'v3_line_17_p16', // STOP BAR 25L
        ];
        const fullEdges = routeToEdges(fullRoute, g.edges) ?? [];

        const vnAirline = getAirlineDef('VN');
        const rawAc: ScenarioAircraft = {
          id: 'S1',
          callsign: 'HVN216',
          airlineCode: 'VN',
          airlineName: vnAirline.name,
          aircraftAsset: vnAirline.asset,
          aircraftType: 'A321',
          currentNodeId: fullRoute[0],
          targetNodeId: fullRoute[fullRoute.length - 1],
          currentEdgeId: fullEdges[0] ?? null,
          progressOnEdge: 0,
          speedKts: 15,
          speedLimitKts: 15,
          status: 'taxiing',
          assignedRoute: fullRoute,
          routeEdgeIndex: 0,
          role: 'departing',
          priority: 1,
          scenarioLabel: 'KHỞI HÀNH 25L',
          clearedRoute: fullRoute,
          routeVisible: true,
        };

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_1_1',
            text: '[PUSHBACK_LINE12] HVN216 từ STAND_10 đẩy lùi quẹo phải ra Line 12 và lăn về phía Bắc hướng đến HS NS.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN216'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
              if (ac && ac.routeEdgeIndex >= 1) {
                return { pass: true, evidence: `HVN216 đã ra Line 12 và đang lăn về HS NS (edge index: ${ac.routeEdgeIndex})` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_2',
            text: '[HS_NS_E6_E4] HVN216 qua ngã tư HS NS, quẹo phải hướng ra E6/E4 và tiếp tục tới E6.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN216'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
              if (ac && ac.routeEdgeIndex >= 15) {
                return { pass: true, evidence: `HVN216 đã qua HS NS và quẹo phải sang E6/E4 thành công` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_3',
            text: '[REACH_STOP_BAR_25L] HVN216 di chuyển an toàn và đến dừng tại vạch chờ STOP BAR 25L.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN216'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
              if (ac && (ac.status === 'arrived' || ac.routeEdgeIndex >= fullRoute.length - 2)) {
                return { pass: true, evidence: `HVN216 đã đến điểm kết thúc STOP BAR 25L` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 2,
            apply: (state: any) => {
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[PUSHBACK_APPROVED] HVN216 được phép đẩy lùi từ STAND_10 quẹo phải ra Line 12',
                  severity: 'info',
                });
              }
              return state;
            },
          },
          {
            atSeconds: 15,
            apply: (state: any) => {
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[FTG_GUIDANCE] Đèn xanh dẫn hướng HVN216 qua HS NS và quẹo phải ra E6/E4',
                  severity: 'info',
                });
              }
              return state;
            },
          },
          {
            atSeconds: 30,
            apply: (state: any) => {
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[CLEARANCE_25L] HVN216 tiếp tục qua E6 đến vạch chờ cất cánh STOP BAR 25L',
                  severity: 'info',
                });
              }
              return state;
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft: filterNonNull([rawAc]),
          observations,
          triggers,
        };
      },
    },

    // ── KỊCH BẢN 2 ─────────────────────────────────────────────────────────────
    emergency_priority_engine_fire: {
      id: 'emergency_priority_engine_fire',
      title: 'Kịch bản 2 — Khẩn nguy BAV315 cháy động cơ, 2 đường băng chuyển đỏ, cách ly tại W5/07L',
      teaser: 'BAV315 cháy động cơ thoát W4 về W5/07L — 2 runway chuyển ĐỎ, BAV456 và THA101 dừng trước dấu X đỏ, HVN123 về Stand 17.',
      situation: 'Trong điều kiện LVC tầm nhìn thấp (RVR < 550m), tàu bay BAV315 vừa hạ cánh RWY 25R phát tín hiệu khẩn nguy cháy động cơ. BAV315 được cấp quyền ưu tiên tuyệt đối để thoát nhanh qua W4 và lăn khẩn cấp vào đường lăn W5/07L đứng yên cách ly an toàn. Cùng lúc, 2 đường băng 25R và 25L chuyển sang màu ĐỎ (Runway Incursion Protection). BAV456 tại E6/E4 và THA101 tại Line 12 lập tức nhận Stop Bar dấu X đỏ dừng lại nhường đường, trong khi HVN123 hạ cánh lăn khẩn trương về bến Stand 17 và đội cứu hỏa RESCUE01 tiếp cận dập lửa.',
      challenges: [
        'Bảo vệ tuyệt đối 2 hành lang đường băng (chuyển ĐỎ) và trục thoát khẩn cấp cho BAV315.',
        'BAV315 lăn với tốc độ cao hơn (28 kts) có kẹp lửa ở đuôi, dừng cách ly an toàn tại W5/07L.',
        'BAV456 và THA101 nhận tín hiệu Stop Bar dấu X đỏ và dừng giữ vị trí an toàn (status=holding, speed=0kts).',
        'HVN123 lăn khẩn trương về Stand 17 và đội cứu hỏa RESCUE01 tiếp cận hiện trường.'
      ],
      watchFor: [
        'BAV315 có ngọn lửa cháy ở đuôi, lăn ưu tiên tốc độ cao từ 25R qua W4 về W5/07L và đứng yên cách ly.',
        'Toàn bộ 2 đường băng Bắc - Nam chuyển sang dải sáng màu ĐỎ bảo vệ.',
        'BAV456 (tại E6) và THA101 (tại Line 12) xuất hiện dấu X đỏ trước mũi, dừng hẳn nhường đường.',
        'HVN123 di chuyển theo lộ trình W4 ➔ W7A ➔ W9B ➔ HS W7 ➔ HS NS ➔ Stand 17.',
        'Đội cứu hỏa RESCUE01 di chuyển từ W9A đến áp sát vị trí cách ly.'
      ],
      setup: (g = graph) => {
        // 1. BAV315: STOP BAR 25R -> chạy thẳng qua W4 -> thẳng tiếp về W5/07L -> rẽ xuống đường lăn W5 (Line 03) về W1
        const bav315_start = resolveV3NodeId('STOP BAR 25R', g);
        const bav315_w5 = resolveV3NodeId('W5/07L', g);
        const bav315_w1 = resolveV3NodeId('W1', g) || 'v3_line_03_p01';
        const r1 = findPath(g, bav315_start, bav315_w5) || [];
        const r2 = findPath(g, bav315_w5, bav315_w1) || [];
        const bav315Route = [...r1, ...r2.slice(1)];
        const bav315Edges = routeToEdges(bav315Route, g.edges) ?? [];

        // 2. BAV456 (Hạ cánh sau khi BAV315 chạy xong): Stopbar 25R -> W4 -> W4/25R -> W4/25L -> W7A/25L -> W9B/W7A -> HS W7 -> HS NS -> Stand 17
        const b456_start = resolveV3NodeId('STOP BAR 25R', g);
        const b456_w4r = resolveV3NodeId('W4/25R', g);
        const b456_w4l = resolveV3NodeId('W4/25L', g);
        const b456_w7a = resolveV3NodeId('W7A/25L', g);
        const b456_w9bw7a = resolveV3NodeId('W9B/W7A', g);
        const b456_hsw7 = resolveV3NodeId('HS W7', g);
        const b456_hsns = resolveV3NodeId('HS NS', g);
        const b456_stand17 = resolveV3NodeId('STAND_17', g);

        const rb1 = findPath(g, b456_start, b456_w4r) || [];
        const rb2 = findPath(g, b456_w4r, b456_w4l) || [];
        const rb3 = findPath(g, b456_w4l, b456_w7a) || [];
        const rb4 = findPath(g, b456_w7a, b456_w9bw7a) || [];
        const rb5 = findPath(g, b456_w9bw7a, b456_hsw7) || [];
        const rb6 = findPath(g, b456_hsw7, b456_hsns) || [];
        const rb7 = findPath(g, b456_hsns, b456_stand17) || [];
        const b456Route = [...rb1, ...rb2.slice(1), ...rb3.slice(1), ...rb4.slice(1), ...rb5.slice(1), ...rb6.slice(1), ...rb7.slice(1)];
        const b456Edges = routeToEdges(b456Route, g.edges) ?? [];

        // 3. VJC456 (E6/E4 -> E6 dừng chờ nhường BAV456 -> sau đó tiếp tục lăn ra STOP BAR 25L cất cánh)
        const dep_start = resolveV3NodeId('E6/E4', g);
        const dep_dest = resolveV3NodeId('STOP BAR 25L', g);
        const depRoute = findPath(g, dep_start, dep_dest) || [];
        const depEdges = routeToEdges(depRoute, g.edges) ?? [];

        // 4. THA101 (Stand 10 -> Line 12 dừng trước Dấu X đỏ)
        const tha_start = resolveV3NodeId('STAND_10', g);
        const tha_dest = resolveV3NodeId('HS NS', g);
        const thaRoute = findPath(g, tha_start, tha_dest) || [];
        const thaEdges = routeToEdges(thaRoute, g.edges) ?? [];

        // 5. RESCUE01 (Xe cứu hỏa xuất phát tại 07R -> khi BAV315 về W5 thì chạy tới dập lửa 10s)
        const rescueStart = resolveV3NodeId('07R', g) || 'v3_line_05_p00';
        const rescueRoute = [rescueStart, 'v3_line_03_p01', 'v3_line_03_p00'];
        const rescueEdges = routeToEdges(rescueRoute, g.edges) ?? [];

        const qhDef = getAirlineDef('QH');
        const vjDef = getAirlineDef('VJ');
        const tgDef = getAirlineDef('TG');

        const aircraft: ScenarioAircraft[] = [
          {
            id: 'S1',
            callsign: 'BAV315',
            airlineCode: 'QH',
            airlineName: qhDef.name,
            aircraftAsset: qhDef.asset,
            aircraftType: 'B737',
            currentNodeId: bav315Route[0],
            targetNodeId: bav315Route[bav315Route.length - 1],
            currentEdgeId: bav315Edges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 65,
            speedLimitKts: 65,
            status: 'taxiing',
            assignedRoute: bav315Route,
            routeEdgeIndex: 0,
            role: 'emergency',
            priority: 0,
            scenarioLabel: 'KHẨN NGUY / CHÁY ĐỘNG CƠ',
            clearedRoute: bav315Route,
            routeVisible: true,
          },
          {
            id: 'S2',
            callsign: 'BAV456',
            airlineCode: 'QH',
            airlineName: qhDef.name,
            aircraftAsset: qhDef.asset,
            aircraftType: 'A321',
            currentNodeId: b456Route[0],
            targetNodeId: b456Route[b456Route.length - 1],
            currentEdgeId: b456Edges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 0,
            speedLimitKts: 35,
            status: 'queued',
            hidden: true,
            assignedRoute: b456Route,
            routeEdgeIndex: 0,
            role: 'arriving',
            priority: 1,
            scenarioLabel: 'HẠ CÁNH VỀ STAND 17',
            clearedRoute: b456Route,
            routeVisible: true,
            releaseAtSeconds: 12,
          },
          {
            id: 'S3',
            callsign: 'VJC456',
            airlineCode: 'VJ',
            airlineName: vjDef.name,
            aircraftAsset: vjDef.asset,
            aircraftType: 'A321',
            currentNodeId: depRoute[0],
            targetNodeId: depRoute[depRoute.length - 1],
            currentEdgeId: depEdges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 0,
            speedLimitKts: 20,
            status: 'queued',
            hidden: true,
            assignedRoute: depRoute,
            routeEdgeIndex: 0,
            role: 'departing',
            priority: 2,
            scenarioLabel: 'E6/E4 ➔ E6',
            clearedRoute: depRoute,
            routeVisible: true,
            releaseAtSeconds: 12,
          },
          {
            id: 'S4',
            callsign: 'THA101',
            airlineCode: 'TG',
            airlineName: tgDef.name,
            aircraftAsset: tgDef.asset,
            aircraftType: 'A350',
            currentNodeId: thaRoute[0],
            targetNodeId: thaRoute[thaRoute.length - 1],
            currentEdgeId: thaEdges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 0,
            speedLimitKts: 12,
            status: 'queued',
            hidden: true,
            assignedRoute: thaRoute,
            routeEdgeIndex: 0,
            role: 'pushback',
            priority: 3,
            scenarioLabel: 'PUSHBACK STAND 10',
            clearedRoute: thaRoute,
            routeVisible: true,
            releaseAtSeconds: 12,
          },
          {
            id: 'S5',
            callsign: 'RESCUE01',
            airlineCode: 'VU',
            airlineName: 'Xe Cứu Hỏa Khẩn Nguy',
            aircraftAsset: '/xecuuhoa.png',
            aircraftType: 'ATR72',
            currentNodeId: rescueRoute[0],
            targetNodeId: rescueRoute[rescueRoute.length - 1],
            currentEdgeId: rescueEdges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 0,
            speedLimitKts: 35,
            status: 'holding',
            assignedRoute: rescueRoute,
            routeEdgeIndex: 0,
            role: 'emergency',
            priority: 0,
            scenarioLabel: 'XE CỨU HỎA TẠI 07R',
            clearedRoute: rescueRoute,
            routeVisible: true,
            isMoving: false,
          },
        ];

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_2_1',
            text: '[EMERGENCY_PRIORITY] BAV315 cháy động cơ, lăn thẳng tốc độ cao qua W4 về cách ly tại W5/07L.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['BAV315'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'BAV315');
              if (ac && (ac.status === 'taxiing' || ac.status === 'holding' || ac.status === 'arrived')) {
                return { pass: true, evidence: `BAV315 / priority=0 / status=${ac.status} / cách ly tại W5/07L` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_2',
            text: '[HOLD_POSITION] VJC456 tại E6 và THA101 tại Line 12 nhận Stop Bar dấu X đỏ, dừng hẳn nhường đường.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VJC456', 'THA101'],
            check: (s) => {
              const held = s.scenarioAircraft?.filter((a: any) => ['VJC456', 'THA101'].includes(a.callsign) && a.status === 'holding' && a.holdReason === 'stop-bar');
              if (held && held.length > 0) {
                return { pass: true, evidence: `${held.map((a: any) => `${a.callsign} (Dấu X đỏ, speed=0)`).join(', ')}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_3',
            text: '[POST_EMERGENCY_LANDING] Sau khi BAV315 cách ly, BAV456 hạ cánh và lăn an toàn về Stand 17.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['BAV456', 'RESCUE01'],
            check: (s) => {
              const b456 = s.scenarioAircraft?.find((a: any) => a.callsign === 'BAV456');
              if (b456 && (b456.status === 'taxiing' || b456.status === 'arrived')) {
                return { pass: true, evidence: `BAV456 hạ cánh và lăn về Stand 17` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 2,
            apply: (state: any) => {
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[EMERGENCY_DECLARED] BAV315 báo cháy động cơ sau khi hạ cánh RWY 25R, ưu tiên độc quyền di chuyển',
                  severity: 'critical',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[RUNWAY_PROTECTED] 2 đường băng 25R và 25L chuyển ĐỎ bảo vệ tuyệt đối',
                  severity: 'critical',
                });
              }
              return state;
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft,
          observations,
          triggers,
        };
      },
    },

    // ── KỊCH BẢN 3 ─────────────────────────────────────────────────────────────
    lvc_hsns_intersection_conflict: {
      id: 'lvc_hsns_intersection_conflict',
      title: 'Kịch bản 3 — Hai tàu bay cùng tiến vào HS NS trong LVC',
      teaser: 'HVN301 (Inbound từ W5/25L) và VJ302 (Outbound từ Stand 11) hội tụ tại HS NS — Stop Bar đỏ giữ VJ302 nhường đường.',
      situation: 'Trong điều kiện sương mù dày đặc (LVC nặng, RVR 150–200m), Tàu A (HVN301 - Inbound) từ W5/25L đang lăn về Stand 17 qua W5/W7B -> HS W7 -> HS NS. Cùng lúc, Tàu B (VJ302 - Outbound) từ Stand 11 lùi đuôi qua phải rồi lăn hướng Bắc ra STOP BAR 25L qua HS NS -> NS2. Cả hai tàu dự kiến tiến vào điểm xung đột HS NS gần như đồng thời mà tổ lái không thể nhìn thấy nhau.',
      challenges: [
        'A-SMGCS Level 4 phát hiện dự báo nguy cơ xung đột cắt ngang tại nút giao HS NS.',
        'Ưu tiên Tàu A (HVN301) đi trước để giải phóng nhanh trục lăn chính W7B.',
        'Tàu B (VJ302) nhận đèn đỏ Stop Bar dấu X trên tim đường và dừng chính xác trước HS NS.',
        'Khi Tàu A qua khỏi HS NS, đèn đỏ trước mũi Tàu B chuyển sang màu xanh lá (FtG) để Tàu B tiếp tục ra RWY 25L cất cánh.'
      ],
      watchFor: [
        'Tàu A (W5/25L -> W5/W7B -> HS W7 -> HS NS -> Stand 17) giữ đèn xanh FtG thông suốt.',
        'Tàu B (Stand 11 lùi đít qua phải -> Line 12) đến trước HS NS thì đèn xanh vụt tắt, hiện đèn Stop Bar đỏ.',
        'Tàu B dừng hẳn nhường đường trong sương mù LVC.',
        'Sau khi Tàu A thoát hoàn toàn khỏi HS NS, đèn đỏ của Tàu B chuyển xanh lá, Tàu B lăn tiếp ra STOP BAR 25L và cất cánh.'
      ],
      setup: (g = graph) => {
        // 1. Tàu A (Inbound: W5/25L -> W5/W7B -> HS W7 -> HS NS -> Stand 17)
        const w5_25l = resolveV3NodeId('W5/25L', g) || 'v3_line_10_p01';
        const w5_w7b = resolveV3NodeId('W5/W7B', g) || 'v3_line_11_p01';
        const stand17 = resolveV3NodeId('STAND_17', g) || 'v3_line_22_p01';
        const rA1 = findPath(g, w5_25l, w5_w7b) || [];
        const rA2 = findPath(g, w5_w7b, stand17) || [];
        const tauARoute = [...rA1, ...rA2.slice(1)];
        const tauAEdges = routeToEdges(tauARoute, g.edges) ?? [];

        // 2. Tàu B (Outbound: Stand 11 -> Line 12 -> HS NS -> Vòng xuống đường lăn E6 phía dưới -> STOP BAR 25L)
        const stand11 = resolveV3NodeId('STAND_11', g) || 'v3_line_32_p00';
        const hsns = resolveV3NodeId('HS NS', g) || 'v3_line_17_p09';
        const e6 = resolveV3NodeId('E6', g) || 'v3_line_17_p13';
        const stopbar25l = resolveV3NodeId('STOP BAR 25L', g) || 'v3_line_17_p16';
        const pB1 = findPath(g, stand11, hsns) || [];
        const pB2 = findPath(g, hsns, e6) || [];
        const pB3 = findPath(g, e6, stopbar25l) || [];
        const tauBRoute = [...pB1, ...pB2.slice(1), ...pB3.slice(1)];
        const tauBEdges = routeToEdges(tauBRoute, g.edges) ?? [];

        const vnDef = getAirlineDef('VN');
        const vjDef = getAirlineDef('VJ');

        const aircraft: ScenarioAircraft[] = [
          {
            id: 'S1',
            callsign: 'HVN301',
            airlineCode: 'VN',
            airlineName: vnDef.name,
            aircraftAsset: vnDef.asset,
            aircraftType: 'A321',
            currentNodeId: tauARoute[0],
            targetNodeId: tauARoute[tauARoute.length - 1],
            currentEdgeId: tauAEdges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 18,
            speedLimitKts: 18,
            status: 'taxiing',
            assignedRoute: tauARoute,
            routeEdgeIndex: 0,
            role: 'arriving',
            priority: 1,
            scenarioLabel: 'W5/25L ➔ STAND 17 (ƯU TIÊN)',
            clearedRoute: tauARoute,
            routeVisible: true,
          },
          {
            id: 'S2',
            callsign: 'VJ302',
            airlineCode: 'VJ',
            airlineName: vjDef.name,
            aircraftAsset: vjDef.asset,
            aircraftType: 'A321',
            currentNodeId: tauBRoute[0],
            targetNodeId: tauBRoute[tauBRoute.length - 1],
            currentEdgeId: tauBEdges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 12,
            speedLimitKts: 16,
            status: 'taxiing',
            assignedRoute: tauBRoute,
            routeEdgeIndex: 0,
            role: 'departing',
            priority: 2,
            scenarioLabel: 'PUSHBACK STAND 11',
            clearedRoute: tauBRoute,
            routeVisible: true,
          },
        ];

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_3_1',
            text: '[CONFLICT_PREDICTION] A-SMGCS phát hiện dự báo xung đột giữa HVN301 và VJ302 tại nút giao HS NS.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN301', 'VJ302'],
            check: (s) => {
              if (s.elapsedSeconds >= 4.0) {
                return { pass: true, evidence: `A-SMGCS phát hiện hội tụ tại HS NS` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_3_2',
            text: '[STOP_BAR_HOLD] VJ302 dừng chính xác trước Stop Bar của HS NS (status=holding, speed=0kts, holdReason=stop-bar).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VJ302'],
            check: (s) => {
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
              if (a2 && a2.status === 'holding' && a2.speedKts === 0 && a2.holdReason === 'stop-bar') {
                return { pass: true, evidence: `VJ302 / status=holding / speed=0kts / holdReason=stop-bar trước HS NS` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_3_3',
            text: '[FTG_RELEASE] Sau khi HVN301 giải phóng HS NS, VJ302 tự động được cấp lại đèn xanh và tiếp tục lăn đến STOP BAR 25L.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN301', 'VJ302'],
            check: (s) => {
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
              if (a2 && (a2.status === 'taxiing' || a2.status === 'departed' || a2.status === 'arrived')) {
                return { pass: true, evidence: `VJ302 tiếp tục hành trình an toàn ra STOP BAR 25L` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 2,
            apply: (state: any) => {
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[LVC_WEATHER] Sương mù dày đặc RVR 150-200m — Kích hoạt hệ thống Follow-the-Greens (FtG)',
                  severity: 'warning',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[CONFLICT_PREDICTED] A-SMGCS phát hiện nguy cơ xung đột tại nút giao HS NS',
                  severity: 'warning',
                });
              }
              return state;
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft,
          observations,
          triggers,
        };
      },
    },

    // ── KỊCH BẢN 4 ─────────────────────────────────────────────────────────────
    lvc_w7a_sudden_closure: {
      id: 'lvc_w7a_sudden_closure',
      title: 'Kịch bản 4 — Phát hiện FOD tại W7A, tự động tái định tuyến qua W9A',
      teaser: 'FOD xuất hiện tại W7A — KSKL cảnh báo, đèn FtG tự động thu hồi và dẫn đường qua W9A về Stand 16.',
      situation: 'Trong điều kiện sương mù LVC (RVR < 550m), tàu bay HVN401 vừa hạ cánh RWY 25R xả phanh qua W4 -> W4/25R. Ban đầu được cấp lộ trình cắt qua 25L vào đường lăn W7A để về Stand 16. Khi tàu bay vừa đến W4/25R, đài KSKL phát hiện FOD xuất hiện trên tim đường W7A (W7A MID). Đèn FtG trên W7A lập tức bị thu hồi, hệ thống tự động đổi hướng dải đèn xanh dẫn tàu bay tiếp tục qua L03_P3 -> W9A/07R -> W9B -> HS W7 -> Stand 16 an toàn.',
      challenges: [
        'Hệ thống A-SMGCS phát hiện FOD khẩn cấp trên tim đường lăn W7A.',
        'Thu hồi dải đèn xanh FtG trên W7A ngay lập tức và bật Stop Bar đỏ chặn lối vào.',
        'Hiển thị khung thoại truyện tranh (Comic Bubble) thông báo từ đài KSKL.',
        'Tự động tính toán lộ trình mới qua W9A và cấp dải đèn xanh FtG liên tục về Stand 16.'
      ],
      watchFor: [
        'HVN401 xả đà hạ cánh RWY 25R lăn vào W4 -> W4/25R.',
        'Tại W4/25R: Vật thể lạ FOD xuất hiện tại W7A MID, khung chat KSKL báo động xuất hiện.',
        'Đèn FtG trên W7A tắt, Stop Bar đỏ chặn W7A.',
        'Dải đèn xanh mới bật sáng dẫn qua L03_P3 -> W9A/07R -> W9B -> HS W7 -> Stand 16.'
      ],
      setup: (g = graph) => {
        const rInit = [
          'v3_line_01_p03', 'v3_line_01_p02', 'v3_line_06_p00', 'v3_line_01_p01',
          'v3_line_04_p00', 'v3_line_04_p01', 'v3_line_04_p02', 'v3_line_04_p03',
          'v3_line_05_p01', 'v3_line_18_p00', 'v3_line_18_p01', 'v3_line_18_p02',
          'v3_line_18_p03', 'v3_line_17_p05', 'v3_line_10_p04', 'v3_line_17_p06',
          'v3_line_11_p01', 'v3_line_17_p07', 'v3_line_19_p03', 'v3_line_17_p08',
          'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00', 'v3_line_21_p01'
        ];
        const rInitEdges = routeToEdges(rInit, g.edges) ?? [];
        const vnDef = getAirlineDef('VN');

        const aircraft: ScenarioAircraft[] = [
          {
            id: 'S1',
            callsign: 'HVN401',
            airlineCode: 'VN',
            airlineName: vnDef.name,
            aircraftAsset: vnDef.asset,
            aircraftType: 'A321',
            currentNodeId: rInit[0],
            targetNodeId: rInit[rInit.length - 1],
            currentEdgeId: rInitEdges[0] ?? null,
            progressOnEdge: 0,
            speedKts: 50,
            speedLimitKts: 50,
            status: 'taxiing',
            assignedRoute: rInit,
            routeEdgeIndex: 0,
            role: 'arriving',
            priority: 1,
            scenarioLabel: 'HẠ CÁNH 25R ➔ W4',
            clearedRoute: rInit,
            routeVisible: true,
          },
        ];

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_4_1',
            text: '[FOD_DETECTION] Phát hiện FOD tại W7A MID khi HVN401 lăn đến W4/25R.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.blockedEdgeIds && (s.blockedEdgeIds.has('E_v3_line_18_p01_v3_line_18_p02') || s.blockedEdgeIds.has('v3_line_10_s00'))) {
                return { pass: true, evidence: `Đã phát hiện FOD và đóng đường lăn W7A` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_4_2',
            text: '[FTG_REROUTE] Hệ thống FtG thu hồi đèn W7A và tự động dẫn hướng qua W9A về Stand 16.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN401');
              if (ac && ac.assignedRoute?.includes('v3_line_17_p01')) {
                return { pass: true, evidence: `Đã tự động chuyển tuyến qua W9A` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_4_3',
            text: '[SAFE_ARRIVAL] HVN401 cập bến Stand 16 an toàn 100%.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN401');
              if (ac && ac.status === 'arrived') {
                return { pass: true, evidence: `HVN401 đã về đỗ an toàn tại Stand 16` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 2,
            apply: (state: any) => {
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[LVC_WEATHER] Sương mù RVR < 550m — Kích hoạt Follow-the-Greens cho HVN401',
                  severity: 'info',
                });
              }
              return state;
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft,
          observations,
          triggers,
        };
      },
    },

    // ── KỊCH BẢN 5: ĐẢO CHIỀU CẤT HẠ CÁNH GIỜ CAO ĐIỂM (SO SÁNH 2 MÀN HÌNH) ────
    lvc_peak_runway_direction_change: {
      id: 'lvc_peak_runway_direction_change',
      title: 'Kịch bản 5 — Đảo chiều cất/hạ cánh: So Sánh 2 Màn Hình (Truyền Thống vs FTG)',
      teaser: 'Gió đổi hướng trong giờ cao điểm LVC — So sánh song song hai màn hình: Điều hành truyền thống vs Follow-the-Green (8 tàu bay).',
      situation: 'Trong giờ cao điểm sương mù LVC (RVR < 550m) với 8 tàu bay hoạt động đồng thời (4 cất cánh, 2 hạ cánh, 2 pushback). Bất ngờ gió đổi chiều khẩn cấp từ 25 sang 07. Hệ thống mở chế độ so sánh 2 màn hình để đối chiếu hiệu quả giữa phương thức truyền thống (nghẽn sóng VHF và khóa cứng toàn sân) và A-SMGCS Level 4 (Auto-Freeze và Dijkstra FTG thông suốt).',
      challenges: [
        'So sánh trực quan 2 màn hình đồng thời với 8 tàu bay.',
        'Màn hình 1 (Truyền thống): Ùn ứ và kẹt cứng do đè sóng vô tuyến.',
        'Màn hình 2 (FTG): Auto-Freeze dừng an toàn và cấp tuyến Dijkstra theo pha không ùn tắc.'
      ],
      watchFor: [
        'Màn trái chạy luồng Truyền thống với 8 tàu bay dồn toa tại nút giao HS NS.',
        'Màn phải chạy luồng A-SMGCS + FtG với cơ chế Auto-Freeze và giải tỏa theo 2 pha.'
      ],
      setup: (g = graph) => {
        return setupScenario5Traditional(g);
      },
    },
  };
}

/** Khởi tạo luồng Điều hành truyền thống cho Kịch bản 5 */
export function setupScenario5Traditional(g: AirportGraph) {
  // 1. Luồng cất cánh: OUT01 đứng ở L28_ENT, 3 tàu bay còn lại xếp phía sau tiến về HS NS
  const pOut1 = findPath(g, 'v3_line_30_p01', 'v3_line_17_p09') || [];
  const pOut2 = findPath(g, 'v3_line_31_p01', 'v3_line_17_p09') || [];
  const pOut3 = findPath(g, 'v3_line_32_p01', 'v3_line_17_p09') || [];
  const pOut4 = findPath(g, 'v3_line_33_p01', 'v3_line_17_p09') || [];

  // 2. Luồng hạ cánh: INB01 xả phanh tới W4 -> rẽ thoát tại W4 -> quẹo xuống W4/25L -> W8 -> W7A -> HS NS
  const pInb1 = [
    'v3_line_01_p01',
    'v3_line_04_p00', 'v3_line_04_p01',
    'v3_line_04_p02', 'v3_line_04_p03',
    'v3_line_05_p01', 'v3_line_18_p00',
    'v3_line_18_p01', 'v3_line_18_p02',
    'v3_line_18_p03', 'v3_line_17_p05',
    'v3_line_10_p04', 'v3_line_17_p06',
    'v3_line_11_p01', 'v3_line_17_p07',
    'v3_line_19_p03', 'v3_line_17_p08',
    'v3_line_17_p09'
  ];

  // 3. Luồng hạ cánh: INB02 nối đuôi ngay sau vượt qua W4 tới W5/07L -> quẹo xuống W5/07R -> W9B -> HS NS
  const pInb2 = [
    'v3_line_01_p01',
    'v3_line_04_p00', 'v3_line_03_p00',
    'v3_line_03_p01', 'v3_line_16_p00',
    'v3_line_17_p00', 'v3_line_05_p01',
    'v3_line_04_p04', 'v3_line_04_p05',
    'v3_line_10_p00', 'v3_line_05_p02',
    'v3_line_19_p00', 'v3_line_19_p01',
    'v3_line_19_p02', 'v3_line_19_p03',
    'v3_line_17_p08', 'v3_line_17_p09'
  ];

  // 4. Luồng bến đỗ: PUSH01 lùi từ Stand 11 đít quẹo phải ra Line 12 rồi chạy lên HS_NS
  const pPush1 = findPath(g, 'v3_line_32_p00', 'v3_line_17_p09') || [];

  // 5. Luồng bến đỗ: PUSH02 lùi từ Stand 3 đít quẹo trái ra Line 12 nối sau PUSH01 rồi chạy lên HS_NS
  const pPush2 = findPath(g, 'v3_line_34_p02', 'v3_line_17_p09') || [];

  const vnDef = getAirlineDef('VN');
  const vjDef = getAirlineDef('VJ');
  const qhDef = getAirlineDef('QH');
  const vuDef = getAirlineDef('VU');
  const sqDef = getAirlineDef('SQ');
  const tgDef = getAirlineDef('TG');

  const aircraft: ScenarioAircraft[] = [
    {
      id: 'S1', callsign: 'OUT01', airlineCode: 'VN', airlineName: vnDef.name, aircraftAsset: vnDef.asset, aircraftType: 'A321',
      currentNodeId: pOut1[0], targetNodeId: pOut1[pOut1.length - 1], currentEdgeId: routeToEdges(pOut1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut1, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S2', callsign: 'OUT02', airlineCode: 'VJ', airlineName: vjDef.name, aircraftAsset: vjDef.asset, aircraftType: 'A321',
      currentNodeId: pOut2[0], targetNodeId: pOut2[pOut2.length - 1], currentEdgeId: routeToEdges(pOut2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut2, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S3', callsign: 'OUT03', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pOut3[0], targetNodeId: pOut3[pOut3.length - 1], currentEdgeId: routeToEdges(pOut3, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut3, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S4', callsign: 'OUT04', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pOut4[0], targetNodeId: pOut4[pOut4.length - 1], currentEdgeId: routeToEdges(pOut4, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut4, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S5', callsign: 'INB01', airlineCode: 'SQ', airlineName: sqDef.name, aircraftAsset: sqDef.asset, aircraftType: 'A350',
      currentNodeId: pInb1[0], targetNodeId: pInb1[pInb1.length - 1], currentEdgeId: routeToEdges(pInb1, g.edges)?.[0] ?? null,
      progressOnEdge: 0.50, speedKts: 22, speedLimitKts: 22, status: 'taxiing', assignedRoute: pInb1, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'XẢ PHANH W4 ➔ HS NS', routeVisible: false, guidanceVisible: false,
    },
    {
      id: 'S6', callsign: 'INB02', airlineCode: 'TG', airlineName: tgDef.name, aircraftAsset: tgDef.asset, aircraftType: 'A350',
      currentNodeId: pInb2[0], targetNodeId: pInb2[pInb2.length - 1], currentEdgeId: routeToEdges(pInb2, g.edges)?.[0] ?? null,
      progressOnEdge: 0.00, speedKts: 16, speedLimitKts: 16, status: 'taxiing', assignedRoute: pInb2, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'XẢ PHANH W5 ➔ HS NS', routeVisible: false, guidanceVisible: false,
    },
    {
      id: 'S7', callsign: 'PUSH01', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pPush1[0], targetNodeId: pPush1[pPush1.length - 1], currentEdgeId: routeToEdges(pPush1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 0, status: 'holding', assignedRoute: pPush1, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'PUSHBACK STAND 11', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S8', callsign: 'PUSH02', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pPush2[0], targetNodeId: pPush2[pPush2.length - 1], currentEdgeId: routeToEdges(pPush2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 0, status: 'holding', assignedRoute: pPush2, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'PUSHBACK STAND 3', routeVisible: false, guidanceVisible: false, hidden: true,
    },
  ];

  const observations: ScenarioObservation[] = [
    {
      id: 'obs_5_1',
      text: '[CONVENTIONAL_PEAK] 8 tàu bay di chuyển dồn dập theo phương thức đàm thoại thoại VHF trong sương mù LVC.',
      required: true,
      status: 'pending',
      checkedAtSeconds: null,
      evidence: '',
      check: (s) => {
        if (s.scenarioAircraft && s.scenarioAircraft.length === 8) {
          return { pass: true, evidence: `Đang có 8 tàu bay hoạt động đồng thời` };
        }
        return { pass: false };
      },
    },
  ];

  return {
    weather: 'fog' as const,
    aircraft,
    observations,
    triggers: [],
  };
}

/** Khởi tạo luồng Follow-the-Greens cho Kịch bản 5 */
export function setupScenario5FTG(g: AirportGraph) {
  const pOut1 = findPath(g, 'v3_line_17_p12', 'v3_line_17_p16') || [];
  const pOut2 = findPath(g, 'v3_line_17_p11', 'v3_line_17_p16') || [];
  const pOut3 = findPath(g, 'v3_line_23_p00', 'v3_line_17_p16') || [];
  const pOut4 = findPath(g, 'v3_line_17_p09', 'v3_line_17_p16') || [];
  const pInb1 = findPath(g, 'v3_line_04_p01', 'v3_line_17_p09') || [];
  const pInb2 = findPath(g, 'v3_line_10_p01', 'v3_line_17_p09') || [];
  const pPush1 = findPath(g, 'v3_line_32_p00', 'v3_line_12_p03') || [];
  const pPush2 = findPath(g, 'v3_line_34_p02', 'v3_line_12_p03') || [];

  const vnDef = getAirlineDef('VN');
  const vjDef = getAirlineDef('VJ');
  const qhDef = getAirlineDef('QH');
  const vuDef = getAirlineDef('VU');
  const sqDef = getAirlineDef('SQ');
  const tgDef = getAirlineDef('TG');

  const aircraft: ScenarioAircraft[] = [
    {
      id: 'S1', callsign: 'OUT01', airlineCode: 'VN', airlineName: vnDef.name, aircraftAsset: vnDef.asset, aircraftType: 'A321',
      currentNodeId: pOut1[0], targetNodeId: pOut1[pOut1.length - 1], currentEdgeId: routeToEdges(pOut1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 15, speedLimitKts: 15, status: 'taxiing', assignedRoute: pOut1, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'FTG DẪN ĐƯỜNG 25L', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S2', callsign: 'OUT02', airlineCode: 'VJ', airlineName: vjDef.name, aircraftAsset: vjDef.asset, aircraftType: 'A321',
      currentNodeId: pOut2[0], targetNodeId: pOut2[pOut2.length - 1], currentEdgeId: routeToEdges(pOut2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 15, speedLimitKts: 15, status: 'taxiing', assignedRoute: pOut2, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'FTG DẪN ĐƯỜNG 25L', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S3', callsign: 'OUT03', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pOut3[0], targetNodeId: pOut3[pOut3.length - 1], currentEdgeId: routeToEdges(pOut3, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 15, speedLimitKts: 15, status: 'taxiing', assignedRoute: pOut3, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'FTG DẪN ĐƯỜNG 25L', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S4', callsign: 'OUT04', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pOut4[0], targetNodeId: pOut4[pOut4.length - 1], currentEdgeId: routeToEdges(pOut4, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 15, speedLimitKts: 15, status: 'taxiing', assignedRoute: pOut4, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'FTG DẪN ĐƯỜNG 25L', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S5', callsign: 'INB01', airlineCode: 'SQ', airlineName: sqDef.name, aircraftAsset: sqDef.asset, aircraftType: 'A350',
      currentNodeId: pInb1[0], targetNodeId: pInb1[pInb1.length - 1], currentEdgeId: routeToEdges(pInb1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pInb1, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'FTG DẪN ĐƯỜNG VỀ BẾN', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S6', callsign: 'INB02', airlineCode: 'TG', airlineName: tgDef.name, aircraftAsset: tgDef.asset, aircraftType: 'A350',
      currentNodeId: pInb2[0], targetNodeId: pInb2[pInb2.length - 1], currentEdgeId: routeToEdges(pInb2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pInb2, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'FTG DẪN ĐƯỜNG VỀ BẾN', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S7', callsign: 'PUSH01', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pPush1[0], targetNodeId: pPush1[pPush1.length - 1], currentEdgeId: routeToEdges(pPush1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 8, speedLimitKts: 8, status: 'taxiing', assignedRoute: pPush1, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'PUSHBACK STAND 11', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S8', callsign: 'PUSH02', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pPush2[0], targetNodeId: pPush2[pPush2.length - 1], currentEdgeId: routeToEdges(pPush2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 8, speedLimitKts: 8, status: 'taxiing', assignedRoute: pPush2, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'PUSHBACK STAND 3', routeVisible: true, guidanceVisible: true,
    },
  ];

  return {
    weather: 'fog' as const,
    aircraft,
    observations: [],
    triggers: [],
  };
}
