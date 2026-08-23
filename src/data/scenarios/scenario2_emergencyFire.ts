import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { findPath, routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';
import { resolveV3NodeId } from './common';

export const scenario2EmergencyFire: PresetScenarioDef = {
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
  setup: (g: AirportGraph = airportGraphV3) => {
    // 1. BAV315: STOP BAR 25R -> chạy hết đường 25R tới W5/07L -> quẹo trái xuống đường lăn W5 đi nửa đường (W5 MID) dừng cách ly
    const bav315_start = resolveV3NodeId('STOP BAR 25R', g);
    const bav315_w5 = resolveV3NodeId('W5/07L', g);
    const bav315_w5mid = 'v3_line_03_p_mid';
    const r1 = findPath(g, bav315_start, bav315_w5) || [];
    const r2 = findPath(g, bav315_w5, bav315_w5mid) || [];
    const bav315Route = [...r1, ...r2.slice(1)];
    const bav315Edges = routeToEdges(bav315Route, g.edges) ?? [];

    // 2. Tàu 2 (HVN123): Vừa hạ cánh đang từ L12_P0 -> W4 -> W4/25L -> W7A/25L -> W9B/W7A -> đi theo W7B -> HS NS -> Stand 17
    const hvn_start = resolveV3NodeId('L12_P0', g) || 'v3_line_12_p00';
    const hvn_w4l = resolveV3NodeId('W4/25L', g) || 'v3_line_04_p03';
    const hvn_w7a = resolveV3NodeId('W7A/25L', g) || 'v3_line_05_p01';
    const hvn_w9bw7a = resolveV3NodeId('W9B/W7A', g) || 'v3_line_18_p03';
    const hvn_hsw7 = resolveV3NodeId('HS W7', g) || 'v3_line_17_p05';
    const hvn_hsns = resolveV3NodeId('HS NS', g) || 'v3_line_17_p09';
    const hvn_stand17 = resolveV3NodeId('STAND_17', g) || 'v3_line_34_p00';

    const rh1 = findPath(g, hvn_start, hvn_w4l) || [];
    const rh2 = findPath(g, hvn_w4l, hvn_w7a) || [];
    const rh3 = findPath(g, hvn_w7a, hvn_w9bw7a) || [];
    const rh4 = findPath(g, hvn_w9bw7a, hvn_hsw7) || [];
    const rh5 = findPath(g, hvn_hsw7, hvn_hsns) || [];
    const rh6 = findPath(g, hvn_hsns, hvn_stand17) || [];
    const hvn123Route = [...rh1, ...rh2.slice(1), ...rh3.slice(1), ...rh4.slice(1), ...rh5.slice(1), ...rh6.slice(1)];
    const hvn123Edges = routeToEdges(hvn123Route, g.edges) ?? [];

    // 3. Tàu 3 (BAV456): xuất phát ở E6/E4 -> E6 để đến STOP BAR 25L
    const bav_start = resolveV3NodeId('E6/E4', g) || 'v3_line_17_p12';
    const bav_dest = resolveV3NodeId('STOP BAR 25L', g) || 'v3_line_17_p16';
    const bav456Route = findPath(g, bav_start, bav_dest) || [];
    const bav456Edges = routeToEdges(bav456Route, g.edges) ?? [];

    // 4. Tàu 4 (THA101): Đã đẩy lùi (pushback) tại Stand 10 , đít nó quẹo phải ròi chạy lên HS_NS -> quẹo phải đến E6 -> Stop bar 25L
    const tha_start = resolveV3NodeId('STAND_10', g) || 'v3_line_33_p00';
    const tha_hsns = resolveV3NodeId('HS NS', g) || 'v3_line_17_p09';
    const tha_e6 = resolveV3NodeId('E6', g) || 'v3_line_17_p13';
    const tha_dest = resolveV3NodeId('STOP BAR 25L', g) || 'v3_line_17_p16';
    const rt1 = findPath(g, tha_start, tha_hsns) || [];
    const rt2 = findPath(g, tha_hsns, tha_e6) || [];
    const rt3 = findPath(g, tha_e6, tha_dest) || [];
    const thaRoute = [...rt1, ...rt2.slice(1), ...rt3.slice(1)];
    const thaEdges = routeToEdges(thaRoute, g.edges) ?? [];

    // 5. RESCUE01 (Xe cứu hỏa ứng trực tại 07R -> sau khi BAV315 cách ly sẽ chạy lên W5 MID dập lửa)
    const rescueStart = resolveV3NodeId('07R', g) || 'v3_line_05_p00';
    const rescueTarget = 'v3_line_03_p_mid';
    const fullRescueRoute = [rescueStart, 'v3_line_03_p01', rescueTarget];
    const fullRescueEdges = routeToEdges(fullRescueRoute, g.edges) ?? [];

    const qhDef = getAirlineDef('QH');
    const vnDef = getAirlineDef('VN');
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
        speedKts: 30,
        speedLimitKts: 30,
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
        callsign: 'HVN123',
        airlineCode: 'VN',
        airlineName: vnDef.name,
        aircraftAsset: vnDef.asset,
        aircraftType: 'A321',
        currentNodeId: hvn123Route[0],
        targetNodeId: hvn123Route[hvn123Route.length - 1],
        currentEdgeId: hvn123Edges[0] ?? null,
        progressOnEdge: 0,
        speedKts: 0,
        speedLimitKts: 20,
        status: 'queued',
        hidden: true,
        assignedRoute: hvn123Route,
        routeEdgeIndex: 0,
        role: 'arriving',
        priority: 1,
        scenarioLabel: 'HẠ CÁNH VỀ STAND 17',
        clearedRoute: hvn123Route,
        routeVisible: true,
        releaseAtSeconds: 6,
      },
      {
        id: 'S3',
        callsign: 'BAV456',
        airlineCode: 'QH',
        airlineName: qhDef.name,
        aircraftAsset: qhDef.asset,
        aircraftType: 'A321',
        currentNodeId: bav456Route[0],
        targetNodeId: bav456Route[bav456Route.length - 1],
        currentEdgeId: bav456Edges[0] ?? null,
        progressOnEdge: 0,
        speedKts: 0,
        speedLimitKts: 0,
        status: 'holding',
        holdReason: 'stop-bar',
        hidden: false,
        assignedRoute: bav456Route,
        routeEdgeIndex: 0,
        role: 'departing',
        priority: 2,
        scenarioLabel: '⛔ ĐÈN ĐỎ: HOLD POSITION TẠI E6/E4',
        clearedRoute: bav456Route,
        routeVisible: true,
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
        speedLimitKts: 0,
        status: 'holding',
        holdReason: 'stop-bar',
        hidden: false,
        assignedRoute: thaRoute,
        routeEdgeIndex: 0,
        role: 'pushback',
        priority: 3,
        scenarioLabel: '⛔ ĐÈN ĐỎ: HOLD POSITION TẠI STAND 10',
        clearedRoute: thaRoute,
        routeVisible: true,
      },
      {
        id: 'S5',
        callsign: 'RESCUE01',
        airlineCode: 'VU',
        airlineName: 'Xe Cứu Hỏa Khẩn Nguy',
        aircraftAsset: '/xecuuhoa.png',
        aircraftType: 'ATR72',
        currentNodeId: rescueStart,
        targetNodeId: rescueTarget,
        currentEdgeId: fullRescueEdges[0] ?? null,
        progressOnEdge: 0,
        speedKts: 0,
        speedLimitKts: 0,
        status: 'holding',
        holdReason: 'stop-bar',
        assignedRoute: fullRescueRoute,
        routeEdgeIndex: 0,
        role: 'emergency',
        priority: 0,
        scenarioLabel: 'XE CỨU HỎA ỨNG TRỰC TẠI 07R',
        clearedRoute: fullRescueRoute,
        routeVisible: true,
        isMoving: false,
      },
    ];

    const observations: ScenarioObservation[] = [
      {
        id: 'obs_2_1',
        text: '[EMERGENCY_PRIORITY] BAV315 cháy động cơ, xả đà qua 25R quẹo trái cách ly tại W5 MID.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['BAV315'],
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'BAV315');
          if (ac && (ac.status === 'taxiing' || ac.status === 'holding' || ac.status === 'arrived')) {
            return { pass: true, evidence: `BAV315 / priority=0 / status=${ac.status} / cách ly tại W5 MID` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_2_2',
        text: '[RESCUE_OPERATION] RESCUE01 từ 07R lăn lên W5 MID tiếp cận dập tắt đám cháy sau 10s.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['RESCUE01'],
        check: (s) => {
          const r = s.scenarioAircraft?.find((a: any) => a.callsign === 'RESCUE01');
          if (r && (r.status === 'taxiing' || r.status === 'arrived')) {
            return { pass: true, evidence: `RESCUE01 đã tiếp cận hiện trường và dập lửa` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_2_3',
        text: '[TRAFFIC_FLOW] HVN123 về Stand 17, BAV456 và THA101 lăn đến STOP BAR 25L an toàn.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN123', 'BAV456', 'THA101'],
        check: (s) => {
          const hvn = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN123');
          if (hvn && (hvn.status === 'taxiing' || hvn.status === 'arrived')) {
            return { pass: true, evidence: `HVN123 hạ cánh lăn về Stand 17` };
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
};
