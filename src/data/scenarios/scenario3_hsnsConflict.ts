import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { findPath, routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation, ScenarioTrigger } from './common';
import { resolveV3NodeId } from './common';

export const scenario3HsnsConflict: PresetScenarioDef = {
  id: 'lvc_hsns_intersection_conflict',
  title: 'Kịch bản 3 — Hai tàu bay cùng tiến vào HS NS trong LVC',
  teaser: 'HVN301 (Inbound từ W5/25L) và VJ302 (Outbound từ Stand 11) hội tụ tại HS NS — Stop Bar đỏ giữ VJ302 nhường đường.',
  situation: 'Trong điều kiện sương mù dày đặc (LVC nặng, RVR 150–200m), Tàu A (HVN301 - Inbound) từ W5/25L đang lăn về Stand 17 qua W5/W7B -> HS W7 -> HS NS. Cùng lúc, Tàu B (VJ302 - Outbound) từ Stand 11 lùi đuôi qua phải rồi lăn hướng Bắc ra STOP BAR 25L qua HS NS -> NS2. Cả hai tàu dự kiến tiến vào điểm xung đột HS NS gần như đồng thời mà tổ lái không thể nhìn thấy nhau.',
  challenges: [
    'A-SMGCS Level 4 phát hiện dự báo nguy cơ xung đột cắt ngang tại nút giao HS NS.',
    'Ưu tiên Tàu A (HVN301) đi trước để giải phóng nhanh trục lăn chính W7B.',
    'Tàu B (VJ302) nhận đèn đỏ Stop Bar dấu X trên tim đường và dừng chính xác trước HS NS.',
    'Khi Tàu A qua khỏi HS NS, đèn đỏ trước mũi Tàu B chuyển sang màu xanh lá (FtG) để Tàu B tiếp tục ra RWY 25L cất cánh.'
  ],
  watchFor: [
    'Tàu A (W5/25L -> W5/W7B -> HS W7 -> HS NS -> Stand 17) giữ đèn xanh FtG thông suốt.',
    'Tàu B (Stand 11 lùi đít qua phải -> Line 12) đến trước HS NS thì đèn xanh vụt tắt, hiện đèn Stop Bar đỏ.',
    'Tàu B dừng hẳn nhường đường trong sương mù LVC.',
    'Sau khi Tàu A thoát hoàn toàn khỏi HS NS, đèn đỏ của Tàu B chuyển xanh lá, Tàu B lăn tiếp ra STOP BAR 25L và cất cánh.'
  ],
  setup: (g: AirportGraph = airportGraphV3) => {
    const w5_25l = resolveV3NodeId('W5/25L', g) || 'v3_line_10_p01';
    const w5_w7b = resolveV3NodeId('W5/W7B', g) || 'v3_line_11_p01';
    const stand17 = resolveV3NodeId('STAND_17', g) || 'v3_line_22_p01';
    const rA1 = findPath(g, w5_25l, w5_w7b) || [];
    const rA2 = findPath(g, w5_w7b, stand17) || [];
    const tauARoute = [...rA1, ...rA2.slice(1)];
    const tauAEdges = routeToEdges(tauARoute, g.edges) ?? [];

    const stand11 = resolveV3NodeId('STAND_11', g) || 'v3_line_32_p00';
    const hsns = resolveV3NodeId('HS NS', g) || 'v3_line_17_p09';
    const e6 = resolveV3NodeId('E6', g) || 'v3_line_17_p13';
    const stopbar25l = resolveV3NodeId('STOP BAR 25L', g) || 'v3_line_17_p16';
    const pB1 = findPath(g, stand11, hsns) || [];
    const pB2 = findPath(g, hsns, e6) || [];
    const pB3 = findPath(g, e6, stopbar25l) || [];
    const tauBRoute = [...pB1, ...pB2.slice(1), ...pB3.slice(1)];
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
        scenarioLabel: 'W5/25L ➔ STAND 17 (ƯU TIÊN)',
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
        speedLimitKts: 0,
        status: 'holding',
        holdReason: 'stop-bar',
        heldSeconds: 0,
        assignedRoute: tauBRoute,
        routeEdgeIndex: 0,
        role: 'departing',
        priority: 2,
        scenarioLabel: '⛔ DỪNG CHỜ TẠI STAND 11 (NHƯỜNG HVN301)',
        clearedRoute: tauBRoute,
        routeVisible: true,
      },
    ];

    const observations: ScenarioObservation[] = [
      {
        id: 'obs_3_1',
        text: '[CONFLICT_PREDICTION] A-SMGCS phát hiện dự báo xung đột giữa HVN301 và VJ302 tại nút giao HS NS.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN301', 'VJ302'],
        check: (s) => {
          if (s.elapsedSeconds >= 4.0) {
            return { pass: true, evidence: `A-SMGCS phát hiện hội tụ tại HS NS` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_3_2',
        text: '[STOP_BAR_HOLD] VJ302 dừng chính xác trước Stop Bar của HS NS (status=holding, speed=0kts, holdReason=stop-bar).',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['VJ302'],
        check: (s) => {
          const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
          if (a2 && a2.status === 'holding' && a2.speedKts === 0 && a2.holdReason === 'stop-bar') {
            return { pass: true, evidence: `VJ302 / status=holding / speed=0kts / holdReason=stop-bar trước HS NS` };
          }
          return { pass: false };
        },
      },
      {
        id: 'obs_3_3',
        text: '[FTG_RELEASE] Sau khi HVN301 giải phóng HS NS, VJ302 tự động được cấp lại đèn xanh và tiếp tục lăn đến STOP BAR 25L.',
        required: true,
        status: 'pending',
        checkedAtSeconds: null,
        evidence: '',
        relatedAircraft: ['HVN301', 'VJ302'],
        check: (s) => {
          const a2 = s.scenarioAircraft?.find((a: any) => a.callsign === 'VJ302');
          if (a2 && (a2.status === 'taxiing' || a2.status === 'departed' || a2.status === 'arrived')) {
            return { pass: true, evidence: `VJ302 tiếp tục hành trình an toàn ra STOP BAR 25L` };
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
              message: '[LVC_WEATHER] Sương mù dày đặc RVR 150-200m — Kích hoạt hệ thống Follow-the-Greens (FtG)',
              severity: 'warning',
            });
            state.scenario.events.push({
              atSeconds: state.elapsedSeconds,
              message: '[CONFLICT_PREDICTED] A-SMGCS phát hiện nguy cơ xung đột tại nút giao HS NS',
              severity: 'warning',
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
