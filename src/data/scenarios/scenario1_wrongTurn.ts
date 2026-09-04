import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';
import { filterNonNull } from './common';

export const scenario1WrongTurn: PresetScenarioDef = {
  id: 'lvc_wrong_turn_radio_failure',
  title: 'Kịch bản 1 — Huấn lệnh STAND 10 qua HS NS, E6 ra RWY 25L',
  teaser: 'KSVKL cấp huấn lệnh HVN216 lăn ra 25L qua NS & E6 — Truyền thống rẽ nhầm vào E4 bị chặn dừng vs FtG dẫn đúng ra E6.',
  situation: 'Giai đoạn 1: KSVKL cấp huấn lệnh cho tàu bay "HVN216 taxi to holding point runway 25L via NS and E6 taxiways".\n\nGiai đoạn 2:\n• Kịch bản truyền thống: Tàu bay đi theo tuyến STAND 10 -> HS NS -> E4. Khi vừa rẽ vào E4 (thay vì E6), hệ thống phát hiện đi sai đường, kích hoạt đèn đỏ cảnh báo và dừng kịch bản.\n• Kịch bản FtG: Tàu bay đi STAND 10 -> HS NS -> E6/E4 -> E6 -> STOP BAR 25L. Đèn xanh FtG dẫn đường liên tục và chính xác trước mũi tàu bay.',
  challenges: [
    'Giai đoạn 1: Tiếp nhận và xác nhận huấn lệnh thoại "HVN216 taxi to holding point runway 25L via NS and E6 taxiways".',
    'Giai đoạn 2 (Truyền thống): Không có đèn dẫn đường, phi công rẽ nhầm vào E4 và bị phát hiện sai lộ trình.',
    'Giai đoạn 2 (FtG): Dải đèn xanh bật sáng dẫn hướng trực quan qua HS NS -> E6/E4 -> E6 đến STOP BAR 25L an toàn 100%.'
  ],
  watchFor: [
    'HVN216 nhận huấn lệnh từ KSVKL tại STAND 10.',
    'Dải đèn xanh FtG dẫn đường chuẩn xác qua tim đường lăn E6.',
    'Tại nút giao E6/E4, đèn FtG ngăn ngừa tuyệt đối nguy cơ rẽ nhầm sang E4.'
  ],
  setup: (g: AirportGraph = airportGraphV3) => {
    const fullRoute = [
      'v3_line_33_p00', // STAND_10
      'v3_line_33_p01',
      'v3_line_32_p01',
      'v3_line_12_p03', // T69
      'v3_line_31_p01',
      'v3_line_30_p01', // L28_ENT
      'v3_line_28_p00',
      'v3_line_27_p00',
      'v3_line_17_p09', // HS_NS
      'v3_line_17_p10', // QUẸO PHẢI TẠI HS NS RA PHÍA ĐÔNG
      'v3_line_21_p00',
      'v3_line_13_p03',
      'v3_line_22_p00',
      'v3_line_15_p01', // INTL_S2
      'v3_line_23_p00', // INTL_S3
      'v3_line_24_p00', // INTL_S4
      'v3_line_25_p00', // T38
      'v3_line_17_p11',
      'v3_line_17_p12', // T39 / E6/E4
      'v3_line_17_p13', // E6
      'v3_line_17_p14',
      'v3_line_17_p15', // L03_P18
      'v3_line_05_p07',
      'v3_line_17_p16', // STOP BAR 25L
    ];
    const fullEdges = routeToEdges(fullRoute, g.edges) ?? [];

    const vnAirline = getAirlineDef('VN');
    const rawAc: ScenarioAircraft = {
      id: 'S1',
      callsign: 'HVN216',
      airlineCode: 'VN',
      airlineName: vnAirline.name,
      aircraftAsset: vnAirline.asset,
      aircraftType: 'A321',
      currentNodeId: fullRoute[0],
      targetNodeId: fullRoute[fullRoute.length - 1],
      currentEdgeId: fullEdges[0] ?? null,
      progressOnEdge: 0,
      speedKts: 20,
      speedLimitKts: 20,
      status: 'taxiing',
      assignedRoute: fullRoute,
      routeEdgeIndex: 0,
      role: 'departing',
      priority: 1,
      scenarioLabel: 'KHỞI HÀNH 25L',
      clearedRoute: fullRoute,
      routeVisible: true,
    };

    const observations: ScenarioObservation[] = [
      {
        id: 'obs_1_1',
        text: '[PUSHBACK_LINE12] HVN216 từ STAND_10 đẩy lùi quẹo phải ra Line 12 và lăn về phía Bắc hướng đến HS NS.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN216'],
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
          if (ac && ac.routeEdgeIndex >= 1) {
            return { pass: true, evidence: `HVN216 đã ra Line 12 và đang lăn về HS NS (edge index: ${ac.routeEdgeIndex})` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_1_2',
        text: '[HS_NS_E6_E4] HVN216 qua ngã tư HS NS, quẹo phải hướng ra E6/E4 và tiếp tục tới E6.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN216'],
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
          if (ac && ac.routeEdgeIndex >= 15) {
            return { pass: true, evidence: `HVN216 đã qua HS NS và quẹo phải sang E6/E4 thành công` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_1_3',
        text: '[REACH_STOP_BAR_25L] HVN216 di chuyển an toàn và đến dừng tại vạch chờ STOP BAR 25L.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN216'],
        check: (s) => {
          const ac = s.scenarioAircraft?.find((a: any) => a.callsign === 'HVN216');
          if (ac && (ac.status === 'arrived' || ac.routeEdgeIndex >= fullRoute.length - 2)) {
            return { pass: true, evidence: `HVN216 đã đến điểm kết thúc STOP BAR 25L` };
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
                message: '📻 [ATC CLEARANCE] "HVN216 taxi to holding point runway 25L via NS and E6 taxiways"',
                severity: 'info',
              },
            ];
          }
          return state;
        },
      },
      {
        atSeconds: 15,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events = [
              ...state.scenario.events,
              {
                atSeconds: state.elapsedSeconds,
                message: '[FTG_GUIDANCE] Đèn xanh dẫn hướng HVN216 qua HS NS và quẹo phải ra E6/E4',
                severity: 'info',
              },
            ];
          }
          return state;
        },
      },
      {
        atSeconds: 30,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events = [
              ...state.scenario.events,
              {
                atSeconds: state.elapsedSeconds,
                message: '[CLEARANCE_25L] HVN216 tiếp tục qua E6 đến vạch chờ cất cánh STOP BAR 25L',
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
      aircraft: filterNonNull([rawAc]),
      observations,
      triggers,
    };
  },
};
