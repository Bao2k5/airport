import type { AirportGraph, SimulationState } from '../../src/types';
import { scenarioTick, routeToEdges } from '../../src/simulation/scenarioRunner';
const pOut1Full = [
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

const pOut2Full = [
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


export function createPrevious2dFtgController(graph: AirportGraph) {
  let clock = 0;
  const performance = { now: () => clock };
  const ftgInitClearancesIssuedRef = { current: false };
  const ftgStage3AnnouncedRef = { current: false };
  const stage3StartSecRef = { current: null as number | null };
  const runwayChangeTriggeredRef = { current: false };
  const takeoffStartWallRef = { current: new Map<string, number>() };
  const setFtgEvents = (_update: unknown) => {};
  return (prev: SimulationState, dt: number) => {
    clock = prev.elapsedSeconds / 5 * 1000;
    const currentSec = prev.elapsedSeconds;
    let stateToTick = { ...prev };

    // Giai đoạn 1: Khi 3 tàu cùng xuất hiện ở đầu kịch bản, phát đồng thời cả 3 huấn lệnh cho Tàu 1, 2, 3
    if (currentSec >= 0.5 && !ftgInitClearancesIssuedRef.current) {
      ftgInitClearancesIssuedRef.current = true;
      setFtgEvents(e => [
        ...e,
        { time: 0, text: '🟢 KSVKL: "INB01, taxi to stand 17"' },
        { time: 0, text: '🟢 KSVKL: "OUTB01, taxi to holding point runway 25L"' },
        { time: 0, text: '🟢 KSVKL: "OUTB02, taxi to holding point runway 25L"' },
      ]);
    }


    if (stage3StartSecRef.current !== null && !ftgStage3AnnouncedRef.current) {
      ftgStage3AnnouncedRef.current = true;
      setFtgEvents(e => [
        ...e,
        { time: Math.round(currentSec), text: '🛫 KSVKL: "OUTB03, OUTB04, OUTB05, pushback and taxi to holding point runway 07R"' },
      ]);
    }

    // Đảm bảo không có comicBubble / hộp thoại huấn lệnh
    stateToTick.comicBubble = undefined;

    // Helper kiểm tra một tàu bay đã hoàn thành cất cánh và biến mất hoàn toàn khỏi màn hình chưa (2.8s)
    const isDisappeared = (callsign: string) => {
      const t = takeoffStartWallRef.current.get(callsign);
      return t !== undefined && (performance.now() - t) >= 2800;
    };

    // Kiểm tra xem Tàu 1 (INB01) đã hạ cánh lăn đến ngã ba W7A chưa
    const inb1 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'INB01');

    const inb1Finished = inb1 ? (inb1.status === 'arrived' || inb1.currentNodeId === 'v3_line_22_p01' || (inb1.routeEdgeIndex >= (inb1.assignedRoute?.length ?? 1) - 1)) : false;
    const out1Finished = isDisappeared('OUT01');
    const out2Finished = isDisappeared('OUT02');
    const out3Finished = isDisappeared('OUT03');
    const out4Finished = isDisappeared('OUT04');

    // Giai đoạn 3 chỉ bắt đầu KHI CẢ 3 TÀU BAY 1, 2, 3 ĐÃ KẾT THÚC GIAI ĐOẠN 1 & 2 VÀ ĐÃ BIẾN MẤT HOÀN TOÀN
    const stage1And2AllFinished = inb1Finished && out1Finished && out2Finished;
    if (stage1And2AllFinished && stage3StartSecRef.current === null) {
      stage3StartSecRef.current = currentSec;
    }

    // Thuật toán điều phối luồng 6 tàu bay trên màn FTG
    stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
      // 1. INB01: Hạ cánh 25R lăn vào W4, đến W7A (routeEdgeIndex >= 12 hoặc v3_line_18_p03) thì DỪNG CHỜ nhường Tàu 2 và Tàu 3
      if (ac.callsign === 'INB01') {
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

        // Tàu 1 dừng chờ tại nút W7A MID (v3_line_18_p02) cho đến khi CẢ TÀU 2 VÀ TÀU 3 ĐÃ RA ĐẦU RW 07R / CẤT CÁNH XONG
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
        if (at07R) {
          if (!takeoffStartWallRef.current.has('OUT01')) {
            takeoffStartWallRef.current.set('OUT01', performance.now());
          }
          const finished = isDisappeared('OUT01');
          return {
            ...ac,
            status: 'departed',
            hidden: finished,
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: finished ? '✓ ĐÃ CẤT CÁNH & RỜI VÙNG TRỜI' : '🛫 ĐANG CHẠY ĐÀ CẤT CÁNH RW 07R',
          };
        }
        const reachedE6 = ac.routeEdgeIndex >= 12 || ac.currentNodeId === 'v3_line_17_p12' || ac.currentNodeId === 'v3_line_17_p13';
        if (reachedE6) {
          if (!runwayChangeTriggeredRef.current) {
            runwayChangeTriggeredRef.current = true;
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
        // BẮT BUỘC DỪNG CHỜ TẠI VẠCH W11/07R (v3_line_16_p01) NẾU TÀU 2 (OUT01) CHƯA BIẾN MẤT HOÀN TOÀN
        const at07R_Hold = !out1Finished && (
          ac.currentNodeId === 'v3_line_16_p01' ||
          ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2
        );
        if (at07R_Hold) {
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p01',
            currentEdgeId: routeToEdges(ac.assignedRoute, graph.edges)?.[ac.assignedRoute.length - 2] ?? ac.currentEdgeId,
            routeEdgeIndex: ac.assignedRoute.length - 2,
            progressOnEdge: 0,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: '🛑 W11/07R (CHỜ TÀU 2 CẤT CÁNH BIẾN MẤT)',
          };
        }

        const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
        if (at07R) {
          if (!takeoffStartWallRef.current.has('OUT02')) {
            takeoffStartWallRef.current.set('OUT02', performance.now());
          }
          const finished = isDisappeared('OUT02');
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p00',
            status: 'departed',
            hidden: finished,
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: finished ? '✓ ĐÃ CẤT CÁNH & RỜI VÙNG TRỜI' : '🛫 ĐANG CHẠY ĐÀ CẤT CÁNH RW 07R',
          };
        }

        const reachedE6 = ac.routeEdgeIndex >= 12 || ac.currentNodeId === 'v3_line_17_p12' || ac.currentNodeId === 'v3_line_17_p13';
        if (reachedE6 || runwayChangeTriggeredRef.current) {
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

      const stage3Elapsed = (stage3StartSecRef.current !== null)
        ? (currentSec - stage3StartSecRef.current)
        : 0;

      // 4. OUT03: Stand 8 -> Pushback ra RW 07R (Bắt đầu Giai đoạn 3 sau khi Tàu 1, 2, 3 kết thúc)
      if (ac.callsign === 'OUT03') {
        // BẮT BUỘC DỪNG CHỜ TẠI VẠCH W11/07R NẾU TÀU 3 (OUT02) CHƯA BIẾN MẤT HOÀN TOÀN
        const at07R_Hold = !out2Finished && (
          ac.currentNodeId === 'v3_line_16_p01' ||
          ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2
        );
        if (at07R_Hold) {
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p01',
            currentEdgeId: routeToEdges(ac.assignedRoute, graph.edges)?.[ac.assignedRoute.length - 2] ?? ac.currentEdgeId,
            routeEdgeIndex: ac.assignedRoute.length - 2,
            progressOnEdge: 0,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: '🛑 W11/07R (CHỜ TÀU 3 CẤT CÁNH BIẾN MẤT)',
          };
        }

        const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
        if (at07R) {
          if (!takeoffStartWallRef.current.has('OUT03')) {
            takeoffStartWallRef.current.set('OUT03', performance.now());
          }
          const finished = isDisappeared('OUT03');
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p00',
            status: 'departed',
            hidden: finished,
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: finished ? '✓ ĐÃ CẤT CÁNH & RỜI VÙNG TRỜI' : '🛫 ĐANG CHẠY ĐÀ CẤT CÁNH RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 1.0) {
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

      // 5. OUT04: Stand 11 -> Pushback ra RW 07R (Cách Tàu 4 thêm một khoảng an toàn)
      if (ac.callsign === 'OUT04') {
        // BẮT BUỘC DỪNG CHỜ TẠI VẠCH W11/07R NẾU TÀU 4 (OUT03) CHƯA BIẾN MẤT HOÀN TOÀN
        const at07R_Hold = !out3Finished && (
          ac.currentNodeId === 'v3_line_16_p01' ||
          ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2
        );
        if (at07R_Hold) {
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p01',
            currentEdgeId: routeToEdges(ac.assignedRoute, graph.edges)?.[ac.assignedRoute.length - 2] ?? ac.currentEdgeId,
            routeEdgeIndex: ac.assignedRoute.length - 2,
            progressOnEdge: 0,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: '🛑 W11/07R (CHỜ TÀU 4 CẤT CÁNH BIẾN MẤT)',
          };
        }

        const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
        if (at07R) {
          if (!takeoffStartWallRef.current.has('OUT04')) {
            takeoffStartWallRef.current.set('OUT04', performance.now());
          }
          const finished = isDisappeared('OUT04');
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p00',
            status: 'departed',
            hidden: finished,
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: finished ? '✓ ĐÃ CẤT CÁNH & RỜI VÙNG TRỜI' : '🛫 ĐANG CHẠY ĐÀ CẤT CÁNH RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 3.0) {
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

      // 6. OUT05: Stand 4 -> Pushback ra RW 07R (Cách Tàu 5 thêm 2 giây)
      if (ac.callsign === 'OUT05') {
        // BẮT BUỘC DỪNG CHỜ TẠI VẠCH W11/07R NẾU TÀU 5 (OUT04) CHƯA BIẾN MẤT HOÀN TOÀN
        const at07R_Hold = !out4Finished && (
          ac.currentNodeId === 'v3_line_16_p01' ||
          ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 2
        );
        if (at07R_Hold) {
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p01',
            currentEdgeId: routeToEdges(ac.assignedRoute, graph.edges)?.[ac.assignedRoute.length - 2] ?? ac.currentEdgeId,
            routeEdgeIndex: ac.assignedRoute.length - 2,
            progressOnEdge: 0,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: '🛑 W11/07R (CHỜ TÀU 5 CẤT CÁNH BIẾN MẤT)',
          };
        }

        const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
        if (at07R) {
          if (!takeoffStartWallRef.current.has('OUT05')) {
            takeoffStartWallRef.current.set('OUT05', performance.now());
          }
          const finished = isDisappeared('OUT05');
          return {
            ...ac,
            currentNodeId: 'v3_line_16_p00',
            status: 'departed',
            hidden: finished,
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: finished ? '✓ ĐÃ CẤT CÁNH & RỜI VÙNG TRỜI' : '🛫 ĐANG CHẠY ĐÀ CẤT CÁNH RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 5.0) {
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


    return scenarioTick(stateToTick, dt, graph);
  };
}
