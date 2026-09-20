import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import { scenarioTick, startScenario } from '../simulation/scenarioRunner';
import { routeToEdges } from '../simulation/pathfinding';
import { getAirlineDef } from '../data/airlineTypes';
import ScenarioRunPage from './ui/ScenarioRunPage';
import ScenarioComparisonPanel from './ui/ScenarioComparisonPanel';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  graph: AirportGraph;
  bgImage: string;
  onExit: () => void;
}

interface ToastMessage {
  id: string;
  text: string;
  time?: number;
  durationSec?: number;
}

function parseToastMeta(text: string) {
  const isPilot = text.includes('👨‍✈️') || text.toLowerCase().includes('pilot');
  const isFod = text.includes('FOD') || text.includes('vật thể lạ');
  const isEmergency = text.includes('🚨') || text.includes('khẩn nguy') || text.includes('STOP');
  const isFtg = text.includes('🟢') || text.includes('FTG') || text.includes('Follow-the-Green');

  const callsignMatch = text.match(/\b(HVN\d+|BAV\d+|THA\d+|RESCUE\d+|VJ\d+|VN\d+|INB\d+|OUT\d+|OUTB\d+)\b/i);
  const callsign = callsignMatch ? callsignMatch[1].toUpperCase() : null;

  const quoteMatch = text.match(/"([^"]+)"/);
  const content = quoteMatch ? quoteMatch[1] : text.replace(/^[^:]+:\s*/, '');

  return { isPilot, isFod, isEmergency, isFtg, callsign, content };
}

function ComparisonDynamicIslandHud({
  toasts,
  onDismiss,
  variant,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  variant: 'traditional' | 'ftg';
}) {
  const isTrad = variant === 'traditional';

  if (toasts.length === 0) {
    return (
      <div className="w-full h-9 px-3 flex items-center justify-between select-none font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${
            isTrad ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
          }`} />
          <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full border leading-none ${
            isTrad ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
          }`}>
            {isTrad ? 'VHF LIVE' : 'FTG LIVE'}
          </span>
          <span className="text-slate-400 text-[11px] truncate">
            {isTrad ? 'Kênh điều hành thoại VHF 118.1 MHz' : 'Hệ thống đèn dẫn hướng A-SMGCS Follow-the-Green'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-mono select-none">
      {toasts.map(toast => {
        const meta = parseToastMeta(toast.text);
        const durationSec = toast.durationSec ?? 3.2;

        return (
          <div
            key={toast.id}
            className={`relative overflow-hidden w-full px-3 py-1.5 flex items-center justify-between text-xs transition-all duration-300 border-b border-white/5 last:border-b-0 ${
              isTrad
                ? 'bg-sky-950/40 text-sky-100 hover:bg-sky-900/40'
                : 'bg-emerald-950/40 text-emerald-100 hover:bg-emerald-900/40'
            }`}
            onClick={() => onDismiss(toast.id)}
            title="Bấm để đóng thông báo này"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`w-2 h-2 rounded-full inline-block animate-pulse shadow-[0_0_8px_currentColor] shrink-0 ${
                isTrad ? 'bg-sky-400 text-sky-400' : 'bg-emerald-400 text-emerald-400'
              }`} />
              <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full border leading-none shrink-0 ${
                isTrad ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              }`}>
                {isTrad ? 'VHF' : 'FTG'}
              </span>
              {meta.callsign && (
                <span className="text-[10px] font-bold text-sky-300 bg-sky-950/70 border border-sky-600/50 px-2 py-0.5 rounded-full tracking-wide leading-none shrink-0">
                  {meta.callsign}
                </span>
              )}
              <div className="font-mono text-[11px] sm:text-xs leading-tight text-slate-100 truncate flex-1 min-w-0 font-medium">
                {meta.content}
              </div>
            </div>

            {/* Nút đóng [✕] */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(toast.id);
              }}
              className="text-[#94A3B8] hover:text-white text-xs px-1.5 py-0.5 hover:bg-white/20 rounded-full transition-colors shrink-0 ml-1 cursor-pointer"
              title="Đóng lệnh này"
            >
              ✕
            </button>

            <div
              className={`absolute bottom-0 left-0 h-[1.5px] ${isTrad ? 'bg-sky-400/80' : 'bg-emerald-400/80'} island-countdown-bar`}
              style={{ animationDuration: `${durationSec}s` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function Scenario1ComparisonView({ graph, bgImage, onExit }: Props) {
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isPaused, setIsPaused] = useState(false);

  // Tuyến đường Truyền thống — STAND 10 -> HS NS -> rẽ nhầm vào E4 (Dừng lại khi rẽ sai)
  const traditionalRoute = [
    'v3_line_33_p00', 'v3_line_33_p01', 'v3_line_32_p01', 'v3_line_12_p03',
    'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00', 'v3_line_27_p00',
    'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00', 'v3_line_13_p03',
    'v3_line_22_p00', 'v3_line_15_p01', 'v3_line_23_p00', 'v3_line_24_p00',
    'v3_line_25_p00', 'v3_line_17_p11', 'v3_line_17_p12',
    'v3_line_26_p03', // E6/E4
    'v3_line_26_p02', // E4 (RẼ SAI ĐƯỜNG)
    'v3_line_26_p01', // E4/25L
  ];

  // Khởi tạo màn Truyền thống
  const initLeftState = () => {
    const s = startScenario('lvc_wrong_turn_radio_failure', graph);
    const vnAirline = getAirlineDef('VN');
    const edges = routeToEdges(traditionalRoute, graph.edges) ?? [];
    s.scenarioAircraft = [{
      id: 'S1',
      callsign: 'HVN216',
      airlineCode: 'VN',
      airlineName: vnAirline.name,
      aircraftAsset: vnAirline.asset,
      aircraftType: 'A321',
      currentNodeId: traditionalRoute[0],
      targetNodeId: traditionalRoute[traditionalRoute.length - 1],
      currentEdgeId: edges[0] ?? null,
      progressOnEdge: 0,
      speedKts: 20,
      speedLimitKts: 20,
      status: 'taxiing',
      assignedRoute: traditionalRoute,
      routeEdgeIndex: 0,
      role: 'departing',
      priority: 1,
      heldSeconds: 0,
    }];
    return s;
  };

  // Khởi tạo màn FtG
  const initRightState = () => {
    return startScenario('lvc_wrong_turn_radio_failure', graph);
  };

  const [leftState, setLeftState] = useState<SimulationState>(initLeftState);
  const [rightState, setRightState] = useState<SimulationState>(initRightState);
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);
  const [leftFinalTime, setLeftFinalTime] = useState<number | null>(null);
  const [rightFinalTime, setRightFinalTime] = useState<number | null>(null);


  // Danh sách thông điệp thoại của KSVKL
  const [traditionalEvents, setTraditionalEvents] = useState<Array<{ text: string }>>([]);
  const [ftgEvents, setFtgEvents] = useState<Array<{ text: string }>>([]);

  // Queue bong bóng tin nhắn pop-up khi đang thu gọn
  const [leftToasts, setLeftToasts] = useState<ToastMessage[]>([]);
  const [rightToasts, setRightToasts] = useState<ToastMessage[]>([]);

  const leftTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rightTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearLeftTimers = useCallback(() => {
    leftTimeoutsRef.current.forEach(clearTimeout);
    leftTimeoutsRef.current = [];
  }, []);

  const clearRightTimers = useCallback(() => {
    rightTimeoutsRef.current.forEach(clearTimeout);
    rightTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearLeftTimers();
      clearRightTimers();
    };
  }, [clearLeftTimers, clearRightTimers]);

  const handleDismissLeftToast = useCallback((id: string) => {
    setLeftToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleDismissRightToast = useCallback((id: string) => {
    setRightToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const prevTradCountRef = useRef(0);
  const prevFtgCountRef = useRef(0);

  // Hiệu ứng thác đổ tuần tự (Staggered Cascade) và cùng nhau biến mất (Dismiss Together)
  useEffect(() => {
    if (traditionalEvents.length <= prevTradCountRef.current) {
      prevTradCountRef.current = traditionalEvents.length;
      return;
    }
    const newItems = traditionalEvents.slice(prevTradCountRef.current);
    prevTradCountRef.current = traditionalEvents.length;

    clearLeftTimers();

    if (newItems.length === 1) {
      const t0: ToastMessage = {
        id: `${Date.now()}-0-${Math.random()}`,
        text: newItems[0].text,
        durationSec: 5.0,
      };
      setLeftToasts([t0]);
      const dismissT = setTimeout(() => {
        setLeftToasts([]);
      }, 5000);
      leftTimeoutsRef.current.push(dismissT);
    } else if (newItems.length === 2) {
      const t0: ToastMessage = {
        id: `${Date.now()}-0-${Math.random()}`,
        text: newItems[0].text,
        durationSec: 2.8,
      };
      const t1: ToastMessage = {
        id: `${Date.now()}-1-${Math.random()}`,
        text: newItems[1].text,
        durationSec: 2.4,
      };
      setLeftToasts([t0]);
      const stage1 = setTimeout(() => {
        setLeftToasts(prev => [...prev, t1]);
      }, 400);
      leftTimeoutsRef.current.push(stage1);

      const dismissT = setTimeout(() => {
        setLeftToasts([]);
      }, 2800);
      leftTimeoutsRef.current.push(dismissT);
    } else {
      const t0: ToastMessage = {
        id: `${Date.now()}-0-${Math.random()}`,
        text: newItems[0].text,
        durationSec: 3.2,
      };
      const t1: ToastMessage = {
        id: `${Date.now()}-1-${Math.random()}`,
        text: newItems[1].text,
        durationSec: 2.8,
      };
      const t2: ToastMessage = {
        id: `${Date.now()}-2-${Math.random()}`,
        text: newItems[2].text,
        durationSec: 2.4,
      };

      setLeftToasts([t0]);

      const stage1 = setTimeout(() => {
        setLeftToasts(prev => [...prev, t1]);
      }, 400);
      leftTimeoutsRef.current.push(stage1);

      const stage2 = setTimeout(() => {
        setLeftToasts(prev => [...prev, t2]);
      }, 800);
      leftTimeoutsRef.current.push(stage2);

      const dismissT = setTimeout(() => {
        setLeftToasts([]);
      }, 3200);
      leftTimeoutsRef.current.push(dismissT);
    }
  }, [traditionalEvents, clearLeftTimers]);

  useEffect(() => {
    if (ftgEvents.length <= prevFtgCountRef.current) {
      prevFtgCountRef.current = ftgEvents.length;
      return;
    }
    const newItems = ftgEvents.slice(prevFtgCountRef.current);
    prevFtgCountRef.current = ftgEvents.length;

    clearRightTimers();

    if (newItems.length === 1) {
      const t0: ToastMessage = {
        id: `${Date.now()}-0-${Math.random()}`,
        text: newItems[0].text,
        durationSec: 5.0,
      };
      setRightToasts([t0]);
      const dismissT = setTimeout(() => {
        setRightToasts([]);
      }, 5000);
      rightTimeoutsRef.current.push(dismissT);
    } else if (newItems.length === 2) {
      const t0: ToastMessage = {
        id: `${Date.now()}-0-${Math.random()}`,
        text: newItems[0].text,
        durationSec: 2.8,
      };
      const t1: ToastMessage = {
        id: `${Date.now()}-1-${Math.random()}`,
        text: newItems[1].text,
        durationSec: 2.4,
      };
      setRightToasts([t0]);
      const stage1 = setTimeout(() => {
        setRightToasts(prev => [...prev, t1]);
      }, 400);
      rightTimeoutsRef.current.push(stage1);

      const dismissT = setTimeout(() => {
        setRightToasts([]);
      }, 2800);
      rightTimeoutsRef.current.push(dismissT);
    } else {
      const t0: ToastMessage = {
        id: `${Date.now()}-0-${Math.random()}`,
        text: newItems[0].text,
        durationSec: 3.2,
      };
      const t1: ToastMessage = {
        id: `${Date.now()}-1-${Math.random()}`,
        text: newItems[1].text,
        durationSec: 2.8,
      };
      const t2: ToastMessage = {
        id: `${Date.now()}-2-${Math.random()}`,
        text: newItems[2].text,
        durationSec: 2.4,
      };

      setRightToasts([t0]);

      const stage1 = setTimeout(() => {
        setRightToasts(prev => [...prev, t1]);
      }, 400);
      rightTimeoutsRef.current.push(stage1);

      const stage2 = setTimeout(() => {
        setRightToasts(prev => [...prev, t2]);
      }, 800);
      rightTimeoutsRef.current.push(stage2);

      const dismissT = setTimeout(() => {
        setRightToasts([]);
      }, 3200);
      rightTimeoutsRef.current.push(dismissT);
    }
  }, [ftgEvents, clearRightTimers]);

  const tradInitClearanceRef = useRef(false);
  const ftgInitClearanceRef = useRef(false);
  const tradWrongTurnAnnouncedRef = useRef(false);
  const ftgArrivedAnnouncedRef = useRef(false);

  const lastTimeRef = useRef<number | null>(null);
  const leftDoneRef = useRef(false);
  const rightDoneRef = useRef(false);
  leftDoneRef.current = leftDone;
  rightDoneRef.current = rightDone;
  const rafRef = useRef<number | null>(null);

  const tickBoth = useCallback((now: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = now;
      return;
    }
    const rawDt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    if (isPaused) return;
    const dt = rawDt * (speedMultiplier * 5.0);

    // Cập nhật Màn Trái (Truyền thống)
    if (!leftDoneRef.current) {
      setLeftState(prev => {
        const next = scenarioTick(prev, dt, graph);

        // Phát huấn lệnh thoại ban đầu cho màn Truyền thống
        if (next.elapsedSeconds >= 0.5 && !tradInitClearanceRef.current) {
          tradInitClearanceRef.current = true;
          setTraditionalEvents(e => [
            ...e,
            { text: '📻 KSVKL: "HVN216, taxi to holding point runway 25L via NS and E6 taxiways"' },
          ]);
        }

        const ac = next.scenarioAircraft?.[0];
        if (ac) {
          // Khi rẽ sai vào E4 (v3_line_26_p02 hoặc gần 25L) -> Stop Bar đỏ chặn lại
          if (ac.currentNodeId === 'v3_line_26_p02' || ac.currentNodeId === 'v3_line_26_p01') {
            setLeftDone(true);
            setLeftFinalTime(next.elapsedSeconds);
            ac.status = 'holding';
            ac.speedKts = 0;

            if (!tradWrongTurnAnnouncedRef.current) {
              tradWrongTurnAnnouncedRef.current = true;
              setTraditionalEvents(e => [
                ...e,
                { text: '⚠️ KSVKL: "HVN216, STOP IMMEDIATELY! Wrong turn into taxiway E4!"' },
              ]);
            }
          }
        }
        return { ...next };
      });
    }

    // Cập nhật Màn Phải (FtG)
    if (!rightDoneRef.current) {
      setRightState(prev => {
        const next = scenarioTick(prev, dt, graph);

        // Phát huấn lệnh ban đầu cho màn FtG
        if (next.elapsedSeconds >= 0.5 && !ftgInitClearanceRef.current) {
          ftgInitClearanceRef.current = true;
          setFtgEvents(e => [
            ...e,
            { text: '🟢 KSVKL: "HVN216, follow green lights to holding point runway 25L via NS and E6 taxiways"' },
          ]);
        }

        const ac = next.scenarioAircraft?.[0];
        if (ac) {
          // Chỉ hoàn thành khi HVN216 đã lăn đến đúng điểm đích STOP BAR 25L
          const atDestination = ac.status === 'arrived' ||
            ac.currentNodeId === 'v3_line_17_p16' ||
            (ac.routeEdgeIndex >= (ac.assignedRoute?.length ?? 1) - 1 && ac.progressOnEdge >= 0.95);
          if (atDestination) {
            if (ac.status !== 'departed') {
              ac.status = 'departed';
              ac.heldSeconds = 0;

              if (!ftgArrivedAnnouncedRef.current) {
                ftgArrivedAnnouncedRef.current = true;
                setFtgEvents(e => [
                  ...e,
                  { text: '🟢 KSVKL: "HVN216, hold short of runway 25L"' },
                ]);
              }
            } else {
              ac.heldSeconds = (ac.heldSeconds ?? 0) + dt;
              if (ac.heldSeconds >= 1.3) {
                setRightDone(true);
                setRightFinalTime(next.elapsedSeconds);
              }
            }
          }
        }
        return { ...next };
      });
    }
  }, [graph, speedMultiplier, isPaused]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    const frame = (time: number) => {
      tickBoth(time);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [tickBoth]);

  const handleRestart = () => {
    setLeftDone(false);
    setRightDone(false);
    setLeftFinalTime(null);
    setRightFinalTime(null);
    setSpeedMultiplier(1);
    tradInitClearanceRef.current = false;
    ftgInitClearanceRef.current = false;
    tradWrongTurnAnnouncedRef.current = false;
    ftgArrivedAnnouncedRef.current = false;
    prevTradCountRef.current = 0;
    prevFtgCountRef.current = 0;
    setTraditionalEvents([]);
    setFtgEvents([]);
    clearLeftTimers();
    clearRightTimers();
    setLeftToasts([]);
    setRightToasts([]);
    setLeftState(initLeftState());
    setRightState(initRightState());
    lastTimeRef.current = performance.now();
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const lE = leftFinalTime ?? leftState.elapsedSeconds ?? 0;
  const rE = rightFinalTime ?? rightState.elapsedSeconds ?? 0;

  const globalStatus = (leftDone && rightDone)
    ? 'completed'
    : isPaused
    ? 'paused'
    : 'running';

  return (
    <ScenarioRunPage
      category="So sánh Kịch bản 1"
      title="HVN216: STAND 10 ➔ STOP BAR 25L"
      description="Đối chiếu an toàn giữa điều hành thủ công VHF và tự động hóa A-SMGCS Follow-the-Green."
      status={globalStatus}
      speedMultiplier={speedMultiplier}
      onSpeedChange={setSpeedMultiplier}
      isPaused={isPaused}
      onTogglePause={() => setIsPaused(p => !p)}
      onRestart={handleRestart}
      onExit={onExit}
    >
      {/* ── LEFT SCREEN: Truyền thống ── */}
      <ScenarioComparisonPanel
        title="Màn Trái: Điều Hành Truyền Thống (VHF)"
        renderMode="traditional"
        timeFormatted={fmt(lE)}
        state={leftState}
        graph={graph}
        bgImage={bgImage}
        isDone={leftDone}
        ftgTag="FtG: OFF"
        hudContent={
          <ComparisonDynamicIslandHud
            toasts={leftToasts}
            onDismiss={handleDismissLeftToast}
            variant="traditional"
          />
        }
        statusBanner={
          <span className={leftDone ? 'text-[#F43F5E] font-bold flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
            {leftDone ? (
              <>
                <ShieldAlert className="w-4 h-4 text-[#F43F5E] flex-shrink-0" />
                Giai đoạn 2: Tàu bay đi sai đường (rẽ nhầm E4) ➔ Stop Bar đỏ khóa dừng!
              </>
            ) : (
              'Giai đoạn 1 & 2: HVN216 lăn theo huấn lệnh thoại VHF thủ công'
            )}
          </span>
        }
      />

      {/* ── RIGHT SCREEN: Follow-the-Green ── */}
      <ScenarioComparisonPanel
        title="Màn Phải: A-SMGCS + Follow-the-Green"
        renderMode="ftg"
        timeFormatted={fmt(rE)}
        state={rightState}
        graph={graph}
        bgImage={bgImage}
        isDone={rightDone}
        ftgTag="FtG: ACTIVE"
        hudContent={
          <ComparisonDynamicIslandHud
            toasts={rightToasts}
            onDismiss={handleDismissRightToast}
            variant="ftg"
          />
        }
        statusBanner={
          <span className={rightDone ? 'text-[#22C55E] font-bold flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
            {rightDone ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                Giai đoạn 2: Follow-the-Green dẫn đúng STAND 10 ➔ E6 ➔ 25L an toàn 100%!
              </>
            ) : (
              'Giai đoạn 1 & 2: Đèn FtG xanh lá dẫn trước mũi tàu qua HS NS → E6/E4 → E6'
            )}
          </span>
        }
      />
    </ScenarioRunPage>
  );
}
