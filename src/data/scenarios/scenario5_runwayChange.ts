import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { findPath, routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft, ScenarioObservation } from './common';

export const scenario5RunwayChange: PresetScenarioDef = {
  id: 'lvc_peak_runway_direction_change',
  title: 'Kịch bản 5 — Đảo chiều cất/hạ cánh: So Sánh 2 Màn Hình (Truyền Thống vs FTG)',
  teaser: 'Gió đổi hướng trong giờ cao điểm LVC — So sánh song song hai màn hình: Điều hành truyền thống vs Follow-the-Green (8 tàu bay).',
  situation: 'Trong giờ cao điểm sương mù LVC (RVR < 550m) với 8 tàu bay hoạt động đồng thời (4 cất cánh, 2 hạ cánh, 2 pushback). Bất ngờ gió đổi chiều khẩn cấp từ 25 sang 07. Hệ thống mở chế độ so sánh 2 màn hình để đối chiếu hiệu quả giữa phương thức truyền thống (nghẽn sóng VHF và khóa cứng toàn sân) và A-SMGCS Level 4 (Auto-Freeze và Dijkstra FTG thông suốt).',
  challenges: [
    'So sánh trực quan 2 màn hình đồng thời với 8 tàu bay.',
    'Màn hình 1 (Truyền thống): Ùn ứ và kẹt cứng do đè sóng vô tuyến.',
    'Màn hình 2 (FTG): Auto-Freeze dừng an toàn và cấp tuyến Dijkstra theo pha không ùn tắc.'
  ],
  watchFor: [
    'Màn trái chạy luồng Truyền thống với 8 tàu bay dồn toa tại nút giao HS NS.',
    'Màn phải chạy luồng A-SMGCS + FtG với cơ chế Auto-Freeze và giải tỏa theo 2 pha.'
  ],
  setup: (g: AirportGraph = airportGraphV3) => {
    return setupScenario5Traditional(g);
  },
};

/** Khởi tạo luồng Điều hành truyền thống cho Kịch bản 5 */
export function setupScenario5Traditional(g: AirportGraph = airportGraphV3) {
  const pOut1 = findPath(g, 'v3_line_30_p01', 'v3_line_17_p09') || [];
  const pOut2 = findPath(g, 'v3_line_31_p01', 'v3_line_17_p09') || [];
  const pOut3 = findPath(g, 'v3_line_32_p01', 'v3_line_17_p09') || [];
  const pOut4 = findPath(g, 'v3_line_33_p01', 'v3_line_17_p09') || [];

  const pInb1 = [
    'v3_line_01_p01',
    'v3_line_04_p00', 'v3_line_04_p01',
    'v3_line_04_p02', 'v3_line_04_p03',
    'v3_line_05_p01', 'v3_line_18_p00',
    'v3_line_18_p01', 'v3_line_18_p02',
    'v3_line_18_p03', 'v3_line_17_p05',
    'v3_line_10_p04', 'v3_line_17_p06',
    'v3_line_11_p01', 'v3_line_17_p07',
    'v3_line_19_p03', 'v3_line_17_p08',
    'v3_line_17_p09'
  ];

  const pInb2 = [
    'v3_line_01_p01',
    'v3_line_04_p00', 'v3_line_03_p00',
    'v3_line_03_p01', 'v3_line_16_p00',
    'v3_line_17_p00', 'v3_line_05_p01',
    'v3_line_04_p04', 'v3_line_04_p05',
    'v3_line_10_p00', 'v3_line_05_p02',
    'v3_line_19_p00', 'v3_line_19_p01',
    'v3_line_19_p02', 'v3_line_19_p03',
    'v3_line_17_p08', 'v3_line_17_p09'
  ];

  const pPush1 = findPath(g, 'v3_line_32_p00', 'v3_line_17_p09') || [];
  const pPush2 = findPath(g, 'v3_line_34_p02', 'v3_line_17_p09') || [];

  const vnDef = getAirlineDef('VN');
  const vjDef = getAirlineDef('VJ');
  const qhDef = getAirlineDef('QH');
  const vuDef = getAirlineDef('VU');
  const sqDef = getAirlineDef('SQ');
  const tgDef = getAirlineDef('TG');

  const aircraft: ScenarioAircraft[] = [
    {
      id: 'S1', callsign: 'OUT01', airlineCode: 'VN', airlineName: vnDef.name, aircraftAsset: vnDef.asset, aircraftType: 'A321',
      currentNodeId: pOut1[0], targetNodeId: pOut1[pOut1.length - 1], currentEdgeId: routeToEdges(pOut1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut1, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S2', callsign: 'OUT02', airlineCode: 'VJ', airlineName: vjDef.name, aircraftAsset: vjDef.asset, aircraftType: 'A321',
      currentNodeId: pOut2[0], targetNodeId: pOut2[pOut2.length - 1], currentEdgeId: routeToEdges(pOut2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut2, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S3', callsign: 'OUT03', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pOut3[0], targetNodeId: pOut3[pOut3.length - 1], currentEdgeId: routeToEdges(pOut3, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut3, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S4', callsign: 'OUT04', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pOut4[0], targetNodeId: pOut4[pOut4.length - 1], currentEdgeId: routeToEdges(pOut4, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut4, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'ẨN: CHỜ INB ĐẾN HS_W7', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S5', callsign: 'INB01', airlineCode: 'SQ', airlineName: sqDef.name, aircraftAsset: sqDef.asset, aircraftType: 'A350',
      currentNodeId: pInb1[0], targetNodeId: pInb1[pInb1.length - 1], currentEdgeId: routeToEdges(pInb1, g.edges)?.[0] ?? null,
      progressOnEdge: 0.50, speedKts: 22, speedLimitKts: 22, status: 'taxiing', assignedRoute: pInb1, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'XẢ PHANH W4 ➔ HS NS', routeVisible: false, guidanceVisible: false,
    },
    {
      id: 'S6', callsign: 'INB02', airlineCode: 'TG', airlineName: tgDef.name, aircraftAsset: tgDef.asset, aircraftType: 'A350',
      currentNodeId: pInb2[0], targetNodeId: pInb2[pInb2.length - 1], currentEdgeId: routeToEdges(pInb2, g.edges)?.[0] ?? null,
      progressOnEdge: 0.00, speedKts: 16, speedLimitKts: 16, status: 'taxiing', assignedRoute: pInb2, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'XẢ PHANH W5 ➔ HS NS', routeVisible: false, guidanceVisible: false,
    },
    {
      id: 'S7', callsign: 'PUSH01', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pPush1[0], targetNodeId: pPush1[pPush1.length - 1], currentEdgeId: routeToEdges(pPush1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 0, status: 'holding', assignedRoute: pPush1, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'PUSHBACK STAND 11', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S8', callsign: 'PUSH02', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pPush2[0], targetNodeId: pPush2[pPush2.length - 1], currentEdgeId: routeToEdges(pPush2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 0, status: 'holding', assignedRoute: pPush2, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'PUSHBACK STAND 3', routeVisible: false, guidanceVisible: false, hidden: true,
    },
  ];

  const observations: ScenarioObservation[] = [
    {
      id: 'obs_5_1',
      text: '[CONVENTIONAL_PEAK] 8 tàu bay di chuyển dồn dập theo phương thức đàm thoại thoại VHF trong sương mù LVC.',
      required: true,
      status: 'pending',
      checkedAtSeconds: null,
      evidence: '',
      check: (s) => {
        if (s.scenarioAircraft && s.scenarioAircraft.length === 8) {
          return { pass: true, evidence: `Đang có 8 tàu bay hoạt động đồng thời` };
        }
        return { pass: false };
      },
    },
  ];

  return {
    weather: 'fog' as const,
    aircraft,
    observations,
    triggers: [],
  };
}

/** Khởi tạo luồng Follow-the-Greens cho Kịch bản 5 */
export function setupScenario5FTG(g: AirportGraph = airportGraphV3) {
  const pInb1 = findPath(g, 'v3_line_01_p01', 'v3_line_22_p01') || [
    'v3_line_01_p01', 'v3_line_04_p00', 'v3_line_04_p01', 'v3_line_04_p02', 'v3_line_04_p03',
    'v3_line_05_p01', 'v3_line_04_p04', 'v3_line_04_p05', 'v3_line_10_p00', 'v3_line_05_p02',
    'v3_line_19_p00', 'v3_line_19_p01', 'v3_line_19_p02', 'v3_line_19_p03', 'v3_line_17_p08',
    'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00', 'v3_line_13_p03', 'v3_line_22_p00', 'v3_line_22_p01'
  ];
  const pInb2 = findPath(g, 'v3_line_01_p01', 'v3_line_24_p01') || [
    'v3_line_01_p01', 'v3_line_04_p00', 'v3_line_04_p01', 'v3_line_04_p02', 'v3_line_04_p03',
    'v3_line_05_p01', 'v3_line_04_p04', 'v3_line_04_p05', 'v3_line_10_p00', 'v3_line_05_p02',
    'v3_line_19_p00', 'v3_line_19_p01', 'v3_line_19_p02', 'v3_line_19_p03', 'v3_line_17_p08',
    'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00', 'v3_line_13_p03', 'v3_line_22_p00',
    'v3_line_15_p01', 'v3_line_23_p00', 'v3_line_24_p00', 'v3_line_24_p01'
  ];

  const pOut1 = findPath(g, 'v3_line_30_p01', 'v3_line_05_p00') || [];
  const pOut2 = findPath(g, 'v3_line_31_p01', 'v3_line_05_p00') || [];
  const pOut3 = findPath(g, 'v3_line_32_p01', 'v3_line_05_p00') || [];
  const pOut4 = findPath(g, 'v3_line_33_p01', 'v3_line_05_p00') || [];

  const pPush1 = findPath(g, 'v3_line_32_p00', 'v3_line_05_p00') || [];
  const pPush2 = findPath(g, 'v3_line_34_p02', 'v3_line_05_p00') || [];

  const vnDef = getAirlineDef('VN');
  const vjDef = getAirlineDef('VJ');
  const qhDef = getAirlineDef('QH');
  const vuDef = getAirlineDef('VU');
  const sqDef = getAirlineDef('SQ');
  const tgDef = getAirlineDef('TG');

  const aircraft: ScenarioAircraft[] = [
    {
      id: 'S1', callsign: 'OUT01', airlineCode: 'VN', airlineName: vnDef.name, aircraftAsset: vnDef.asset, aircraftType: 'A321',
      currentNodeId: pOut1[0], targetNodeId: pOut1[pOut1.length - 1], currentEdgeId: routeToEdges(pOut1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 8, speedLimitKts: 8, status: 'taxiing', assignedRoute: pOut1, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'LĂN CHẬM BAN ĐẦU (8 KTS)', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S2', callsign: 'OUT02', airlineCode: 'VJ', airlineName: vjDef.name, aircraftAsset: vjDef.asset, aircraftType: 'A321',
      currentNodeId: pOut2[0], targetNodeId: pOut2[pOut2.length - 1], currentEdgeId: routeToEdges(pOut2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 8, speedLimitKts: 8, status: 'taxiing', assignedRoute: pOut2, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'LĂN CHẬM BAN ĐẦU (8 KTS)', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S3', callsign: 'OUT03', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pOut3[0], targetNodeId: pOut3[pOut3.length - 1], currentEdgeId: routeToEdges(pOut3, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 8, speedLimitKts: 8, status: 'taxiing', assignedRoute: pOut3, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'LĂN CHẬM BAN ĐẦU (8 KTS)', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S4', callsign: 'OUT04', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pOut4[0], targetNodeId: pOut4[pOut4.length - 1], currentEdgeId: routeToEdges(pOut4, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 8, speedLimitKts: 8, status: 'taxiing', assignedRoute: pOut4, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'LĂN CHẬM BAN ĐẦU (8 KTS)', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S5', callsign: 'INB01', airlineCode: 'SQ', airlineName: sqDef.name, aircraftAsset: sqDef.asset, aircraftType: 'A350',
      currentNodeId: pInb1[0], targetNodeId: pInb1[pInb1.length - 1], currentEdgeId: routeToEdges(pInb1, g.edges)?.[0] ?? null,
      progressOnEdge: 0.50, speedKts: 14, speedLimitKts: 14, status: 'taxiing', assignedRoute: pInb1, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'XẢ PHANH TIẾN VỀ W4', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S6', callsign: 'INB02', airlineCode: 'TG', airlineName: tgDef.name, aircraftAsset: tgDef.asset, aircraftType: 'A350',
      currentNodeId: pInb2[0], targetNodeId: pInb2[pInb2.length - 1], currentEdgeId: routeToEdges(pInb2, g.edges)?.[0] ?? null,
      progressOnEdge: 0.00, speedKts: 12, speedLimitKts: 12, status: 'taxiing', assignedRoute: pInb2, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'XẢ PHANH TIẾN VỀ W4', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S7', callsign: 'PUSH01', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pPush1[0], targetNodeId: pPush1[pPush1.length - 1], currentEdgeId: routeToEdges(pPush1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 4, speedLimitKts: 4, status: 'taxiing', assignedRoute: pPush1, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'CHUẨN BỊ PUSHBACK', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S8', callsign: 'PUSH02', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pPush2[0], targetNodeId: pPush2[pPush2.length - 1], currentEdgeId: routeToEdges(pPush2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 4, speedLimitKts: 4, status: 'taxiing', assignedRoute: pPush2, routeEdgeIndex: 0,
      role: 'pushback', priority: 3, scenarioLabel: 'CHUẨN BỊ PUSHBACK', routeVisible: true, guidanceVisible: true,
    },
  ];

  return {
    weather: 'fog' as const,
    aircraft,
    observations: [],
    triggers: [],
  };
}
