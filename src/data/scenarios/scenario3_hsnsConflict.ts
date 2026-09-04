import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';

export const scenario3HsnsConflict: PresetScenarioDef = {
  id: 'lvc_hsns_intersection_conflict',
  title: 'Kịch bản 2 — Xung đột ngã tư HS NS',
  teaser: 'VN301 hạ cánh 25R qua W4 về Stand 17 — VJ302 pushback Stand 11 dừng chờ đèn đỏ FtG tại L28_ENT, sau khi VN301 về bến đỗ 17 thì đèn chuyển xanh lăn ra RW 25L.',
  situation: 'Giai đoạn 1:\n• Tàu bay 1 (VN301) vừa hạ cánh đang lăn vào bến đỗ 17. Tuyến di chuyển: RW 25R -> W4 -> CROSS 25L -> W7 -> HS NS -> STAND 17.\n• Tàu bay 2 (VJ302) pushback tại vị trí Stand 11, di chuyển ra đường cất hạ cánh 25L. Khi tàu bay 1 taxi đến W7 thì tàu bay 2 mới bắt đầu pushback ra. Sau khi taxi ra đến vị trí L28_ENT thì dừng lại trước vạch dừng, dải đèn FtG chuyển sang màu đỏ nhường đường cho tàu bay 1. Tuyến di chuyển: STAND 11 -> L28_ENT (DỪNG ĐÈN ĐỎ FtG) -> HS NS -> E6 -> RW 25L.\n\nGiai đoạn 2:\n• Khi tàu bay 1 lăn về hẳn bến đỗ 17 an toàn, dải đèn FtG của tàu bay 2 chuyển sang màu xanh lá và tàu tiếp tục di chuyển qua E6 ra RW 25L an toàn.',
  challenges: [
    'Giai đoạn 1: A-SMGCS phát hiện nguy cơ xung đột tại nút giao giữa VN301 (Inbound) và VJ302 (Outbound).',
    'Tự động chuyển dải đèn dẫn hướng Follow-the-Green sang màu đỏ và kích hoạt Stop Bar đỏ giữ VJ302 dừng an toàn tại L28_ENT.',
    'Giai đoạn 2: Khi VN301 đã về bến đỗ 17 an toàn, tự động cấp lại dải đèn xanh FtG cho VJ302 tiếp tục qua E6 ra RW 25L.'
  ],
  watchFor: [
    'VN301 hạ cánh 25R lăn qua W4, cắt qua 25L vào trục W7.',
    'Khi VN301 đến W7, VJ302 tại Stand 11 bắt đầu pushback ra.',
    'VJ302 đến điểm L28_ENT thì dừng lại trước vạch dừng, dải đèn FtG đổi sang màu đỏ duy nhất tại đây (speed = 0 kts).',
    'Khi VN301 về tới bến đỗ 17, đèn FtG của VJ302 chuyển lại màu xanh lá, VJ302 lăn tiếp qua E6 đến vạch chờ 25L.'
  ],
  setup: (g: AirportGraph = airportGraphV3) => {
    // Tuyến Tàu 1: RW 25R - W4 - CROSS 25L - W7 - HS NS - STAND 17
    const tauARoute = [
      'v3_line_01_p03', // RW 25R
      'v3_line_01_p02',
      'v3_line_06_p00',
      'v3_line_01_p01',
      'v3_line_04_p00',
      'v3_line_04_p01', // W4/25R
      'v3_line_04_p02',
      'v3_line_04_p03', // W4/25L (CROSS 25L)
      'v3_line_05_p01',
      'v3_line_18_p00',
      'v3_line_18_p01',
      'v3_line_18_p02',
      'v3_line_18_p03', // W9B/W7A (W7)
      'v3_line_17_p05',
      'v3_line_10_p04',
      'v3_line_17_p06',
      'v3_line_11_p01', // W5/W7B
      'v3_line_17_p07',
      'v3_line_19_p03', // HS_W7
      'v3_line_17_p08',
      'v3_line_17_p09', // HS_NS
      'v3_line_17_p10',
      'v3_line_21_p00', // Ngang STAND 16
      'v3_line_13_p03',
      'v3_line_22_p00',
      'v3_line_22_p01', // STAND 17
    ];
    const tauAEdges = routeToEdges(tauARoute, g.edges) ?? [];

    // Tuyến Tàu 2: STAND 11 - HS NS (DỪNG) - E6 - RW 25L
    const tauBRoute = [
      'v3_line_32_p00', // STAND 11
      'v3_line_32_p01',
      'v3_line_12_p03',
      'v3_line_31_p01',
      'v3_line_30_p01',
      'v3_line_28_p00',
      'v3_line_27_p00',
      'v3_line_17_p09', // HS_NS (DỪNG CHỜ)
      'v3_line_17_p10',
      'v3_line_21_p00',
      'v3_line_13_p03',
      'v3_line_22_p00',
      'v3_line_15_p01',
      'v3_line_23_p00',
      'v3_line_24_p00',
      'v3_line_25_p00',
      'v3_line_17_p11',
      'v3_line_17_p12',
      'v3_line_17_p13', // E6
      'v3_line_17_p14',
      'v3_line_17_p15',
      'v3_line_05_p07',
      'v3_line_17_p16', // STOP BAR 25L
    ];
    const tauBEdges = routeToEdges(tauBRoute, g.edges) ?? [];

    const vnDef = getAirlineDef('VN');
    const vjDef = getAirlineDef('VJ');

    const aircraft: ScenarioAircraft[] = [
      {
        id: 'S1',
        callsign: 'VN301',
        airlineCode: 'VN',
        airlineName: vnDef.name,
        aircraftAsset: vnDef.asset,
        aircraftType: 'A321',
        currentNodeId: tauARoute[0],
        targetNodeId: tauARoute[tauARoute.length - 1],
        currentEdgeId: tauAEdges[0] ?? null,
        progressOnEdge: 0,
        speedKts: 20,
        speedLimitKts: 20,
        status: 'taxiing',
        assignedRoute: tauARoute,
        routeEdgeIndex: 0,
        role: 'arriving',
        priority: 1,
        scenarioLabel: '25R ➔ W4 ➔ W7 ➔ HS NS ➔ STAND 17',
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
        speedKts: 0,
        speedLimitKts: 20,
        status: 'holding',
        assignedRoute: tauBRoute,
        routeEdgeIndex: 0,
        role: 'departing',
        priority: 2,
        scenarioLabel: 'STAND 11: CHỜ VN301 ĐẾN W7',
        clearedRoute: tauBRoute,
        routeVisible: true,
      },
    ];

    const observations: ScenarioObservation[] = [
      {
        id: 'obs_2_1',
        text: '[STAGE1_INBOUND_W7] VN301 hạ cánh 25R lăn qua W4/CROSS 25L đến W7 -> VJ302 bắt đầu pushback.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['VN301'],
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN301' || a.callsign === 'HVN301');
          if (ac && ac.routeEdgeIndex >= 12) {
            return { pass: true, evidence: `VN301 đã đến W7, VJ302 bắt đầu pushback` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_2_2',
        text: '[STAGE1_L28ENT_HOLD] VJ302 lăn ra đến L28_ENT dừng chờ trước đèn đỏ FtG, VN301 lăn về bến đỗ 17 (Kết thúc GĐ 1).',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['VJ302', 'VN301'],
        check: (s) => {
          const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
          if (a2 && a2.routeEdgeIndex >= 4 && a2.status === 'holding') {
            return { pass: true, evidence: `VJ302 dừng chờ an toàn trước đèn đỏ FtG tại L28_ENT` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_2_3',
        text: '[STAGE2_RELEASE_25L] Bắt đầu GĐ 2: VN301 lăn tới Stand 16, VJ302 nhận đèn xanh FtG lăn theo sau qua E6 ra RW 25L.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['VN301', 'VJ302'],
        check: (s) => {
          const vn = s.scenarioAircraft?.find((a: any) => a.callsign === 'VN301' || a.callsign === 'HVN301');
          const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
          const vnAt16 = vn && (vn.routeEdgeIndex >= 22 || vn.status === 'arrived' || vn.currentNodeId === 'v3_line_21_p00' || vn.currentNodeId === 'v3_line_22_p01');
          if (vnAt16 && a2 && a2.routeEdgeIndex >= 4 && a2.speedKts > 0) {
            return { pass: true, evidence: `VN301 đã tới Stand 16, VJ302 nhận đèn xanh FtG và đang lăn theo sau ra RW 25L` };
          }
          return { pass: false };
        },
      },
    ];

    const triggers: ScenarioTrigger[] = [
      {
        atSeconds: 1,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events = [
              ...state.scenario.events,
              {
                atSeconds: state.elapsedSeconds,
                message: '📻 [ATC CLEARANCE] "VN301, taxi to stand 17"',
                severity: 'info',
              },
            ];
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
