import type { AirportGraph } from '../../types';
import { airportGraphV3 } from '../airportGraph.v3';
import { getAirlineDef } from '../airlineTypes';
import { routeToEdges } from '../../simulation/pathfinding';
import type { PresetScenarioDef, ScenarioAircraft } from './common';

export const scenario5RunwayChange: PresetScenarioDef = {
  id: 'lvc_peak_runway_direction_change',
  title: 'Kịch bản 5 — Đảo chiều cất/hạ cánh Runway Change 07R',
  teaser: 'Gió đổi hướng trong LVC — So sánh song song: Điều hành truyền thống ùn tắc tại NS2 vs Follow-the-Green điều phối 6 tàu bay mượt mà.',
  situation: 'Giai đoạn 1 (FtG):\n• Tàu bay 1 (INB01): Hạ cánh RW 25R lăn vào W4 về bến đỗ 17. Đến W7A thì dừng chờ trước ngã ba, nhường đường cho tàu bay 2 và tàu bay 3 đi qua rồi mới tiếp tục vào bến đỗ 17 (RW 25R - W4 - CROSS 25L - W7A [DỪNG] - HS NS - STAND 17).\n• Tàu bay 2 (OUT01): từ Stand 9 taxi ra RW 25L (STAND 9 - HS NS - E6 - RW 25L).\n• Tàu bay 3 (OUT02): từ Stand 12 taxi ra nối đuôi tàu bay 2 ra RW 25L (STAND 12 - HS NS - E6 - RW 25L).\n\nGiai đoạn 2:\n• Tàu bay 2 di chuyển đến đoạn rẽ vào E6, KSVKL thông báo đổi chiều đường chc "RUNWAY CHANGE 07R". Tàu bay 2 và 3 nối đuôi nhau di chuyển qua đầu RW 07R (E6 - RW 25L - NS2 - HS NS - W7B - W11 - RW 07R).\n\nGiai đoạn 3:\n• Tàu bay 4 ở Stand 8, Tàu bay 5 ở Stand 11, Tàu bay 6 ở Stand 4 lần lượt pushback và di chuyển nối đuôi nhau (cách nhau khoảng 2s) ra RW 07R (STAND ... - HS NS - W7 - W11 - RW 07R).\n\nĐối với Kịch bản truyền thống:\n• Giai đoạn 1: Tàu bay 1 đến HS NS thì dừng lại. Tàu bay 2 và 3 đến NS2 thì dừng lại do xung đột với tàu 1 (tàu 4, 5, 6 chưa xuất hiện).\n• Giai đoạn 2: Đến khi FtG bắt đầu chạy tàu 4 thì màn truyền thống: tàu 1 đi qua NS vào bến 17, tàu 2 & 3 tiếp tục đi ra RW 07R. Tàu 4, 5, 6 ở Stand chưa đến lượt.',
  challenges: [
    'So sánh trực quan 2 màn hình đồng thời với 6 tàu bay.',
    'Màn hình 1 (Truyền thống): Ùn ứ và dừng nghẽn tại nút giao NS2 do đè sóng đàm thoại.',
    'Màn hình 2 (FTG): Nhường đường tự động tại ngã ba W7A, chuyển hướng Dijkstra thông suốt ra RW 07R theo 3 giai đoạn.'
  ],
  watchFor: [
    'Màn trái chạy luồng Truyền thống: Tàu 1 dừng tại HS NS, Tàu 2 & 3 dừng nghẽn tại NS2.',
    'Màn phải chạy luồng FtG: Tàu 1 dừng chờ tại W7A, nhường Tàu 2 & 3 rẽ ra 07R trước khi lăn về Stand 17.',
    'Giai đoạn 3: Tàu 4 (Stand 8), Tàu 5 (Stand 11), Tàu 6 (Stand 4) lần lượt pushback cách nhau 2s ra đầu 07R.'
  ],
  setup: (g: AirportGraph = airportGraphV3) => {
    return setupScenario5FTG(g);
  },
};

/** Khởi tạo luồng Điều hành truyền thống cho Kịch bản 5 */
export function setupScenario5Traditional(g: AirportGraph = airportGraphV3) {
  // 1. INB01: Hạ cánh 25R lăn qua W4 -> W7A -> đến HS NS thì DỪNG LẠI
  const pInb1 = [
    'v3_line_01_p03', 'v3_line_01_p02', 'v3_line_06_p00', 'v3_line_01_p01',
    'v3_line_04_p00', 'v3_line_04_p01', 'v3_line_04_p02', 'v3_line_04_p03',
    'v3_line_05_p01', 'v3_line_18_p00', 'v3_line_18_p01', 'v3_line_18_p02',
    'v3_line_18_p03', 'v3_line_17_p05', 'v3_line_10_p04', 'v3_line_17_p06',
    'v3_line_11_p01', 'v3_line_17_p07', 'v3_line_19_p03', 'v3_line_17_p08',
    'v3_line_17_p09', // HS NS (DỪNG TẠI ĐÂY Ở GIAI ĐOẠN 1)
    'v3_line_17_p10', 'v3_line_21_p00', 'v3_line_13_p03', 'v3_line_22_p00',
    'v3_line_22_p01'  // STAND 17
  ];

  // 2. OUT01: Stand 9 -> HS NS -> E6 -> RW 25L -> NS2 (DỪNG TẠI NS2 Ở GIAI ĐOẠN 1) -> sau đó tiếp tục ra 07R
  const pOut1 = [
    'v3_line_27_p01', 'v3_line_27_p00', 'v3_line_17_p09', 'v3_line_17_p10',
    'v3_line_21_p00', 'v3_line_13_p03', 'v3_line_22_p00', 'v3_line_15_p01',
    'v3_line_23_p00', 'v3_line_24_p00', 'v3_line_25_p00', 'v3_line_17_p11',
    'v3_line_17_p12', 'v3_line_17_p13', 'v3_line_17_p14', 'v3_line_17_p15',
    'v3_line_05_p07', 'v3_line_17_p16', 'v3_line_05_p07', 'v3_line_26_p00',
    'v3_line_05_p06', 'v3_line_09_p01', 'v3_line_13_p00', 'v3_line_05_p05',
    'v3_line_07_p01', 'v3_line_06_p03', 'v3_line_05_p04', 'v3_line_12_p01', // NS2 (DỪNG)
    'v3_line_12_p02', 'v3_line_17_p09', 'v3_line_17_p08', 'v3_line_19_p03',
    'v3_line_17_p07', 'v3_line_11_p01', 'v3_line_17_p06', 'v3_line_10_p04',
    'v3_line_17_p05', 'v3_line_18_p03', 'v3_line_17_p04', 'v3_line_16_p04',
    'v3_line_17_p03', 'v3_line_16_p03', 'v3_line_16_p02', 'v3_line_16_p01',
    'v3_line_16_p00'
  ];

  // 3. OUT02: Stand 12 -> HS NS -> E6 -> RW 25L -> NS2 (DỪNG THEO ĐUÔI OUT01)
  const pOut2 = [
    'v3_line_31_p00', 'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00',
    'v3_line_27_p00', 'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00',
    'v3_line_13_p03', 'v3_line_22_p00', 'v3_line_15_p01', 'v3_line_23_p00',
    'v3_line_24_p00', 'v3_line_25_p00', 'v3_line_17_p11', 'v3_line_17_p12',
    'v3_line_17_p13', 'v3_line_17_p14', 'v3_line_17_p15', 'v3_line_05_p07',
    'v3_line_17_p16', 'v3_line_05_p07', 'v3_line_26_p00', 'v3_line_05_p06',
    'v3_line_09_p01', 'v3_line_13_p00', 'v3_line_05_p05', 'v3_line_07_p01',
    'v3_line_06_p03', 'v3_line_05_p04', 'v3_line_12_p01', 'v3_line_12_p02',
    'v3_line_17_p09', 'v3_line_17_p08', 'v3_line_19_p03', 'v3_line_17_p07',
    'v3_line_11_p01', 'v3_line_17_p06', 'v3_line_10_p04', 'v3_line_17_p05',
    'v3_line_18_p03', 'v3_line_17_p04', 'v3_line_16_p04', 'v3_line_17_p03',
    'v3_line_16_p03', 'v3_line_16_p02', 'v3_line_16_p01', 'v3_line_16_p00'
  ];

  // Common corridor to 07R
  const pCommon07R = [
    'v3_line_17_p09', 'v3_line_17_p08', 'v3_line_19_p03', 'v3_line_17_p07',
    'v3_line_11_p01', 'v3_line_17_p06', 'v3_line_10_p04', 'v3_line_17_p05',
    'v3_line_18_p03', 'v3_line_17_p04', 'v3_line_16_p04', 'v3_line_17_p03',
    'v3_line_16_p03', 'v3_line_16_p02', 'v3_line_16_p01', 'v3_line_16_p00'
  ];

  const pOut3 = ['v3_line_28_p01', 'v3_line_28_p00', 'v3_line_27_p00', ...pCommon07R];
  const pOut4 = ['v3_line_32_p00', 'v3_line_32_p01', 'v3_line_12_p03', 'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00', 'v3_line_27_p00', ...pCommon07R];
  const pOut5 = ['v3_line_35_p00', 'v3_line_35_p01', 'v3_line_34_p00', 'v3_line_33_p01', 'v3_line_32_p01', 'v3_line_12_p03', 'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00', 'v3_line_27_p00', ...pCommon07R];

  const vnDef = getAirlineDef('VN');
  const vjDef = getAirlineDef('VJ');
  const qhDef = getAirlineDef('QH');
  const vuDef = getAirlineDef('VU');
  const sqDef = getAirlineDef('SQ');
  const tgDef = getAirlineDef('TG');

  const aircraft: ScenarioAircraft[] = [
    {
      id: 'S1', callsign: 'INB01', airlineCode: 'SQ', airlineName: sqDef.name, aircraftAsset: sqDef.asset, aircraftType: 'A350',
      currentNodeId: pInb1[0], targetNodeId: pInb1[pInb1.length - 1], currentEdgeId: routeToEdges(pInb1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pInb1, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'HẠ CÁNH 25R ➔ W4 ➔ STAND 17', routeVisible: false, guidanceVisible: false,
    },
    {
      id: 'S2', callsign: 'OUT01', airlineCode: 'VJ', airlineName: vjDef.name, aircraftAsset: vjDef.asset, aircraftType: 'A321',
      currentNodeId: pOut1[0], targetNodeId: pOut1[pOut1.length - 1], currentEdgeId: routeToEdges(pOut1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pOut1, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 9 ➔ E6 ➔ RW 25L', routeVisible: false, guidanceVisible: false,
    },
    {
      id: 'S3', callsign: 'OUT02', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pOut2[0], targetNodeId: pOut2[pOut2.length - 1], currentEdgeId: routeToEdges(pOut2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pOut2, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 12 ➔ E6 ➔ RW 25L', routeVisible: false, guidanceVisible: false,
    },
    {
      id: 'S4', callsign: 'OUT03', airlineCode: 'VN', airlineName: vnDef.name, aircraftAsset: vnDef.asset, aircraftType: 'A321',
      currentNodeId: pOut3[0], targetNodeId: pOut3[pOut3.length - 1], currentEdgeId: routeToEdges(pOut3, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut3, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 8 (CHỜ LƯỢT)', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S5', callsign: 'OUT04', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pOut4[0], targetNodeId: pOut4[pOut4.length - 1], currentEdgeId: routeToEdges(pOut4, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut4, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 11 (CHỜ LƯỢT)', routeVisible: false, guidanceVisible: false, hidden: true,
    },
    {
      id: 'S6', callsign: 'OUT05', airlineCode: 'TG', airlineName: tgDef.name, aircraftAsset: tgDef.asset, aircraftType: 'A350',
      currentNodeId: pOut5[0], targetNodeId: pOut5[pOut5.length - 1], currentEdgeId: routeToEdges(pOut5, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut5, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 4 (CHỜ LƯỢT)', routeVisible: false, guidanceVisible: false, hidden: true,
    },
  ];

  return {
    weather: 'fog' as const,
    aircraft,
    observations: [],
    triggers: [],
  };
}

/** Khởi tạo luồng Follow-the-Greens cho Kịch bản 5 */
export function setupScenario5FTG(g: AirportGraph = airportGraphV3) {
  // 1. INB01: Hạ cánh 25R lăn vào W4 về Stand 17 (Dừng chờ tại W7A nhường OUT01 & OUT02)
  const pInb1 = [
    'v3_line_01_p03', 'v3_line_01_p02', 'v3_line_06_p00', 'v3_line_01_p01',
    'v3_line_04_p00', 'v3_line_04_p01', 'v3_line_04_p02', 'v3_line_04_p03',
    'v3_line_05_p01', 'v3_line_18_p00', 'v3_line_18_p01', 'v3_line_18_p02',
    'v3_line_18_p03', // W7A (DỪNG CHỜ TẠI NGÃ BA)
    'v3_line_17_p05', 'v3_line_10_p04', 'v3_line_17_p06',
    'v3_line_11_p01', 'v3_line_17_p07', 'v3_line_19_p03', 'v3_line_17_p08',
    'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00', 'v3_line_13_p03',
    'v3_line_22_p00', 'v3_line_22_p01' // STAND 17
  ];

  // Tuyến đường ra RW 07R đầy đủ
  const pOut1 = [
    'v3_line_27_p01', 'v3_line_27_p00', 'v3_line_17_p09', 'v3_line_17_p10',
    'v3_line_21_p00', 'v3_line_13_p03', 'v3_line_22_p00', 'v3_line_15_p01',
    'v3_line_23_p00', 'v3_line_24_p00', 'v3_line_25_p00', 'v3_line_17_p11',
    'v3_line_17_p12', 'v3_line_17_p13', 'v3_line_17_p14', 'v3_line_17_p15',
    'v3_line_05_p07', 'v3_line_17_p16', 'v3_line_05_p07', 'v3_line_26_p00',
    'v3_line_05_p06', 'v3_line_09_p01', 'v3_line_13_p00', 'v3_line_05_p05',
    'v3_line_07_p01', 'v3_line_06_p03', 'v3_line_05_p04', 'v3_line_12_p01',
    'v3_line_12_p02', 'v3_line_17_p09', 'v3_line_17_p08', 'v3_line_19_p03',
    'v3_line_17_p07', 'v3_line_11_p01', 'v3_line_17_p06', 'v3_line_10_p04',
    'v3_line_17_p05', 'v3_line_18_p03', 'v3_line_17_p04', 'v3_line_16_p04',
    'v3_line_17_p03', 'v3_line_16_p03', 'v3_line_16_p02', 'v3_line_16_p01',
    'v3_line_16_p00'
  ];

  const pOut2 = [
    'v3_line_31_p00', 'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00',
    'v3_line_27_p00', 'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00',
    'v3_line_13_p03', 'v3_line_22_p00', 'v3_line_15_p01', 'v3_line_23_p00',
    'v3_line_24_p00', 'v3_line_25_p00', 'v3_line_17_p11', 'v3_line_17_p12',
    'v3_line_17_p13', 'v3_line_17_p14', 'v3_line_17_p15',
    'v3_line_05_p07', 'v3_line_17_p16', 'v3_line_05_p07', 'v3_line_26_p00',
    'v3_line_05_p06', 'v3_line_09_p01', 'v3_line_13_p00', 'v3_line_05_p05',
    'v3_line_07_p01', 'v3_line_06_p03', 'v3_line_05_p04', 'v3_line_12_p01',
    'v3_line_12_p02', 'v3_line_17_p09', 'v3_line_17_p08', 'v3_line_19_p03',
    'v3_line_17_p07', 'v3_line_11_p01', 'v3_line_17_p06', 'v3_line_10_p04',
    'v3_line_17_p05', 'v3_line_18_p03', 'v3_line_17_p04', 'v3_line_16_p04',
    'v3_line_17_p03', 'v3_line_16_p03', 'v3_line_16_p02', 'v3_line_16_p01',
    'v3_line_16_p00'
  ];

  // Hành lang chung ra đầu 07R
  const pCommon07R = [
    'v3_line_17_p09', 'v3_line_17_p08', 'v3_line_19_p03', 'v3_line_17_p07',
    'v3_line_11_p01', 'v3_line_17_p06', 'v3_line_10_p04', 'v3_line_17_p05',
    'v3_line_18_p03', 'v3_line_17_p04', 'v3_line_16_p04', 'v3_line_17_p03',
    'v3_line_16_p03', 'v3_line_16_p02', 'v3_line_16_p01', 'v3_line_16_p00'
  ];

  // 4. OUT03: Stand 8 -> HS NS -> W7 -> W11 -> RW 07R
  const pOut3 = ['v3_line_28_p01', 'v3_line_28_p00', 'v3_line_27_p00', ...pCommon07R];

  // 5. OUT04: Stand 11 -> Line 12 -> HS NS -> W7 -> W11 -> RW 07R
  const pOut4 = ['v3_line_32_p00', 'v3_line_32_p01', 'v3_line_12_p03', 'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00', 'v3_line_27_p00', ...pCommon07R];

  // 6. OUT05: Stand 4 -> Line 12 -> HS NS -> W7 -> W11 -> RW 07R
  const pOut5 = ['v3_line_35_p00', 'v3_line_35_p01', 'v3_line_34_p00', 'v3_line_33_p01', 'v3_line_32_p01', 'v3_line_12_p03', 'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00', 'v3_line_27_p00', ...pCommon07R];

  const vnDef = getAirlineDef('VN');
  const vjDef = getAirlineDef('VJ');
  const qhDef = getAirlineDef('QH');
  const vuDef = getAirlineDef('VU');
  const sqDef = getAirlineDef('SQ');
  const tgDef = getAirlineDef('TG');

  const aircraft: ScenarioAircraft[] = [
    {
      id: 'S1', callsign: 'INB01', airlineCode: 'SQ', airlineName: sqDef.name, aircraftAsset: sqDef.asset, aircraftType: 'A350',
      currentNodeId: pInb1[0], targetNodeId: pInb1[pInb1.length - 1], currentEdgeId: routeToEdges(pInb1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pInb1, routeEdgeIndex: 0,
      role: 'arriving', priority: 1, scenarioLabel: 'HẠ CÁNH 25R ➔ W4 ➔ CROSS 25L ➔ W7A', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S2', callsign: 'OUT01', airlineCode: 'VJ', airlineName: vjDef.name, aircraftAsset: vjDef.asset, aircraftType: 'A321',
      currentNodeId: pOut1[0], targetNodeId: pOut1[pOut1.length - 1], currentEdgeId: routeToEdges(pOut1, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pOut1, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 9 ➔ HS NS ➔ E6', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S3', callsign: 'OUT02', airlineCode: 'QH', airlineName: qhDef.name, aircraftAsset: qhDef.asset, aircraftType: 'A321',
      currentNodeId: pOut2[0], targetNodeId: pOut2[pOut2.length - 1], currentEdgeId: routeToEdges(pOut2, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 20, speedLimitKts: 20, status: 'taxiing', assignedRoute: pOut2, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 12 ➔ NỐI ĐUÔI TÀU 2 ➔ E6', routeVisible: true, guidanceVisible: true,
    },
    {
      id: 'S4', callsign: 'OUT03', airlineCode: 'VN', airlineName: vnDef.name, aircraftAsset: vnDef.asset, aircraftType: 'A321',
      currentNodeId: pOut3[0], targetNodeId: pOut3[pOut3.length - 1], currentEdgeId: routeToEdges(pOut3, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut3, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 8 (CHỜ GIAI ĐOẠN 3 PUSHBACK)', routeVisible: false, guidanceVisible: false,
      hidden: false, releaseAtSeconds: 16,
    },
    {
      id: 'S5', callsign: 'OUT04', airlineCode: 'VU', airlineName: vuDef.name, aircraftAsset: vuDef.asset, aircraftType: 'A321',
      currentNodeId: pOut4[0], targetNodeId: pOut4[pOut4.length - 1], currentEdgeId: routeToEdges(pOut4, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut4, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 11 (CHỜ GIAI ĐOẠN 3 PUSHBACK)', routeVisible: false, guidanceVisible: false,
      hidden: false, releaseAtSeconds: 18,
    },
    {
      id: 'S6', callsign: 'OUT05', airlineCode: 'TG', airlineName: tgDef.name, aircraftAsset: tgDef.asset, aircraftType: 'A350',
      currentNodeId: pOut5[0], targetNodeId: pOut5[pOut5.length - 1], currentEdgeId: routeToEdges(pOut5, g.edges)?.[0] ?? null,
      progressOnEdge: 0, speedKts: 0, speedLimitKts: 20, status: 'holding', assignedRoute: pOut5, routeEdgeIndex: 0,
      role: 'departing', priority: 2, scenarioLabel: 'STAND 4 (CHỜ GIAI ĐOẠN 3 PUSHBACK)', routeVisible: false, guidanceVisible: false,
      hidden: false, releaseAtSeconds: 20,
    },
  ];

  return {
    weather: 'fog' as const,
    aircraft,
    observations: [],
    triggers: [],
  };
}
