import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';

export const scenario4FodClosure: PresetScenarioDef = {
  id: 'lvc_w7a_sudden_closure',
  title: 'Kịch bản 4 — Phát hiện FOD tại W7A, tự động tái định tuyến qua W3 và HS_W7',
  teaser: 'FOD xuất hiện tại W7A — KSKL cảnh báo, đèn FtG tự động thu hồi và dẫn đường qua W3 và HS_W7 về Stand 16.',
  situation: 'Giai đoạn 1:\n• Tàu bay (HVN401) hạ cánh RWY 25R, lộ trình dự kiến ban đầu: RW 25R -> W4 -> W7A -> W7B -> STAND 16. Huấn lệnh ban đầu: "HVN401, vacate left via W4, cross runway 25L, taxi to stand 16 via W7A and W7B".\n\nGiai đoạn 2:\n• Khi tàu bay tới W4 chuẩn bị cắt qua Runway 25L, hệ thống phát hiện vật thể lạ FOD tại W7A MID -> Đèn FtG trên W7A bị thu hồi lập tức, Stop Bar 25L chuyển đỏ và tàu bay DỪNG LẠI trước vạch dừng.\n• Phi công đàm thoại: "HVN401, holding short of Runway 25L, unable W7A due FOD, request alternate taxi route."\n• KSVKL cấp huấn lệnh đổi tuyến mới: "HVN401, roger, cross runway 25L, taxi to stand 16 via W3 and HS_W7".\n• Stop Bar 25L giải phóng, dải đèn xanh FtG mới bật sáng dẫn tàu cắt qua 25L bẻ hướng vào W3 qua HS_W7 về Stand 16 an toàn 100%.',
  challenges: [
    'Hệ thống A-SMGCS phát hiện FOD khẩn cấp trên tim đường lăn W7A.',
    'Thu hồi dải đèn xanh FtG trên W7A ngay lập tức và bật Stop Bar đỏ giữ tàu dừng trước Runway 25L.',
    'Hiển thị đối thoại Pilot xin đổi tuyến và KSVKL cấp lộ trình thay thế.',
    'Tự động tính toán lộ trình mới qua W3, HS_W7 và cấp dải đèn xanh FtG liên tục về Stand 16.'
  ],
  watchFor: [
    'HVN401 hạ cánh RWY 25R lăn qua W4 theo vệt đèn xanh ban đầu (25R ➔ W4 ➔ W7A ➔ W7B ➔ STAND 16).',
    'FOD xuất hiện tại W7A MID: Đèn W7A tắt, Stop Bar 25L chuyển đỏ, HVN401 dừng trước Runway 25L.',
    'Hộp thoại hiển thị Pilot xin đổi tuyến và KSVKL cấp phép rẽ qua W3 và HS_W7.',
    'Dải đèn xanh mới bật sáng dẫn qua W4 ➔ 25L ➔ W3 ➔ HS_W7 ➔ Stand 16.'
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
        scenarioLabel: '25R ➔ W4 ➔ W7A ➔ W7B ➔ STAND 16',
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
        text: '[FTG_REROUTE] Hệ thống FtG thu hồi đèn W7A và tự động dẫn hướng qua W3 và HS_W7 về Stand 16.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN401');
          if (ac && (ac.assignedRoute?.includes('v3_line_19_p03') || ac.assignedRoute?.includes('v3_line_05_p02') || ac.assignedRoute?.includes('v3_line_17_p01'))) {
            return { pass: true, evidence: `Đã tự động chuyển tuyến qua W3 và HS_W7` };
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
                message: '📻 [ATC CLEARANCE] "HVN401, vacate left via W4, cross runway 25L, taxi to stand 16 via W7A and W7B"',
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
