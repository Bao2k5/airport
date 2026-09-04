import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';

export const scenario4FodClosure: PresetScenarioDef = {
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
  setup: (g: AirportGraph = airportGraphV3) => {
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
        speedKts: 20,
        speedLimitKts: 20,
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
        atSeconds: 1,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events = [
              ...state.scenario.events,
              {
                atSeconds: state.elapsedSeconds,
                message: '📻 [ATC CLEARANCE] "HVN401 taxi to stand 16"',
                severity: 'info',
              },
            ];
          }
          return state;
        },
      },
      {
        atSeconds: 3,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events = [
              ...state.scenario.events,
              {
                atSeconds: state.elapsedSeconds,
                message: '[LVC_WEATHER] Sương mù RVR < 550m — Kích hoạt Follow-the-Greens cho HVN401',
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
