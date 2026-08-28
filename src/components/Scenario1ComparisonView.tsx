import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import { scenarioTick, startScenario } from '../simulation/scenarioRunner';
import { routeToEdges } from '../simulation/pathfinding';
import { getAirlineDef } from '../data/airlineTypes';
import ScenarioRunPage from './ui/ScenarioRunPage';
import ScenarioComparisonPanel from './ui/ScenarioComparisonPanel';
import SurfaceCard from './ui/SurfaceCard';
import { Radio, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  graph: AirportGraph;
  bgImage: string;
  onExit: () => void;
}

export default function Scenario1ComparisonView({ graph, bgImage, onExit }: Props) {
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2);
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
      speedKts: 15,
      speedLimitKts: 15,
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

  const lastTimeRef = useRef<number>(performance.now());
  const leftDoneRef = useRef(false);
  const rightDoneRef = useRef(false);
  leftDoneRef.current = leftDone;
  rightDoneRef.current = rightDone;

  const tickBoth = useCallback(() => {
    const now = performance.now();
    const rawDt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    if (isPaused) return;
    const dt = rawDt * speedMultiplier;

    // Cập nhật Màn Trái (Truyền thống)
    if (!leftDoneRef.current) {
      setLeftState(prev => {
        const next = scenarioTick(prev, dt, graph);
        const ac = next.scenarioAircraft?.[0];
        if (ac) {
          // Khi rẽ sai vào E4 (v3_line_26_p02 hoặc gần 25L) -> Stop Bar đỏ chặn lại
          if (ac.currentNodeId === 'v3_line_26_p02' || ac.currentNodeId === 'v3_line_26_p01') {
            setLeftDone(true);
            setLeftFinalTime(next.elapsedSeconds);
            ac.status = 'holding';
            ac.speedKts = 0;
          }
        }
        return { ...next };
      });
    }

    // Cập nhật Màn Phải (FtG)
    if (!rightDoneRef.current) {
      setRightState(prev => {
        const next = scenarioTick(prev, dt, graph);
        const ac = next.scenarioAircraft?.[0];
        if (ac) {
          if (ac.status === 'holding' || ac.currentNodeId === 'v3_line_17_p13') {
            setRightDone(true);
            setRightFinalTime(next.elapsedSeconds);
          }
        }
        return { ...next };
      });
    }
  }, [graph, speedMultiplier, isPaused]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    const timer = setInterval(tickBoth, 33);
    return () => clearInterval(timer);
  }, [tickBoth]);

  const handleRestart = () => {
    setLeftDone(false); setRightDone(false); setLeftFinalTime(null); setRightFinalTime(null);
    setLeftState(initLeftState()); setRightState(initRightState());
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
        doneLabel="Dừng do cảnh báo sai lộ trình"
        ftgTag="FtG: OFF"
        clearanceContent={
          leftState.elapsedSeconds < 6.5 ? (
            <SurfaceCard variant="active" className="absolute top-3 left-3 right-3 z-20 p-2.5 sm:p-3 backdrop-blur-md animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#06B6D4] animate-pulse" />
                  <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wide">
                    Giai đoạn 1: Huấn lệnh KSVKL (ATC Clearance)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-[6px] bg-[#0E1523] text-[#93C5FD] border border-[rgba(56,189,248,0.3)]">
                  TWR 118.1 MHz
                </span>
              </div>
              <div className="mt-1.5 text-xs font-mono font-bold text-[#F1F5F9] pl-3 border-l-2 border-[#06B6D4]">
                “HVN216 taxi to holding point runway 25L via NS and E6 taxiways”
              </div>
            </SurfaceCard>
          ) : null
        }
        hudContent={
          <SurfaceCard className="relative lg:absolute lg:top-3 lg:left-3 z-10 p-2 sm:p-2.5 text-xs flex flex-col gap-1 backdrop-blur-sm w-full lg:max-w-xs">
            <div className="text-[#94A3B8] font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#F43F5E]" />
              Thoại VHF thủ công · Không có đèn
            </div>
            <div className="text-[#94A3B8]">
              Vị trí: <span className="text-[#F1F5F9] font-mono font-bold">{leftState.scenarioAircraft?.[0]?.currentNodeId || '—'}</span>
            </div>
            <div className="text-[#94A3B8]">
              Tốc độ: <span className="text-[#F1F5F9] font-mono font-bold">{leftState.scenarioAircraft?.[0]?.speedKts?.toFixed(1) || '0'} kts</span>
            </div>
          </SurfaceCard>
        }
        statusBanner={
          <span className={leftDone ? 'text-[#F43F5E] font-bold flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
            {leftDone ? (
              <>
                <ShieldAlert className="w-4 h-4 text-[#F43F5E] flex-shrink-0" />
                Giai đoạn 2: Tàu bay đi sai đường (rẽ nhầm E4) ➔ Stop Bar đỏ khóa dừng!
              </>
            ) : leftState.elapsedSeconds < 6.5 ? (
              'Giai đoạn 1: KSVKL cấp huấn lệnh thoại cho HVN216 tại Stand 10'
            ) : (
              'Giai đoạn 2: Lăn theo thoại VHF thủ công — Phi công tự quan sát trong sương mù'
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
        doneLabel="Hoàn thành 100% đúng tuyến"
        ftgTag="FtG: ACTIVE"
        clearanceContent={
          rightState.elapsedSeconds < 6.5 ? (
            <SurfaceCard variant="active" className="absolute top-3 left-3 right-3 z-20 p-2.5 sm:p-3 backdrop-blur-md animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#06B6D4] animate-pulse" />
                  <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wide">
                    Giai đoạn 1: Huấn lệnh KSVKL (ATC Clearance)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-[6px] bg-[#0E1523] text-[#93C5FD] border border-[rgba(56,189,248,0.3)]">
                  TWR 118.1 MHz
                </span>
              </div>
              <div className="mt-1.5 text-xs font-mono font-bold text-[#F1F5F9] pl-3 border-l-2 border-[#06B6D4]">
                “HVN216 taxi to holding point runway 25L via NS and E6 taxiways”
              </div>
            </SurfaceCard>
          ) : null
        }
        hudContent={
          <SurfaceCard className="relative lg:absolute lg:top-3 lg:left-3 z-10 p-2 sm:p-2.5 text-xs flex flex-col gap-1 backdrop-blur-sm w-full lg:max-w-xs">
            <div className="text-[#22C55E] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              Đèn xanh FtG dẫn hướng thông minh
            </div>
            <div className="text-[#94A3B8]">
              Vị trí: <span className="text-[#F1F5F9] font-mono font-bold">{rightState.scenarioAircraft?.[0]?.currentNodeId || '—'}</span>
            </div>
            <div className="text-[#94A3B8]">
              Tốc độ: <span className="text-[#F1F5F9] font-mono font-bold">{rightState.scenarioAircraft?.[0]?.speedKts?.toFixed(1) || '0'} kts</span>
            </div>
          </SurfaceCard>
        }
        statusBanner={
          <span className={rightDone ? 'text-[#22C55E] font-bold flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
            {rightDone ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                Giai đoạn 2: Follow-the-Green dẫn đúng STAND 10 ➔ E6 ➔ 25L an toàn 100%!
              </>
            ) : rightState.elapsedSeconds < 6.5 ? (
              'Giai đoạn 1: KSVKL cấp huấn lệnh cho HVN216 tại Stand 10'
            ) : (
              'Giai đoạn 2: Đèn FtG xanh lá dẫn trước mũi tàu qua HS NS → E6/E4 → E6'
            )}
          </span>
        }
      />
    </ScenarioRunPage>
  );
}
