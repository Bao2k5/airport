import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import { scenarioTick, startScenario } from '../simulation/scenarioRunner';
import { routeToEdges } from '../simulation/pathfinding';
import { getAirlineDef } from '../data/airlineTypes';
import ScenarioRunPage from './ui/ScenarioRunPage';
import ScenarioComparisonPanel from './ui/ScenarioComparisonPanel';
import { Radio, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  graph: AirportGraph;
  bgImage: string;
  onExit: () => void;
}

interface ToastMessage {
  id: string;
  text: string;
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
    }, 8000);
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

  const handleDismissLeftToast = useCallback((id: string) => {
    setLeftToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleDismissRightToast = useCallback((id: string) => {
    setRightToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const prevTradCountRef = useRef(0);
  const prevFtgCountRef = useRef(0);

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
    }));
    setRightToasts(prev => [...prev.slice(-3), ...newToasts]);
  }, [ftgEvents, ftgEvents.length]);

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
