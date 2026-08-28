import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import type { ScenarioAircraft } from '../data/presetScenarios';
import { setupScenario5Traditional, setupScenario5FTG } from '../data/presetScenarios';
import { scenarioTick, startScenario } from '../simulation/scenarioRunner';
import ScenarioRunPage from './ui/ScenarioRunPage';
import ScenarioComparisonPanel from './ui/ScenarioComparisonPanel';
import SurfaceCard from './ui/SurfaceCard';
import { Radio, CheckCircle2 } from 'lucide-react';

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
    const isStage2Traditional = stage3StartSecRef.current !== null;

    if (currentSec >= 6 && currentSec - dt < 6) {
      setTraditionalEvents(e => [
        ...e,
        { time: 6, text: '⚠️ [GIAI ĐOẠN 1] INB01 dừng tại HS NS; OUT01 & OUT02 dừng tại NS2 do xung đột luồng và nghẽn sóng thoại.' },
      ]);
    }

    if (isStage2Traditional && !prev.scenarioAircraft?.some(a => a.callsign === 'OUT03' && !a.hidden)) {
      setTraditionalEvents(e => [
        ...e,
        { time: Math.round(currentSec), text: '📻 [GIAI ĐOẠN 2] KSVKL giải tỏa thủ công: INB01 qua HS NS vào bến 17; OUT01 & OUT02 tiếp tục ra RW 07R. Tàu 4, 5, 6 ở Stand chờ lượt.' },
      ]);
    }

    stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
      // ── GIAI ĐOẠN 1: KHI FTG CHƯA CHẠY TÀU 4 (!isStage2Traditional) ──
      if (!isStage2Traditional) {
        // 1. INB01: Hạ cánh di chuyển đến HS NS (v3_line_17_p09 / index >= 20) thì DỪNG LẠI
        if (ac.callsign === 'INB01') {
          const atHSNS = ac.currentNodeId === 'v3_line_17_p09' || ac.routeEdgeIndex >= 20;
          if (atHSNS) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG TẠI HS NS (CHỜ GIẢI TỎA)',
            };
          }
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 16,
            speedLimitKts: 16,
            scenarioLabel: 'RW 25R ➔ W4 ➔ CROSS 25L ➔ HS NS',
          };
        }

        // 2. OUT01: Lăn ra qua NS2 xuống đúng ngã ba E6/NS2 (v3_line_12_p02 / index >= 28) thì DỪNG LẠI do xung đột với Tàu 1
        if (ac.callsign === 'OUT01') {
          const atE6NS2 = ac.currentNodeId === 'v3_line_12_p02' || (ac.routeEdgeIndex >= 28 && ac.progressOnEdge >= 0.5);
          if (atE6NS2) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG TẠI E6/NS2 (XUNG ĐỘT TÀU 1)',
            };
          }
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 16,
            speedLimitKts: 16,
            scenarioLabel: 'STAND 9 ➔ E6 ➔ RW 25L ➔ NS2 ➔ E6/NS2',
          };
        }

        // 3. OUT02: Lăn theo đuôi OUT01 đến NS2 (v3_line_12_p01 / index >= 30) thì DỪNG LẠI
        if (ac.callsign === 'OUT02') {
          const atNS2 = ac.currentNodeId === 'v3_line_12_p01' || (ac.routeEdgeIndex >= 30 && ac.progressOnEdge >= 0.5);
          if (atNS2) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG THEO ĐUÔI TÀU 2 TẠI NS2',
            };
          }
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 14,
            speedLimitKts: 14,
            scenarioLabel: 'STAND 12 ➔ E6 ➔ RW 25L ➔ NS2',
          };
        }

        // 4, 5, 6: Chưa xuất hiện ở Giai đoạn 1
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
        // ── GIAI ĐOẠN 2: BẮT ĐẦU KHI FTG CHẠY TÀU 4 (isStage2Traditional) ──
        // 1. INB01: Được KSVKL giải tỏa đi qua HS NS vào bến đỗ Stand 17
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
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 16,
            speedLimitKts: 16,
            holdReason: undefined,
            scenarioLabel: 'HS NS ➔ VÀO BẾN ĐỖ STAND 17',
          };
        }

        // 2. OUT01: Được KSVKL giải tỏa tiếp tục đi theo tuyến ban đầu ra RW 07R
        if (ac.callsign === 'OUT01') {
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
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 16,
            speedLimitKts: 16,
            holdReason: undefined,
            scenarioLabel: 'NS2 ➔ HS NS ➔ W7B ➔ W11 ➔ RW 07R',
          };
        }

        // 3. OUT02: Được KSVKL giải tỏa tiếp tục đi theo tuyến ban đầu ra RW 07R
        if (ac.callsign === 'OUT02') {
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
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 14,
            speedLimitKts: 14,
            holdReason: undefined,
            scenarioLabel: 'NS2 ➔ NỐI ĐUÔI TÀU 2 RA RW 07R',
          };
        }

        // 4, 5, 6: Ở stand lần lượt 8, 11, 4 và KHÔNG PUSHBACK RA VÌ CHƯA ĐẾN LƯỢT
        if (ac.callsign === 'OUT03' || ac.callsign === 'OUT04' || ac.callsign === 'OUT05') {
          const standName = ac.callsign === 'OUT03' ? 'STAND 8' : ac.callsign === 'OUT04' ? 'STAND 11' : 'STAND 4';
          return {
            ...ac,
            hidden: false,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            holdReason: undefined,
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

      // 3. OUT02: Đứng chờ tại Stand 12 cho đến khi Tàu 1 đến W7A và Tàu 2 bắt đầu lăn thì mới xuất phát sau
      if (ac.callsign === 'OUT02') {
        const out1Started = out1 ? (out1.routeEdgeIndex >= 2 || out1.progressOnEdge >= 0.5 || out1.status === 'taxiing') : false;
        if (!inb1ReachedW7A || !out1Started) {
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
            speedKts: 18.5,
            speedLimitKts: 18.5,
            scenarioLabel: '🔄 RUNWAY CHANGE 07R ➔ NỐI ĐUÔI TÀU 2 RA 07R',
          };
        }
        return {
          ...ac,
          status: 'taxiing',
          speedKts: 18.5,
          speedLimitKts: 18.5,
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
        const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
        if (at07R && stage3StartSecRef.current !== null && stage3Elapsed >= 4.6) {
          return {
            ...ac,
            status: 'departed',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: '🛫 ĐÃ RA ĐẦU RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 4.6) {
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

      // 6. OUT05: Stand 4 -> Pushback ra RW 07R (Cách Tàu 5 thêm một khoảng an toàn)
      if (ac.callsign === 'OUT05') {
        const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
        if (at07R && stage3StartSecRef.current !== null && stage3Elapsed >= 8.2) {
          return {
            ...ac,
            status: 'departed',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: '🛫 ĐÃ RA ĐẦU RW 07R',
          };
        }
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 8.2) {
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

  const globalStatus = (leftDone && rightDone)
    ? 'completed'
    : isPaused
    ? 'paused'
    : 'running';

  return (
    <ScenarioRunPage
      category="So sánh Kịch bản 5"
      title="Đảo chiều cất/hạ cánh Runway Change 07R"
      description="Đánh giá hiệu năng giải tỏa luồng và chống ùn tắc giao lộ giữa điều hành thoại thủ công và tự động hóa A-SMGCS Follow-the-Green."
      status={globalStatus}
      speedMultiplier={speedMultiplier}
      onSpeedChange={setSpeedMultiplier}
      isPaused={isPaused}
      onTogglePause={() => setIsPaused(p => !p)}
      onRestart={handleRestart}
      onExit={onExit}
    >
      {/* ── LEFT SCREEN: Traditional ATC (No FtG) ── */}
      <ScenarioComparisonPanel
        title="Màn Trái: Điều Hành Truyền Thống (VHF)"
        renderMode="traditional"
        timeFormatted={formatMMSS(leftElapsed)}
        state={leftState}
        graph={graph}
        bgImage={bgImage}
        isDone={leftDone}
        doneLabel={`Hoàn thành: ${formatMMSS(leftElapsed)}`}
        ftgTag="FtG: OFF"
        hudContent={
          <SurfaceCard className="relative lg:absolute lg:top-3 lg:left-3 z-10 p-2 sm:p-2.5 text-xs backdrop-blur-sm flex flex-col gap-1.5 w-full lg:max-w-xs">
            <div className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider border-b border-[rgba(148,163,184,0.16)] pb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#F43F5E]" />
              Nhật ký thoại VHF / KSVKL
            </div>
            <div className="flex items-center justify-between gap-3 text-[#94A3B8]">
              <span>Pha điều phối:</span>
              <span className="text-[#F1F5F9] font-mono font-bold">
                {leftElapsed < 18 ? 'GĐ 1: Xung đột dừng HS NS & NS2' : 'GĐ 2: Giải tỏa thủ công'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#94A3B8]">
              <span>Tàu đang holding:</span>
              <span className="text-[#F43F5E] font-mono font-bold">
                {leftState.scenarioAircraft?.filter(a => a.status === 'holding' || a.status === 'stopped' || a.status === 'waiting').length || 0}/6
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#94A3B8]">
              <span>Tổng chờ tích lũy:</span>
              <span className="text-[#F1F5F9] font-mono font-bold">
                {Math.round(leftState.scenarioAircraft?.reduce((sum, a) => sum + (a.heldSeconds || 0), 0) || 0)}s
              </span>
            </div>
            <div className="text-xs text-[#94A3B8] bg-[#070B13] p-1.5 rounded-[6px] border border-[rgba(148,163,184,0.12)] max-h-20 overflow-y-auto flex flex-col gap-1">
              {traditionalEvents.slice(-3).map((ev, idx) => (
                <div key={`trad-ev-${idx}`} className="text-[#CBD5E1]">
                  <span className="text-[#F43F5E] font-mono font-bold">[{formatMMSS(ev.time)}]</span> {ev.text}
                </div>
              ))}
            </div>
          </SurfaceCard>
        }
        statusBanner={
          <span className="flex items-center gap-1.5 leading-snug">
            {leftElapsed < 18 ? (
              'Giai đoạn 1: INB01 dừng tại HS NS; OUT01 & OUT02 dừng tại E6/NS2 do xung đột luồng.'
            ) : leftDone ? (
              `Hoàn tất giải tỏa thủ công lúc ${formatMMSS(leftElapsed)}.`
            ) : (
              'Giai đoạn 2: KSVKL phát lệnh giải tỏa thủ công từng tàu. Tàu 4, 5, 6 chờ trong bến.'
            )}
          </span>
        }
      />

      {/* ── RIGHT SCREEN: A-SMGCS + Follow-the-Green ── */}
      <ScenarioComparisonPanel
        title="Màn Phải: A-SMGCS + Follow-the-Green"
        renderMode="ftg"
        timeFormatted={formatMMSS(rightElapsed)}
        state={rightState}
        graph={graph}
        bgImage={bgImage}
        isDone={rightDone}
        doneLabel={`Hoàn thành: ${formatMMSS(rightElapsed)}`}
        ftgTag="FtG: ACTIVE"
        alertContent={
          showRunwayChangeAlert ? (
            <SurfaceCard variant="active" className="absolute top-3 right-3 z-30 p-2.5 sm:p-3 shadow-lg backdrop-blur-md flex items-center gap-2.5 max-w-sm animate-fadeIn">
              <Radio className="w-4 h-4 text-[#06B6D4] animate-pulse" />
              <div>
                <div className="text-xs text-[#06B6D4] font-bold uppercase tracking-wider">
                  KSVKL THÔNG BÁO:
                </div>
                <div className="text-xs font-mono font-bold text-[#F1F5F9]">
                  “RUNWAY CHANGE 07R” — ĐỔI CHIỀU SANG 07R
                </div>
              </div>
            </SurfaceCard>
          ) : null
        }
        hudContent={
          <SurfaceCard className="relative lg:absolute lg:top-3 lg:left-3 z-10 p-2 sm:p-2.5 text-xs backdrop-blur-sm flex flex-col gap-1.5 w-full lg:max-w-xs">
            <div className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider border-b border-[rgba(148,163,184,0.16)] pb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4]" />
              Tự Động Hóa A-SMGCS + FtG
            </div>
            <div className="flex items-center justify-between gap-3 text-[#94A3B8]">
              <span>Pha điều phối:</span>
              <span className="text-[#F1F5F9] font-mono font-bold">
                {rightElapsed < 5 ? 'GĐ 1: INB01 dừng W7A nhường đường' : (rightElapsed < 16 ? 'GĐ 2: OUT01/02 đổi hướng 07R' : 'GĐ 3: Pushback Stand 8, 11, 4')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#94A3B8]">
              <span>Tàu đang holding:</span>
              <span className="text-[#22C55E] font-mono font-bold">
                {rightState.scenarioAircraft?.filter(a => a.status === 'holding' || a.status === 'stopped' || a.status === 'waiting').length || 0}/6
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#94A3B8]">
              <span>Tổng chờ tích lũy:</span>
              <span className="text-[#F1F5F9] font-mono font-bold">
                {Math.round(rightState.scenarioAircraft?.reduce((sum, a) => sum + (a.heldSeconds || 0), 0) || 0)}s
              </span>
            </div>
            <div className="text-xs text-[#94A3B8] bg-[#070B13] p-1.5 rounded-[6px] border border-[rgba(148,163,184,0.12)] max-h-20 overflow-y-auto flex flex-col gap-1">
              {ftgEvents.slice(-3).map((ev, idx) => (
                <div key={`ftg-ev-${idx}`} className="text-[#CBD5E1]">
                  <span className="text-[#06B6D4] font-mono font-bold">[{formatMMSS(ev.time)}]</span> {ev.text}
                </div>
              ))}
            </div>
          </SurfaceCard>
        }
        statusBanner={
          <span className="flex items-center gap-1.5 leading-snug">
            {rightElapsed < 5 ? (
              'GĐ 1: INB01 nhường đường tự động tại W7A; OUT01 & OUT02 lăn thông suốt.'
            ) : rightElapsed < 16 ? (
              'GĐ 2: OUT01 & OUT02 đổi hướng 07R; INB01 tiếp tục lăn về Stand 17.'
            ) : rightDone ? (
              `Toàn bộ 6 tàu bay hoàn tất chuyển hướng an toàn lúc ${formatMMSS(rightElapsed)}.`
            ) : (
              'GĐ 3: Stand 8, 11, 4 pushback nối đuôi cách nhau ra 07R.'
            )}
          </span>
        }
      />
    </ScenarioRunPage>
  );
}
