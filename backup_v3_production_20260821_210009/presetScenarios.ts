import type { AircraftStatus, AirportGraph, AirlineCode, AircraftType } from '../types';
import { airportGraphV3 } from './airportGraph.v3';
import { getAirlineDef } from './airlineTypes';
import { findPath, routeToEdges } from '../simulation/pathfinding';
import { recalculateRoutePreservingProgress } from '../simulation/scenarioRunner';

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
  if (idOrLabel === 'STAND_13') return 'v3_line_30_p00';
  const found = graph.nodes.find(n => n.id === idOrLabel || n.label === idOrLabel);
  return found ? found.id : idOrLabel;
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
      title: 'Kịch bản 1 — Taxi sai tuyến trong LVC và mất liên lạc vô tuyến',
      teaser: 'HVN216 rẽ nhầm E4 trong LVC và mất liên lạc — KSVKL can thiệp cấp lại lộ trình qua E2/E6.',
      situation: 'Trong điều kiện tầm nhìn thấp (LVC / sương mù dày), tàu bay HVN216 được cấp phép taxi từ STAND_10 ra STOP BAR 25L theo tuyến quy định (STAND_10 -> HS NS -> E6/E4 -> E6 -> STOP BAR 25L). Tuy nhiên, tại khu vực giao lộ E6/E4, tàu bay rẽ sớm nhầm vào E4 thay vì đi vào E6. Đồng thời, HVN216 gặp sự cố mất liên lạc vô tuyến. Tàu bay dừng giữ vị trí an toàn trên nhánh E4 cho đến khi KSVKL phát hiện và can thiệp cấp lại lộ trình hợp lệ qua E2 -> E6/E2 -> E6/E4 -> E6.',
      challenges: [
        'Tầm nhìn thấp kết hợp mất liên lạc thoại khiến tổ lái không tự biết đã lệch tuyến vào E4.',
        'Tàu bay phải dừng an toàn trên nhánh E4, không tự ý di chuyển gây nguy cơ xung đột.',
        'KSVKL can thiệp cấp lại lộ trình hợp lệ qua Dijkstra trên Graph V3 để đưa tàu đến STOP BAR 25L.'
      ],
      watchFor: [
        'HVN216 ban đầu lăn bình thường từ STAND_10 qua HS NS về phía Đông.',
        'Tại giao lộ E6/E4: Không FtG tàu rẽ nhầm vào E4, biểu tượng MẤT LIÊN LẠC kích hoạt và tàu dừng hẳn (status=holding, holdReason=deviation).',
        'Có FtG: Đèn tim đường xanh lá dẫn hướng chính xác vào E6, ngăn ngừa hoàn toàn lỗi rẽ nhầm.',
        'Sau can thiệp: KSVKL cấp lại lộ trình hợp lệ và HVN216 tiếp tục lăn an toàn đến STOP BAR 25L.'
      ],
      setup: (g = graph) => {
        const rawAc = createScenarioAircraft({ id: 'S1', callsign: 'HVN216', from: 'STAND_10', to: 'STOP BAR 25L', role: 'departing', priority: 1, aircraftType: 'A321', airlineCode: 'VN' }, g);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_1_1',
            text: '[LVC_NAVIGATION_ERROR] HVN216 rẽ nhầm vào E4 trong LVC và mất liên lạc vô tuyến (radioFailure=true, deviated=true).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN216'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
              if (ac && (ac.deviated || ac.radioFailure)) {
                return { pass: true, evidence: `HVN216 / deviated=${ac.deviated} / radioFailure=${ac.radioFailure} / label=${ac.scenarioLabel}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_2',
            text: '[HOLD_POSITION] HVN216 giữ vị trí an toàn trên nhánh E4 (status=holding, speed=0kts, holdReason=deviation).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN216'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
              if (ac && ac.status === 'holding' && ac.speedKts === 0 && ac.holdReason === 'deviation') {
                return { pass: true, evidence: `HVN216 / status=holding / speed=0kts / holdReason=deviation / an toàn trên nhánh E4` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_3',
            text: '[REROUTE_GRANTED] KSVKL cấp lại lộ trình hợp lệ qua Dijkstra và HVN216 tiếp tục lăn an toàn đến STOP BAR 25L.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN216'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
              if (ac && !ac.deviated && (ac.status === 'taxiing' || ac.status === 'arrived') && s.elapsedSeconds >= 29) {
                return { pass: true, evidence: `HVN216 / status=${ac.status} / route đã cấp lại qua Dijkstra đến ${ac.targetNodeId}` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 18,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'HVN216') {
                  return {
                    ...ac,
                    deviated: true,
                    radioFailure: true,
                    scenarioLabel: 'MẤT LIÊN LẠC / SAI TUYẾN',
                    holdReason: 'deviation',
                    status: 'holding',
                    speedKts: 0,
                    currentNodeId: 'v3_line_26_p01', // E4/25L
                  };
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[LVC_NAVIGATION_ERROR] HVN216 rẽ nhầm vào E4 trong LVC',
                  severity: 'critical',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[RADIO_FAILURE] HVN216 không chủ động phát hiện sai tuyến',
                  severity: 'warning',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[ATC_INTERVENTION] KSV phát hiện và yêu cầu giữ vị trí',
                  severity: 'info',
                });
              }
              return state;
            },
          },
          {
            atSeconds: 28,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'HVN216') {
                  const destId = resolveV3NodeId('STOP BAR 25L', g);
                  const newRoute = findPath(g, 'v3_line_26_p01', destId, state.blockedEdgeIds);
                  const newEdges = newRoute ? routeToEdges(newRoute, g.edges) : [];
                  return {
                    ...ac,
                    deviated: false,
                    holdReason: undefined,
                    status: 'taxiing',
                    speedKts: 15,
                    assignedRoute: newRoute || ac.assignedRoute,
                    clearedRoute: newRoute || ac.clearedRoute,
                    routeEdgeIndex: 0,
                    progressOnEdge: 0,
                    currentNodeId: 'v3_line_26_p01',
                    currentEdgeId: newEdges && newEdges.length > 0 ? newEdges[0] : ac.currentEdgeId,
                  };
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[REROUTE_GRANTED] Cấp lại tuyến về E6 và STOP BAR 25L',
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
      title: 'Kịch bản 2 — Khẩn nguy hạ cánh RWY25R, thoát W4 và cô lập tại W5',
      teaser: 'BAV315 cháy động cơ thoát W4 về W5/07R — Hai runway chuyển đỏ, bảo vệ tuyệt đối hành lang cứu hộ.',
      situation: 'Trong điều kiện LVC, tàu bay BAV315 vừa hạ cánh RWY 25R phát tín hiệu khẩn nguy cháy động cơ. BAV315 được cấp quyền ưu tiên tuyệt đối để thoát đường băng qua W4 và lăn dọc hành lang W5 đến khu vực cách ly khẩn cấp gần W5/07R. Hai hành lang đường băng (25R và 25L) lập tức chuyển sang trạng thái ĐỎ (Runway Incursion Protection). BAV456 và THA101 nhận lệnh dừng khẩn cấp trước Stop Bar, trong khi HVN123 được cấp huấn lệnh EXPEDITE về Stand 17 và đội cứu hộ RESCUE01 xuất phát từ W9A/07R.',
      challenges: [
        'Bảo vệ tuyệt đối hai hành lang đường băng và trục lăn khẩn cấp W5 cho BAV315.',
        'Các tàu bay khác (BAV456, THA101) phải lập tức dừng trước Stop Bar (status=holding, speed=0kts).',
        'HVN123 được cấp huấn lệnh EXPEDITE về Stand 17 để giải phóng tim đường lăn chính.',
        'Đội cứu hộ khẩn cấp RESCUE01 triển khai tiếp cận vị trí cách ly an toàn.'
      ],
      watchFor: [
        'BAV315 (ĐỎ - KHẨN NGUY) lăn ưu tiên liên tục từ 25R qua W4/W5 về vùng cách ly W5/07R.',
        'Hai đường băng 25R/07L và 25L/07R chuyển sang trạng thái ĐỎ được bảo vệ.',
        'BAV456 và THA101 nhận Stop Bar đỏ, dừng hẳn (status=holding, speed=0kts) nhường đường.',
        'HVN123 nhận huấn lệnh EXPEDITE về Stand 17 theo lộ trình W4/25L -> W7A/25L -> W9B -> HS NS -> STAND_17.',
        'Đội cứu hộ RESCUE01 di chuyển từ W9A/07R đến bảo vệ tàu bay cách ly.'
      ],
      setup: (g = graph) => {
        const hvn123Route = [
          'v3_line_04_p03', // W4/25L
          'v3_line_18_p00',
          'v3_line_18_p01', // W7A/25L
          'v3_line_18_p02',
          'v3_line_18_p03', // W7B (W9B/W7A)
          'v3_line_17_p05',
          'v3_line_17_p06',
          'v3_line_17_p07', // HS W7
          'v3_line_17_p08',
          'v3_line_17_p09', // HS NS
          'v3_line_17_p10',
          'v3_line_17_p11',
          'v3_line_17_p12',
          'v3_line_26_p03', // E6/E4
          'v3_line_26_p02',
          'v3_line_26_p01', // E4/25L
          'v3_line_26_p00',
          'v3_line_09_p01',
          'v3_line_13_p00',
          'v3_line_13_p01', // E2/25L
          'v3_line_13_p02', // E6/E2
          'v3_line_15_p00',
          'v3_line_22_p00',
          'v3_line_22_p01', // STAND_17
        ];
        const hvn123Edges = routeToEdges(hvn123Route, g.edges) ?? [];

        const acHv123: ScenarioAircraft = {
          id: 'S2',
          callsign: 'HVN123',
          airlineCode: 'VN',
          airlineName: 'Vietnam Airlines',
          aircraftAsset: '/assets/vietnam_airlines_a321.png',
          aircraftType: 'A321',
          currentNodeId: 'v3_line_04_p03',
          targetNodeId: 'v3_line_22_p01',
          currentEdgeId: hvn123Edges[0] ?? null,
          progressOnEdge: 0,
          speedKts: 15,
          speedLimitKts: 15,
          status: 'taxiing',
          assignedRoute: hvn123Route,
          routeEdgeIndex: 0,
          role: 'arriving',
          priority: 1,
          scenarioLabel: 'EXPEDITE',
          clearedRoute: hvn123Route,
          routeVisible: true,
        };

        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'BAV315', from: 'STOP BAR 25R', to: 'W5/07R', role: 'emergency', priority: 0, label: 'KHẨN NGUY', aircraftType: 'B737', airlineCode: 'QH' }, g),
          acHv123,
          createScenarioAircraft({ id: 'S3', callsign: 'BAV456', from: 'E6/E4', to: 'STOP BAR 25L', role: 'departing', priority: 2, aircraftType: 'A321', airlineCode: 'QH' }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'THA101', from: 'STAND_10', to: 'STOP BAR 25R', role: 'pushback', priority: 3, label: 'PUSHBACK', aircraftType: 'A350', airlineCode: 'TG' }, g),
          createScenarioAircraft({ id: 'S5', callsign: 'RESCUE01', from: 'W9A/07R', to: 'W5/07R', role: 'emergency', priority: 0, label: 'CỨU HỘ', aircraftType: 'ATR72', airlineCode: 'VU' }, g),
        ]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_2_1',
            text: '[EMERGENCY_PRIORITY] BAV315 (KHẨN NGUY) có priority=0 cao nhất và lăn liên tục về vùng cách ly W5/07R.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['BAV315'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'BAV315');
              if (ac && (ac.status === 'taxiing' || ac.status === 'arrived')) {
                return { pass: true, evidence: `BAV315 / priority=0 / status=${ac.status} / lăn về vùng cách ly W5/07R` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_2',
            text: '[HOLD_POSITION] BAV456 và THA101 dừng trước Stop Bar (status=holding, speed=0kts, holdReason=stop-bar).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['BAV456', 'THA101'],
            check: (s) => {
              const held = s.scenarioAircraft?.filter((a: any) => ['BAV456', 'THA101'].includes(a.callsign) && a.status === 'holding' && a.holdReason === 'stop-bar');
              if (held && held.length > 0) {
                return { pass: true, evidence: `${held.map((a: any) => `${a.callsign} (status=holding, speed=0)`).join(', ')} / nhường đường BAV315` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_3',
            text: '[EXPEDITE_ROUTING] HVN123 được cấp huấn lệnh EXPEDITE về Stand 17 và RESCUE01 tiếp cận hỗ trợ.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['HVN123', 'RESCUE01'],
            check: (s) => {
              const hvn = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN123');
              if (hvn && (hvn.status === 'taxiing' || hvn.status === 'arrived')) {
                return { pass: true, evidence: `HVN123 expedite an toàn về Stand 17` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 5,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'BAV456' || ac.callsign === 'THA101') {
                  return {
                    ...ac,
                    status: 'holding',
                    speedKts: 0,
                    holdReason: 'stop-bar',
                    releaseAtSeconds: 35,
                  };
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[EMERGENCY_DECLARED] BAV315 engine fire after landing RWY 25R',
                  severity: 'critical',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[RUNWAY_PROTECTED] Runway corridors 25R/25L protected (RED status)',
                  severity: 'critical',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[FTG_EMERGENCY_CORRIDOR] Green guidance assigned exclusively to BAV315',
                  severity: 'info',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[EXPEDITE_CLEARANCE] HVN123 cleared to expedite to Stand 17',
                  severity: 'info',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[HOLD_POSITION] BAV456 and THA101 stopped before protected areas',
                  severity: 'warning',
                });
              }
              return state;
            },
          },
          {
            atSeconds: 35,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'BAV456' || ac.callsign === 'THA101') {
                  return {
                    ...ac,
                    status: 'taxiing',
                    speedKts: 15,
                    holdReason: undefined,
                  };
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[EMERGENCY_CLEARED] BAV315 isolated at W5/07R; normal flow released safely',
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

    // ── KỊCH BẢN 3 ─────────────────────────────────────────────────────────────
    lvc_hsns_intersection_conflict: {
      id: 'lvc_hsns_intersection_conflict',
      title: 'Kịch bản 3 — Hai tàu bay cùng tiến vào HS NS trong LVC',
      teaser: 'HVN301 (Inbound) và VJ302 (Outbound) hội tụ tại HS NS — Stop Bar đỏ giữ VJ302 nhường đường.',
      situation: 'Trong điều kiện sương mù dày đặc (LVC nặng, RVR 150–200m), Tàu bay A (HVN301 - Inbound) từ W4/25L đang lăn về STAND_17 qua HS W7 -> HS NS. Cùng lúc, Tàu bay B (VJ302 - Outbound) từ STAND_11 đang hướng Bắc ra STOP BAR 25L qua HS NS -> NS2/25L. Cả hai tàu dự kiến tiến vào điểm nóng xung đột HS NS gần như đồng thời mà tổ lái không thể nhìn thấy nhau.',
      challenges: [
        'A-SMGCS phải dự báo trước nguy cơ xung đột tại nút giao HS NS.',
        'Ưu tiên HVN301 đi trước để giải phóng trục lăn chính.',
        'VJ302 phải nhận Stop Bar đỏ và dừng chính xác trước nút giao HS NS (status=holding, speed=0kts).'
      ],
      watchFor: [
        'HVN301 (Inbound) và VJ302 (Outbound) cùng lăn về phía giao điểm HS NS.',
        'A-SMGCS kích hoạt Stop Bar đỏ trước mũi VJ302 — VJ302 dừng hẳn (speed=0kts, GIỮ NGUYÊN).',
        'HVN301 giữ đèn xanh FtG liên tục đi qua HS NS an toàn.',
        'Khi HVN301 thoát hoàn toàn khỏi HS NS, Stop Bar của VJ302 tắt, đèn xanh bật lại và VJ302 tiếp tục hành trình đến STOP BAR 25L.'
      ],
      setup: (g = graph) => {
        const hvn301Route = [
          'v3_line_17_p04', // W7B (W9B)
          'v3_line_17_p05',
          'v3_line_17_p06',
          'v3_line_17_p07', // HS W7
          'v3_line_17_p08',
          'v3_line_17_p09', // HS NS
          'v3_line_17_p10',
          'v3_line_17_p11',
          'v3_line_17_p12',
          'v3_line_26_p03', // E6/E4
          'v3_line_26_p02',
          'v3_line_26_p01', // E4/25L
          'v3_line_26_p00',
          'v3_line_09_p01',
          'v3_line_13_p00',
          'v3_line_13_p01', // E2/25L
          'v3_line_13_p02', // E6/E2
          'v3_line_15_p00',
          'v3_line_22_p00',
          'v3_line_22_p01', // STAND_17
        ];
        const hvnEdges = routeToEdges(hvn301Route, g.edges) ?? [];

        const ac1: ScenarioAircraft = {
          id: 'S1',
          callsign: 'HVN301',
          airlineCode: 'VN',
          airlineName: 'Vietnam Airlines',
          aircraftAsset: '/assets/vietnam_airlines_a321.png',
          aircraftType: 'A321',
          currentNodeId: 'v3_line_17_p04',
          targetNodeId: 'v3_line_22_p01',
          currentEdgeId: hvnEdges[0] ?? null,
          progressOnEdge: 0,
          speedKts: 15,
          speedLimitKts: 15,
          status: 'taxiing',
          assignedRoute: hvn301Route,
          routeEdgeIndex: 0,
          role: 'arriving',
          priority: 1,
          clearedRoute: hvn301Route,
          routeVisible: true,
        };
        const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'VJ302', from: 'STAND_11', to: 'STOP BAR 25L', role: 'departing', priority: 2, aircraftType: 'A321', airlineCode: 'VJ' }, g);

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
              if (a2 && (a2.status === 'taxiing' || a2.status === 'arrived') && a2.speedKts > 0 && s.elapsedSeconds >= 33) {
                return { pass: true, evidence: `VJ302 status=${a2.status}, speed=${a2.speedKts.toFixed(1)}kts, tiếp tục hành trình an toàn` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 5,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'VJ302') {
                  return {
                    ...ac,
                    status: 'holding',
                    speedKts: 0,
                    holdReason: 'stop-bar',
                    releaseAtSeconds: 32,
                  };
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[CONFLICT_PREDICTED] Conflict predicted at HS NS',
                  severity: 'warning',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[PRIORITY_GRANTED] Inbound aircraft HVN301 granted priority',
                  severity: 'info',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[STOP_BAR_ACTIVE] Outbound aircraft VJ302 held before HS NS',
                  severity: 'critical',
                });
              }
              return state;
            },
          },
          {
            atSeconds: 32,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'VJ302') {
                  return {
                    ...ac,
                    status: 'taxiing',
                    speedKts: 15,
                    holdReason: undefined,
                  };
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[CONFLICT_ZONE_CLEARED] HS NS cleared by HVN301',
                  severity: 'info',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[FTG_RELEASED] Outbound aircraft VJ302 released to STOP BAR 25L',
                  severity: 'info',
                });
              }
              return state;
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft: filterNonNull([ac1, ac2]),
          observations,
          triggers,
        };
      },
    },

    // ── KỊCH BẢN 4 ─────────────────────────────────────────────────────────────
    lvc_w7a_sudden_closure: {
      id: 'lvc_w7a_sudden_closure',
      title: 'Kịch bản 4 — Đóng đường lăn W7A đột ngột, tự động tái định tuyến',
      teaser: 'Đóng W7A do sự cố FOD — thu hồi đèn FtG và tự động reroute qua W5/W9A trên Graph V3.',
      situation: 'Trong điều kiện LVC (RVR < 550m), đường lăn W7A bị đóng đột xuất do phát hiện mảnh vỡ (FOD). Tàu bay HVN401 vừa hạ cánh RWY 25R thoát qua W4, ban đầu được chỉ định vào W7A. Ngay khi sự cố xảy ra, đèn xanh FtG trên W7A bị thu hồi lập tức và hệ thống tự động tính toán lộ trình mới theo Graph V3 vòng qua W5/W9A.',
      challenges: [
        'Ngăn chặn tuyệt đối không cho HVN401 đi vào đoạn W7A bị đóng.',
        'Tính toán lộ trình vòng qua Dijkstra (hành lang W5/W9A) hợp lệ về mặt topology Graph V3.',
        'Đảm bảo không teleport và giữ nguyên tiến trình lăn bánh.'
      ],
      watchFor: [
        'HVN401 ban đầu lăn theo hướng vào W7A.',
        'Tại giây thứ 15: sự cố W7A_CLOSED kích hoạt, đoạn W7A chuyển sang màu đỏ (bị chặn).',
        'Lộ trình của HVN401 ngay lập tức đổi hướng vẽ lại vòng qua W5/W9A mà không chứa đoạn W7A bị đóng.'
      ],
      setup: (g = graph) => {
        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'HVN401', from: 'W4/25R', to: 'STAND_7', role: 'arriving', aircraftType: 'A321', airlineCode: 'VN' }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'VJ402', from: 'STAND_8', to: 'STOP BAR 25R', role: 'departing', aircraftType: 'A321', airlineCode: 'VJ' }, g),
        ]);
        const closureEdge = 'v3_line_10_s00'; // W7A segment

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_4_1',
            text: '[FOD_INCIDENT] Sự cố đóng đường lăn W7A được kích hoạt tại t=15s (blockedEdgeIds chứa v3_line_10_s00).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedEdgeIds: [closureEdge],
            check: (s) => {
              if (s.blockedEdgeIds && s.blockedEdgeIds.has(closureEdge) && s.elapsedSeconds >= 15) {
                return { pass: true, evidence: `Đường lăn W7A (${closureEdge}) bị đóng lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_4_2',
            text: '[FTG_REVOCATION] Đèn dẫn đường trên đoạn W7A bị thu hồi ngay lập tức khi phát hiện sự cố.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.blockedEdgeIds && s.blockedEdgeIds.has(closureEdge)) {
                return { pass: true, evidence: `Đèn xanh FtG trên W7A đã thu hồi` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_4_3',
            text: '[DYNAMIC_REROUTE] HVN401 được cấp lộ trình mới vòng qua Dijkstra an toàn, tuyệt đối không chứa đoạn W7A bị đóng.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.blockedEdgeIds && s.blockedEdgeIds.has(closureEdge) && s.elapsedSeconds >= 16) {
                const allClear = s.scenarioAircraft?.every((ac: any) => {
                  const edges = routeToEdges(ac.assignedRoute, g.edges) ?? [];
                  const remaining = edges.slice(ac.routeEdgeIndex);
                  return !remaining.includes(closureEdge);
                });
                if (allClear) {
                  return { pass: true, evidence: `Tuyến mới hoàn toàn né đoạn ${closureEdge}` };
                }
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft,
          observations,
          triggers: [
            {
              atSeconds: 15,
              apply: (state: any) => {
                state.blockedEdgeIds.add(closureEdge);
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  if (ac.callsign === 'HVN401') {
                    return recalculateRoutePreservingProgress(ac, ac.targetNodeId, state.blockedEdgeIds, g);
                  }
                  return ac;
                });
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: '[FOD_REPORTED] W7A closed due to surface incident',
                    severity: 'critical',
                  });
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: '[FTG_REVOKED] Green guidance on W7A withdrawn',
                    severity: 'warning',
                  });
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: '[REROUTE_REQUESTED] HVN401 rerouting around W7A closure',
                    severity: 'info',
                  });
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: '[REROUTE_GRANTED] Valid V3 route assigned via W5/W9A',
                    severity: 'info',
                  });
                }
                return state;
              },
            },
          ],
        };
      },
    },

    // ── KỊCH BẢN 5 ─────────────────────────────────────────────────────────────
    lvc_peak_runway_direction_change: {
      id: 'lvc_peak_runway_direction_change',
      title: 'Kịch bản 5 — Đảo chiều cất/hạ cánh khẩn cấp giờ cao điểm với 8 tàu bay',
      teaser: 'Gió đổi hướng trong giờ cao điểm LVC — So sánh hai màn hình: Điều hành truyền thống vs Follow-the-Green (8 tàu bay).',
      situation: 'Trong giờ cao điểm LVC (RVR < 550m) với đúng 8 tàu bay đang hoạt động đồng thời (4 tàu bay departing, 2 tàu bay arriving, 2 tàu bay pushback). Bất ngờ hướng gió thay đổi đột ngột, KSVKL phát lệnh khẩn cấp đổi chiều cất hạ cánh từ đầu 25 sang đầu 07 (07R/07L). Toàn bộ hệ thống kích hoạt cơ chế Auto-Freeze dừng toàn bộ tàu bay an toàn, sau đó tái phân bổ lộ trình theo từng đợt tuần tự.',
      challenges: [
        'Quản lý đúng 8 tàu bay cùng lúc trong điều kiện tầm nhìn thấp (OUT01..04, INB01..02, PUSH01..02).',
        'Cơ chế Auto-Freeze dừng an toàn trước Stop Bar mà không gây ùn ứ hoặc va chạm.',
        'Phân đợt release tuần tự (phased release) và reroute qua Dijkstra về các đầu 07L/07R.'
      ],
      watchFor: [
        '8 tàu bay ban đầu hoạt động theo kế hoạch khai thác đầu 25.',
        'Tại giây thứ 25: lệnh RUNWAY_CHANGE_07 kích hoạt, toàn bộ đèn FtG tắt, 8 tàu bay dừng lại trước Stop Bar (status=holding).',
        'OUT01 và OUT02 được release đợt 1 quay đầu về hướng 07; OUT03, OUT04 giữ vị trí và release đợt 2.',
        'INB01, INB02 được reroute né xung đột; PUSH01, PUSH02 giữ tại bến cho đến khi hành lang thông thoáng.'
      ],
      setup: (g = graph) => {
        const aircraft = filterNonNull([
          // Departing (4)
          createScenarioAircraft({ id: 'S1', callsign: 'OUT01', from: 'STAND_1', to: 'STOP BAR 25L', role: 'departing', releaseAtSeconds: 0, aircraftType: 'A321', airlineCode: 'VN' }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'OUT02', from: 'STAND_2', to: 'STOP BAR 25L', role: 'departing', releaseAtSeconds: 0, aircraftType: 'A321', airlineCode: 'VJ' }, g),
          createScenarioAircraft({ id: 'S3', callsign: 'OUT03', from: 'STAND_3', to: 'STOP BAR 25L', role: 'departing', releaseAtSeconds: 5, aircraftType: 'A321', airlineCode: 'QH' }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'OUT04', from: 'STAND_4', to: 'STOP BAR 25L', role: 'departing', releaseAtSeconds: 5, aircraftType: 'A321', airlineCode: 'VU' }, g),
          // Arriving (2)
          createScenarioAircraft({ id: 'S5', callsign: 'INB01', from: 'STOP BAR 25R', to: 'STAND_10', role: 'arriving', releaseAtSeconds: 0, aircraftType: 'A350', airlineCode: 'SQ' }, g),
          createScenarioAircraft({ id: 'S6', callsign: 'INB02', from: 'STOP BAR 25R', to: 'STAND_11', role: 'arriving', releaseAtSeconds: 4, aircraftType: 'A350', airlineCode: 'TG' }, g),
          // Pushback (2)
          createScenarioAircraft({ id: 'S7', callsign: 'PUSH01', from: 'STAND_12', to: 'STOP BAR 25R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 10, aircraftType: 'A321', airlineCode: 'QH' }, g),
          createScenarioAircraft({ id: 'S8', callsign: 'PUSH02', from: 'STAND_13', to: 'STOP BAR 25R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 15, aircraftType: 'A350', airlineCode: 'TG' }, g),
        ]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_5_1',
            text: '[AUTO_FREEZE] Lệnh đổi đầu đường băng kích hoạt tại t=25s, toàn bộ 8 tàu bay nhận Stop Bar và dừng an toàn.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.elapsedSeconds >= 25) {
                return { pass: true, evidence: `Auto-freeze đã kích hoạt thành công cho 8 tàu bay lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_5_2',
            text: '[PHASED_REROUTE] Tái lập lộ trình qua Dijkstra chuyển đích sang các đầu 07L/07R mà không tạo xung đột mới.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              const outList = s.scenarioAircraft?.filter((a: any) => ['OUT01', 'OUT02'].includes(a.callsign));
              if (outList && outList.every((a: any) => a.targetNodeId.includes('07') || a.targetNodeId.includes('v3_line_03') || a.targetNodeId.includes('v3_line_16')) && s.elapsedSeconds >= 26) {
                return { pass: true, evidence: `OUT01 & OUT02 đã chuyển hướng về đầu 07: ${outList.map((a: any) => `${a.callsign}->${a.targetNodeId}`).join(', ')}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_5_3',
            text: '[FLOW_STABILIZATION] Đội bay 8 chiếc được giải phóng theo từng đợt (phased release), luồng giao thông mới ổn định hoàn toàn.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.elapsedSeconds >= 46) {
                return { pass: true, evidence: `Toàn bộ 8 tàu bay đã hoàn tất tái phân bổ và giải phóng theo pha` };
              }
              return { pass: false };
            },
          },
        ];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 25,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'OUT01') {
                  const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_16_p01', state.blockedEdgeIds, g);
                  return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
                }
                if (ac.callsign === 'OUT02') {
                  const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_17_p01', state.blockedEdgeIds, g);
                  return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
                }
                if (ac.callsign === 'INB01' || ac.callsign === 'INB02') {
                  return { ...ac, status: 'taxiing', speedKts: 15, holdReason: undefined, scenarioLabel: 'FTG DẪN ĐƯỜNG VỀ BẾN' };
                }
                return {
                  ...ac,
                  status: 'holding',
                  speedKts: 0,
                  holdReason: 'stop-bar',
                  scenarioLabel: 'AUTO-FREEZE (STOP BAR ĐỎ)',
                };
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[RUNWAY_DIRECTION_CHANGE] Runway operation changed from 25 to 07',
                  severity: 'critical',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[AUTO_FREEZE_ACTIVE] All active FtG guidance frozen for 8 aircraft',
                  severity: 'warning',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[EMERGENCY_STOP_BAR] Stop bars activated for affected aircraft',
                  severity: 'critical',
                });
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[PHASED_RELEASE] Aircraft released in safe sequence',
                  severity: 'info',
                });
              }
              return state;
            },
          },
          {
            atSeconds: 45,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.callsign === 'OUT03') {
                  const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_01_p00', state.blockedEdgeIds, g);
                  return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, scenarioLabel: 'FTG DẪN ĐƯỜNG 07L' };
                }
                if (ac.callsign === 'OUT04') {
                  const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_03_p01', state.blockedEdgeIds, g);
                  return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, scenarioLabel: 'FTG DẪN ĐƯỜNG 07L' };
                }
                if (ac.callsign === 'PUSH01') {
                  const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_17_p04', state.blockedEdgeIds, g);
                  return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
                }
                if (ac.callsign === 'PUSH02') {
                  const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_18_p03', state.blockedEdgeIds, g);
                  return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: '[PHASE_2_RELEASED] Remaining aircraft cleared to taxi to Runway 07',
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
  };
}
