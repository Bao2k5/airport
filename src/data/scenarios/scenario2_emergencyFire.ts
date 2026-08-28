import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';

export const scenario2EmergencyFire: PresetScenarioDef = {
  id: 'emergency_priority_engine_fire',
  title: 'Kịch bản 3 — Khẩn nguy BAV315 cháy động cơ thoát W4 dừng lại, HVN123 vào W5 về Stand 17',
  teaser: 'BAV315 cháy động cơ thoát W4 dừng lại — HVN123 vào W5 về Stand 17, đồng thời BAV456 & THA101 cất cánh 25L.',
  situation: 'Giai đoạn 1:\n• Tàu bay 1 (BAV315) khẩn nguy: Hạ cánh runway 25R bị cháy động cơ (tốc độ chậm hơn), sau đó thoát đường cất hạ cánh vào đường W4 và dừng lại. Tuyến di chuyển: RW 25R -> W4.\n\nGiai đoạn 2:\n• Tàu bay 2 (HVN123): Hạ cánh sau BAV315 đi vào W5 và vào bến đỗ 17. Tuyến di chuyển: RW 25R -> W5 -> CROSS 25L -> W11 -> W9B -> STAND 17.\n• Đồng thời lúc đó, Tàu bay 3 (BAV456) đang ở vị trí E6/E4 tiếp tục đi đến RW 25L. Tuyến di chuyển: E6/E4 -> E6 -> RW 25L.\n• Cùng đồng thời, Tàu bay 4 (THA101) đang ở vị trí Stand 10 pushback ra, và đi ra RW 25L. Tuyến di chuyển: STAND 10 -> HS NS -> E6/E4 -> E6 -> RW 25L.',
  challenges: [
    'Giai đoạn 1: BAV315 cháy động cơ thoát nhanh ra đường lăn W4 và dừng cô lập an toàn.',
    'Giai đoạn 2: Tự động điều phối luồng giao thông song song:',
    '• HVN123 hạ cánh sau thoát qua W5, cắt qua 25L vào W11/W9B về Stand 17.',
    '• BAV456 tại E6/E4 tiếp tục lăn ra đầu 25L cất cánh.',
    '• THA101 từ Stand 10 pushback lăn theo sau ra RW 25L.'
  ],
  watchFor: [
    'BAV315 cháy động cơ có lửa ở đuôi, xả đà vào W4 và dừng lại.',
    'Xe cứu hỏa RESCUE01 tiếp cận hiện trường W4 để xử lý sự cố.',
    'HVN123 hạ cánh thoát qua ngả W5 -> W11 -> W9B về Stand 17.',
    'BAV456 và THA101 lăn thông suốt qua E6 ra vạch chờ cất cánh RW 25L.'
  ],
  setup: (g: AirportGraph = airportGraphV3) => {
    // 1. BAV315: RW 25R -> W4 (dừng lại tại điểm giữa W4/25R và W4/25L)
    const bav315Route = [
      'v3_line_01_p03',
      'v3_line_01_p02',
      'v3_line_06_p00',
      'v3_line_01_p01',
      'v3_line_04_p00',
      'v3_line_04_p01', // W4/25R
      'v3_line_04_p02', // Ở GIỮA W4/25R VÀ W4/25L (DỪNG LẠI TẠI ĐÂY)
    ];
    const bav315Edges = routeToEdges(bav315Route, g.edges) ?? [];

    // 2. HVN123: RW 25R -> W5 -> CROSS 25L -> W11 -> W9B -> STAND 17
    const hvn123Route = [
      'v3_line_01_p03', // RW 25R (Hạ cánh)
      'v3_line_01_p02',
      'v3_line_06_p00',
      'v3_line_01_p01',
      'v3_line_04_p00',
      'v3_line_03_p00', // W5/07L (Thoát vào đường lăn W5)
      'v3_line_03_p_mid',
      'v3_line_03_p01', // W5/07R
      'v3_line_16_p00', // CROSS 25L
      'v3_line_16_p01', // W11/07R
      'v3_line_16_p02',
      'v3_line_16_p03',
      'v3_line_17_p03',
      'v3_line_16_p04',
      'v3_line_17_p04', // W9B
      'v3_line_18_p03', // W7
      'v3_line_17_p05',
      'v3_line_10_p04',
      'v3_line_17_p06',
      'v3_line_11_p01',
      'v3_line_17_p07',
      'v3_line_19_p03', // HS_W7
      'v3_line_17_p08',
      'v3_line_17_p09', // HS_NS
      'v3_line_17_p10',
      'v3_line_21_p00',
      'v3_line_13_p03',
      'v3_line_22_p00',
      'v3_line_22_p01', // STAND 17
    ];
    const hvn123Edges = routeToEdges(hvn123Route, g.edges) ?? [];

    // 3. BAV456: E6/E4 -> E6 -> RW 25L
    const bav456Route = [
      'v3_line_17_p12', // E6/E4
      'v3_line_17_p13', // E6
      'v3_line_17_p14',
      'v3_line_17_p15',
      'v3_line_05_p07',
      'v3_line_17_p16', // STOP BAR 25L
    ];
    const bav456Edges = routeToEdges(bav456Route, g.edges) ?? [];

    // 4. THA101: STAND 10 -> HS NS -> E6/E4 -> E6 -> RW 25L
    const thaRoute = [
      'v3_line_33_p00', // STAND 10
      'v3_line_33_p01',
      'v3_line_32_p01',
      'v3_line_12_p03',
      'v3_line_31_p01',
      'v3_line_30_p01',
      'v3_line_28_p00',
      'v3_line_27_p00',
      'v3_line_17_p09', // HS_NS
      'v3_line_17_p10',
      'v3_line_21_p00',
      'v3_line_13_p03',
      'v3_line_22_p00',
      'v3_line_15_p01',
      'v3_line_23_p00',
      'v3_line_24_p00',
      'v3_line_25_p00',
      'v3_line_17_p11',
      'v3_line_17_p12', // E6/E4
      'v3_line_17_p13', // E6
      'v3_line_17_p14',
      'v3_line_17_p15',
      'v3_line_05_p07',
      'v3_line_17_p16', // STOP BAR 25L
    ];
    const thaEdges = routeToEdges(thaRoute, g.edges) ?? [];

    // 5. RESCUE01 (Xe cứu hỏa đứng đợi ở W4/25L -> khi BAV315 vào giữa thì chạy lên áp sát)
    const rescueStart = 'v3_line_04_p03'; // W4/25L
    const rescueTarget = 'v3_line_04_p02'; // Ở giữa W4/25R và W4/25L
    const fullRescueRoute = [rescueStart, rescueTarget];
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
        speedKts: 13,
        speedLimitKts: 13,
        status: 'taxiing',
        assignedRoute: bav315Route,
        routeEdgeIndex: 0,
        role: 'emergency',
        priority: 0,
        scenarioLabel: '🔥 KHẨN NGUY: CHÁY ĐỘNG CƠ THOÁT VÀO GIỮA W4',
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
        speedLimitKts: 18,
        status: 'queued',
        hidden: true,
        assignedRoute: hvn123Route,
        routeEdgeIndex: 0,
        role: 'arriving',
        priority: 1,
        scenarioLabel: '25R ➔ W5 ➔ W11 ➔ W9B ➔ STAND 17',
        clearedRoute: hvn123Route,
        routeVisible: true,
        releaseAtSeconds: 4,
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
        speedLimitKts: 15,
        status: 'queued',
        hidden: true,
        assignedRoute: bav456Route,
        routeEdgeIndex: 0,
        role: 'departing',
        priority: 2,
        scenarioLabel: 'E6/E4 ➔ E6 ➔ RW 25L',
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
        speedLimitKts: 14,
        status: 'queued',
        hidden: true,
        assignedRoute: thaRoute,
        routeEdgeIndex: 0,
        role: 'pushback',
        priority: 3,
        scenarioLabel: 'STAND 10 ➔ HS NS ➔ E6 ➔ RW 25L',
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
        speedLimitKts: 25,
        status: 'holding',
        holdReason: 'stop-bar',
        assignedRoute: fullRescueRoute,
        routeEdgeIndex: 0,
        role: 'emergency',
        priority: 0,
        scenarioLabel: '🚒 CHỜ TẠI W4/25L ĐỢI BAV315 VÀO ĐIỂM DỪNG',
        clearedRoute: fullRescueRoute,
        routeVisible: true,
        isMoving: false,
      },
    ];

    const observations: ScenarioObservation[] = [
      {
        id: 'obs_3_1',
        text: '[EMERGENCY_EXIT_W4] BAV315 cháy động cơ xả đà thoát qua W4 và dừng lại an toàn.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['BAV315'],
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'BAV315');
          if (ac && (ac.status === 'holding' || ac.status === 'arrived' || ac.currentNodeId === 'v3_line_04_p01')) {
            return { pass: true, evidence: `BAV315 đã thoát vào W4 và dừng an toàn` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_3_2',
        text: '[INBOUND_W5_STAND17] HVN123 hạ cánh sau thoát qua W5 -> W11 -> W9B về Stand 17.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN123'],
        check: (s) => {
          const hvn = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN123');
          if (hvn && (hvn.status === 'taxiing' || hvn.status === 'arrived')) {
            return { pass: true, evidence: `HVN123 lăn qua W5 về Stand 17` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_3_3',
        text: '[DEPARTURE_25L] BAV456 từ E6/E4 và THA101 từ Stand 10 lăn ra RW 25L an toàn.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['BAV456', 'THA101'],
        check: (s) => {
          const b4 = s.scenarioAircraft?.find((a: any) => a.callsign === 'BAV456');
          const t1 = s.scenarioAircraft?.find((a: any) => a.callsign === 'THA101');
          if (b4 && t1 && (b4.status === 'taxiing' || b4.status === 'arrived') && (t1.status === 'taxiing' || t1.status === 'arrived')) {
            return { pass: true, evidence: `BAV456 và THA101 đang lăn ra RW 25L` };
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
              message: '🔥 [MAYDAY] BAV315 báo cháy động cơ sau hạ cánh 25R, giảm tốc thoát vào W4 và dừng lại',
              severity: 'critical',
            });
          }
          return state;
        },
      },
      {
        atSeconds: 6,
        apply: (state: any) => {
          const r = state.scenarioAircraft?.find((a: any) => a.callsign === 'RESCUE01');
          if (r) {
            r.status = 'taxiing';
            r.speedKts = 24;
            r.isMoving = true;
          }
          const hvn = state.scenarioAircraft?.find((a: any) => a.callsign === 'HVN123');
          if (hvn) {
            hvn.status = 'taxiing';
            hvn.speedKts = 18;
            hvn.hidden = false;
          }
          if (state.scenario) {
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '🚒 [RESCUE_DISPATCH] Xe cứu hỏa RESCUE01 xuất phát tiếp cận dập lửa BAV315 tại W4',
              severity: 'info',
            });
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '🛬 [HVN123_LANDED] HVN123 hạ cánh thoát qua W5 -> W11 -> W9B về Stand 17',
              severity: 'info',
            });
          }
          return state;
        },
      },
      {
        atSeconds: 16,
        apply: (state: any) => {
          const b = state.scenarioAircraft?.find((a: any) => a.callsign === 'BAV315');
          if (b) {
            b.isFireExtinguished = true;
          }
          if (state.scenario) {
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '✅ [FIRE_EXTINGUISHED] Đội cứu hỏa đã khống chế hoàn toàn đám cháy động cơ BAV315 tại W4',
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
};
