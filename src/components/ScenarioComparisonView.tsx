import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import type { ScenarioAircraft } from '../data/presetScenarios';
import { setupScenario5Traditional, setupScenario5FTG } from '../data/presetScenarios';
import { scenarioTick, startScenario, routeToEdges } from '../simulation/scenarioRunner';
import ScenarioRunPage from './ui/ScenarioRunPage';
import ScenarioComparisonPanel from './ui/ScenarioComparisonPanel';
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

interface ToastMessage {
  id: string;
  text: string;
  time: number;
}

function ToastItem({
  toast,
  onDismiss,
  variant,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  variant: 'traditional' | 'ftg';
}) {
  useEffect(() => {
    const t = setTimeout(() => {
      onDismiss(toast.id);
    }, 8000); // 8s: thời gian rộng rãi để đọc thoải mái cả 3 huấn lệnh cùng xuất hiện
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const isTrad = variant === 'traditional';

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto w-full max-w-[330px] bg-[#0E1523]/95 border ${
        isTrad ? 'border-rose-500/40 hover:border-rose-500/70' : 'border-cyan-500/40 hover:border-cyan-500/70'
      } shadow-2xl shadow-black/90 rounded-2xl rounded-tl-sm p-2.5 text-xs text-[#F1F5F9] backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 cursor-pointer select-none`}
      title="Bấm để đóng tin nhắn này"
    >
      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-white/10">
        <div className={`flex items-center gap-1.5 ${isTrad ? 'text-rose-400' : 'text-cyan-400'} font-bold text-[10.5px] uppercase tracking-wider`}>
          <span className={`w-2 h-2 rounded-full ${isTrad ? 'bg-rose-500' : 'bg-cyan-400'} animate-ping inline-block`} />
          {isTrad ? <Radio className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>{isTrad ? 'KSVKL (VHF Ground)' : 'A-SMGCS / KSVKL'}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          className="text-[#94A3B8] hover:text-white text-xs px-1 hover:bg-white/10 rounded transition-colors"
          title="Đóng"
        >
          ✕
        </button>
      </div>
      <div className={`text-[#F1F5F9] font-mono text-[11.5px] leading-relaxed pl-1.5 border-l-2 ${
        isTrad ? 'border-rose-500/60 bg-rose-950/20' : 'border-cyan-500/60 bg-cyan-950/20'
      } py-1 pr-1.5 rounded-r`}>
        {toast.text}
      </div>
    </div>
  );
}

export default function Scenario5ComparisonView({
  graph,
  bgImage,
  onExit,
}: Props) {
  // Speed scale state: 0.5x, 1x (default), 2x, 5x, 10x
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
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

  // Independent Event Logs for both simulation panes (starts empty, events appear only at exact timeline)
  const [traditionalEvents, setTraditionalEvents] = useState<Array<{ time: number; callsign?: string; text: string }>>([]);
  const [ftgEvents, setFtgEvents] = useState<Array<{ time: number; callsign?: string; text: string }>>([]);

  // Track completion state and final frozen simulated timestamps
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);
  const [leftFinalTime, setLeftFinalTime] = useState<number | null>(null);
  const [rightFinalTime, setRightFinalTime] = useState<number | null>(null);


  // Toast state for collapsed HUD view: queue of active chat bubbles, each lasting 4.5s
  const [leftToasts, setLeftToasts] = useState<ToastMessage[]>([]);
  const [rightToasts, setRightToasts] = useState<ToastMessage[]>([]);

  const handleDismissLeftToast = useCallback((id: string) => {
    setLeftToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleDismissRightToast = useCallback((id: string) => {
    setRightToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const prevTradCountRef = useRef(0);
  const prevFtgCountRef = useRef(0);
  const tradInitClearancesIssuedRef = useRef(false);
  const ftgInitClearancesIssuedRef = useRef(false);

  useEffect(() => {
    if (traditionalEvents.length <= prevTradCountRef.current) {
      prevTradCountRef.current = traditionalEvents.length;
      return;
    }
    const newItems = traditionalEvents.slice(prevTradCountRef.current);
    prevTradCountRef.current = traditionalEvents.length;

    const newToasts: ToastMessage[] = newItems.map((ev, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      text: ev.text,
      time: ev.time,
    }));

    setLeftToasts(prev => [...prev.slice(-3), ...newToasts]);
  }, [traditionalEvents, traditionalEvents.length]);

  useEffect(() => {
    if (ftgEvents.length <= prevFtgCountRef.current) {
      prevFtgCountRef.current = ftgEvents.length;
      return;
    }
    const newItems = ftgEvents.slice(prevFtgCountRef.current);
    prevFtgCountRef.current = ftgEvents.length;

    const newToasts: ToastMessage[] = newItems.map((ev, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      text: ev.text,
      time: ev.time,
    }));

    setRightToasts(prev => [...prev.slice(-3), ...newToasts]);
  }, [ftgEvents, ftgEvents.length]);

  const runwayChangeTriggeredRef = useRef(false);
  const tradRunwayChangeTriggeredRef = useRef(false);
  const tradInbHoldAnnouncedRef = useRef(false);
  const tradOutHoldAnnouncedRef = useRef(false);
  const stage3StartSecRef = useRef<number | null>(null);
  const tradStage2AnnouncedRef = useRef(false);
  const tradOutClearanceIssuedRef = useRef(false);
  const tradOut2ClearanceIssuedRef = useRef(false);
  const tradOut1Stage2StartSecRef = useRef<number | null>(null);
  const ftgStage3AnnouncedRef = useRef(false);
  const takeoffStartWallRef = useRef<Map<string, number>>(new Map());
  const tradTakeoffStartRef = useRef<Map<string, number>>(new Map());

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

    // 1. Giai đoạn 1: Khi 3 tàu cùng xuất hiện ở đầu kịch bản, phát đồng thời cả 3 huấn lệnh ban đầu cho Tàu 1, 2, 3
    if (currentSec >= 0.5 && !tradInitClearancesIssuedRef.current) {
      tradInitClearancesIssuedRef.current = true;
      setTraditionalEvents(e => [
        ...e,
        { time: 0, text: '📻 KSVKL: "INB01, vacate left via W4 and cross runway 25L taxi to stand 17 via W7 and E6 taxiway"' },
        { time: 0, text: '📻 KSVKL: "OUTB01, taxi to holding point runway 25L via NS and E6 taxiway"' },
        { time: 0, text: '📻 KSVKL: "OUTB02, taxi to holding point runway 25L via NS and E6 taxiway"' },
      ]);
    }



    if (isStage2Traditional && !tradStage2AnnouncedRef.current) {
      tradStage2AnnouncedRef.current = true;
      setTraditionalEvents(e => [
        ...e,
        { time: Math.round(currentSec), text: '📻 KSVKL: "INB01, continue taxi to stand 17 via E6 taxiway"' },
      ]);
    }

    const inb1Ac = stateToTick.scenarioAircraft?.find(a => a.callsign === 'INB01');
    const inb1PassedHSNS = inb1Ac ? (inb1Ac.routeEdgeIndex > 20 || inb1Ac.currentNodeId === 'v3_line_17_p10' || inb1Ac.currentNodeId === 'v3_line_21_p00' || inb1Ac.status === 'arrived') : false;

    if (isStage2Traditional && inb1PassedHSNS && !tradOutClearanceIssuedRef.current) {
      tradOutClearanceIssuedRef.current = true;
      tradOut1Stage2StartSecRef.current = currentSec;
      setTraditionalEvents(e => [
        ...e,
        { time: Math.round(currentSec), text: '📻 KSVKL: "OUTB01, continue taxi to holding point 07R via W7, W9, W11 taxiway"' },
      ]);
    }

    if (
      isStage2Traditional &&
      tradOut1Stage2StartSecRef.current !== null &&
      currentSec >= tradOut1Stage2StartSecRef.current + 6.0 &&
      !tradOut2ClearanceIssuedRef.current
    ) {
      tradOut2ClearanceIssuedRef.current = true;
      setTraditionalEvents(e => [
        ...e,
        { time: Math.round(currentSec), text: '📻 KSVKL: "OUTB02, continue taxi to holding point 07R via W7, W9, W11 taxiway"' },
      ]);
    }

    // Helper tính toạ độ pixel của tàu bay để kiểm soát khoảng cách an toàn (separation)
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const getAcPos = (targetAc?: ScenarioAircraft | null) => {
      if (!targetAc || !targetAc.assignedRoute || targetAc.assignedRoute.length < 2) return null;
      const idx = Math.min(targetAc.routeEdgeIndex, targetAc.assignedRoute.length - 2);
      const u = nodeMap.get(targetAc.assignedRoute[idx]);
      const v = nodeMap.get(targetAc.assignedRoute[idx + 1]);
      if (!u || !v) return null;
      const prog = Math.max(0, Math.min(1, targetAc.progressOnEdge));
      return {
        x: u.x + (v.x - u.x) * prog,
        y: u.y + (v.y - u.y) * prog,
      };
    };

    const out1Ac = stateToTick.scenarioAircraft?.find(a => a.callsign === 'OUT01');
    const posOut1 = getAcPos(out1Ac);

    // Helper kiểm tra một tàu bay đã hoàn thành cất cánh và biến mất hoàn toàn trên màn truyền thống chưa (2.8s)
    const isTradDisappeared = (callsign: string) => {
      const t = tradTakeoffStartRef.current.get(callsign);
      return t !== undefined && (performance.now() - t) >= 2800;
    };
    const tradOut1Finished = isTradDisappeared('OUT01');

    stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
      // ── GIAI ĐOẠN 1: KHI FTG CHƯA CHẠY TÀU 4 (!isStage2Traditional) ──
      if (!isStage2Traditional) {
        // 1. INB01: Hạ cánh di chuyển nhanh đến ngay chỗ HS W7 đi lên 1 chút (index >= 18) thì dừng chờ
        if (ac.callsign === 'INB01') {
          const atHSW7 = (ac.routeEdgeIndex === 18 && ac.progressOnEdge >= 0.25) || ac.routeEdgeIndex > 18 || ac.currentNodeId === 'v3_line_17_p08';
          if (atHSW7) {
            if (!tradInbHoldAnnouncedRef.current) {
              tradInbHoldAnnouncedRef.current = true;
              setTraditionalEvents(e => [
                ...e,
                { time: Math.round(currentSec), text: '⚠️ KSVKL: "INB01, holdshort of HS NS"' },
              ]);
            }
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG TẠI HS W7 (HOLDSHORT HS NS)',
            };
          }
          const isRollout = ac.routeEdgeIndex <= 4;
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 20,
            speedLimitKts: 20,
            scenarioLabel: isRollout ? 'HẠ CÁNH XẢ ĐÀ 25R ➔ THOÁT W4' : 'W4 ➔ CROSS 25L ➔ HS W7',
          };
        }

        // 2. OUT01: Đợi 0.8s nhận huấn lệnh rồi mới lăn ra qua NS2 xuống đúng ngã ba E6/NS2 (v3_line_12_p02) thì DỪNG LẠI
        if (ac.callsign === 'OUT01') {
          if (currentSec < 0.8 && ac.routeEdgeIndex === 0) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              scenarioLabel: 'STAND 9 (CHỜ HUẤN LỆNH KSVKL)',
            };
          }

          const reachedE6 = ac.routeEdgeIndex >= 12 || ac.currentNodeId === 'v3_line_17_p12' || ac.currentNodeId === 'v3_line_17_p13';
          if (reachedE6 && !tradRunwayChangeTriggeredRef.current) {
            tradRunwayChangeTriggeredRef.current = true;
            setTraditionalEvents(e => [
              ...e,
              { time: Math.round(currentSec), text: '📻 KSVKL: "OUTB01 (OUTB02), taxi to holding point runway 07R via NS2, W7, W9, W11 taxiway"' },
            ]);
          }

          const atE6NS2 = ac.currentNodeId === 'v3_line_12_p02' || (ac.routeEdgeIndex >= 28 && ac.progressOnEdge >= 0.5);
          if (atE6NS2) {
            if (!tradOutHoldAnnouncedRef.current) {
              tradOutHoldAnnouncedRef.current = true;
              setTraditionalEvents(e => [
                ...e,
                { time: Math.round(currentSec), text: '⚠️ KSVKL: "OUTB01 (OUTB02), holdshort of HS NS"' },
              ]);
            }
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG TẠI E6/NS2 (HOLDSHORT HS NS)',
            };
          }
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 20,
            speedLimitKts: 20,
            scenarioLabel: 'STAND 9 ➔ E6 ➔ RW 25L ➔ NS2 ➔ E6/NS2',
          };
        }

        // 3. OUT02: Chờ Tàu 2 (OUT01) lăn trước 7.0s để giãn khoảng cách an toàn rộng hơn rồi mới pushback từ Stand 12
        if (ac.callsign === 'OUT02') {
          const posOut2 = getAcPos(ac);
          const distToOut1 = (posOut1 && posOut2) ? Math.hypot(posOut1.x - posOut2.x, posOut1.y - posOut2.y) : Infinity;

          if (currentSec < 7.0 && ac.routeEdgeIndex === 0) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              scenarioLabel: 'STAND 12 (CHỜ TÀU 2 LĂN TRƯỚC)',
            };
          }
          const atNS2 = ac.currentNodeId === 'v3_line_05_p04' || ac.currentNodeId === 'v3_line_12_p01' || (ac.routeEdgeIndex >= 28 && ac.progressOnEdge >= 0.2) || distToOut1 < 75;
          if (atNS2) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG THEO ĐUÔI TÀU 2 (HOLDSHORT HS NS)',
            };
          }
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 17.5,
            speedLimitKts: 17.5,
            scenarioLabel: 'STAND 12 ➔ E6 ➔ RW 25L ➔ NS2',
          };
        }

        // 4, 5, 6: Đã xuất hiện ở vị trí bãi đỗ (Stand 8, 11, 4), đứng im chờ huấn lệnh pushback
        if (ac.callsign === 'OUT03' || ac.callsign === 'OUT04' || ac.callsign === 'OUT05') {
          const standName = ac.callsign === 'OUT03' ? 'STAND 8' : ac.callsign === 'OUT04' ? 'STAND 11' : 'STAND 4';
          return {
            ...ac,
            hidden: false,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            scenarioLabel: `${standName} (CHỜ HUẤN LỆNH PUSHBACK)`,
          };
        }
      } else {
        // ── GIAI ĐOẠN 2: BẮT ĐẦU KHI FTG CHẠY TÀU 4 (isStage2Traditional) ──
        // 1. INB01: Được KSVKL giải tỏa đi qua HS W7, HS NS vào bến đỗ Stand 17
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
            speedKts: 20,
            speedLimitKts: 20,
            holdReason: undefined,
            scenarioLabel: 'HS W7 ➔ HS NS ➔ VÀO BẾN ĐỖ STAND 17',
          };
        }

        // 2. OUT01: Được KSVKL giải tỏa tiếp tục đi theo tuyến ban đầu ra RW 07R (chờ INB01 qua HS NS)
        if (ac.callsign === 'OUT01') {
          if (!tradOutClearanceIssuedRef.current) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG TẠI E6/NS2 (CHỜ INB01 QUA HS NS)',
            };
          }
          const at07R = ac.currentNodeId === 'v3_line_16_p00' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1;
          if (at07R) {
            if (!tradTakeoffStartRef.current.has('OUT01')) {
              tradTakeoffStartRef.current.set('OUT01', performance.now());
            }
            const finished = isTradDisappeared('OUT01');
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
          return {
            ...ac,
            status: 'taxiing',
            speedKts: 20,
            speedLimitKts: 20,
            holdReason: undefined,
            scenarioLabel: 'NS2 ➔ HS NS ➔ W7B ➔ W11 ➔ RW 07R',
          };
        }

        // 3. OUT02: Được KSVKL giải tỏa tiếp tục đi theo tuyến ban đầu ra RW 07R sau khi có huấn lệnh (cách Tàu 2 6.0s)
        if (ac.callsign === 'OUT02') {
          const posOut2 = getAcPos(ac);
          const distToOut1 = (posOut1 && posOut2) ? Math.hypot(posOut1.x - posOut2.x, posOut1.y - posOut2.y) : Infinity;

          const out2CanRoll = tradOut1Stage2StartSecRef.current !== null && currentSec >= tradOut1Stage2StartSecRef.current + 6.0;
          if (!out2CanRoll) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 DỪNG THEO ĐUÔI TÀU 2 (GIÃN CÁCH 6.0s)',
            };
          }

          // Bắt buộc dừng chờ tại điểm an toàn (v3_line_16_p02 hoặc khi cách Tàu 2 < 75px) nếu Tàu 2 (OUT01) chưa cất cánh xong
          const at07R_Hold = !tradOut1Finished && (
            ac.currentNodeId === 'v3_line_16_p02' ||
            ac.currentNodeId === 'v3_line_16_p01' ||
            ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 3 ||
            distToOut1 < 75
          );
          if (at07R_Hold) {
            return {
              ...ac,
              currentNodeId: 'v3_line_16_p02',
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              holdReason: 'stop-bar',
              scenarioLabel: '🛑 W11/07R (CHỜ TÀU 2 CẤT CÁNH BIẾN MẤT)',
            };
          }

          // Khoảng cách an toàn dọc đường lăn: nếu gần hơn 70px thì phanh dừng chờ
          if (!tradOut1Finished && distToOut1 < 70) {
            return {
              ...ac,
              status: 'holding',
              speedKts: 0,
              speedLimitKts: 0,
              scenarioLabel: '🛑 GIÃN CÁCH AN TOÀN SAU TÀU 2 (< 70m)',
            };
          }

          const at07R = ac.currentNodeId === 'v3_line_16_p00' || (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.8);
          if (at07R) {
            if (!tradTakeoffStartRef.current.has('OUT02')) {
              tradTakeoffStartRef.current.set('OUT02', performance.now());
            }
            const finished = isTradDisappeared('OUT02');
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

          // Điều chỉnh tốc độ lăn theo sau mượt mà: nếu dưới 95px thì giảm còn 12 kts, bình thường lăn 16 kts
          const targetSpeed = (!tradOut1Finished && distToOut1 < 95) ? 12 : 16;
          return {
            ...ac,
            status: 'taxiing',
            speedKts: targetSpeed,
            speedLimitKts: targetSpeed,
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

      // Xử lý về bến cho INB01
      if (ac.callsign === 'INB01' && (ac.currentNodeId === 'v3_line_22_p01' || ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1)) {
        return {
          ...ac,
          status: 'arrived',
          speedKts: 0,
          speedLimitKts: 0,
          scenarioLabel: '✓ ĐÃ VỀ BẾN STAND 17',
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
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 6.5) {
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
        if (stage3StartSecRef.current !== null && stage3Elapsed >= 12.0) {
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
      setTimeout(() => {
        setRightDone(true);
        setRightFinalTime(Math.round(next.elapsedSeconds * 10) / 10);
      }, 2500);
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
        const simDt = wallDt * (speedMultiplier * 5.0); // 1x=5.0, 2x=10.0, 4x=20.0

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
    setSpeedMultiplier(1);
    runwayChangeTriggeredRef.current = false;
    tradRunwayChangeTriggeredRef.current = false;
    tradInbHoldAnnouncedRef.current = false;
    tradOutHoldAnnouncedRef.current = false;
    stage3StartSecRef.current = null;
    tradStage2AnnouncedRef.current = false;
    tradOutClearanceIssuedRef.current = false;
    tradOut2ClearanceIssuedRef.current = false;
    tradOut1Stage2StartSecRef.current = null;
    ftgStage3AnnouncedRef.current = false;
    takeoffStartWallRef.current.clear();
    tradTakeoffStartRef.current.clear();
    setTraditionalEvents([]);
    setFtgEvents([]);
    setLeftToasts([]);
    setRightToasts([]);
    tradInitClearancesIssuedRef.current = false;
    ftgInitClearancesIssuedRef.current = false;
    prevTradCountRef.current = 0;
    prevFtgCountRef.current = 0;
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
        ftgTag="FtG: OFF"
        hudContent={
          leftToasts.length > 0 ? (
            <div className="relative lg:absolute lg:top-3 lg:left-3 z-10 flex flex-col gap-2 w-full lg:max-w-xs pointer-events-none">
              {leftToasts.map(toast => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onDismiss={handleDismissLeftToast}
                  variant="traditional"
                />
              ))}
            </div>
          ) : null
        }
        statusBanner={
          <span className="flex items-center gap-1.5 leading-snug">
            {leftElapsed < 18 ? (
              'Giai đoạn 1: INB01 dừng tại HS W7; OUT01 & OUT02 dừng tại E6/NS2 do xung đột luồng.'
            ) : leftDone ? (
              'Giai đoạn 2: INB01 về bến 17; OUT01 & 02 ra 07R. Tàu 4, 5, 6 tiếp tục chờ trong bến do nghẽn luồng VHF.'
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
        ftgTag="FtG: ACTIVE"
        alertContent={null}
        hudContent={
          rightToasts.length > 0 ? (
            <div className="relative lg:absolute lg:top-3 lg:left-3 z-10 flex flex-col gap-2 w-full lg:max-w-xs pointer-events-none">
              {rightToasts.map(toast => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onDismiss={handleDismissRightToast}
                  variant="ftg"
                />
              ))}
            </div>
          ) : null
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
