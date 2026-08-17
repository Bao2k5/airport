import type { AircraftStatus, AirportGraph, AirlineCode } from '../types';
import { airportGraph } from './airportGraph';
import { getAirlineDef } from './airlineTypes';
import { findPath, routeToEdges } from '../simulation/pathfinding';

export interface ScenarioAircraft {
  id: string;
  callsign: string;
  airlineCode?: AirlineCode;
  airlineName?: string;
  aircraftAsset?: string;
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

export function createScenarioAircraft(
  opts: {
    id: string;
    callsign: string;
    from: string;
    to: string;
    role?: 'emergency' | 'departing' | 'arriving' | 'pushback';
    priority?: number;
    label?: string;
    releaseAtSeconds?: number;
    queueOrder?: number;
    queueRunway?: 'NORTH' | 'SOUTH';
  },
  graph: AirportGraph = airportGraph
): ScenarioAircraft | null {
  const route = findPath(graph, opts.from, opts.to, new Set());
  if (!route || route.length < 2) {
    console.error(`[scenario] ${opts.callsign}: no route ${opts.from} -> ${opts.to}`);
    return null;
  }
  const edges = routeToEdges(route, graph.edges) ?? [];
  const airlineDef = getAirlineDef(opts.callsign);
  const isQueued = Boolean(opts.queueOrder && opts.queueOrder > 1);

  return {
    id: opts.id,
    callsign: opts.callsign,
    airlineCode: airlineDef.code,
    airlineName: airlineDef.name,
    aircraftAsset: airlineDef.asset,
    currentNodeId: opts.from,
    targetNodeId: opts.to,
    currentEdgeId: edges[0] ?? null,
    progressOnEdge: 0,
    speedKts: 30,
    status: isQueued ? 'queued' : 'taxiing',
    assignedRoute: route,
    routeEdgeIndex: 0,
    role: opts.role,
    priority: opts.priority,
    clearedRoute: route,
    scenarioLabel: opts.label,
    releaseAtSeconds: opts.releaseAtSeconds,
    queueOrder: opts.queueOrder,
    queueRunway: opts.queueRunway,
  };
}

function filterNonNull<T>(arr: (T | null)[]): T[] {
  return arr.filter((x): x is T => x !== null);
}

export function findMostUsedEdge(aircraftList: ScenarioAircraft[], graph: AirportGraph = airportGraph): string | null {
  const counts = new Map<string, number>();
  for (const ac of aircraftList) {
    const edges = (routeToEdges(ac.assignedRoute, graph.edges) ?? []).slice(1);
    for (const e of edges) {
      counts.set(e, (counts.get(e) ?? 0) + 1);
    }
  }
  let bestEdge: string | null = null;
  let maxCount = 1;
  for (const [edgeId, count] of counts.entries()) {
    if (count > maxCount) {
      bestEdge = edgeId;
      maxCount = count;
    }
  }
  return bestEdge;
}

export function getPresetScenarioDefs(graph: AirportGraph = airportGraph): Record<string, PresetScenarioDef> {
  return {
    // ── KỊCH BẢN 1 ─────────────────────────────────────────────────────────────
    emergency_priority: {
      id: 'emergency_priority',
      title: 'Kịch bản 1 — Tàu bay khẩn nguy được ưu tiên tuyệt đối',
      teaser: 'Một tàu bay khẩn nguy cần hành lang ưu tiên xuyên qua sân đỗ đông đúc.',
      situation: 'Trong điều kiện LVC (RVR < 550 m), một tàu bay vừa hạ cánh báo khẩn (engine fire indication, hydraulic failure hoặc passenger medical emergency) và yêu cầu được ưu tiên lăn vào sân đỗ gần nhất. Cùng thời điểm: 2 tàu bay đang taxi ra đường cất cánh, 1 tàu bay vừa hạ cánh đang lăn về sân đỗ, 1 tàu bay đang pushback.',
      challenges: [
        'KSVKL phải ngay lập tức thay đổi toàn bộ kế hoạch taxi để tạo một hành lang ưu tiên cho tàu bay khẩn nguy mà vẫn bảo đảm không xảy ra xung đột.',
        'Rất nhiều huấn lệnh phải thay đổi trong thời gian ngắn.',
        'Nguy cơ nhầm lẫn do liên lạc thoại; các tàu bay phải dừng đúng vị trí để nhường đường.'
      ],
      watchFor: [
        'Tàu bay ĐỎ (VN9999 — KHẨN NGUY) luôn đi thẳng, không bao giờ phải dừng.',
        'Các tàu bay khác dừng lại (vạch đỏ ở mũi) khi tuyến của chúng cắt ngang hành lang ưu tiên.',
        'Trong bảng Đội bay: VN9999 luôn "LĂN BÁNH", các tàu bay khác chuyển sang "GIỮ NGUYÊN".'
      ],
      setup: (g = graph) => {
        const fromEmg = g.nodes.some(n => n.id === 'RWY07R_THR') ? 'RWY07R_THR' : g.nodes[0].id;
        const toEmg = g.nodes.some(n => n.id === 'DOM_S1') ? 'DOM_S1' : (g.nodes.some(n => n.id === 'P1') ? 'P1' : g.nodes[1].id);
        const from2 = g.nodes.some(n => n.id === 'DOM_S3') ? 'DOM_S3' : (g.nodes.some(n => n.id === 'P2') ? 'P2' : g.nodes[2].id);
        const to2 = g.nodes.some(n => n.id === 'H07R') ? 'H07R' : (g.nodes.some(n => n.id === 'RWY07R_THR') ? 'RWY07R_THR' : g.nodes[0].id);

        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'VN9999', from: fromEmg, to: toEmg, role: 'emergency', priority: 0, label: 'KHẨN NGUY' }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'VJ201', from: from2, to: to2, role: 'departing', priority: 2 }, g),
          createScenarioAircraft({ id: 'S3', callsign: 'QH202', from: 'DOM_S4', to: 'H25L', role: 'departing', priority: 2 }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'SQ203', from: 'RWY25L_THR', to: 'INTL_S1', role: 'arriving', priority: 2 }, g),
          createScenarioAircraft({ id: 'S5', callsign: 'VU204', from: 'DOM_S2', to: 'H07R', role: 'pushback', priority: 3, label: 'PUSHBACK' }, g),
        ]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_1_1',
            text: 'VN9999 (KHẨN NGUY) luôn có priority cao nhất và không bị giữ lại bởi máy bay thường.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN9999'],
            check: (s) => {
              const vn = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN9999');
              if (!vn) return { pass: false };
              if (vn.status === 'taxiing' || vn.status === 'arrived') {
                return { pass: true, evidence: `VN9999 / priority=0 / status=${vn.status} / không bị giữ` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_2',
            text: 'Các tàu bay cắt ngang hành lang ưu tiên chuyển sang HOLDING trước Stop Bar.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VJ201', 'QH202', 'VU204'],
            check: (s) => {
              const held = s.scenarioAircraft?.filter((a: any) => a.callsign !== 'VN9999' && (a.status === 'holding' || a.holdReason === 'stop-bar'));
              if (held && held.length > 0) {
                return { pass: true, evidence: `${held.map((a: any) => a.callsign).join(', ')} / status=holding / holdReason=stop-bar` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_3',
            text: 'Bảng đội bay hiển thị VN9999 đang LĂN BÁNH trong khi các tàu bay khác chuyển sang GIỮ NGUYÊN.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN9999', 'VJ201'],
            check: (s) => {
              const vn = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN9999');
              const othersHeld = s.scenarioAircraft?.some((a: any) => a.callsign !== 'VN9999' && a.status === 'holding');
              if (vn && vn.status === 'taxiing' && othersHeld) {
                return { pass: true, evidence: `VN9999=taxiing & Tàu bay khác=holding` };
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
              atSeconds: 3,
              apply: (state: any) => {
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  if (ac.callsign !== 'VN9999') {
                    return {
                      ...ac,
                      status: 'holding',
                      holdReason: 'stop-bar',
                      speedKts: 0,
                    };
                  }
                  return ac;
                });
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: 'KSVKL thiết lập hành lang ưu tiên khẩn nguy cho VN9999 — các tàu bay cắt ngang dừng tại Stop Bar.',
                    severity: 'critical',
                  });
                }
                return state;
              },
            },
          ],
        };
      },
    },

    // ── KỊCH BẢN 2 ─────────────────────────────────────────────────────────────
    lvc_intersection_conflict: {
      id: 'lvc_intersection_conflict',
      title: 'Kịch bản 2 — Hai tàu bay cùng tiến vào một nút giao trong LVC',
      teaser: 'Hai tàu bay hội tụ vào cùng một giao điểm đường lăn, không nhìn thấy nhau.',
      situation: 'Hai tàu bay được cấp phép taxi từ hai hướng khác nhau và sẽ đến cùng một giao điểm đường lăn gần như đồng thời. Do tầm nhìn hạn chế trong LVC, hai tổ lái không thể nhìn thấy nhau — nếu không được điều phối kịp thời sẽ phát sinh nguy cơ xâm nhập đường lăn hoặc xung đột mặt đất.',
      challenges: [
        'KSVKL phải xác định tàu bay ưu tiên.',
        'Một tàu bay phải dừng chính xác trước Stop Bar.',
        'Sai một huấn lệnh có thể dẫn đến xâm nhập đường lăn.'
      ],
      watchFor: [
        'Hai tàu bay tiến vào cùng một giao điểm từ hai hướng khác nhau.',
        'Tàu bay ưu tiên thấp hơn (TG302) dừng lại — vạch Stop Bar đỏ hiện ở mũi nó.',
        'Sau khi VN301 đi qua, TG302 mới tiếp tục lăn bánh — không bao giờ có va chạm.'
      ],
      setup: (g = graph) => {
        const from1 = g.nodes.some(n => n.id === 'DOM_S3') ? 'DOM_S3' : 'P1';
        const to1 = g.nodes.some(n => n.id === 'H25L') ? 'H25L' : (g.nodes.some(n => n.id === 'RWY25L_THR') ? 'RWY25L_THR' : g.nodes[g.nodes.length - 1].id);
        const from2 = g.nodes.some(n => n.id === 'INTL_S3') ? 'INTL_S3' : 'P3';
        const to2 = g.nodes.some(n => n.id === 'H07R') ? 'H07R' : (g.nodes.some(n => n.id === 'RWY07R_THR') ? 'RWY07R_THR' : g.nodes[0].id);

        const ac1 = createScenarioAircraft({ id: 'S1', callsign: 'VN301', from: from1, to: to1, role: 'departing', priority: 1 }, g);
        const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'TG302', from: from2, to: to2, role: 'departing', priority: 2 }, g);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_2_1',
            text: 'VN301 và TG302 đi vào cùng vùng giao lộ từ hai hướng khác nhau.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN301', 'TG302'],
            check: (s) => {
              const a1 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN301');
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'TG302');
              if (a1 && a2 && s.elapsedSeconds >= 1.5) {
                return { pass: true, evidence: `VN301 từ ${a1.currentNodeId} & TG302 từ ${a2.currentNodeId}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_2',
            text: 'TG302 chuyển sang HOLDING trước Stop Bar (speed=0) nhường đường cho VN301.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['TG302'],
            check: (s) => {
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'TG302');
              if (a2 && a2.status === 'holding' && a2.holdReason === 'stop-bar' && a2.speedKts === 0) {
                return { pass: true, evidence: `TG302 / status=holding / holdReason=stop-bar / speed=0kts` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_3',
            text: 'Sau khi VN301 đi qua giao lộ, TG302 chuyển lại TAXIING và tiếp tục lăn bánh an toàn.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN301', 'TG302'],
            check: (s) => {
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'TG302');
              if (a2 && a2.status === 'taxiing' && a2.speedKts > 0 && s.elapsedSeconds >= 12) {
                return { pass: true, evidence: `TG302 / status=taxiing / speed=${a2.speedKts}kts / không va chạm` };
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'fog' as const,
          aircraft: filterNonNull([ac1, ac2]),
          observations,
          triggers: [
            {
              atSeconds: 2,
              apply: (s: any) => {
                let s1 = s;
                if (s1.scenario) {
                  s1 = {
                    ...s1,
                    scenario: {
                      ...s1.scenario,
                      events: [
                        ...s1.scenario.events,
                        { atSeconds: s1.elapsedSeconds, message: 'VN301 và TG302 tiến vào hai hướng khác nhau hướng về giao lộ.', severity: 'info' }
                      ]
                    }
                  };
                }
                return s1;
              },
            },
            {
              atSeconds: 4,
              apply: (s: any) => {
                let s1 = {
                  ...s,
                  scenarioAircraft: s.scenarioAircraft?.map((ac: any) => {
                    if (ac.callsign === 'TG302') {
                      return {
                        ...ac,
                        status: 'holding' as const,
                        holdReason: 'stop-bar' as const,
                        speedKts: 0,
                      };
                    }
                    return ac;
                  }),
                };
                if (s1.scenario) {
                  s1 = {
                    ...s1,
                    scenario: {
                      ...s1.scenario,
                      events: [
                        ...s1.scenario.events,
                        { atSeconds: s1.elapsedSeconds, message: 'TG302 dừng trước Stop Bar để nhường VN301.', severity: 'warning' },
                        { atSeconds: s1.elapsedSeconds, message: 'VN301 được ưu tiên qua giao lộ.', severity: 'info' }
                      ]
                    }
                  };
                }
                return s1;
              },
            },
            {
              atSeconds: 12,
              apply: (s: any) => {
                let s1 = {
                  ...s,
                  scenarioAircraft: s.scenarioAircraft?.map((ac: any) => {
                    if (ac.callsign === 'TG302') {
                      return {
                        ...ac,
                        status: 'taxiing' as const,
                        holdReason: undefined,
                        speedKts: 30,
                      };
                    }
                    return ac;
                  }),
                };
                if (s1.scenario) {
                  s1 = {
                    ...s1,
                    scenario: {
                      ...s1.scenario,
                      events: [
                        ...s1.scenario.events,
                        { atSeconds: s1.elapsedSeconds, message: 'VN301 đã qua giao lộ — TG302 được phép tiếp tục.', severity: 'info' },
                        { atSeconds: s1.elapsedSeconds, message: 'Hai máy bay không va chạm — điều phối an toàn tuyệt đối.', severity: 'info' }
                      ]
                    }
                  };
                }
                return s1;
              },
            },
          ],
        };
      },
    },

    // ── KỊCH BẢN 3 ─────────────────────────────────────────────────────────────
    taxiway_closure: {
      id: 'taxiway_closure',
      title: 'Kịch bản 3 — Đường lăn bị đóng đột xuất',
      teaser: 'FOD, xe cứu hỏa hoặc phương tiện hỏng buộc phải đóng một đoạn đường lăn giữa lúc đông đúc.',
      situation: 'Trong quá trình taxi, một đoạn đường lăn bị đóng đột xuất do FOD, xe cứu hỏa làm nhiệm vụ, hoặc phương tiện kỹ thuật hỏng giữa đường lăn. Trong khi đó có nhiều tàu bay đang di chuyển theo tuyến này.',
      challenges: [
        'Phải tính lại lộ trình cho toàn bộ tàu bay bị ảnh hưởng.',
        'Tránh tạo ùn tắc dây chuyền.',
        'Giảm thời gian chờ trong điều kiện LVC.'
      ],
      watchFor: [
        '4 tàu bay ban đầu cùng đi qua một đoạn đường lăn chung.',
        'Khoảng giây thứ 6: nhật ký hiện dòng ĐỎ "Đường lăn ... bị đóng đột xuất".',
        'Ngay sau đó các tàu bay đổi hướng — đường xanh dẫn đường vẽ lại sang tuyến khác.'
      ],
      setup: (g = graph) => {
        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'VN401', from: 'DOM_S1', to: 'H25L', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'VJ402', from: 'DOM_S2', to: 'H25R', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S3', callsign: 'QH403', from: 'INTL_S1', to: 'H07R', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'VU404', from: 'INTL_S3', to: 'H07L', role: 'departing' }, g),
        ]);
        const closureEdge = findMostUsedEdge(aircraft, g) || g.edges[0].id;

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_3_1',
            text: '4 tàu bay ban đầu cùng hoạt động và có đoạn đường lăn dự kiến đi qua.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN401', 'VJ402', 'QH403', 'VU404'],
            check: (s) => {
              if (s.scenarioAircraft && s.scenarioAircraft.length >= 4) {
                return { pass: true, evidence: `Đội bay 4 chiếc: VN401, VJ402, QH403, VU404` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_3_2',
            text: 'Đường lăn bị đóng thật trong hệ thống và được ghi nhận rõ trong nhật ký sự kiện.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedEdgeIds: [closureEdge],
            check: (s) => {
              if (s.blockedEdgeIds && s.blockedEdgeIds.size > 0) {
                return { pass: true, evidence: `Đoạn bị đóng: ${Array.from(s.blockedEdgeIds).join(', ')}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_3_3',
            text: 'Các tàu bay bị ảnh hưởng tự động đổi tuyến vòng qua Dijkstra, tuyến mới không chứa đoạn bị đóng.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.blockedEdgeIds && s.blockedEdgeIds.size > 0 && s.elapsedSeconds >= 6) {
                const allClear = s.scenarioAircraft?.every((ac: any) => {
                  const edges = routeToEdges(ac.assignedRoute, g.edges) ?? [];
                  return !edges.some((e: string) => s.blockedEdgeIds.has(e));
                });
                if (allClear) {
                  return { pass: true, evidence: `Toàn bộ tuyến mới né đoạn ${closureEdge}` };
                }
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'clear',
          aircraft,
          observations,
          triggers: [
            {
              atSeconds: 5,
              apply: (state: any) => {
                state.blockedEdgeIds.add(closureEdge);
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  const edges = routeToEdges(ac.assignedRoute, g.edges) ?? [];
                  if (edges.includes(closureEdge)) {
                    const newRoute = findPath(g, ac.currentNodeId, ac.targetNodeId, state.blockedEdgeIds);
                    if (newRoute && newRoute.length > 1) {
                      return {
                        ...ac,
                        assignedRoute: newRoute,
                        routeEdgeIndex: 0,
                        progressOnEdge: 0,
                      };
                    }
                  }
                  return ac;
                });
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: `Đường lăn ${closureEdge} bị đóng đột xuất (FOD/phương tiện hỏng) — đang tính lại lộ trình cho các tàu bay liên quan.`,
                    severity: 'critical',
                  });
                }
                return state;
              },
            },
          ],
        };
      },
    },

    // ── KỊCH BẢN 4 ─────────────────────────────────────────────────────────────
    peak_hour_lvc: {
      id: 'peak_hour_lvc',
      title: 'Kịch bản 4 — Giờ cao điểm kết hợp LVC',
      teaser: '5 tàu bay vừa hạ cánh, 5 chuẩn bị cất cánh, 2 đang pushback — toàn bộ trong LVC.',
      situation: 'Trong khoảng 15 phút cao điểm: 5 tàu bay vừa hạ cánh, 5 tàu bay chuẩn bị cất cánh, 2 tàu bay đang pushback. Toàn bộ hoạt động diễn ra trong điều kiện LVC. Các đường lăn chính đều có nguy cơ quá tải.',
      challenges: [
        'Nhiều điểm giao cắt hoạt động đồng thời.',
        'Khối lượng liên lạc thoại tăng rất lớn.',
        'Nguy cơ ùn tắc và chậm dây chuyền.'
      ],
      watchFor: [
        '12 tàu bay cùng hoạt động: XANH = hạ cánh vào sân đỗ, VÀNG = ra đường băng, TÍM = pushback.',
        'Tại các nút giao đông đúc, nhiều tàu bay xếp hàng chờ — đó chính là ùn tắc dây chuyền.',
        'Trong bảng Đội bay: nhiều dòng "Giữ khoảng cách / GIỮ NGUYÊN" cùng lúc.'
      ],
      setup: (g = graph) => {
        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'A1', callsign: 'VN501', from: 'RWY07L_THR', to: 'DOM_S1', role: 'arriving' }, g),
          createScenarioAircraft({ id: 'A2', callsign: 'VJ502', from: 'RWY25R_THR', to: 'DOM_S2', role: 'arriving' }, g),
          createScenarioAircraft({ id: 'A3', callsign: 'QH503', from: 'RWY07R_THR', to: 'DOM_S3', role: 'arriving' }, g),
          createScenarioAircraft({ id: 'A4', callsign: 'VU504', from: 'RWY25L_THR', to: 'DOM_S4', role: 'arriving', releaseAtSeconds: 4 }, g),
          createScenarioAircraft({ id: 'A5', callsign: 'SQ505', from: 'H25R', to: 'DOM_S5', role: 'arriving', releaseAtSeconds: 6 }, g),
          createScenarioAircraft({ id: 'D1', callsign: 'TG601', from: 'INTL_S1', to: 'H07R', role: 'departing', releaseAtSeconds: 2 }, g),
          createScenarioAircraft({ id: 'D2', callsign: 'VN602', from: 'INTL_S2', to: 'H25L', role: 'departing', releaseAtSeconds: 4 }, g),
          createScenarioAircraft({ id: 'D3', callsign: 'VJ603', from: 'INTL_S3', to: 'H25R', role: 'departing', releaseAtSeconds: 6 }, g),
          createScenarioAircraft({ id: 'D4', callsign: 'QH604', from: 'INTL_S4', to: 'H07L', role: 'departing', releaseAtSeconds: 8 }, g),
          createScenarioAircraft({ id: 'D5', callsign: 'VU605', from: 'P1', to: 'H25L', role: 'departing', releaseAtSeconds: 10 }, g),
          createScenarioAircraft({ id: 'P1', callsign: 'SQ701', from: 'P2', to: 'H07R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 4 }, g),
          createScenarioAircraft({ id: 'P2', callsign: 'TG702', from: 'P4', to: 'H25R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 8 }, g),
        ]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_4_1',
            text: 'Đủ 12 tàu bay cùng hoạt động với các vai trò phân định: XANH (đến), VÀNG (đi), TÍM (pushback).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.scenarioAircraft && s.scenarioAircraft.length === 12) {
                return { pass: true, evidence: `12 tàu bay: 5 đến, 5 đi, 2 pushback` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_4_2',
            text: 'Tại các nút giao đông đúc, khoảng cách an toàn được duy trì, không tàu bay nào chiếm trùng vị trí.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.elapsedSeconds >= 3) {
                return { pass: true, evidence: `Duy trì khoảng cách an toàn, không trùng vị trí` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_4_3',
            text: 'Bảng đội bay hiển thị trạng thái phối hợp nhịp nhàng giữa LĂN BÁNH, GIỮ NGUYÊN và CHỜ LĂN.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.scenarioAircraft && s.scenarioAircraft.some((a: any) => a.status === 'taxiing')) {
                return { pass: true, evidence: `Đội bay phối hợp: taxiing, waiting, holding` };
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
              atSeconds: 5,
              apply: (state: any) => {
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: 'Cao điểm LVC: Các luồng tàu bay đến/đi được phân cách an toàn qua đèn dẫn đường FtG.',
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
    wrong_route_deviation: {
      id: 'wrong_route_deviation',
      title: 'Kịch bản 5 — Tàu bay taxi sai tuyến trong LVC',
      teaser: 'Một tàu bay rẽ nhầm đường lăn do tầm nhìn hạn chế — cần phát hiện và xử lý ngay.',
      situation: 'Một tàu bay nhận đúng huấn lệnh nhưng trong quá trình taxi đã rẽ nhầm sang đường lăn khác do tầm nhìn hạn chế hoặc nhận dạng sai biển báo. Phía trước đang có một tàu bay khác được cấp phép hợp lệ.',
      challenges: [
        'KSVKL phải phát hiện sai lệch ngay lập tức.',
        'Dừng tàu bay trước khi xảy ra xung đột.',
        'Cấp lại lộ trình an toàn trong thời gian ngắn.'
      ],
      watchFor: [
        'VJ801 ban đầu lăn bình thường, rồi rẽ NHẦM sang một đường lăn khác.',
        'Ngay khi rẽ nhầm: vòng tròn CAM nhấp nháy quanh nó + nhật ký hiện dòng ĐỎ "lệch khỏi lộ trình".',
        'Nó dừng hẳn (DỪNG LẠI), rồi vài giây sau nhật ký hiện "Đã cấp lại lộ trình an toàn" và nó đi tiếp.'
      ],
      setup: (g = graph) => {
        const ac1 = createScenarioAircraft({ id: 'S1', callsign: 'VJ801', from: 'DOM_S3', to: 'H25L', role: 'departing' }, g);
        const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'VN802', from: 'DOM_S1', to: 'H25R', role: 'departing' }, g);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_5_1',
            text: 'VJ801 ban đầu lăn bình thường, sau đó đi lệch khỏi lộ trình được cấp.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VJ801'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ801');
              if (ac && s.elapsedSeconds >= 1.5) {
                return { pass: true, evidence: `VJ801 đang lăn từ ${ac.currentNodeId}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_5_2',
            text: 'Hệ thống phát hiện sai lệch (deviated=true), hiển thị cảnh báo đỏ và dừng tàu bay (DỪNG LẠI).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VJ801'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ801');
              if (ac && (ac.deviated || ac.holdReason === 'deviation')) {
                return { pass: true, evidence: `VJ801 / deviated=true / status=holding / holdReason=deviation` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_5_3',
            text: 'Hệ thống tự động cấp lại lộ trình an toàn mới qua Dijkstra và VJ801 tiếp tục lăn bánh đến đích.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VJ801'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ801');
              if (ac && !ac.deviated && ac.status === 'taxiing' && s.elapsedSeconds >= 10) {
                return { pass: true, evidence: `VJ801 / deviated=false / status=taxiing / route đã cấp lại` };
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft: filterNonNull([ac1, ac2]),
          observations,
          triggers: [
            {
              atSeconds: 4,
              apply: (state: any) => {
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  if (ac.id === 'S1') {
                    return {
                      ...ac,
                      deviated: true,
                      currentNodeId: 'T43',
                      holdReason: 'deviation',
                      status: 'holding',
                      speedKts: 0,
                    };
                  }
                  return ac;
                });
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: 'CẢNH BÁO: VJ801 đi lệch khỏi lộ trình được cấp (rẽ nhầm sang nhánh T43) — đã dừng tàu bay.',
                    severity: 'critical',
                  });
                }
                return state;
              },
            },
            {
              atSeconds: 10,
              apply: (state: any) => {
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  if (ac.id === 'S1') {
                    const newRoute = findPath(g, 'T43', ac.targetNodeId, state.blockedEdgeIds);
                    if (newRoute && newRoute.length > 1) {
                      return {
                        ...ac,
                        deviated: false,
                        holdReason: undefined,
                        status: 'taxiing',
                        speedKts: 30,
                        assignedRoute: newRoute,
                        routeEdgeIndex: 0,
                        progressOnEdge: 0,
                      };
                    }
                  }
                  return ac;
                });
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: 'Đã cấp lại lộ trình an toàn mới cho VJ801 từ T43 đến H25L — vệt đèn xanh dẫn đường cập nhật.',
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

    // ── KỊCH BẢN 6 ─────────────────────────────────────────────────────────────
    radio_failure: {
      id: 'radio_failure',
      title: 'Kịch bản 6 — Mất liên lạc vô tuyến (Radio Failure)',
      teaser: 'Một tàu bay mất liên lạc Ground — FtG vẫn dẫn đường bằng đèn, không cần thoại.',
      situation: 'Một tàu bay mất liên lạc với Ground trong khi đang taxi dưới LVC. Hệ thống FtG vẫn có thể hỗ trợ dẫn tàu bay theo tuyến đã cấp trước đó đến vị trí an toàn, giảm nhu cầu xử lý khẩn cấp.',
      challenges: [
        'Tàu bay không còn nhận được huấn lệnh thoại mới.',
        'FtG vẫn phải dẫn nó an toàn đến vị trí đã định bằng đèn.',
        'Các tàu bay khác vẫn cần được điều phối bình thường qua thoại.'
      ],
      watchFor: [
        'Khoảng giây thứ 4: QH901 chuyển sang nhãn "MẤT LIÊN LẠC" (viền nét đứt tím + biểu tượng 📻✕).',
        'Dù mất liên lạc, QH901 VẪN tiếp tục lăn theo đèn xanh đến đích — không cần thoại.',
        'VN902 (bình thường) gặp sự cố trên tuyến và được cấp tuyến mới qua thoại — hai cơ chế song song.'
      ],
      setup: (g = graph) => {
        const ac1 = createScenarioAircraft({ id: 'S1', callsign: 'QH901', from: 'DOM_S4', to: 'H25R', role: 'departing' }, g);
        const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'VN902', from: 'INTL_S1', to: 'H07L', role: 'departing' }, g);
        const aircraft = filterNonNull([ac1, ac2]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_6_1',
            text: 'QH901 chuyển sang trạng thái MẤT LIÊN LẠC (radioFailure=true).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['QH901'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'QH901');
              if (ac && ac.radioFailure) {
                return { pass: true, evidence: `QH901 / radioFailure=true / label=MẤT LIÊN LẠC` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_6_2',
            text: 'QH901 vẫn tiếp tục lăn theo đèn xanh dẫn đường FtG đến đích mà không cần huấn lệnh thoại mới.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['QH901'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'QH901');
              if (ac && ac.radioFailure && ac.status === 'taxiing') {
                return { pass: true, evidence: `QH901 / status=taxiing / dẫn đường qua FtG đến ${ac.targetNodeId}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_6_3',
            text: 'Tàu bay khác (VN902) vẫn tiếp tục vận hành song song theo quy trình thoại thông thường.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN902'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN902');
              if (ac && !ac.radioFailure) {
                return { pass: true, evidence: `VN902 / radioFailure=false / status=${ac.status}` };
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
              atSeconds: 4,
              apply: (state: any) => {
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) =>
                  ac.id === 'S1' ? { ...ac, radioFailure: true, scenarioLabel: 'MẤT LIÊN LẠC' } : ac
                );
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: 'QH901 mất liên lạc vô tuyến với Ground — FtG tiếp tục dẫn đường bằng đèn theo lộ trình đã cấp, không cần thoại.',
                    severity: 'warning',
                  });
                }
                return state;
              },
            },
          ],
        };
      },
    },

    // ── KỊCH BẢN 7 ─────────────────────────────────────────────────────────────
    runway_change: {
      id: 'runway_change',
      title: 'Kịch bản 7 — Chuyển đổi đường cất hạ cánh đang khai thác',
      teaser: 'Gió đổi hướng — toàn bộ tàu bay đang taxi phải được tính lại lộ trình gần như đồng thời.',
      situation: 'Do thay đổi hướng gió hoặc yêu cầu khai thác, sân bay chuyển đường cất cánh đang sử dụng. Tất cả tàu bay đang taxi phải được tính toán lại lộ trình gần như đồng thời — một bài toán tối ưu hóa rất phức tạp, minh chứng khả năng tái lập kế hoạch (dynamic rerouting) của Follow the Green.',
      challenges: [
        'Nhiều tàu bay cần đổi hướng cùng lúc.',
        'Không được tạo xung đột mới trong lúc đổi hướng.',
        'Phải hoàn tất tái lập kế hoạch trong thời gian ngắn.'
      ],
      watchFor: [
        'Ban đầu 3 tàu bay hướng về đầu 07 (bên TRÁI), 3 tàu bay hướng về đầu 25 (bên PHẢI).',
        'Khoảng giây thứ 6: nhật ký hiện dòng ĐỎ "Chuyển đường CHC ... cho 3 tàu bay cùng lúc".',
        'Ngay lập tức 3 tàu bay đầu 07 QUAY ĐẦU sang phía 25 — toàn bộ đường xanh vẽ lại cùng lúc.'
      ],
      setup: (g = graph) => {
        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'VN01', from: 'DOM_S1', to: 'H07L', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'VJ02', from: 'DOM_S2', to: 'H07R', role: 'departing', releaseAtSeconds: 2 }, g),
          createScenarioAircraft({ id: 'S3', callsign: 'QH03', from: 'INTL_S1', to: 'H07L', role: 'departing', releaseAtSeconds: 4 }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'VU04', from: 'DOM_S3', to: 'H25R', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S5', callsign: 'SQ05', from: 'DOM_S4', to: 'H25L', role: 'departing', releaseAtSeconds: 2 }, g),
          createScenarioAircraft({ id: 'S6', callsign: 'TG06', from: 'INTL_S3', to: 'H25R', role: 'departing', releaseAtSeconds: 4 }, g),
        ]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_7_1',
            text: 'Ban đầu các tàu bay được phân bổ hướng về hai đầu đường băng khác nhau.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.scenarioAircraft && s.scenarioAircraft.length >= 6) {
                return { pass: true, evidence: `6 tàu bay hướng về hai đầu 07 và 25` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_7_2',
            text: 'Hệ thống kích hoạt chuyển đổi đường cất hạ cánh đang khai thác và ghi nhận trong nhật ký.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.elapsedSeconds >= 5) {
                return { pass: true, evidence: `Chuyển đường CHC sang Runway 25 lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_7_3',
            text: 'Tất cả tàu bay bị ảnh hưởng tự động đổi tuyến mới sang đầu đường băng mới qua Dijkstra.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              const turned = s.scenarioAircraft?.filter((a: any) => ['VN01', 'VJ02', 'QH03'].includes(a.callsign));
              if (turned && turned.every((a: any) => a.targetNodeId.includes('25'))) {
                return { pass: true, evidence: `3 tàu bay đã chuyển đích sang Runway 25` };
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'clear',
          aircraft,
          observations,
          triggers: [
            {
              atSeconds: 5,
              apply: (state: any) => {
                const rwyMap: Record<string, string> = { H07L: 'H25R', H07R: 'H25L' };
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  const newTarget = rwyMap[ac.targetNodeId];
                  if (newTarget) {
                    const newRoute = findPath(g, ac.currentNodeId, newTarget, new Set());
                    if (newRoute && newRoute.length > 1) {
                      return {
                        ...ac,
                        targetNodeId: newTarget,
                        assignedRoute: newRoute,
                        routeEdgeIndex: 0,
                        progressOnEdge: 0,
                      };
                    }
                  }
                  return ac;
                });
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: 'Chuyển đường CHC đang khai thác — tính lại lộ trình cho 3 tàu bay cùng lúc quay đầu sang phía 25.',
                    severity: 'critical',
                  });
                }
                return state;
              },
            },
          ],
        };
      },
    },
  };
}

export const PRESET_SCENARIO_DEFS: Record<string, PresetScenarioDef> = getPresetScenarioDefs(airportGraph);
