import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';
import { filterNonNull } from './common';

export const scenario1WrongTurn: PresetScenarioDef = {
  id: 'lvc_wrong_turn_radio_failure',
  title: 'Kịch bản 1 — Khởi hành STAND_10 qua HS NS, E6/E4, E6 đến STOP BAR 25L',
  teaser: 'HVN216 khởi hành từ STAND_10 qua ngã tư HS NS -> E6/E4 -> E6 và kết thúc hành trình an toàn tại STOP BAR 25L.',
  situation: 'Trong điều kiện tầm nhìn thấp LVC (RVR < 550m), tàu bay HVN216 khởi hành từ STAND_10 đẩy lùi quẹo phải ra Line 12, lăn dọc hành lang chính về phía Bắc. Khi đến ngã tư xung đột HS NS, hệ thống Follow-the-Greens cấp dải đèn xanh thông suốt dẫn tàu bay quẹo phải ra E6/E4, tiếp tục hành trình qua E6 và đến dừng an toàn tại vạch chờ cất cánh STOP BAR 25L.',
  challenges: [
    'Tàu bay đẩy lùi an toàn từ STAND_10 quẹo phải vào tim đường lăn Line 12.',
    'Hệ thống Follow the Greens bật đèn tim đường xanh dẫn hướng qua ngã tư HS NS và quẹo phải ra E6/E4.',
    'Duy trì lộ trình liên tục thông suốt qua E6 đến vạch dừng STOP BAR 25L.'
  ],
  watchFor: [
    'HVN216 xuất phát từ STAND_10 ra Line 12 và lăn về phía Bắc.',
    'Tại giao điểm HS NS, đèn xanh FtG dẫn hướng rẽ phải sang E6/E4.',
    'Tàu bay tiếp tục hành trình qua E6 và đến dừng an toàn tại STOP BAR 25L.'
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
      speedKts: 15,
      speedLimitKts: 15,
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
        atSeconds: 2,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '[PUSHBACK_APPROVED] HVN216 được phép đẩy lùi từ STAND_10 quẹo phải ra Line 12',
              severity: 'info',
            });
          }
          return state;
        },
      },
      {
        atSeconds: 15,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '[FTG_GUIDANCE] Đèn xanh dẫn hướng HVN216 qua HS NS và quẹo phải ra E6/E4',
              severity: 'info',
            });
          }
          return state;
        },
      },
      {
        atSeconds: 30,
        apply: (state: any) => {
          if (state.scenario) {
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '[CLEARANCE_25L] HVN216 tiếp tục qua E6 đến vạch chờ cất cánh STOP BAR 25L',
              severity: 'info',
            });
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
