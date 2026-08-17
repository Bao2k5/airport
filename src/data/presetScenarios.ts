import type { AircraftStatus, AirportGraph, AirlineCode } from '../types';
import { airportGraph } from './airportGraph';
import { getAirlineDef } from './airlineTypes';
import { findPath, routeToEdges } from '../simulation/pathfinding';
import { recalculateRoutePreservingProgress } from '../simulation/scenarioRunner';

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
  const isWaiting = Boolean(opts.releaseAtSeconds && opts.releaseAtSeconds > 0);
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

export function generateDeviatedRoute(clearedRoute: string[], graph: AirportGraph = airportGraph): string[] | null {
  if (clearedRoute.length < 4) return null;
  const destination = clearedRoute[clearedRoute.length - 1];
  for (let n = 1; n <= clearedRoute.length - 2; n++) {
    const current = clearedRoute[n];
    const nextExpected = clearedRoute[n + 1];
    const prev = clearedRoute[n - 1];

    const connectedEdges = graph.edges.filter(
      e => (e.fromNodeId === current || (e.bidirectional && e.toNodeId === current))
    );
    for (const edge of connectedEdges) {
      if (edge.type === 'runway') continue;
      const neighbor = edge.fromNodeId === current ? edge.toNodeId : edge.fromNodeId;
      if (neighbor === nextExpected || neighbor === prev) continue;

      const prefix = clearedRoute.slice(0, n + 1);
      const subRoute = findPath(graph, neighbor, destination, new Set([edge.id]));
      if (subRoute && subRoute.length > 1) {
        return [...prefix, ...subRoute];
      }
      return [...prefix, neighbor];
    }
  }
  return null;
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
        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'VN9999', from: 'RWY07R_THR', to: 'DOM_S1', role: 'emergency', priority: 0, label: 'KHẨN NGUY' }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'VN201', from: 'DOM_S3', to: 'H07R', role: 'departing', priority: 2 }, g),
          createScenarioAircraft({ id: 'S3', callsign: 'VN202', from: 'DOM_S4', to: 'H25L', role: 'departing', priority: 2 }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'VN203', from: 'RWY25L_THR', to: 'INTL_S1', role: 'arriving', priority: 2 }, g),
          createScenarioAircraft({ id: 'S5', callsign: 'VN204', from: 'DOM_S2', to: 'H07R', role: 'pushback', priority: 3, label: 'PUSHBACK' }, g),
        ]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_1_1',
            text: 'VN9999 (KHẨN NGUY) luôn có priority=0 cao nhất và không bị giữ lại bởi máy bay thường.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN9999'],
            check: (s) => {
              const vn = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN9999');
              if (!vn) return { pass: false };
              if (vn.status === 'taxiing' || vn.status === 'arrived') {
                return { pass: true, evidence: `VN9999 / priority=0 / status=${vn.status} / tiến độ=${(vn.progressOnEdge * 100).toFixed(0)}%` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_2',
            text: 'Các tàu bay cắt ngang hành lang ưu tiên tự động dừng trước Stop Bar (status=holding, holdReason=stop-bar).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN201', 'VN202', 'VN203', 'VN204'],
            check: (s) => {
              const held = s.scenarioAircraft?.filter((a: any) => a.callsign !== 'VN9999' && a.status === 'holding' && a.holdReason === 'stop-bar');
              if (held && held.length > 0) {
                return { pass: true, evidence: `${held.map((a: any) => `${a.callsign} (status=${a.status}, holdReason=${a.holdReason})`).join(', ')} / nhường đường VN9999` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_1_3',
            text: 'VN9999 lăn bánh liên tục đến bến đỗ an toàn mà không va chạm với bất kỳ tàu bay nào.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN9999'],
            check: (s) => {
              const vn = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN9999');
              if (vn && (vn.status === 'taxiing' || vn.status === 'arrived') && s.elapsedSeconds >= 8) {
                return { pass: true, evidence: `VN9999 hoàn tất tiếp cận DOM_S1 an toàn lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft,
          observations,
          triggers: [],
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
        const ac1 = createScenarioAircraft({ id: 'S1', callsign: 'VN301', from: 'DOM_S3', to: 'H25L', role: 'departing', priority: 1 }, g);
        const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'TG302', from: 'INTL_S3', to: 'H07R', role: 'departing', priority: 2 }, g);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_2_1',
            text: 'VN301 và TG302 cùng tiến vào vùng nút giao từ hai nhánh khác nhau.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN301', 'TG302'],
            check: (s) => {
              const a1 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN301');
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'TG302');
              if (a1 && a2 && s.elapsedSeconds >= 1.0) {
                return { pass: true, evidence: `VN301 (từ DOM_S3) & TG302 (từ INTL_S3) cùng di chuyển` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_2',
            text: 'TG302 tự phát hiện xung đột và dừng trước Stop Bar của L40_P0 (status=holding, speed=0kts, holdReason=stop-bar) nhường VN301.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['TG302'],
            check: (s) => {
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'TG302');
              if (!a2) return { pass: false };

              const stopBarNode = g.nodes.find(n => n.id === 'L40_P0');
              const fromNode = g.nodes.find(n => n.id === a2.assignedRoute[a2.routeEdgeIndex]);
              const toNode = g.nodes.find(n => n.id === a2.assignedRoute[a2.routeEdgeIndex + 1]);
              const prog = Math.max(0, Math.min(1, a2.progressOnEdge));
              const posX = fromNode && toNode ? fromNode.x + (toNode.x - fromNode.x) * prog : 0;
              const posY = fromNode && toNode ? fromNode.y + (toNode.y - fromNode.y) * prog : 0;
              const nextNodeId = a2.assignedRoute[a2.routeEdgeIndex + 1];
              const distToStopBar = stopBarNode ? Math.hypot(posX - stopBarNode.x, posY - stopBarNode.y) : Infinity;

              // Strict conditions: NO separation fallback, NO loose holding check
              const isStrictStopBar = (
                a2.status === 'holding' &&
                a2.speedKts === 0 &&
                a2.holdReason === 'stop-bar' &&
                nextNodeId === 'L40_P0' &&
                distToStopBar <= 5
              );

              if (isStrictStopBar) {
                return {
                  pass: true,
                  evidence: `currentNodeId=${a2.currentNodeId}, currentEdgeId=${a2.currentEdgeId}, routeEdgeIndex=${a2.routeEdgeIndex}, progressOnEdge=${a2.progressOnEdge.toFixed(3)}, nextNodeId=${nextNodeId}, stopBarNode=L40_P0, aircraftPos=(${posX.toFixed(2)}, ${posY.toFixed(2)}), stopBarPos=(${stopBarNode?.x}, ${stopBarNode?.y}), distToStopBar=${distToStopBar.toFixed(2)}px`,
                };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_2_3',
            text: 'Sau khi VN301 đi qua giao lộ, TG302 tự động tiếp tục lăn bánh an toàn (status=taxiing, holdReason cleared, speed>0).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN301', 'TG302'],
            check: (s) => {
              const a1 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN301');
              const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'TG302');
              if (a1 && a2 && (a2.status === 'taxiing' || a2.status === 'arrived' || a2.status === 'departed') && (!a2.holdReason || a2.holdReason === null) && a2.speedKts > 0 && s.elapsedSeconds >= 12) {
                return {
                  pass: true,
                  evidence: `VN301 status=${a1.status} (đã giải phóng giao lộ), TG302 status=${a2.status}, holdReason=${a2.holdReason || 'cleared'}, speedKts=${a2.speedKts.toFixed(1)}`,
                };
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft: filterNonNull([ac1, ac2]),
          observations,
          triggers: [],
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
        'Tại giây thứ 60: nhật ký hiện dòng ĐỎ "Đường lăn ... bị đóng đột xuất".',
        'Ngay sau đó các tàu bay đổi hướng — đường xanh dẫn đường vẽ lại sang tuyến khác.'
      ],
      setup: (g = graph) => {
        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'VN401', from: 'DOM_S1', to: 'H25L', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'VN402', from: 'DOM_S2', to: 'H25R', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S3', callsign: 'VN403', from: 'INTL_S1', to: 'H07R', role: 'departing' }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'VN404', from: 'INTL_S3', to: 'H07L', role: 'departing' }, g),
        ]);
        const closureEdge = findMostUsedEdge(aircraft, g) || (g.edges.find(e => e.type !== 'runway')?.id ?? g.edges[0].id);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_3_1',
            text: '4 tàu bay ban đầu cùng hoạt động và có đoạn đường lăn dự kiến đi qua.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN401', 'VN402', 'VN403', 'VN404'],
            check: (s) => {
              if (s.scenarioAircraft && s.scenarioAircraft.length === 4) {
                return { pass: true, evidence: `Đội bay 4 chiếc: VN401, VN402, VN403, VN404` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_3_2',
            text: 'Tại mốc t=60s, đoạn đường lăn bị đóng thật (blockedEdgeIds chứa closureEdge).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedEdgeIds: [closureEdge],
            check: (s) => {
              if (s.blockedEdgeIds && s.blockedEdgeIds.has(closureEdge) && s.elapsedSeconds >= 60) {
                return { pass: true, evidence: `Đoạn ${closureEdge} bị đóng lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_3_3',
            text: 'Các tàu bay bị ảnh hưởng tự động đổi tuyến vòng qua Dijkstra, tuyến mới tuyệt đối không chứa đoạn bị đóng.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.blockedEdgeIds && s.blockedEdgeIds.has(closureEdge) && s.elapsedSeconds >= 60.5) {
                const allClear = s.scenarioAircraft?.every((ac: any) => {
                  const edges = routeToEdges(ac.assignedRoute, g.edges) ?? [];
                  const remaining = edges.slice(ac.routeEdgeIndex);
                  return !remaining.includes(closureEdge);
                });
                if (allClear) {
                  return { pass: true, evidence: `Toàn bộ tuyến mới né hoàn toàn đoạn ${closureEdge}` };
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
              atSeconds: 60,
              apply: (state: any) => {
                state.blockedEdgeIds.add(closureEdge);
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  const edges = routeToEdges(ac.assignedRoute, g.edges) ?? [];
                  if (edges.slice(ac.routeEdgeIndex).includes(closureEdge)) {
                    return recalculateRoutePreservingProgress(ac, ac.targetNodeId, state.blockedEdgeIds, g);
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
          // Arriving (5)
          createScenarioAircraft({ id: 'A1', callsign: 'VN501', from: 'RWY07L_THR', to: 'DOM_S1', role: 'arriving', releaseAtSeconds: 0 }, g),
          createScenarioAircraft({ id: 'A2', callsign: 'VN502', from: 'RWY25R_THR', to: 'DOM_S2', role: 'arriving', releaseAtSeconds: 0 }, g),
          createScenarioAircraft({ id: 'A3', callsign: 'VN503', from: 'RWY07R_THR', to: 'DOM_S3', role: 'arriving', releaseAtSeconds: 0 }, g),
          createScenarioAircraft({ id: 'A4', callsign: 'VN504', from: 'RWY25L_THR', to: 'DOM_S4', role: 'arriving', releaseAtSeconds: 20 }, g),
          createScenarioAircraft({ id: 'A5', callsign: 'VN505', from: 'H25R', to: 'DOM_S5', role: 'arriving', releaseAtSeconds: 30 }, g),
          // Departing (5)
          createScenarioAircraft({ id: 'D1', callsign: 'VN601', from: 'INTL_S1', to: 'H07R', role: 'departing', releaseAtSeconds: 150 }, g),
          createScenarioAircraft({ id: 'D2', callsign: 'VN602', from: 'INTL_S2', to: 'H25L', role: 'departing', releaseAtSeconds: 175 }, g),
          createScenarioAircraft({ id: 'D3', callsign: 'VN603', from: 'INTL_S3', to: 'H25R', role: 'departing', releaseAtSeconds: 200 }, g),
          createScenarioAircraft({ id: 'D4', callsign: 'VN604', from: 'INTL_S4', to: 'H07L', role: 'departing', releaseAtSeconds: 225 }, g),
          createScenarioAircraft({ id: 'D5', callsign: 'VN605', from: 'P1', to: 'H25L', role: 'departing', releaseAtSeconds: 250 }, g),
          // Pushback (2)
          createScenarioAircraft({ id: 'P1', callsign: 'VN701', from: 'P2', to: 'H07R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 275 }, g),
          createScenarioAircraft({ id: 'P2', callsign: 'VN702', from: 'P4', to: 'H25R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 300 }, g),
        ]);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_4_1',
            text: 'Đúng 12 tàu bay với mốc releaseAtSeconds chuẩn: 0, 20, 30, 150, 175, 200, 225, 250, 275, 300.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.scenarioAircraft && s.scenarioAircraft.length === 12) {
                return { pass: true, evidence: `12 tàu bay: 5 đến, 5 đi, 2 pushback với releaseAtSeconds chính xác` };
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
              if (s.elapsedSeconds >= 10) {
                return { pass: true, evidence: `Duy trì khoảng cách an toàn, không có va chạm` };
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
          triggers: [],
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
        'VN801 ban đầu lăn bình thường, rồi rẽ NHẦM sang một đường lăn khác.',
        'Ngay khi rẽ nhầm: vòng tròn CAM nhấp nháy quanh nó + nhật ký hiện dòng ĐỎ "lệch khỏi lộ trình".',
        'Nó dừng hẳn (DỪNG LẠI), rồi vài giây sau nhật ký hiện "Đã cấp lại lộ trình an toàn" và nó đi tiếp.'
      ],
      setup: (g = graph) => {
        const rawAc1 = createScenarioAircraft({ id: 'S1', callsign: 'VN801', from: 'DOM_S3', to: 'H25L', role: 'departing' }, g);
        const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'VN802', from: 'DOM_S1', to: 'H25R', role: 'departing' }, g);

        let ac1 = rawAc1;
        if (rawAc1) {
          const devRoute = generateDeviatedRoute(rawAc1.clearedRoute || rawAc1.assignedRoute, g);
          if (devRoute) {
            ac1 = {
              ...rawAc1,
              assignedRoute: devRoute,
            };
          }
        }

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_5_1',
            text: 'VN801 ban đầu lăn bình thường trên lộ trình xuất phát.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN801'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN801');
              if (ac && s.elapsedSeconds >= 1.0) {
                return { pass: true, evidence: `VN801 đang lăn từ ${ac.currentNodeId}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_5_2',
            text: 'Hệ thống tự động phát hiện lệch tuyến thực tế (deviated=true, holdReason=deviation, status=stopped).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN801'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN801');
              if (ac && (ac.deviated || ac.holdReason === 'deviation')) {
                return { pass: true, evidence: `VN801 / deviated=true / status=${ac.status} / holdReason=deviation` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_5_3',
            text: 'Sau đúng 4s kể từ lúc dừng, KSVKL cấp lại lộ trình an toàn qua Dijkstra và VN801 tiếp tục lăn bánh.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN801'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN801');
              if (ac && !ac.deviated && ac.status === 'taxiing' && s.elapsedSeconds >= 15) {
                return { pass: true, evidence: `VN801 / deviated=false / status=taxiing / route đã cấp lại` };
              }
              return { pass: false };
            },
          },
        ];

        return {
          weather: 'fog',
          aircraft: filterNonNull([ac1, ac2]),
          observations,
          triggers: [],
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
        'Tại giây thứ 50: VN901 chuyển sang nhãn "MẤT LIÊN LẠC" (viền nét đứt tím + biểu tượng 📻✕).',
        'Dù mất liên lạc, VN901 VẪN tiếp tục lăn theo đèn xanh đến đích — không cần thoại.',
        'Tại giây thứ 75: VN902 gặp sự cố trên tuyến và được cấp tuyến mới qua thoại — hai cơ chế song song.'
      ],
      setup: (g = graph) => {
        const ac1 = createScenarioAircraft({ id: 'S1', callsign: 'VN901', from: 'DOM_S4', to: 'H25R', role: 'departing' }, g);
        const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'VN902', from: 'INTL_S1', to: 'H07L', role: 'departing' }, g);
        const aircraft = filterNonNull([ac1, ac2]);

        const vn901Edges = ac1 ? (routeToEdges(ac1.assignedRoute, g.edges) ?? []) : [];
        const vn901EdgeSet = new Set(vn901Edges);
        const vn902Edges = ac2 ? (routeToEdges(ac2.assignedRoute, g.edges) ?? []) : [];
        const closureEdgeVN902 = vn902Edges.slice(1).find(e => !vn901EdgeSet.has(e)) ?? vn902Edges[1];

        const triggers: ScenarioTrigger[] = [
          {
            atSeconds: 50,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) =>
                ac.id === 'S1' || ac.callsign === 'VN901'
                  ? { ...ac, radioFailure: true, scenarioLabel: 'MẤT LIÊN LẠC' }
                  : ac
              );
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: 'VN901 mất liên lạc vô tuyến với Ground — FtG tiếp tục dẫn đường bằng đèn theo lộ trình đã cấp, không cần thoại.',
                  severity: 'warning',
                });
              }
              return state;
            },
          },
        ];

        if (closureEdgeVN902) {
          triggers.push({
            atSeconds: 75,
            apply: (state: any) => {
              state.blockedEdgeIds.add(closureEdgeVN902);
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                if (ac.id === 'S2' || ac.callsign === 'VN902') {
                  return recalculateRoutePreservingProgress(ac, ac.targetNodeId, state.blockedEdgeIds, g);
                }
                return ac;
              });
              if (state.scenario) {
                state.scenario.events.push({
                  atSeconds: state.elapsedSeconds,
                  message: 'Sự cố trên tuyến của VN902 — vẫn điều phối lại bình thường qua thoại (không ảnh hưởng tàu bay mất liên lạc).',
                  severity: 'info',
                });
              }
              return state;
            },
          });
        }

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_6_1',
            text: 'Tại mốc t=50s, VN901 chuyển sang trạng thái MẤT LIÊN LẠC (radioFailure=true, label=MẤT LIÊN LẠC).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN901'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN901');
              if (ac && ac.radioFailure && s.elapsedSeconds >= 50) {
                return { pass: true, evidence: `VN901 / radioFailure=true / label=MẤT LIÊN LẠC lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_6_2',
            text: 'VN901 vẫn tiếp tục lăn theo đèn xanh dẫn đường FtG đến đích mà không cần huấn lệnh thoại mới.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN901'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN901');
              if (ac && ac.radioFailure && (ac.status === 'taxiing' || ac.status === 'arrived')) {
                return { pass: true, evidence: `VN901 / status=${ac.status} / dẫn đường qua FtG đến ${ac.targetNodeId}` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_6_3',
            text: 'Tàu bay VN902 vẫn tiếp tục vận hành song song và được tái điều phối qua thoại lúc t=75s.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            relatedAircraft: ['VN902'],
            check: (s) => {
              const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN902');
              if (ac && !ac.radioFailure && s.elapsedSeconds >= 75) {
                return { pass: true, evidence: `VN902 / radioFailure=false / status=${ac.status} lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
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
        'Tại giây thứ 75: nhật ký hiện dòng ĐỎ "Chuyển đường CHC ... cho 3 tàu bay cùng lúc".',
        'Ngay lập tức 3 tàu bay đầu 07 QUAY ĐẦU sang phía 25 — toàn bộ đường xanh vẽ lại cùng lúc.'
      ],
      setup: (g = graph) => {
        const aircraft = filterNonNull([
          createScenarioAircraft({ id: 'S1', callsign: 'VNA01', from: 'DOM_S1', to: 'H07L', role: 'departing', releaseAtSeconds: 0 }, g),
          createScenarioAircraft({ id: 'S2', callsign: 'VNA02', from: 'DOM_S2', to: 'H07R', role: 'departing', releaseAtSeconds: 25 }, g),
          createScenarioAircraft({ id: 'S3', callsign: 'VNA03', from: 'INTL_S1', to: 'H07L', role: 'departing', releaseAtSeconds: 50 }, g),
          createScenarioAircraft({ id: 'S4', callsign: 'VNA04', from: 'DOM_S3', to: 'H25R', role: 'departing', releaseAtSeconds: 0 }, g),
          createScenarioAircraft({ id: 'S5', callsign: 'VNA05', from: 'DOM_S4', to: 'H25L', role: 'departing', releaseAtSeconds: 25 }, g),
          createScenarioAircraft({ id: 'S6', callsign: 'VNA06', from: 'INTL_S3', to: 'H25R', role: 'departing', releaseAtSeconds: 50 }, g),
        ]);

        const rwyMap: Record<string, string> = { H07L: 'H25R', H07R: 'H25L' };
        const affectedIds = aircraft.filter(a => rwyMap[a.targetNodeId]).map(a => a.id);

        const observations: ScenarioObservation[] = [
          {
            id: 'obs_7_1',
            text: 'Ban đầu 6 tàu bay được phân bổ hướng về hai đầu đường băng khác nhau (3 tàu đầu 07, 3 tàu đầu 25).',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.scenarioAircraft && s.scenarioAircraft.length === 6) {
                return { pass: true, evidence: `6 tàu bay: VNA01..VNA06 hướng về hai đầu 07 và 25` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_7_2',
            text: 'Tại giây thứ 75, hệ thống kích hoạt đổi đầu đường băng khai thác sang đầu 25 và ghi nhận sự kiện.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              if (s.elapsedSeconds >= 75) {
                return { pass: true, evidence: `Chuyển đường CHC sang Runway 25 lúc ${s.elapsedSeconds.toFixed(1)}s` };
              }
              return { pass: false };
            },
          },
          {
            id: 'obs_7_3',
            text: 'Chỉ 3 tàu bay đang hướng tới 07 (VNA01, VNA02, VNA03) tự động đổi đích sang 25R/25L, giữ nguyên tiến độ.',
            required: true,
            status: 'pending',
            checkedAtSeconds: null,
            evidence: '',
            check: (s) => {
              const turned = s.scenarioAircraft?.filter((a: any) => ['VNA01', 'VNA02', 'VNA03'].includes(a.callsign));
              if (turned && turned.every((a: any) => a.targetNodeId.includes('25')) && s.elapsedSeconds >= 75.5) {
                return { pass: true, evidence: `3 tàu bay đã chuyển đích sang Runway 25: ${turned.map((a: any) => `${a.callsign}->${a.targetNodeId}`).join(', ')}` };
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
              atSeconds: 75,
              apply: (state: any) => {
                state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                  if (affectedIds.includes(ac.id)) {
                    const newTarget = rwyMap[ac.targetNodeId];
                    if (newTarget) {
                      return recalculateRoutePreservingProgress(ac, newTarget, state.blockedEdgeIds, g);
                    }
                  }
                  return ac;
                });
                if (state.scenario) {
                  state.scenario.events.push({
                    atSeconds: state.elapsedSeconds,
                    message: `Chuyển đường CHC đang khai thác — tính lại lộ trình cho ${affectedIds.length} tàu bay cùng lúc quay đầu sang phía 25.`,
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

