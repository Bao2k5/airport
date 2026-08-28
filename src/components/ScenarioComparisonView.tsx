import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import type { ScenarioAircraft } from '../data/presetScenarios';
import { setupScenario5Traditional, setupScenario5FTG } from '../data/presetScenarios';
import AirportMap from './AirportMap';
import { scenarioTick, startScenario } from '../simulation/scenarioRunner';

interface Props {
  graph: AirportGraph;
  bgImage: string;
  onExit: () => void;
}

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

export default function Scenario5ComparisonView({
  graph,
  bgImage,
  onExit,
}: Props) {
  // Speed scale state: 1x, 2x (default), 4x
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2);
  const [isPaused, setIsPaused] = useState(false);

  // Two completely independent simulation states
  const [leftState, setLeftState] = useState<SimulationState>(() => {
    const s = startScenario('lvc_peak_runway_direction_change', graph);
    const tradSetup = setupScenario5Traditional(graph);
    s.scenarioAircraft = tradSetup.aircraft;
    return s;
  });

  const [rightState, setRightState] = useState<SimulationState>(() => {
    const s = startScenario('lvc_peak_runway_direction_change', graph);
    const ftgSetup = setupScenario5FTG(graph);
    s.scenarioAircraft = ftgSetup.aircraft;
    return s;
  });

  // Independent Event Logs for both simulation panes
  const [traditionalEvents, setTraditionalEvents] = useState<Array<{ time: number; callsign?: string; text: string }>>([
    { time: 0, text: 'Bắt đầu mô phỏng: INB01 lăn vào W4, OUT01 (Stand 9) & OUT02 (Stand 12) lăn ra 25L' },
  ]);
  const [ftgEvents, setFtgEvents] = useState<Array<{ time: number; callsign?: string; text: string }>>([
    { time: 0, text: 'Khởi động hệ thống A-SMGCS FtG: Cấp đèn xanh tự động cho 6 tàu bay theo 3 giai đoạn' },
  ]);

  // Track completion state and final frozen simulated timestamps
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);
  const [leftFinalTime, setLeftFinalTime] = useState<number | null>(null);
  const [rightFinalTime, setRightFinalTime] = useState<number | null>(null);
  const [showRunwayChangeAlert, setShowRunwayChangeAlert] = useState(false);

  const runwayChangeTriggeredRef = useRef(false);
  const stage3StartSecRef = useRef<number | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Helper to count finished aircraft (arrived or departed)
  const countCompleted = (aircraftList?: ScenarioAircraft[] | null): number => {
    if (!aircraftList) return 0;
    return aircraftList.filter(a => a.status === 'arrived' || a.status === 'departed').length;
  };

  const leftCount = countCompleted(leftState.scenarioAircraft);
  const rightCount = countCompleted(rightState.scenarioAircraft);

    // Custom Tick for Left Screen: Traditional ATC without FtG
  const leftTick = useCallback((prev: SimulationState, dt: number): SimulationState => {
    if (leftDone) return prev;

    const currentSec = prev.elapsedSeconds;
    let stateToTick = { ...prev };

    // Turn OFF all FtG visual guidance & route preview on traditional screen
    if (stateToTick.scenarioAircraft) {
      stateToTick.scenarioAircraft = stateToTick.scenarioAircraft.map(ac => ({
        ...ac,
        guidanceVisible: false,
        routeVisible: false,
      }));
    }

    // Traditional ATC delays & Gridlock at direction change
    if (currentSec >= 6 && currentSec - dt < 6) {
      setTraditionalEvents(e => [
        ...e,
        { time: 6, text: '⚠️ [GIAI ĐOẠN 1] INB01 dừng tại HS NS; OUT01 & OUT02 dừng tại NS2 do xung đột luồng và nghẽn sóng thoại.' },
      ]);
    }

    if (currentSec >= 18 && currentSec - dt < 18) {
      setTraditionalEvents(e => [
        ...e,
        { time: 18, text: '📻 [GIAI ĐOẠN 2] KSVKL giải tỏa thủ công: INB01 qua HS NS vào bến 17; OUT01 & OUT02 tiếp tục ra RW 07R. Tàu 4, 5, 6 ở Stand chờ lượt.' },
      ]);
    }

    stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
      // Giai đoạn 1 (currentSec < 18s):
      if (currentSec < 18) {
        // INB01 dừng tại HS NS
        if (ac.callsign === 'INB01' && ((ac.routeEdgeIndex >= 18 && ac.progressOnEdge >= 0.85) || ac.currentNodeId === 'v3_line_17_p09')) {
          return {
            ...ac,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: '⛔ DỪNG TẠI HS NS (CHỜ THỦ CÔNG)',
          };
        }
        // OUT01 dừng tại NS2
        if (ac.callsign === 'OUT01' && ac.routeEdgeIndex >= 26) {
          return {
            ...ac,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: '⛔ DỪNG TẠI NS2 (XUNG ĐỘT INB01)',
          };
        }
        // OUT02 dừng sau OUT01
        if (ac.callsign === 'OUT02' && ac.routeEdgeIndex >= 25) {
          return {
            ...ac,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: '⛔ DỪNG THEO ĐUÔI OUT01 TẠI NS2',
          };
        }
        // Tàu 4, 5, 6 chưa xuất hiện ở Giai đoạn 1
        if (ac.callsign === 'OUT03' || ac.callsign === 'OUT04' || ac.callsign === 'OUT05') {
          return {
            ...ac,
            hidden: true,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
          };
        }
      } else {
        // Giai đoạn 2 (currentSec >= 18s):
        // INB01 được giải tỏa qua HS NS vào bến 17
        if (ac.callsign === 'INB01' && ac.status === 'holding') {
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 16,
            speedLimitKts: 16,
            holdReason: undefined,
            scenarioLabel: 'HẠ CÁNH 25R ➔ VÀO STAND 17',
          };
        }
        // OUT01 & OUT02 tiếp tục đi ra RW 07R
        if ((ac.callsign === 'OUT01' || ac.callsign === 'OUT02') && ac.status === 'holding') {
          return {
            ...ac,
            status: 'taxiing',
            speedKts: ac.callsign === 'OUT01' ? 16 : 14,
            speedLimitKts: ac.callsign === 'OUT01' ? 16 : 14,
            holdReason: undefined,
            scenarioLabel: 'TIẾP TỤC LĂN RA RW 07R',
          };
        }
        // Tàu 4, 5, 6 ở Stand và KHÔNG PUSHBACK RA vì chưa đến lượt
        if (ac.callsign === 'OUT03' || ac.callsign === 'OUT04' || ac.callsign === 'OUT05') {
          const standName = ac.callsign === 'OUT03' ? 'STAND 8' : ac.callsign === 'OUT04' ? 'STAND 11' : 'STAND 4';
          return {
            ...ac,
            hidden: false,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: `${standName} (CHƯA ĐẾN LƯỢT PUSHBACK)`,
          };
        }
      }

      // Xử lý cất cánh hoặc về bến
      if (ac.callsign === 'INB01' && (ac.currentNodeId === 'v3_line_22_p01' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1)) {
        return {
          ...ac,
          status: 'arrived',
          speedKts: 0,
          speedLimitKts: 0,
          scenarioLabel: '✓ ĐÃ VỀ BẾN STAND 17',
        };
      }
      if ((ac.callsign === 'OUT01' || ac.callsign === 'OUT02') && (ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1)) {
        return {
          ...ac,
          status: 'departed',
          speedKts: 0,
          speedLimitKts: 0,
          scenarioLabel: '🛫 ĐÃ CẤT CÁNH RW 07R',
        };
      }

      return ac;
    });

    const next = scenarioTick(stateToTick, dt, graph);

    // Strictly enforce NO visual guidance & NO route preview on traditional screen
    if (next.scenarioAircraft) {
      next.scenarioAircraft = next.scenarioAircraft.map(ac => ({
        ...ac,
        guidanceVisible: false,
        routeVisible: false,
      }));
    }

    // Check completion for Left Panel (3 active aircraft finished)
    const finished = countCompleted(next.scenarioAircraft);
    if (finished >= 3 && !leftDone && next.elapsedSeconds > 35) {
      setLeftDone(true);
      setLeftFinalTime(Math.round(next.elapsedSeconds * 10) / 10);
    }

    return next;
  }, [graph, leftDone]);

  // Custom Tick for Right Screen: A-SMGCS + Follow-the-Green (NO comic bubble / NO speech box)
  const rightTick = useCallback((prev: SimulationState, dt: number): SimulationState => {
    if (rightDone) return prev;

    const currentSec = prev.elapsedSeconds;
    let stateToTick = { ...prev };

    // Events log
    if (currentSec >= 5 && currentSec - dt < 5) {
      setFtgEvents(e => [
        ...e,
        { time: 5, text: '🟢 [GIAI ĐOẠN 1 & 2] Tàu 1 (INB01) dừng tại W7A nhường đường; Tàu 2 (OUT01) và Tàu 3 (OUT02) đổi hướng ra RW 07R.' },
      ]);
    }

    if (currentSec >= 16 && currentSec - dt < 16) {
      setFtgEvents(e => [
        ...e,
        { time: 16, text: '🛫 [GIAI ĐOẠN 3] Tàu 4 (Stand 8), Tàu 5 (Stand 11), Tàu 6 (Stand 4) lần lượt pushback cách nhau 2s ra RW 07R!' },
      ]);
    }

    if (currentSec >= 28 && currentSec - dt < 28) {
      setFtgEvents(e => [
        ...e,
        { time: 28, text: '✅ Tàu 1 vào Stand 17; OUT01 & OUT02 cất cánh 07R; OUT03, OUT04, OUT05 lăn thông suốt.' },
      ]);
    }

    // Đảm bảo không có comicBubble / hộp thoại huấn lệnh
    stateToTick.comicBubble = undefined;

    // Kiểm tra xem Tàu 1 (INB01) đã hạ cánh lăn đến ngã ba W7A chưa
    const inb1 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'INB01');
    const inb1ReachedW7A = inb1 ? (inb1.routeEdgeIndex >= 12 || inb1.currentNodeId === 'v3_line_18_p03' || inb1.status === 'holding') : false;

    const out1 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'OUT01');
    const out2 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'OUT02');

    const inb1Finished = inb1 ? (inb1.status === 'arrived' || inb1.currentNodeId === 'v3_line_22_p01' || (inb1.routeEdgeIndex >= (inb1.assignedRoute?.length ?? 1) - 1)) : false;
    const out1Finished = out1 ? (out1.status === 'departed' || out1.currentNodeId === 'v3_line_16_p00' || (out1.routeEdgeIndex >= (out1.assignedRoute?.length ?? 1) - 1)) : false;
    const out2Finished = out2 ? (out2.status === 'departed' || out2.currentNodeId === 'v3_line_16_p00' || (out2.routeEdgeIndex >= (out2.assignedRoute?.length ?? 1) - 1)) : false;

    // Giai đoạn 3 chỉ bắt đầu KHI CẢ 3 TÀU BAY 1, 2, 3 ĐÃ KẾT THÚC GIAI ĐOẠN 1 & 2
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

        // Tàu 1 dừng chờ tại ngã ba W7A cho đến khi Tàu 2 và Tàu 3 đi qua khỏi bến đỗ Stand 17
        const out2PassedStand17 = out2 ? (out2.routeEdgeIndex >= 10 || out2.currentNodeId === 'v3_line_15_p01' || out2.currentNodeId === 'v3_line_23_p00' || out2.currentNodeId === 'v3_line_24_p00' || out2.currentNodeId === 'v3_line_25_p00' || out2.currentNodeId === 'v3_line_17_p11' || out2.currentNodeId === 'v3_line_17_p12' || out2.currentNodeId === 'v3_line_17_p13') : false;

        if (!out2PassedStand17 && (ac.routeEdgeIndex >= 12 || ac.currentNodeId === 'v3_line_18_p03')) {
          return {
            ...ac,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: 'stop-bar',
            scenarioLabel: 'W7A (DỪNG CHỜ TÀU 2 & 3 QUA STAND 17)',
          };
        }

        return {
          ...ac,
          status: 'taxiing',
          speedKts: 20,
          speedLimitKts: 20,
          holdReason: undefined,
          scenarioLabel: 'RW 25R ➔ W4 ➔ CROSS 25L ➔ HS NS ➔ STAND 17',
        };
      }

      // 2. OUT01: Đứng chờ tại Stand 9 cho đến khi Tàu 1 đến W7A và dừng lại mới được đi
      if (ac.callsign === 'OUT01') {
        if (!inb1ReachedW7A) {
          return {
            ...ac,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: 'STAND 9 (CHỜ TÀU 1 ĐẾN W7A)',
          };
        }
        const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
        if (at07R) {
          return {
            ...ac,
            status: 'departed',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: '🛫 ĐÃ RA ĐẦU RW 07R',
          };
        }
        const reachedE6 = ac.routeEdgeIndex >= 12 || ac.currentNodeId === 'v3_line_17_p12' || ac.currentNodeId === 'v3_line_17_p13';
        if (reachedE6) {
          if (!runwayChangeTriggeredRef.current) {
            runwayChangeTriggeredRef.current = true;
            setShowRunwayChangeAlert(true);
            if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
            alertTimerRef.current = setTimeout(() => {
              setShowRunwayChangeAlert(false);
            }, 4000);
          }
          return {
            ...ac,
            assignedRoute: pOut1Full,
            clearedRoute: pOut1Full,
            targetNodeId: 'v3_line_16_p00',
            status: 'taxiing',
            speedKts: 22,
            speedLimitKts: 22,
            scenarioLabel: '🔄 RUNWAY CHANGE 07R ➔ RA RW 07R',
          };
        }
        return {
          ...ac,
          status: 'taxiing',
          speedKts: 22,
          speedLimitKts: 22,
          scenarioLabel: 'STAND 9 ➔ HS NS ➔ E6',
        };
      }

      // 3. OUT02: Đứng chờ tại Stand 12 cho đến khi Tàu 1 đến W7A và dừng lại mới được đi
      if (ac.callsign === 'OUT02') {
        if (!inb1ReachedW7A) {
          return {
            ...ac,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: 'STAND 12 (CHỜ TÀU 1 ĐẾN W7A)',
          };
        }
        const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
        if (at07R) {
          return {
            ...ac,
            status: 'departed',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: '🛫 ĐÃ RA ĐẦU RW 07R',
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
          speedKts: 20,
          speedLimitKts: 20,
          scenarioLabel: 'STAND 12 ➔ NỐI ĐUÔI TÀU 2 ➔ E6',
        };
      }

      const stage3Elapsed = (stage3StartSecRef.current !== null)
        ? (currentSec - stage3StartSecRef.current)
        : 0;

      // 4. OUT03: Stand 8 -> Pushback ra RW 07R (Bắt đầu Giai đoạn 3 sau khi Tàu 1, 2, 3 kết thúc)
      if (ac.callsign === 'OUT03') {
        const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
        if (at07R && stage3StartSecRef.current !== null && stage3Elapsed >= 1.0) {
          return {
            ...ac,
            status: 'departed',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: '🛫 ĐÃ RA ĐẦU RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 1.0) {
          return {
            ...ac,
            hidden: false,
            routeVisible: true,
            guidanceVisible: true,
            status: 'taxiing',
            speedKts: 18,
            speedLimitKts: 18,
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

      // 5. OUT04: Stand 11 -> Pushback ra RW 07R (Cách Tàu 4 khoảng 2.5s)
      if (ac.callsign === 'OUT04') {
        const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
        if (at07R && stage3StartSecRef.current !== null && stage3Elapsed >= 3.5) {
          return {
            ...ac,
            status: 'departed',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: '🛫 ĐÃ RA ĐẦU RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 3.5) {
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

      // 6. OUT05: Stand 4 -> Pushback ra RW 07R (Cách Tàu 5 khoảng 2.5s)
      if (ac.callsign === 'OUT05') {
        const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
        if (at07R && stage3StartSecRef.current !== null && stage3Elapsed >= 6.0) {
          return {
            ...ac,
            status: 'departed',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: '🛫 ĐÃ RA ĐẦU RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 6.0) {
          return {
            ...ac,
            hidden: false,
            routeVisible: true,
            guidanceVisible: true,
            status: 'taxiing',
            speedKts: 18,
            speedLimitKts: 18,
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
          scenarioLabel: 'STAND 4 (CHỜ GIAI ĐOẠN 3)',
        };
      }

      return ac;
    });

    const next = scenarioTick(stateToTick, dt, graph);

    // Check completion for Right Panel (6 aircraft finished)
    const finished = countCompleted(next.scenarioAircraft);
    if (finished === 6 && !rightDone) {
      setRightDone(true);
      setRightFinalTime(Math.round(next.elapsedSeconds * 10) / 10);
    }

    return next;
  }, [graph, rightDone]);

  // Main animation loop advancing both independent states simultaneously
  useEffect(() => {
    if (isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }

    const frame = (now: number) => {
      if (lastTimeRef.current !== null) {
        const wallDt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        const simDt = wallDt * (speedMultiplier * 3.0); // 1x=3.0, 2x=6.0, 4x=12.0

        if (!leftDone) setLeftState(prev => leftTick(prev, simDt));
        if (!rightDone) setRightState(prev => rightTick(prev, simDt));
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [isPaused, leftDone, rightDone, speedMultiplier, leftTick, rightTick]);

  const handleRestart = () => {
    setLeftDone(false);
    setRightDone(false);
    setLeftFinalTime(null);
    setRightFinalTime(null);
    setShowRunwayChangeAlert(false);
    runwayChangeTriggeredRef.current = false;
    stage3StartSecRef.current = null;
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setTraditionalEvents([
      { time: 0, text: 'Bắt đầu mô phỏng: 8 tàu bay lăn theo kế hoạch ban đầu đầu 25' },
    ]);
    setFtgEvents([
      { time: 0, text: 'Khởi động hệ thống A-SMGCS Level 4: Rolling Window FtG cấp phép đầu 25' },
    ]);
    const initLeft = startScenario('lvc_peak_runway_direction_change', graph);
    initLeft.scenarioAircraft = setupScenario5Traditional(graph).aircraft;
    const initRight = startScenario('lvc_peak_runway_direction_change', graph);
    initRight.scenarioAircraft = setupScenario5FTG(graph).aircraft;
    setLeftState(initLeft);
    setRightState(initRight);
    lastTimeRef.current = performance.now();
  };

  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const leftElapsed = leftFinalTime !== null ? leftFinalTime : (leftState.elapsedSeconds || 0);
  const rightElapsed = rightFinalTime !== null ? rightFinalTime : (rightState.elapsedSeconds || 0);

  const bothFinished = leftDone && rightDone;
  const timeSavedSec = Math.max(0, (leftFinalTime || 0) - (rightFinalTime || 0));
  const timeSavedPct = leftFinalTime ? Math.round((timeSavedSec / leftFinalTime) * 1000) / 10 : 0;
  const isFtgFaster = (leftFinalTime || 0) > (rightFinalTime || 0);

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 bg-[#070D18] flex flex-col text-white animate-fadeIn select-none overflow-hidden">
      {/* ── Top Header / Control Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0C192E] border-b border-[#1E3A8A] flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-[#1E3A8A] text-[#93C5FD] font-mono text-xs font-bold border border-[#3B82F6]/40">
            SO SÁNH ĐIỀU HÀNH KỊCH BẢN 5
          </div>
          <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
            Đảo chiều cất/hạ cánh Runway Change 07R (6 tàu bay)
          </h2>
        </div>

        {/* Speed Controls & Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Speed Scale Selector */}
          <div className="flex items-center bg-[#071326] p-0.5 rounded-lg border border-[#1E3A8A]">
            <span className="text-[10px] text-[#94A3B8] font-bold px-2">TỐC ĐỘ:</span>
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                  speedMultiplier === s
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(p => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              isPaused ? 'bg-[#059669] hover:bg-[#047857] text-white' : 'bg-[#D97706] hover:bg-[#B45309] text-white'
            }`}
          >
            {isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
          </button>

          <button
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E293B] hover:bg-[#334155] text-[#CBD5E1] border border-[#475569] transition cursor-pointer"
          >
            🔄 Chạy lại
          </button>

          <button
            onClick={onExit}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm transition cursor-pointer"
          >
            ✕ Thoát so sánh
          </button>
        </div>
      </div>

      {/* ── Main Dual Map Container ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 min-h-0 overflow-hidden relative">
        {/* ── LEFT SCREEN: Traditional ATC (No FtG) ── */}
        <div className="flex flex-col bg-[#0F172A] rounded-xl border border-[#334155] overflow-hidden shadow-2xl relative">
          {/* Individual Panel Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#1E293B] border-b border-[#334155] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${leftDone ? 'bg-[#10B981]' : 'bg-[#EF4444] animate-pulse'}`}></span>
              <span className="font-bold text-xs md:text-sm text-[#F87171]">MÀN TRÁI: ĐIỀU HÀNH TRUYỀN THỐNG (KHÔNG FTG)</span>
            </div>
            
            {/* Panel Individual Clock & Completed Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#0B132B] px-2.5 py-0.5 rounded border border-[#334155]">
                <span className="text-[10px] text-[#94A3B8] font-bold">Thời gian:</span>
                <span className="font-mono text-xs font-black text-[#F87171]">{formatMMSS(leftElapsed)}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#334155] text-[#E2E8F0]">
                {leftDone ? `HOÀN TẤT — ${formatMMSS(leftElapsed)}` : `Đang chạy · ${leftCount}/6`}
              </span>
            </div>
          </div>

          {/* Map Viewer */}
          <div className="flex-1 relative min-h-0">
            <AirportMap
              state={leftState}
              graph={graph}
              bgImage={bgImage}
              renderMode="traditional"
            />
            {/* Live Telemetry HUD Overlay */}
            <div className="absolute top-2 left-2 z-10 bg-[#0F172A]/90 border border-[#334155] rounded-lg p-2.5 text-[11px] shadow-lg backdrop-blur flex flex-col gap-1.5 pointer-events-none max-w-xs">
              <div className="text-[11px] font-bold text-[#F87171] uppercase tracking-wider border-b border-[#334155] pb-1">
                📻 Nhật ký thoại VHF / KSVKL (Tuần tự)
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#94A3B8] font-bold">Pha điều phối:</span>
                <span className="text-[#F87171] font-mono font-bold">
                  {leftElapsed < 18 ? 'GĐ 1: Xung đột dừng HS NS & NS2' : 'GĐ 2: Giải tỏa thủ công'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#94A3B8] font-bold">Tàu đang holding:</span>
                <span className="text-[#FCA5A5] font-mono font-bold">
                  {leftState.scenarioAircraft?.filter(a => a.status === 'holding' || a.status === 'stopped' || a.status === 'waiting').length || 0}/6
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#94A3B8] font-bold">Tổng chờ tích lũy:</span>
                <span className="text-[#FCA5A5] font-mono font-bold">
                  {Math.round(leftState.scenarioAircraft?.reduce((sum, a) => sum + (a.heldSeconds || 0), 0) || 0)}s
                </span>
              </div>
              <div className="text-[10px] text-[#CBD5E1] bg-[#1E293B]/80 p-1.5 rounded border border-[#334155] max-h-20 overflow-y-auto flex flex-col gap-1">
                {traditionalEvents.slice(-3).map((ev, idx) => (
                  <div key={`trad-ev-${idx}`}>
                    <span className="text-[#F87171] font-mono font-bold">[{formatMMSS(ev.time)}]</span> {ev.text}
                  </div>
                ))}
              </div>
            </div>

            {leftDone && (
              <div className="absolute top-3 right-3 z-10 bg-[#0F172A]/90 border border-[#10B981] px-3 py-1.5 rounded-lg shadow-lg backdrop-blur flex items-center gap-2 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span className="text-xs font-bold text-[#34D399]">Hoàn thành: {formatMMSS(leftElapsed)}</span>
              </div>
            )}
          </div>

          {/* Bottom Live Status Banner */}
          <div className="px-3 py-2 bg-[#090D16] border-t border-[#1E293B] text-[11px] text-[#94A3B8] flex items-center justify-between flex-shrink-0">
            <div>
              <strong className="text-[#FCA5A5]">Tình trạng:</strong>{' '}
              {leftElapsed < 18 ? '⚠️ Giai đoạn 1: INB01 dừng tại HS NS, OUT01 & OUT02 dừng tại NS2 do xung đột luồng.' : (
                leftDone ? `✓ Đã hoàn tất giải tỏa lúc ${formatMMSS(leftElapsed)}.` :
                '📻 Giai đoạn 2: KSVKL phát lệnh giải tỏa thủ công từng tàu. Tàu 4, 5, 6 chờ trong bến.'
              )}
            </div>
            <span className="font-mono text-[10px] text-[#EF4444] font-bold">FtG: OFF (0 Lights)</span>
          </div>
        </div>

        {/* ── RIGHT SCREEN: A-SMGCS + Follow-the-Green ── */}
        <div className="flex flex-col bg-[#0F172A] rounded-xl border border-[#059669] overflow-hidden shadow-2xl relative">
          {/* Individual Panel Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#064E3B] border-b border-[#059669] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${rightDone ? 'bg-[#34D399]' : 'bg-[#10B981] animate-pulse'}`}></span>
              <span className="font-bold text-xs md:text-sm text-[#34D399]">MÀN PHẢI: A-SMGCS + FOLLOW-THE-GREEN</span>
            </div>

            {/* Panel Individual Clock & Completed Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#062419] px-2.5 py-0.5 rounded border border-[#059669]">
                <span className="text-[10px] text-[#A7F3D0] font-bold">Thời gian:</span>
                <span className="font-mono text-xs font-black text-[#34D399]">{formatMMSS(rightElapsed)}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#065F46] text-[#A7F3D0]">
                {rightDone ? `HOÀN TẤT — ${formatMMSS(rightElapsed)}` : `Đang chạy · ${rightCount}/6`}
              </span>
            </div>
          </div>

          {/* Map Viewer */}
          <div className="flex-1 relative min-h-0">
            <AirportMap
              state={rightState}
              graph={graph}
              bgImage={bgImage}
              renderMode="ftg"
            />

            {/* ── Runway Change 07R Alert Notification inside FTG Panel (Hiển thị 4 giây thực) ── */}
            {showRunwayChangeAlert && (
              <div className="absolute top-3 right-3 z-30 animate-bounce pointer-events-none max-w-sm transition-opacity duration-500">
                <div className="bg-[#062419]/95 border-2 border-[#34D399] text-white px-3.5 py-2 rounded-xl shadow-[0_0_25px_rgba(52,211,153,0.6)] backdrop-blur-md flex items-center gap-2.5">
                  <span className="text-xl animate-pulse">📻</span>
                  <div>
                    <div className="text-[9px] text-[#A7F3D0] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-ping inline-block"></span>
                      KSVKL THÔNG BÁO:
                    </div>
                    <div className="text-xs font-black text-[#FDE047] font-mono tracking-wide">
                      “RUNWAY CHANGE 07R” — ĐỔI CHIỀU SANG 07R
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Telemetry HUD Overlay */}
            <div className="absolute top-2 left-2 z-10 bg-[#062419]/90 border border-[#059669] rounded-lg p-2.5 text-[11px] shadow-lg backdrop-blur flex flex-col gap-1.5 pointer-events-none max-w-xs">
              <div className="text-[11px] font-bold text-[#34D399] uppercase tracking-wider border-b border-[#059669] pb-1">
                ⚡ Tự Động Hóa A-SMGCS + FtG
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A7F3D0] font-bold">Pha điều phối:</span>
                <span className="text-[#34D399] font-mono font-bold">
                  {rightElapsed < 5 ? 'GĐ 1: INB01 dừng W7A nhường đường' : (rightElapsed < 16 ? 'GĐ 2: OUT01/02 đổi hướng 07R' : 'GĐ 3: Pushback Stand 8, 11, 4')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A7F3D0] font-bold">Tàu đang holding:</span>
                <span className="text-[#34D399] font-mono font-bold">
                  {rightState.scenarioAircraft?.filter(a => a.status === 'holding' || a.status === 'stopped' || a.status === 'waiting').length || 0}/6
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A7F3D0] font-bold">Tổng chờ tích lũy:</span>
                <span className="text-[#34D399] font-mono font-bold">
                  {Math.round(rightState.scenarioAircraft?.reduce((sum, a) => sum + (a.heldSeconds || 0), 0) || 0)}s
                </span>
              </div>
              <div className="text-[10px] text-[#A7F3D0] bg-[#064E3B]/80 p-1.5 rounded border border-[#059669] max-h-20 overflow-y-auto flex flex-col gap-1">
                {ftgEvents.slice(-3).map((ev, idx) => (
                  <div key={`ftg-ev-${idx}`}>
                    <span className="text-[#34D399] font-mono font-bold">[{formatMMSS(ev.time)}]</span> {ev.text}
                  </div>
                ))}
              </div>
            </div>

            {rightDone && (
              <div className="absolute top-3 right-3 z-10 bg-[#062419]/90 border border-[#34D399] px-3 py-1.5 rounded-lg shadow-lg backdrop-blur flex items-center gap-2 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-[#34D399]"></span>
                <span className="text-xs font-bold text-[#34D399]">Hoàn thành: {formatMMSS(rightElapsed)}</span>
              </div>
            )}
          </div>

          {/* Bottom Live Status Banner */}
          <div className="px-3 py-2 bg-[#062419] border-t border-[#059669] text-[11px] text-[#A7F3D0] flex items-center justify-between flex-shrink-0">
            <div>
              <strong className="text-[#34D399]">Tình trạng:</strong>{' '}
              {rightElapsed < 5 ? 'INB01 nhường đường tự động tại W7A; OUT01 & OUT02 lăn thông suốt.' : (
                rightElapsed < 16 ? '✓ OUT01 & OUT02 đổi hướng 07R; INB01 tiếp tục lăn về Stand 17.' :
                rightDone ? `✓ Toàn bộ 6 tàu bay đã hoàn tất chuyển hướng an toàn lúc ${formatMMSS(rightElapsed)}.` :
                '✓ Giai đoạn 3: Stand 8, 11, 4 pushback nối đuôi cách nhau 2s ra 07R.'
              )}
            </div>
            <span className="font-mono text-[10px] text-[#34D399] font-bold">FtG: ACTIVE</span>
          </div>
        </div>

        {/* ── FINAL COMPARISON SUMMARY MODAL (Appears when both finish) ── */}
        {bothFinished && (
          <div className="absolute inset-0 z-30 bg-[#070D18]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#0F172A] border-2 border-[#3B82F6] rounded-2xl p-6 max-w-xl w-full shadow-2xl text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1E3A8A] text-[#38BDF8] mb-3 text-2xl font-black">
                ⏱️
              </div>
              <h3 className="text-lg md:text-xl font-black text-white mb-1">
                KẾT QUẢ SO SÁNH HIỆU QUẢ ĐIỀU HÀNH
              </h3>
              <p className="text-xs text-[#94A3B8] mb-5">
                Kịch bản 5: Đảo chiều cất/hạ cánh Runway Change 07R (6 tàu bay)
              </p>

              <div className="grid grid-cols-2 gap-4 mb-5 text-left">
                <div className="bg-[#1E293B] p-3.5 rounded-xl border border-[#334155]">
                  <div className="text-[11px] font-bold text-[#F87171] mb-1">ĐIỀU HÀNH TRUYỀN THỐNG</div>
                  <div className="font-mono text-2xl font-black text-white">{formatMMSS(leftFinalTime || 0)}</div>
                  <div className="text-[10px] text-[#94A3B8] mt-1">Huấn lệnh thoại · Xếp hàng thủ công</div>
                </div>

                <div className="bg-[#064E3B] p-3.5 rounded-xl border border-[#059669]">
                  <div className="text-[11px] font-bold text-[#34D399] mb-1">A-SMGCS + FOLLOW-THE-GREEN</div>
                  <div className="font-mono text-2xl font-black text-[#34D399]">{formatMMSS(rightFinalTime || 0)}</div>
                  <div className="text-[10px] text-[#A7F3D0] mt-1">Đèn xanh dẫn hướng · Tự động nhường đường</div>
                </div>
              </div>

              {/* Performance Difference Highlight */}
              <div className={`p-4 rounded-xl mb-5 text-center border ${
                isFtgFaster ? 'bg-[#062419] border-[#10B981]' : 'bg-[#3E1F1F] border-[#EF4444]'
              }`}>
                {isFtgFaster ? (
                  <>
                    <div className="text-xs font-bold text-[#34D399] uppercase tracking-wider mb-1">
                      ✓ A-SMGCS + FtG Nhanh Hơn Vượt Trội
                    </div>
                    <div className="text-xl md:text-2xl font-black text-white font-mono">
                      Tiết kiệm {formatMMSS(timeSavedSec)} ({timeSavedPct}%)
                    </div>
                    <div className="text-[11px] text-[#A7F3D0] mt-1">
                      Giảm 100% nguy cơ nhầm lẫn thoại và ngăn ngừa ùn tắc giao lộ trong sương mù.
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-bold text-[#F87171]">
                    ⚠️ KẾT QUẢ CẦN REVIEW: Thời gian FtG không nhanh hơn truyền thống.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E293B] hover:bg-[#334155] text-white border border-[#475569] transition cursor-pointer"
                >
                  🔄 Chạy lại so sánh
                </button>
                <button
                  onClick={onExit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white transition cursor-pointer shadow-lg"
                >
                  ✓ Đóng kết quả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
