import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';

export const scenario3HsnsConflict: PresetScenarioDef = {
  id: 'lvc_hsns_intersection_conflict',
  title: 'Kịch bản 2 — Xung đột ngã tư HS NS (Tàu hạ cánh về Stand 17 vs Tàu cất cánh từ Stand 11)',
  teaser: 'HVN301 hạ cánh 25R qua W4 về Stand 17 — VJ302 pushback Stand 11 dừng chờ Stop Bar đỏ tại HS NS, sau đó tiếp nối ra RW 25L.',
  situation: 'Giai đoạn 1:\n• Tàu bay 1 (HVN301) vừa hạ cánh đang lăn vào bến đỗ 17. Tuyến di chuyển: RW 25R -> W4 -> CROSS 25L -> W7 -> HS NS -> STAND 17.\n• Tàu bay 2 (VJ302) pushback tại vị trí Stand 11, di chuyển ra đường cất hạ cánh 25L. Khi tàu bay 1 taxi đến W7 thì tàu bay 2 mới bắt đầu pushback ra. Vì thế tàu bay 2 sau khi taxi ra đến NS thì dừng lại (hiện đường Stop Bar màu đỏ) nhường đường cho tàu bay 1. Tuyến di chuyển: STAND 11 -> HS NS (DỪNG) -> E6 -> RW 25L.\n\nGiai đoạn 2:\n• Khi tàu bay 1 taxi tới ngang Stand 16, tàu bay 2 bắt đầu di chuyển theo sau và tiến thẳng ra RW 25L qua E6 an toàn.',
  challenges: [
    'Giai đoạn 1: A-SMGCS phát hiện nguy cơ xung đột tại nút giao HS NS giữa HVN301 (Inbound) và VJ302 (Outbound).',
    'Tự động kích hoạt Stop Bar màu đỏ trên Line 12 giữ VJ302 dừng an toàn trước giao lộ HS NS.',
    'Giai đoạn 2: Khi HVN301 giải phóng HS NS và đến ngang Stand 16, tự động cấp dải đèn xanh FtG cho VJ302 tiếp tục ra RW 25L.'
  ],
  watchFor: [
    'HVN301 hạ cánh 25R lăn qua W4, cắt qua 25L vào trục W7.',
    'Khi HVN301 đến W7, VJ302 tại Stand 11 bắt đầu pushback ra Line 12.',
    'VJ302 đến trước HS NS thì dừng lại trước Stop Bar đỏ (speed = 0 kts).',
    'Khi HVN301 đến bến 16/17, Stop Bar chuyển xanh lá, VJ302 lăn tiếp qua E6 đến vạch chờ 25L.'
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
        speedLimitKts: 14,
        status: 'holding',
        assignedRoute: tauBRoute,
        routeEdgeIndex: 0,
        role: 'departing',
        priority: 2,
        scenarioLabel: 'STAND 11: CHỜ HVN301 ĐẾN W7',
        clearedRoute: tauBRoute,
        routeVisible: true,
      },
    ];

    const observations: ScenarioObservation[] = [
      {
        id: 'obs_2_1',
        text: '[STAGE1_INBOUND_W7] HVN301 hạ cánh 25R lăn qua W4/CROSS 25L đến W7 -> VJ302 bắt đầu pushback.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN301'],
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN301');
          if (ac && ac.routeEdgeIndex >= 12) {
            return { pass: true, evidence: `HVN301 đã đến W7, VJ302 bắt đầu pushback` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_2_2',
        text: '[STAGE1_HSNS_HOLD] VJ302 lăn ra đến HS NS dừng trước Stop Bar đỏ, HVN301 về tới Stand 16 (Kết thúc GĐ 1).',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['VJ302', 'HVN301'],
        check: (s) => {
          const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
          if (a2 && a2.routeEdgeIndex >= 6 && a2.status === 'holding') {
            return { pass: true, evidence: `VJ302 dừng chờ an toàn trước Stop Bar đỏ tại HS NS` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_2_3',
        text: '[STAGE2_RELEASE_25L] Bắt đầu GĐ 2: HVN301 đã về Stand 16, VJ302 nhận đèn xanh FtG lăn tiếp qua E6 ra 25L.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN301', 'VJ302'],
        check: (s) => {
          const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
          if (a2 && a2.routeEdgeIndex >= 7 && a2.speedKts > 0) {
            return { pass: true, evidence: `VJ302 đã được giải phóng và đang lăn ra RW 25L` };
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
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '[GIAI ĐOẠN 1] HVN301 hạ cánh 25R lăn vào W4 về bến 17. VJ302 tại Stand 11 chờ HVN301 đến W7 mới pushback.',
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
