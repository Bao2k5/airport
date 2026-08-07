// Preset scenarios extracted directly from Vercel demo (100% parity)

import type { AircraftStatus } from '../types';
import { airportGraph } from './airportGraph';
import { findPath, routeToEdges } from '../simulation/pathfinding';

export interface ScenarioAircraft {
  id: string;
  callsign: string;
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

export interface ScenarioState {
  id: string;
  title: string;
  situation: string;
  challenges: string[];
  watchFor: string[];
  startedAtSeconds: number;
  events: ScenarioEvent[];
  pendingTriggers: ScenarioTrigger[];
  completed: boolean;
}

export interface PresetScenarioDef {
  id: string;
  title: string;
  teaser: string;
  situation: string;
  challenges: string[];
  watchFor: string[];
  setup: () => {
    weather: 'clear' | 'fog' | 'thunderstorm';
    aircraft: ScenarioAircraft[];
    triggers: ScenarioTrigger[];
  };
}

function createScenarioAircraft(opts: {
  id: string;
  callsign: string;
  from: string;
  to: string;
  role?: 'emergency' | 'departing' | 'arriving' | 'pushback';
  priority?: number;
  label?: string;
  releaseAtSeconds?: number;
}): ScenarioAircraft | null {
  const route = findPath(airportGraph, opts.from, opts.to, new Set());
  if (!route || route.length < 2) {
    console.error(`[scenario] ${opts.callsign}: no route ${opts.from} -> ${opts.to}`);
    return null;
  }
  const edges = routeToEdges(route, airportGraph.edges) ?? [];
  return {
    id: opts.id,
    callsign: opts.callsign,
    currentNodeId: opts.from,
    targetNodeId: opts.to,
    currentEdgeId: edges[0] ?? null,
    progressOnEdge: 0,
    speedKts: 30,
    status: 'taxiing',
    assignedRoute: route,
    routeEdgeIndex: 0,
    role: opts.role,
    priority: opts.priority,
    clearedRoute: route,
    scenarioLabel: opts.label,
    releaseAtSeconds: opts.releaseAtSeconds,
  };
}

function filterNonNull<T>(arr: (T | null)[]): T[] {
  return arr.filter((x): x is T => x !== null);
}

function findMostUsedEdge(aircraftList: ScenarioAircraft[]): string | null {
  const counts = new Map<string, number>();
  for (const ac of aircraftList) {
    const edges = (routeToEdges(ac.assignedRoute, airportGraph.edges) ?? []).slice(1);
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

export const PRESET_SCENARIO_DEFS: Record<string, PresetScenarioDef> = {
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
    setup: () => ({
      weather: 'fog',
      aircraft: filterNonNull([
        createScenarioAircraft({ id: 'S1', callsign: 'VN9999', from: 'RWY07R_THR', to: 'DOM_S1', role: 'emergency', priority: 0, label: 'KHẨN NGUY' }),
        createScenarioAircraft({ id: 'S2', callsign: 'VN201', from: 'DOM_S3', to: 'H07R', role: 'departing' }),
        createScenarioAircraft({ id: 'S3', callsign: 'VN202', from: 'DOM_S4', to: 'H25L', role: 'departing' }),
        createScenarioAircraft({ id: 'S4', callsign: 'VN203', from: 'RWY25L_THR', to: 'INTL_S1', role: 'arriving' }),
        createScenarioAircraft({ id: 'S5', callsign: 'VN204', from: 'DOM_S2', to: 'H07R', role: 'pushback', priority: 3, label: 'PUSHBACK' }),
      ]),
      triggers: [],
    }),
  },
  lvc_intersection_conflict: {
    id: 'lvc_intersection_conflict',
    title: 'Kịch bản 2 — Hai tàu bay cùng tiến vào một nút giao trong LVC',
    teaser: 'Hai tàu bay hội tụ vào cùng một giao điểm đường lăn, không nhìn thấy nhau.',
    situation: 'Hai tàu bay được cấp phép taxi từ hai hướng khác nhau và sẽ đến cùng một giao điểm đường lăn gần như đồng thời. Do tầm nhìn hạn chế, hai tổ lái không thể nhìn thấy nhau — nếu không được điều phối kịp thời sẽ phát sinh nguy cơ xâm nhập đường lăn hoặc xung đột mặt đất.',
    challenges: [
      'KSVKL phải xác định tàu bay ưu tiên.',
      'Một tàu bay phải dừng chính xác trước Stop Bar.',
      'Sai một huấn lệnh có thể dẫn đến xâm nhập đường lăn.'
    ],
    watchFor: [
      'Hai tàu bay tiến vào cùng một giao điểm từ hai hướng khác nhau.',
      'Tàu bay ưu tiên thấp hơn (VN302) dừng lại — vạch Stop Bar đỏ hiện ở mũi nó.',
      'Sau khi VN301 đi qua, VN302 mới tiếp tục lăn bánh — không bao giờ có va chạm.'
    ],
    setup: () => ({
      weather: 'fog',
      aircraft: filterNonNull([
        createScenarioAircraft({ id: 'S1', callsign: 'VN301', from: 'DOM_S3', to: 'H25L', role: 'departing', priority: 1 }),
        createScenarioAircraft({ id: 'S2', callsign: 'VN302', from: 'INTL_S3', to: 'H07R', role: 'departing', priority: 2 }),
      ]),
      triggers: [],
    }),
  },
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
    setup: () => {
      const aircraft = filterNonNull([
        createScenarioAircraft({ id: 'S1', callsign: 'VN401', from: 'DOM_S1', to: 'H25L', role: 'departing' }),
        createScenarioAircraft({ id: 'S2', callsign: 'VN402', from: 'DOM_S2', to: 'H25R', role: 'departing' }),
        createScenarioAircraft({ id: 'S3', callsign: 'VN403', from: 'INTL_S1', to: 'H07R', role: 'departing' }),
        createScenarioAircraft({ id: 'S4', callsign: 'VN404', from: 'INTL_S3', to: 'H07L', role: 'departing' }),
      ]);
      const closureEdge = findMostUsedEdge(aircraft);
      return {
        weather: 'clear',
        aircraft,
        triggers: closureEdge
          ? [
              {
                atSeconds: 60,
                apply: (state: any) => {
                  state.blockedEdgeIds.add(closureEdge);
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
            ]
          : [],
      };
    },
  },
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
    setup: () => ({
      weather: 'fog',
      aircraft: filterNonNull([
        createScenarioAircraft({ id: 'A1', callsign: 'VN501', from: 'RWY07L_THR', to: 'DOM_S1', role: 'arriving' }),
        createScenarioAircraft({ id: 'A2', callsign: 'VN502', from: 'RWY25R_THR', to: 'DOM_S2', role: 'arriving' }),
        createScenarioAircraft({ id: 'A3', callsign: 'VN503', from: 'RWY07R_THR', to: 'DOM_S3', role: 'arriving' }),
        createScenarioAircraft({ id: 'A4', callsign: 'VN504', from: 'RWY25L_THR', to: 'DOM_S4', role: 'arriving', releaseAtSeconds: 20 }),
        createScenarioAircraft({ id: 'A5', callsign: 'VN505', from: 'H25R', to: 'DOM_S5', role: 'arriving', releaseAtSeconds: 30 }),
        createScenarioAircraft({ id: 'D1', callsign: 'VN601', from: 'INTL_S1', to: 'H07R', role: 'departing', releaseAtSeconds: 150 }),
        createScenarioAircraft({ id: 'D2', callsign: 'VN602', from: 'INTL_S2', to: 'H25L', role: 'departing', releaseAtSeconds: 175 }),
        createScenarioAircraft({ id: 'D3', callsign: 'VN603', from: 'INTL_S3', to: 'H25R', role: 'departing', releaseAtSeconds: 200 }),
        createScenarioAircraft({ id: 'D4', callsign: 'VN604', from: 'INTL_S4', to: 'H07L', role: 'departing', releaseAtSeconds: 225 }),
        createScenarioAircraft({ id: 'D5', callsign: 'VN605', from: 'P1', to: 'H25L', role: 'departing', releaseAtSeconds: 250 }),
        createScenarioAircraft({ id: 'P1', callsign: 'VN701', from: 'P2', to: 'H07R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 275 }),
        createScenarioAircraft({ id: 'P2', callsign: 'VN702', from: 'P4', to: 'H25R', role: 'pushback', priority: 3, label: 'PUSHBACK', releaseAtSeconds: 300 }),
      ]),
      triggers: [],
    }),
  },
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
    setup: () => {
      const ac1 = createScenarioAircraft({ id: 'S1', callsign: 'VN801', from: 'DOM_S3', to: 'H25L', role: 'departing' });
      const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'VN802', from: 'DOM_S1', to: 'H25R', role: 'departing' });
      return {
        weather: 'fog',
        aircraft: filterNonNull([ac1, ac2]),
        triggers: [],
      };
    },
  },
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
      'Khoảng giây thứ 4: VN901 chuyển sang nhãn "MẤT LIÊN LẠC" (viền nét đứt tím + biểu tượng 📻✕).',
      'Dù mất liên lạc, VN901 VẪN tiếp tục lăn theo đèn xanh đến đích — không cần thoại.',
      'VN902 (bình thường) gặp sự cố trên tuyến và được cấp tuyến mới qua thoại — hai cơ chế song song.'
    ],
    setup: () => {
      const ac1 = createScenarioAircraft({ id: 'S1', callsign: 'VN901', from: 'DOM_S4', to: 'H25R', role: 'departing' });
      const ac2 = createScenarioAircraft({ id: 'S2', callsign: 'VN902', from: 'INTL_S1', to: 'H07L', role: 'departing' });
      const aircraft = filterNonNull([ac1, ac2]);
      return {
        weather: 'fog',
        aircraft,
        triggers: [
          {
            atSeconds: 50,
            apply: (state: any) => {
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) =>
                ac.id === 'S1' ? { ...ac, radioFailure: true, scenarioLabel: 'MẤT LIÊN LẠC' } : ac
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
        ],
      };
    },
  },
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
    setup: () => {
      const aircraft = filterNonNull([
        createScenarioAircraft({ id: 'S1', callsign: 'VNA01', from: 'DOM_S1', to: 'H07L', role: 'departing' }),
        createScenarioAircraft({ id: 'S2', callsign: 'VNA02', from: 'DOM_S2', to: 'H07R', role: 'departing', releaseAtSeconds: 25 }),
        createScenarioAircraft({ id: 'S3', callsign: 'VNA03', from: 'INTL_S1', to: 'H07L', role: 'departing', releaseAtSeconds: 50 }),
        createScenarioAircraft({ id: 'S4', callsign: 'VNA04', from: 'DOM_S3', to: 'H25R', role: 'departing' }),
        createScenarioAircraft({ id: 'S5', callsign: 'VNA05', from: 'DOM_S4', to: 'H25L', role: 'departing', releaseAtSeconds: 25 }),
        createScenarioAircraft({ id: 'S6', callsign: 'VNA06', from: 'INTL_S3', to: 'H25R', role: 'departing', releaseAtSeconds: 50 }),
      ]);
      return {
        weather: 'clear',
        aircraft,
        triggers: [
          {
            atSeconds: 75,
            apply: (state: any) => {
              const rwyMap: Record<string, string> = { H07L: 'H25R', H07R: 'H25L' };
              state.scenarioAircraft = state.scenarioAircraft.map((ac: any) => {
                const newTarget = rwyMap[ac.targetNodeId];
                if (newTarget) {
                  const newRoute = findPath(airportGraph, ac.currentNodeId, newTarget, new Set());
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
                  message: 'Chuyển đường CHC đang khai thác — tính lại lộ trình cho 3 tàu bay cùng lúc.',
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
