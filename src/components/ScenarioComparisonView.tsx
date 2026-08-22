import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import type { ScenarioAircraft } from '../data/presetScenarios';
import { setupScenario5Traditional, setupScenario5FTG } from '../data/presetScenarios';
import AirportMap from './AirportMap';
import { scenarioTick, startScenario, recalculateRoutePreservingProgress } from '../simulation/scenarioRunner';

interface Props {
  graph: AirportGraph;
  bgImage: string;
  onExit: () => void;
}

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
    { time: 0, text: 'Bắt đầu mô phỏng: 8 tàu bay lăn theo kế hoạch ban đầu đầu 25' },
  ]);
  const [ftgEvents, setFtgEvents] = useState<Array<{ time: number; callsign?: string; text: string }>>([
    { time: 0, text: 'Khởi động hệ thống A-SMGCS Level 4: Rolling Window FtG cấp phép đầu 25' },
  ]);

  // Track completion state and final frozen simulated timestamps
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);
  const [leftFinalTime, setLeftFinalTime] = useState<number | null>(null);
  const [rightFinalTime, setRightFinalTime] = useState<number | null>(null);

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
  // Distinct manual voice dispatch: sequential verbal instructions, lower taxi speed (11.4 kts), no blue route preview
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

    // Traditional ATC delays & Gridlock at direction change (t >= 10s: radio jam, t >= 14s: gridlock)
    if (currentSec >= 10 && currentSec - dt < 10) {
      setTraditionalEvents(e => [
        ...e,
        { time: 10, text: '⚠️ ĐÈ SÓNG VÔ TUYẾN: Gió đổi hướng, 8 phi công đè sóng VHF liên tục hỏi đường rẽ!' },
      ]);
    }

    // Traditional ATC events: t=10s Radio Jam
    if (currentSec >= 10 && currentSec - dt < 10) {
      setTraditionalEvents(e => [
        ...e,
        { time: 10, text: '⚠️ ĐÈ SÓNG VÔ TUYẾN: Gió đổi hướng, 8 phi công đè sóng VHF liên tục hỏi đường rẽ!' },
      ]);
    }

    // Kiểm tra tàu hạ cánh thứ nhất (INB01) thực sự chạy tới điểm HS_W7 (v3_line_19_p03)
    const inb1 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'INB01');
    const inb1ReachedHsW7 = inb1 ? (
      inb1.currentNodeId === 'v3_line_19_p03' ||
      inb1.assignedRoute[inb1.routeEdgeIndex] === 'v3_line_19_p03' || 
      inb1.assignedRoute[inb1.routeEdgeIndex + 1] === 'v3_line_19_p03' ||
      inb1.routeEdgeIndex >= 14
    ) : false;

    // Quản lý 4 tàu cất cánh và 2 tàu pushback: đồng thời cùng xuất hiện khi INB01 đến HS_W7
    stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
      if (ac.callsign === 'PUSH01') {
        const out4 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'OUT04');
        const out4PassedStand11 = out4 && (out4.routeEdgeIndex >= 1 || out4.status === 'holding');
        if (!inb1ReachedHsW7 || !out4PassedStand11) {
          return {
            ...ac,
            hidden: !inb1ReachedHsW7,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            progressOnEdge: 0,
            routeEdgeIndex: 0,
            scenarioLabel: 'STAND 11: CHỜ OUT04 LĂN QUA',
          };
        } else {
          return {
            ...ac,
            hidden: false,
            status: ac.status === 'holding' && ac.routeEdgeIndex === 0 && ac.progressOnEdge === 0 ? 'taxiing' : ac.status,
            speedKts: ac.speedKts > 0 ? ac.speedKts : 7,
            speedLimitKts: 7,
            scenarioLabel: 'PUSHBACK STAND 11 ➔ LINE 12',
          };
        }
      }

      if (ac.callsign === 'PUSH02') {
        const push1 = stateToTick.scenarioAircraft?.find(a => a.callsign === 'PUSH01');
        const push1SafelyAhead = push1 && (push1.status === 'holding' || push1.routeEdgeIndex >= 3);
        if (!inb1ReachedHsW7 || !push1SafelyAhead) {
          return {
            ...ac,
            hidden: !inb1ReachedHsW7,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            progressOnEdge: 0,
            routeEdgeIndex: 0,
            scenarioLabel: 'STAND 3: CHỜ PUSH01 LĂN QUA',
          };
        } else {
          return {
            ...ac,
            hidden: false,
            status: ac.status === 'holding' && ac.routeEdgeIndex === 0 && ac.progressOnEdge === 0 ? 'taxiing' : ac.status,
            speedKts: ac.speedKts > 0 ? ac.speedKts : 6,
            speedLimitKts: 6,
            scenarioLabel: 'PUSHBACK STAND 3 ➔ LINE 12',
          };
        }
      }

      if (ac.callsign.startsWith('OUT')) {
        if (!inb1ReachedHsW7) {
          return {
            ...ac,
            hidden: true,
            status: 'holding',
            speedKts: 0,
            speedLimitKts: 0,
            progressOnEdge: 0,
            routeEdgeIndex: 0,
            scenarioLabel: 'ẨN: CHỜ INB01 ĐẾN HS_W7',
          };
        } else {
          ac = {
            ...ac,
            hidden: false,
            status: ac.status === 'holding' && ac.routeEdgeIndex === 0 && ac.progressOnEdge === 0 ? 'taxiing' : ac.status,
            speedKts: ac.speedKts > 0 ? ac.speedKts : 14,
            speedLimitKts: 14,
            scenarioLabel: ac.callsign === 'OUT01' ? 'L28_ENT ➔ HS NS' : 'BÁM ĐUÔI TÀU TRƯỚC',
          };
        }
      }

      // Xếp hàng nối đuôi an toàn mũi chạm đuôi khi tới gần HS NS
      if (ac.callsign === 'OUT01' && ((ac.routeEdgeIndex >= 2 && ac.progressOnEdge >= 0.93) || ac.status === 'arrived' || ac.currentNodeId === 'v3_line_17_p09')) {
        return {
          ...ac,
          routeEdgeIndex: 2,
          progressOnEdge: 0.93,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ DỪNG TẠI HS NS',
        };
      }
      if (ac.callsign === 'OUT02' && ((ac.routeEdgeIndex >= 3 && ac.progressOnEdge >= 0.57) || ac.status === 'arrived')) {
        return {
          ...ac,
          routeEdgeIndex: 3,
          progressOnEdge: 0.57,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ STOP (SAU OUT01)',
        };
      }
      if (ac.callsign === 'OUT03' && ((ac.routeEdgeIndex >= 4 && ac.progressOnEdge >= 0.85) || ac.status === 'arrived')) {
        return {
          ...ac,
          routeEdgeIndex: 4,
          progressOnEdge: 0.85,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ STOP (SAU OUT02)',
        };
      }
      if (ac.callsign === 'OUT04' && ((ac.routeEdgeIndex > 5 || (ac.routeEdgeIndex === 5 && ac.progressOnEdge >= 0.81)) || ac.status === 'arrived')) {
        return {
          ...ac,
          routeEdgeIndex: 5,
          progressOnEdge: 0.81,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ STOP (SAU OUT03)',
        };
      }
      if (ac.callsign === 'PUSH01' && ((ac.routeEdgeIndex > 4 || (ac.routeEdgeIndex === 4 && ac.progressOnEdge >= 0.35)) || ac.status === 'arrived')) {
        return {
          ...ac,
          routeEdgeIndex: 4,
          progressOnEdge: 0.35,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ STOP (SAU OUT04)',
        };
      }
      if (ac.callsign === 'PUSH02' && ((ac.routeEdgeIndex > 10 || (ac.routeEdgeIndex === 10 && ac.progressOnEdge >= 0.38)) || ac.status === 'arrived')) {
        return {
          ...ac,
          routeEdgeIndex: 10,
          progressOnEdge: 0.38,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ STOP (SAU PUSH01)',
        };
      }
      if (ac.callsign === 'INB01' && ((ac.routeEdgeIndex >= 16 && ac.progressOnEdge >= 0.90) || ac.status === 'arrived' || ac.currentNodeId === 'v3_line_17_p09')) {
        return {
          ...ac,
          routeEdgeIndex: 16,
          progressOnEdge: 0.90,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ DỪNG TẠI HS NS',
        };
      }
      if (ac.callsign === 'INB02' && ((ac.routeEdgeIndex >= 15 && ac.progressOnEdge >= 0.40) || ac.status === 'arrived')) {
        return {
          ...ac,
          routeEdgeIndex: 15,
          progressOnEdge: 0.40,
          status: 'holding',
          speedKts: 0,
          speedLimitKts: 0,
          holdReason: 'stop-bar',
          scenarioLabel: '⛔ STOP (SAU INB01)',
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

    // Check completion for Left Panel
    const finished = countCompleted(next.scenarioAircraft);
    if (finished === 8 && !leftDone) {
      setLeftDone(true);
      setLeftFinalTime(Math.round(next.elapsedSeconds * 10) / 10);
    }

    return next;
  }, [graph, leftDone]);

  // Custom Tick for Right Screen: A-SMGCS + Follow-the-Green
  // Instant Auto-Freeze, dynamic parallel Dijkstra reroute, 2-phase release, active blue route preview + green rolling window
  const rightTick = useCallback((prev: SimulationState, dt: number): SimulationState => {
    if (rightDone) return prev;

    const currentSec = prev.elapsedSeconds;
    let stateToTick = { ...prev };

    // Automated FtG Direction Change Triggers
    if (currentSec >= 25 && currentSec - dt < 25) {
      setFtgEvents(e => [
        ...e,
        { time: 25, text: '⚡ RUNWAY_CHANGE_07R: Auto-Freeze kích hoạt tức thời, dừng 8 tàu bằng Stop Bar đỏ' },
        { time: 25, callsign: 'OUT01, OUT02', text: 'Pha 1: Cấp tuyến đổi hướng 07R qua Dijkstra + Route Preview xanh dương + FtG xanh 15 kts' },
      ]);

      stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
        if (ac.callsign === 'OUT01') {
          const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_16_p01', stateToTick.blockedEdgeIds, graph);
          return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, routeVisible: true, guidanceVisible: true, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
        }
        if (ac.callsign === 'OUT02') {
          const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_17_p01', stateToTick.blockedEdgeIds, graph);
          return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, routeVisible: true, guidanceVisible: true, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
        }
        if (ac.callsign === 'INB01' || ac.callsign === 'INB02') {
          return { ...ac, status: 'taxiing', speedKts: 15, holdReason: undefined, routeVisible: true, guidanceVisible: true, scenarioLabel: 'FTG DẪN ĐƯỜNG VỀ BẾN' };
        }
        // Others held by Auto-Freeze Stop Bar (route preview hidden until cleared)
        return { ...ac, status: 'holding', speedKts: 0, holdReason: 'stop-bar', routeVisible: false, guidanceVisible: false, scenarioLabel: 'AUTO-FREEZE (STOP BAR ĐỎ)' };
      });
    }

    if (currentSec >= 45 && currentSec - dt < 45) {
      setFtgEvents(e => [
        ...e,
        { time: 45, callsign: 'OUT03, OUT04, PUSH', text: 'Pha 2: Giải phóng hành lang + Cấp Route Preview xanh dương + FtG xanh 15 kts' },
      ]);

      stateToTick.scenarioAircraft = stateToTick.scenarioAircraft?.map(ac => {
        if (ac.callsign === 'OUT03') {
          const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_01_p00', stateToTick.blockedEdgeIds, graph);
          return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, routeVisible: true, guidanceVisible: true, scenarioLabel: 'FTG DẪN ĐƯỜNG 07L' };
        }
        if (ac.callsign === 'OUT04') {
          const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_03_p01', stateToTick.blockedEdgeIds, graph);
          return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, routeVisible: true, guidanceVisible: true, scenarioLabel: 'FTG DẪN ĐƯỜNG 07L' };
        }
        if (ac.callsign === 'PUSH01') {
          const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_17_p04', stateToTick.blockedEdgeIds, graph);
          return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, routeVisible: true, guidanceVisible: true, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
        }
        if (ac.callsign === 'PUSH02') {
          const rerouted = recalculateRoutePreservingProgress(ac, 'v3_line_18_p03', stateToTick.blockedEdgeIds, graph);
          return { ...rerouted, status: 'taxiing', speedKts: 15, holdReason: undefined, routeVisible: true, guidanceVisible: true, scenarioLabel: 'FTG DẪN ĐƯỜNG 07R' };
        }
        return ac;
      });
    }

    const next = scenarioTick(stateToTick, dt, graph);

    // Check completion for Right Panel
    const finished = countCompleted(next.scenarioAircraft);
    if (finished === 8 && !rightDone) {
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
    <div className="fixed inset-0 z-50 bg-[#070D18] flex flex-col text-white animate-fadeIn select-none">
      {/* ── Top Header / Control Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0C192E] border-b border-[#1E3A8A] flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-[#1E3A8A] text-[#93C5FD] font-mono text-xs font-bold border border-[#3B82F6]/40">
            SO SÁNH ĐIỀU HÀNH KỊCH BẢN 5
          </div>
          <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
            Đảo chiều cất/hạ cánh khẩn cấp trong giờ cao điểm LVC (8 tàu bay)
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
                {leftDone ? `HOÀN TẤT — ${formatMMSS(leftElapsed)}` : `Đang chạy · ${leftCount}/8`}
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
                  {leftElapsed < 25 ? 'Pha 0: Kế hoạch 25' : (leftElapsed < 50 ? 'Pha 1: Chờ lệnh thoại' : (leftElapsed < 90 ? 'Pha 1: Thoại OUT01/02' : (leftElapsed < 135 ? 'Pha 2: Thoại OUT03/04' : 'Pha 3: Thoại Pushback')))}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#94A3B8] font-bold">Tàu đang holding:</span>
                <span className="text-[#FCA5A5] font-mono font-bold">
                  {leftState.scenarioAircraft?.filter(a => a.status === 'holding' || a.status === 'stopped' || a.status === 'waiting').length || 0}/8
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
              {leftElapsed < 25 ? '8 tàu bay lăn theo kế hoạch đầu 25 (chưa đổi chiều)' : (
                leftElapsed < 90 ? '⚠️ Ùn ứ tại Stop Bar HS NS / E6. KSVKL phát lệnh thoại tuần tự từng tàu.' :
                leftDone ? `✓ Đã hoàn tất 8/8 tàu bay lúc ${formatMMSS(leftElapsed)}.` :
                'Đang giải tỏa chậm, thời gian chờ trung bình tăng do thoại thủ công.'
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
                {rightDone ? `HOÀN TẤT — ${formatMMSS(rightElapsed)}` : `Đang chạy · ${rightCount}/8`}
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
            {/* Live Telemetry HUD Overlay */}
            <div className="absolute top-2 left-2 z-10 bg-[#062419]/90 border border-[#059669] rounded-lg p-2.5 text-[11px] shadow-lg backdrop-blur flex flex-col gap-1.5 pointer-events-none max-w-xs">
              <div className="text-[11px] font-bold text-[#34D399] uppercase tracking-wider border-b border-[#059669] pb-1">
                ⚡ Tự Động Hóa A-SMGCS + FtG
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A7F3D0] font-bold">Pha điều phối:</span>
                <span className="text-[#34D399] font-mono font-bold">
                  {rightElapsed < 25 ? 'Pha 0: Kế hoạch 25' : (rightElapsed < 45 ? 'Pha 1: Auto-Freeze & 07R' : 'Pha 2: Dynamic FtG 8 tàu')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A7F3D0] font-bold">Tàu đang holding:</span>
                <span className="text-[#34D399] font-mono font-bold">
                  {rightState.scenarioAircraft?.filter(a => a.status === 'holding' || a.status === 'stopped' || a.status === 'waiting').length || 0}/8
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
              {rightElapsed < 25 ? 'Dẫn đường FtG xanh lá thông suốt ra STOP BAR 25L' : (
                rightElapsed < 45 ? '✓ Auto-Freeze dừng an toàn; OUT01/OUT02 chuyển hướng 07R qua Dijkstra.' :
                rightDone ? `✓ Toàn bộ 8 tàu bay đã hoàn tất chuyển hướng an toàn lúc ${formatMMSS(rightElapsed)}.` :
                '✓ Cấp quyền theo pha mượt mà, không ùn tắc giao lộ.'
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
                Kịch bản 5: Đảo chiều khai thác 25 → 07 trong giờ cao điểm LVC (8 tàu bay)
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
                  <div className="text-[10px] text-[#A7F3D0] mt-1">Auto-Freeze · Đèn xanh dẫn hướng</div>
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
