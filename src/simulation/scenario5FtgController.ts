import type { AirportGraph, SimulationState } from '../types';
import type { ScenarioAircraft } from '../data/presetScenarios';
import { setupScenario5FTG } from '../data/presetScenarios';
import { routeToEdges } from './pathfinding';
import { createFlightMotion } from './flightMotion';

export const SCENARIO5_ID = 'lvc_peak_runway_direction_change';
// 2D FTG base departure duration (seconds)
export const DEPARTURE_RELEASE_SECONDS = 14;

export interface FtgEvent {
  time: number;
  text: string;
}

export interface Scenario5FtgProgress {
  initialClearances: boolean;
  stage3Announced: boolean;
  stage3Start: number | null;
  runwayChanged: boolean;
  departures: Record<string, number>;
  events: FtgEvent[];
}

const createProgress = (): Scenario5FtgProgress => ({
  initialClearances: false,
  stage3Announced: false,
  stage3Start: null,
  runwayChanged: false,
  departures: {},
  events: [],
});

/**
 * Controller FTG Kịch bản 5 dành cho mô phỏng 3D:
 * - Đảm bảo chính xác 100% các mốc thời gian, giãn cách và huấn lệnh như màn hình 2D
 * - Hỗ trợ đầy đủ cất cánh động học 3D (lineup -> roll -> rotate -> climb) ở đầu 07R
 */
export function prepareScenario5FtgTick(prev: SimulationState, graph: AirportGraph, _dt: number = 0.05): SimulationState {
  const currentSec = prev.elapsedSeconds;
  const routes = setupScenario5FTG(graph).aircraft;
  const pOut1Full = routes.find(ac => ac.callsign === 'OUT01')!.assignedRoute;
  const pOut2Full = routes.find(ac => ac.callsign === 'OUT02')!.assignedRoute;

  const progress: Scenario5FtgProgress = {
    ...createProgress(),
    ...prev.scenario?.ftgProgress,
    departures: { ...prev.scenario?.ftgProgress?.departures },
  };

  const stateToTick: SimulationState = {
    ...prev,
    scenario: { ...prev.scenario, ftgProgress: progress },
  };

  const setFtgEvents = (append: (events: FtgEvent[]) => FtgEvent[]) => {
    const prevLen = progress.events.length;
    progress.events = append(progress.events);
    const added = progress.events.slice(prevLen);
    if (stateToTick.scenario && added.length > 0) {
      stateToTick.scenario.events = [
        ...(stateToTick.scenario.events ?? []),
        ...added.map(ev => ({
          atSeconds: ev.time,
          message: ev.text,
          severity: 'info' as const,
        })),
      ];
    }
  };

  // Giai đoạn 1: Khi 3 tàu cùng xuất hiện ở đầu kịch bản, phát đồng thời cả 3 huấn lệnh cho Tàu 1, 2, 3
  if (currentSec >= 0.5 && !progress.initialClearances) {
    progress.initialClearances = true;
    setFtgEvents(e => [
      ...e,
      { time: 0, text: '🟢 KSVKL: "INB01, taxi to stand 17"' },
      { time: 0, text: '🟢 KSVKL: "OUTB01, taxi to holding point runway 25L"' },
      { time: 0, text: '🟢 KSVKL: "OUTB02, taxi to holding point runway 25L"' },
    ]);
  }

  if (progress.stage3Start !== null && !progress.stage3Announced) {
    progress.stage3Announced = true;
    setFtgEvents(e => [
      ...e,
      { time: Math.round(currentSec), text: '🛫 KSVKL: "OUTB03, OUTB04, OUTB05, pushback and taxi to holding point runway 07R"' },
    ]);
  }

  // Đảm bảo không có comicBubble che màn hình
  stateToTick.comicBubble = undefined;

  // Helper kiểm tra tàu bay đã hoàn thành cất cánh và biến mất hoàn toàn
  const isPlaneGone = (callsign: string) => {
    const target = stateToTick.scenarioAircraft?.find(a => a.callsign === callsign);
    if (!target) return true;
    if (target.hidden) return true;
    if (progress.departures[callsign] !== undefined && !target.flight && target.status === 'departed') return true;
    return false;
  };

  const isPlaneAtRunway07R = (callsign: string): boolean => {
    const target = stateToTick.scenarioAircraft?.find(a => a.callsign === callsign);
    if (!target) return false;
    return target.currentNodeId === 'v3_line_16_p00' || Boolean(target.flight);
  };

  // Kiểm tra xem Tàu 1 (INB01) đã vào bến Stand 17 chưa
  const inb1 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'INB01');
  const inb1Finished = inb1
    ? (inb1.status === 'arrived' || inb1.currentNodeId === 'v3_line_22_p01' || (inb1.routeEdgeIndex >= (inb1.assignedRoute?.length ?? 1) - 1))
    : false;

  const out1Finished = isPlaneGone('OUT01');
  const out2Finished = isPlaneGone('OUT02');
  const out3Finished = isPlaneGone('OUT03');
  const out4Finished = isPlaneGone('OUT04');

  // Giai đoạn 3 chỉ bắt đầu KHI CẢ 3 TÀU BAY 1, 2, 3 ĐÃ KẾT THÚC GIAI ĐOẠN 1 & 2
  const stage1And2AllFinished = inb1Finished && out1Finished && out2Finished;
  if (stage1And2AllFinished && progress.stage3Start === null) {
    progress.stage3Start = currentSec;
  }

  // Hàm xử lý cất cánh 3D cho các tàu bay tại đầu 07R (v3_line_16_p00)
  const handle07RDeparture = (ac: ScenarioAircraft, callsign: string): ScenarioAircraft => {
    // Nếu tàu bay đã cất cánh bay lên trời xong hoặc đã ẩn đi
    if (ac.hidden || (progress.departures[callsign] !== undefined && !ac.flight)) {
      return {
        ...ac,
        status: 'departed',
        hidden: true,
        speedKts: 0,
        speedLimitKts: 0,
        scenarioLabel: '✓ ĐÃ CẤT CÁNH & RỜI VÙNG TRỜI',
      };
    }

    if (!ac.flight && progress.departures[callsign] === undefined) {
      const departureFlight = createFlightMotion({ ...ac, currentNodeId: 'v3_line_16_p00' }, graph, 'departure');
      if (departureFlight) {
        return {
          ...ac,
          flight: departureFlight,
          currentNodeId: 'v3_line_16_p00',
          currentEdgeId: null,
          status: 'taxiing',
          guidanceVisible: false,
          scenarioLabel: '🛫 VÀO ĐƯỜNG BĂNG 07R (LINE UP)',
        };
      }
    }

    if (ac.flight) {
      const phase = ac.flight.phase;
      let label = '🛫 VÀO ĐƯỜNG BĂNG 07R (LINE UP)';
      if (phase === 'takeoff-roll') {
        label = '🛫 ĐANG CHẠY ĐÀ CẤT CÁNH RW 07R';
      } else if (phase === 'rotate' || phase === 'climb') {
        label = '🛫 CẤT CÁNH BAY LÊN (CLIMB)';
      }
      return { ...ac, scenarioLabel: label };
    }

    // Khi chuyến bay kết thúc (vừa bay hết pha leo cao trong advanceFlight)
    progress.departures[callsign] = currentSec;
    return {
      ...ac,
      status: 'departed',
      hidden: true,
      speedKts: 0,
      speedLimitKts: 0,
      scenarioLabel: '✓ ĐÃ CẤT CÁNH & RỜI VÙNG TRỜI',
    };
  };

  // Thuật toán điều phối luồng 6 tàu bay trên màn FTG
  stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
    // 1. INB01: Hạ cánh 25R lăn vào W4, đến W7A thì DỪNG CHỜ nhường Tàu 2 và Tàu 3
    if (ac.callsign === 'INB01') {
      if (!ac.flight && (ac.routeEdgeIndex === 0 || ac.currentNodeId === 'v3_line_01_p03') && currentSec < 3.0) {
        const arrivalFlight = createFlightMotion(ac, graph, 'arrival');
        if (arrivalFlight) {
          return {
            ...ac,
            flight: arrivalFlight,
            speedKts: 140,
            scenarioLabel: '🛬 TIẾP CẬN ĐƯỜNG BĂNG 25R',
          };
        }
      }
      if (ac.flight) {
        return ac;
      }

      const isAtStand17 = ac.currentNodeId === 'v3_line_22_p01' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
      if (isAtStand17) {
        return {
          ...ac,
          status: 'arrived',
          speedKts: 0,
          speedLimitKts: 0,
          scenarioLabel: '✓ ĐÃ VỀ BẾN STAND 17',
        };
      }

      // Tàu 1 dừng chờ tại nút W7A MID (v3_line_18_p02) cho đến khi CẢ TÀU 2 VÀ TÀU 3 ĐÃ CẤT CÁNH XONG
      const bothOutDeparted = out1Finished && out2Finished;

      if (!bothOutDeparted && (ac.routeEdgeIndex >= 11 || ac.currentNodeId === 'v3_line_18_p02')) {
        return {
          ...ac,
          currentNodeId: 'v3_line_18_p02',
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '🛑 W7A MID (CHỜ TÀU 2 & 3 CẤT CÁNH 07R)',
        };
      }

      const isRollout = ac.routeEdgeIndex <= 4;
      return {
        ...ac,
        status: 'taxiing',
        speedKts: 20,
        speedLimitKts: 20,
        holdReason: undefined,
        scenarioLabel: isRollout ? 'HẠ CÁNH XẢ ĐÀ 25R ➔ THOÁT W4' : 'RW 25R ➔ W4 ➔ CROSS 25L ➔ HS NS ➔ STAND 17',
      };
    }

    // 2. OUT01: Bắt đầu lăn ngay từ đầu (t=0) từ Stand 9 -> HS NS -> E6
    if (ac.callsign === 'OUT01') {
      const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
      if (at07R || ac.flight) {
        return handle07RDeparture(ac, 'OUT01');
      }

      const reachedE6 = ac.routeEdgeIndex >= 12 || ac.currentNodeId === 'v3_line_17_p12' || ac.currentNodeId === 'v3_line_17_p13';
      if (reachedE6) {
        if (!progress.runwayChanged) {
          progress.runwayChanged = true;
          setFtgEvents(e => [
            ...e,
            { time: Math.round(currentSec), text: '📢 KSVKL: "RUNWAY CHANGE 07R"' },
          ]);
        }
        return {
          ...ac,
          assignedRoute: pOut1Full,
          clearedRoute: pOut1Full,
          targetNodeId: 'v3_line_16_p00',
          status: 'taxiing',
          speedKts: 20,
          speedLimitKts: 20,
          scenarioLabel: '🔄 RUNWAY CHANGE 07R ➔ RA RW 07R',
        };
      }
      if (currentSec < 0.8 && ac.routeEdgeIndex === 0) {
        return {
          ...ac,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          scenarioLabel: 'STAND 9 (CHỜ HUẤN LỆNH KSVKL)',
        };
      }
      return {
        ...ac,
        status: 'taxiing',
        speedKts: 20,
        speedLimitKts: 20,
        scenarioLabel: 'STAND 9 ➔ HS NS ➔ E6',
      };
    }

    // 3. OUT02: Bắt đầu lăn sau Tàu 2 (t >= 7.0s) từ Stand 12 nối đuôi Tàu 2 ra E6
    if (ac.callsign === 'OUT02') {
      if (currentSec < 7.0 && ac.routeEdgeIndex === 0) {
        return {
          ...ac,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          scenarioLabel: 'STAND 12 (CHỜ TÀU 2 LĂN TRƯỚC)',
        };
      }

      // DỪNG CHỜ TẠI VẠCH W11/07R (dừng lùi lại trước vạch 1 khoảng an toàn) NẾU TÀU 2 (OUT01) CHƯA CẤT CÁNH BIẾN MẤT
      const at07R_Hold = !out1Finished && (
        ac.currentNodeId === 'v3_line_16_p01' ||
        ac.currentNodeId === 'v3_line_16_p00' ||
        ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2 ||
        (ac.routeEdgeIndex === (ac.assignedRoute?.length ?? 1) - 3 && (ac.progressOnEdge ?? 0) >= 0.75)
      );
      if (at07R_Hold) {
        const holdEdgeIdx = Math.max(0, (ac.assignedRoute?.length ?? 3) - 3);
        const holdEdge = routeToEdges(ac.assignedRoute, graph.edges)?.[holdEdgeIdx] ?? ac.currentEdgeId;
        return {
          ...ac,
          currentNodeId: 'v3_line_16_p01',
          currentEdgeId: holdEdge,
          routeEdgeIndex: holdEdgeIdx,
          progressOnEdge: 0.75,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '🛑 W11/07R (CHỜ TÀU 2 CẤT CÁNH BIẾN MẤT)',
        };
      }

      const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
      if (at07R || ac.flight) {
        return handle07RDeparture(ac, 'OUT02');
      }

      const reachedE6 = ac.routeEdgeIndex >= 12 || ac.currentNodeId === 'v3_line_17_p12' || ac.currentNodeId === 'v3_line_17_p13';
      if (reachedE6 || progress.runwayChanged) {
        return {
          ...ac,
          assignedRoute: pOut2Full,
          clearedRoute: pOut2Full,
          targetNodeId: 'v3_line_16_p00',
          status: 'taxiing',
          speedKts: 20,
          speedLimitKts: 20,
          scenarioLabel: '🔄 RUNWAY CHANGE 07R ➔ NỐI ĐUÔI TÀU 2 RA 07R',
        };
      }
      return {
        ...ac,
        status: 'taxiing',
        speedKts: 17.5,
        speedLimitKts: 17.5,
        scenarioLabel: 'STAND 12 ➔ NỐI ĐUÔI TÀU 2 ➔ E6',
      };
    }

    const stage3Elapsed = (progress.stage3Start !== null)
      ? (currentSec - progress.stage3Start)
      : 0;

    // 4. OUT03: Stand 8 -> Pushback ra RW 07R (Bắt đầu Giai đoạn 3 sau khi Tàu 1, 2, 3 kết thúc)
    if (ac.callsign === 'OUT03') {
      // DỪNG CHỜ TẠI VẠCH W11/07R (dừng lùi lại trước vạch 1 khoảng an toàn) NẾU TÀU 3 (OUT02) CHƯA CẤT CÁNH BIẾN MẤT
      const at07R_Hold = !out2Finished && (
        ac.currentNodeId === 'v3_line_16_p01' ||
        ac.currentNodeId === 'v3_line_16_p00' ||
        ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2 ||
        (ac.routeEdgeIndex === (ac.assignedRoute?.length ?? 1) - 3 && (ac.progressOnEdge ?? 0) >= 0.75)
      );
      if (at07R_Hold) {
        const holdEdgeIdx = Math.max(0, (ac.assignedRoute?.length ?? 3) - 3);
        const holdEdge = routeToEdges(ac.assignedRoute, graph.edges)?.[holdEdgeIdx] ?? ac.currentEdgeId;
        return {
          ...ac,
          currentNodeId: 'v3_line_16_p01',
          currentEdgeId: holdEdge,
          routeEdgeIndex: holdEdgeIdx,
          progressOnEdge: 0.75,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '🛑 W11/07R (CHỜ TÀU 3 CẤT CÁNH BIẾN MẤT)',
        };
      }

      const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
      if (at07R || ac.flight) {
        return handle07RDeparture(ac, 'OUT03');
      }

      if (progress.stage3Start !== null && stage3Elapsed >= 1.0) {
        return {
          ...ac,
          hidden: false,
          routeVisible: true,
          guidanceVisible: true,
          status: 'taxiing',
          speedKts: 20,
          speedLimitKts: 20,
          scenarioLabel: 'STAND 8 ➔ PUSHBACK RA RW 07R',
        };
      }
      return {
        ...ac,
        hidden: false,
        routeVisible: false,
        guidanceVisible: false,
        status: 'holding',
        speedKts: 0,
        speedLimitKts: 0,
        holdReason: undefined,
        scenarioLabel: 'STAND 8 (CHỜ TÀU 1, 2, 3 HOÀN TẤT)',
      };
    }

    // 5. OUT04: Stand 11 -> Pushback ra RW 07R (Xếp hàng sau Tàu 4 với khoảng cách an toàn)
    if (ac.callsign === 'OUT04') {
      if (!out3Finished) {
        const out3OnRunway = isPlaneAtRunway07R('OUT03');
        const reachedQueue = ac.currentNodeId === 'v3_line_16_p01' ||
          ac.currentNodeId === 'v3_line_16_p00' ||
          ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2 ||
          (ac.routeEdgeIndex === (ac.assignedRoute?.length ?? 1) - 3 && (ac.progressOnEdge ?? 0) >= 0.25);

        if (reachedQueue) {
          // Nếu Tàu 4 vẫn đang đứng đợi trước vạch W11/07R -> Tàu 5 dừng ở Vị trí 2 (cách một khoảng an toàn phía sau)
          if (!out3OnRunway) {
            const holdEdgeIdx = Math.max(0, (ac.assignedRoute?.length ?? 3) - 3);
            const holdEdge = routeToEdges(ac.assignedRoute, graph.edges)?.[holdEdgeIdx] ?? ac.currentEdgeId;
            return {
              ...ac,
              currentNodeId: 'v3_line_16_p02',
              currentEdgeId: holdEdge,
              routeEdgeIndex: holdEdgeIdx,
              progressOnEdge: 0.25,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 W11 (XẾP HÀNG CHỜ CẤT CÁNH - SAU TÀU 4)',
            };
          }

          // Khi Tàu 4 đã lăn vào đường băng 07R -> Tàu 5 tiến lên Vị trí 1 (ngay trước vạch dừng W11/07R) và dừng chờ
          if ((ac.routeEdgeIndex === (ac.assignedRoute?.length ?? 1) - 3 && (ac.progressOnEdge ?? 0) >= 0.75) ||
              ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2 ||
              ac.currentNodeId === 'v3_line_16_p01' ||
              ac.currentNodeId === 'v3_line_16_p00') {
            const holdEdgeIdx = Math.max(0, (ac.assignedRoute?.length ?? 3) - 3);
            const holdEdge = routeToEdges(ac.assignedRoute, graph.edges)?.[holdEdgeIdx] ?? ac.currentEdgeId;
            return {
              ...ac,
              currentNodeId: 'v3_line_16_p01',
              currentEdgeId: holdEdge,
              routeEdgeIndex: holdEdgeIdx,
              progressOnEdge: 0.75,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 W11/07R (CHỜ TÀU 4 CẤT CÁNH BIẾN MẤT)',
            };
          }
        }
      }

      const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
      if (at07R || ac.flight) {
        return handle07RDeparture(ac, 'OUT04');
      }

      if (progress.stage3Start !== null && stage3Elapsed >= 3.0) {
        return {
          ...ac,
          hidden: false,
          routeVisible: true,
          guidanceVisible: true,
          status: 'taxiing',
          speedKts: 18,
          speedLimitKts: 18,
          scenarioLabel: 'STAND 11 ➔ NỐI ĐUÔI TÀU 4 RA 07R',
        };
      }
      return {
        ...ac,
        hidden: false,
        routeVisible: false,
        guidanceVisible: false,
        status: 'holding',
        speedKts: 0,
        speedLimitKts: 0,
        holdReason: undefined,
        scenarioLabel: 'STAND 11 (CHỜ TÀU 1, 2, 3 HOÀN TẤT)',
      };
    }

    // 6. OUT05: Stand 4 -> Pushback ra RW 07R (Xếp hàng sau Tàu 5 với khoảng cách an toàn)
    if (ac.callsign === 'OUT05') {
      if (!out4Finished) {
        const out4OnRunway = isPlaneAtRunway07R('OUT04');
        const out3Gone = out3Finished;
        const out4AtPos1 = out3Gone && !out4OnRunway; // Tàu 4 đang ở Vị trí 1 sát vạch W11/07R
        const out4AtPos2 = !out3Gone && !out4OnRunway; // Tàu 4 đang ở Vị trí 2 (vì Tàu 3 đang ở Vị trí 1 hoặc trên đường băng)

        const reachedQueue = ac.currentNodeId === 'v3_line_16_p01' ||
          ac.currentNodeId === 'v3_line_16_p00' ||
          ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 3 ||
          (ac.routeEdgeIndex === (ac.assignedRoute?.length ?? 1) - 4 && (ac.progressOnEdge ?? 0) >= 0.35);

        if (reachedQueue) {
          // Trường hợp 1: Tàu 4 đang ở Vị trí 2 -> Tàu 5 dừng ở Vị trí 3 (cách Tàu 4 một khoảng an toàn)
          if (out4AtPos2) {
            const holdEdgeIdx = Math.max(0, (ac.assignedRoute?.length ?? 4) - 4);
            const holdEdge = routeToEdges(ac.assignedRoute, graph.edges)?.[holdEdgeIdx] ?? ac.currentEdgeId;
            return {
              ...ac,
              currentNodeId: 'v3_line_16_p03',
              currentEdgeId: holdEdge,
              routeEdgeIndex: holdEdgeIdx,
              progressOnEdge: 0.35,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 W11 (XẾP HÀNG CHỜ CẤT CÁNH - SAU TÀU 5)',
            };
          }

          // Trường hợp 2: Tàu 4 đang ở Vị trí 1 -> Tàu 5 tiến lên dừng ở Vị trí 2
          if (out4AtPos1) {
            const holdEdgeIdx = Math.max(0, (ac.assignedRoute?.length ?? 3) - 3);
            const holdEdge = routeToEdges(ac.assignedRoute, graph.edges)?.[holdEdgeIdx] ?? ac.currentEdgeId;
            return {
              ...ac,
              currentNodeId: 'v3_line_16_p02',
              currentEdgeId: holdEdge,
              routeEdgeIndex: holdEdgeIdx,
              progressOnEdge: 0.25,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 W11 (XẾP HÀNG CHỜ CẤT CÁNH - SAU TÀU 5)',
            };
          }

          // Trường hợp 3: Tàu 4 đã vào đường băng 07R -> Tàu 5 tiến lên Vị trí 1 (trước vạch dừng W11/07R) và dừng chờ
          if ((ac.routeEdgeIndex === (ac.assignedRoute?.length ?? 1) - 3 && (ac.progressOnEdge ?? 0) >= 0.75) ||
              ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2 ||
              ac.currentNodeId === 'v3_line_16_p01' ||
              ac.currentNodeId === 'v3_line_16_p00') {
            const holdEdgeIdx = Math.max(0, (ac.assignedRoute?.length ?? 3) - 3);
            const holdEdge = routeToEdges(ac.assignedRoute, graph.edges)?.[holdEdgeIdx] ?? ac.currentEdgeId;
            return {
              ...ac,
              currentNodeId: 'v3_line_16_p01',
              currentEdgeId: holdEdge,
              routeEdgeIndex: holdEdgeIdx,
              progressOnEdge: 0.75,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 W11/07R (CHỜ TÀU 5 CẤT CÁNH BIẾN MẤT)',
            };
          }
        }
      }

      const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
      if (at07R || ac.flight) {
        return handle07RDeparture(ac, 'OUT05');
      }

      if (progress.stage3Start !== null && stage3Elapsed >= 5.0) {
        return {
          ...ac,
          hidden: false,
          routeVisible: true,
          guidanceVisible: true,
          status: 'taxiing',
          speedKts: 16.5,
          speedLimitKts: 16.5,
          scenarioLabel: 'STAND 4 ➔ NỐI ĐUÔI TÀU 5 RA 07R',
        };
      }
      return {
        ...ac,
        hidden: false,
        routeVisible: false,
        guidanceVisible: false,
        status: 'holding',
        speedKts: 0,
        speedLimitKts: 0,
        holdReason: undefined,
        scenarioLabel: 'STAND 4 (CHỜ TÀU 1, 2, 3 HOÀN TẤT)',
      };
    }

    return ac;
  });

  const totalFinished = stateToTick.scenarioAircraft?.filter(a => a.status === 'arrived' || a.status === 'departed').length ?? 0;
  if (totalFinished === 6 && !stateToTick.scenario?.completed) {
    stateToTick.scenario = {
      ...stateToTick.scenario,
      completed: true,
    };
  }

  return stateToTick;
}
