import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import AirportMap from './AirportMap';
import { scenarioTick, startScenario } from '../simulation/scenarioRunner';
import { scenario1WrongTurn } from '../data/scenarios/scenario1_wrongTurn';
import { routeToEdges } from '../simulation/pathfinding';
import { getAirlineDef } from '../data/airlineTypes';
import AppShell from './ui/AppShell';
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
    const edges = routeToEdges(traditionalRoute, graph.edges) ?? [];
    const vnDef = getAirlineDef('VN');
    s.scenarioAircraft = [{
      id: 'S1', callsign: 'HVN216', airlineCode: 'VN',
      airlineName: vnDef.name, aircraftAsset: vnDef.asset, aircraftType: 'A321',
      currentNodeId: traditionalRoute[0], targetNodeId: traditionalRoute[traditionalRoute.length - 1],
      currentEdgeId: edges[0] ?? null, progressOnEdge: 0,
      speedKts: 15, speedLimitKts: 15, status: 'taxiing',
      assignedRoute: traditionalRoute, routeEdgeIndex: 0,
      role: 'departing', priority: 1,
      scenarioLabel: 'HUẤN LỆNH: STAND 10 ➔ E6 ➔ 25L',
      clearedRoute: traditionalRoute, routeVisible: false, guidanceVisible: false,
    }];
    return s;
  };

  // Khởi tạo màn FtG với tuyến ngắn thẳng
  const initRightState = () => {
    const s = startScenario('lvc_wrong_turn_radio_failure', graph);
    const setup = scenario1WrongTurn.setup?.(graph);
    if (setup) s.scenarioAircraft = setup.aircraft;
    return s;
  };

  const [leftState, setLeftState] = useState<SimulationState>(initLeftState);
  const [rightState, setRightState] = useState<SimulationState>(initRightState);
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);
  const [leftFinalTime, setLeftFinalTime] = useState<number | null>(null);
  const [rightFinalTime, setRightFinalTime] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const countCompleted = (list?: any[] | null) =>
    list?.filter(a => a.status === 'arrived' || a.status === 'departed').length ?? 0;

  const leftTick = useCallback((prev: SimulationState, dt: number): SimulationState => {
    if (leftDone) return prev;
    let st = {
      ...prev,
      scenarioAircraft: prev.scenarioAircraft?.map(ac => ({ ...ac, guidanceVisible: false, routeVisible: false })),
    };
    const next = scenarioTick(st, dt, graph);
    if (next.scenarioAircraft) {
      next.scenarioAircraft = next.scenarioAircraft.map(ac => {
        // Kiểm tra khi vừa rẽ vào E4 (v3_line_26_p02 / v3_line_26_p01)
        if (ac.currentNodeId === 'v3_line_26_p02' || ac.currentNodeId === 'v3_line_26_p01' || ac.routeEdgeIndex >= 19) {
          return {
            ...ac,
            status: 'holding' as const,
            holdReason: 'deviation' as const,
            deviated: true,
            speedKts: 0,
            scenarioLabel: '⛔ ĐI SAI ĐƯỜNG: RẼ NHẦM E4',
            guidanceVisible: false,
            routeVisible: false,
          };
        }
        return { ...ac, guidanceVisible: false, routeVisible: false };
      });
    }

    const ac = next.scenarioAircraft?.find(a => a.callsign === 'HVN216');
    if (ac && (ac.deviated || ac.currentNodeId === 'v3_line_26_p02' || ac.currentNodeId === 'v3_line_26_p01' || ac.routeEdgeIndex >= 19) && !leftDone) {
      setLeftDone(true);
      setLeftFinalTime(Math.round(next.elapsedSeconds * 10) / 10);
      if (next.scenario) {
        next.scenario.events.push({
          atSeconds: next.elapsedSeconds,
          message: '⛔ [CẢNH BÁO] HVN216 đi sai huấn lệnh, đã rẽ vào E4 thay vì E6! Tàu bay bị khóa dừng tại chỗ.',
          severity: 'critical',
        });
      }
    }
    return next;
  }, [graph, leftDone]);

  const rightTick = useCallback((prev: SimulationState, dt: number): SimulationState => {
    if (rightDone) return prev;
    const next = scenarioTick(prev, dt, graph);
    if (countCompleted(next.scenarioAircraft) >= 1 && !rightDone) {
      setRightDone(true);
      setRightFinalTime(Math.round(next.elapsedSeconds * 10) / 10);
    }
    return next;
  }, [graph, rightDone]);

  useEffect(() => {
    if (isPaused) { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; lastTimeRef.current = null; return; }
    const frame = (now: number) => {
      if (lastTimeRef.current !== null) {
        const simDt = Math.min((now - lastTimeRef.current) / 1000, 0.1) * speedMultiplier * 3.0;
        if (!leftDone) setLeftState(prev => leftTick(prev, simDt));
        if (!rightDone) setRightState(prev => rightTick(prev, simDt));
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; lastTimeRef.current = null; };
  }, [isPaused, leftDone, rightDone, speedMultiplier, leftTick, rightTick]);

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
    <AppShell
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
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3 min-h-0 overflow-hidden">
        {/* ── LEFT SCREEN: Truyền thống ── */}
        <SurfaceCard className="flex flex-col h-full overflow-hidden shadow-md relative">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#131E2E] border-b border-[rgba(148,163,184,0.16)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
              <span className="font-bold text-xs text-[#F1F5F9] uppercase tracking-wider">
                Màn Trái: Điều Hành Truyền Thống (VHF)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] font-medium">Thời gian:</span>
              <span className="font-mono text-xs font-bold text-[#F43F5E]">{fmt(lE)}</span>
            </div>
          </div>

          <div className="flex-1 relative min-h-0 bg-[#070B13]">
            <AirportMap state={leftState} graph={graph} bgImage={bgImage} renderMode="traditional" aircraftScale={1.5} />

            {/* Khung Huấn lệnh KSVKL (Giai đoạn 1: hiển thị 6.5s đầu rồi tự động tắt) */}
            {leftState.elapsedSeconds < 6.5 && (
              <SurfaceCard variant="active" className="absolute top-3 left-3 right-3 z-20 p-3 backdrop-blur-md animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#06B6D4] animate-pulse" />
                    <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wide">
                      Giai đoạn 1: Huấn lệnh KSVKL (ATC Clearance)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-[#0E1523] text-[#93C5FD] border border-[rgba(56,189,248,0.3)]">
                    TWR 118.1 MHz
                  </span>
                </div>
                <div className="mt-1.5 text-xs font-mono font-bold text-[#F1F5F9] pl-3 border-l-2 border-[#06B6D4]">
                  “HVN216 taxi to holding point runway 25L via NS and E6 taxiways”
                </div>
              </SurfaceCard>
            )}

            {/* Telemetry HUD góc dưới */}
            <SurfaceCard className="absolute bottom-3 left-3 z-10 p-2.5 text-[11px] pointer-events-none flex flex-col gap-1 backdrop-blur-sm max-w-xs">
              <div className="text-[#94A3B8] font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#F43F5E]" />
                Thoại VHF thủ công · Không có đèn dẫn đường
              </div>
              <div className="text-[#94A3B8]">
                Vị trí: <span className="text-[#F1F5F9] font-mono font-bold">{leftState.scenarioAircraft?.[0]?.currentNodeId || '—'}</span>
              </div>
              <div className="text-[#94A3B8]">
                Tốc độ: <span className="text-[#F1F5F9] font-mono font-bold">{leftState.scenarioAircraft?.[0]?.speedKts?.toFixed(1) || '0'} kts</span>
              </div>
            </SurfaceCard>
          </div>

          <div className="px-3.5 py-2 bg-[#0E1523] border-t border-[rgba(148,163,184,0.16)] text-xs text-[#94A3B8] flex justify-between items-center flex-shrink-0">
            <span className={leftDone ? 'text-[#F43F5E] font-bold flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
              {leftDone ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-[#F43F5E]" />
                  Giai đoạn 2: Tàu bay đi sai đường (rẽ nhầm E4) ➔ Stop Bar đỏ khóa dừng!
                </>
              ) : leftState.elapsedSeconds < 6.5 ? (
                'Giai đoạn 1: KSVKL cấp huấn lệnh thoại cho HVN216 tại Stand 10'
              ) : (
                'Giai đoạn 2: Lăn theo thoại VHF thủ công — Phi công tự quan sát trong sương mù'
              )}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#94A3B8]">FtG: OFF</span>
          </div>
        </SurfaceCard>

        {/* ── RIGHT SCREEN: Follow-the-Green ── */}
        <SurfaceCard className="flex flex-col h-full overflow-hidden shadow-md relative">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#131E2E] border-b border-[rgba(148,163,184,0.16)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="font-bold text-xs text-[#F1F5F9] uppercase tracking-wider">
                Màn Phải: A-SMGCS + Follow-the-Green
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] font-medium">Thời gian:</span>
              <span className="font-mono text-xs font-bold text-[#22C55E]">{fmt(rE)}</span>
            </div>
          </div>

          <div className="flex-1 relative min-h-0 bg-[#070B13]">
            <AirportMap state={rightState} graph={graph} bgImage={bgImage} renderMode="ftg" aircraftScale={1.5} />

            {/* Khung Huấn lệnh KSVKL (Giai đoạn 1: hiển thị 6.5s đầu rồi tự động tắt) */}
            {rightState.elapsedSeconds < 6.5 && (
              <SurfaceCard variant="active" className="absolute top-3 left-3 right-3 z-20 p-3 backdrop-blur-md animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#06B6D4] animate-pulse" />
                    <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wide">
                      Giai đoạn 1: Huấn lệnh KSVKL (ATC Clearance)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-[#0E1523] text-[#93C5FD] border border-[rgba(56,189,248,0.3)]">
                    TWR 118.1 MHz
                  </span>
                </div>
                <div className="mt-1.5 text-xs font-mono font-bold text-[#F1F5F9] pl-3 border-l-2 border-[#06B6D4]">
                  “HVN216 taxi to holding point runway 25L via NS and E6 taxiways”
                </div>
              </SurfaceCard>
            )}

            {/* Telemetry HUD góc dưới */}
            <SurfaceCard className="absolute bottom-3 left-3 z-10 p-2.5 text-[11px] pointer-events-none flex flex-col gap-1 backdrop-blur-sm max-w-xs">
              <div className="text-[#22C55E] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                Đèn xanh FtG dẫn hướng tự động thông minh
              </div>
              <div className="text-[#94A3B8]">
                Vị trí: <span className="text-[#F1F5F9] font-mono font-bold">{rightState.scenarioAircraft?.[0]?.currentNodeId || '—'}</span>
              </div>
              <div className="text-[#94A3B8]">
                Tốc độ: <span className="text-[#F1F5F9] font-mono font-bold">{rightState.scenarioAircraft?.[0]?.speedKts?.toFixed(1) || '0'} kts</span>
              </div>
            </SurfaceCard>
          </div>

          <div className="px-3.5 py-2 bg-[#0E1523] border-t border-[rgba(148,163,184,0.16)] text-xs text-[#94A3B8] flex justify-between items-center flex-shrink-0">
            <span className={rightDone ? 'text-[#22C55E] font-bold flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
              {rightDone ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  Giai đoạn 2: Follow-the-Green dẫn đúng STAND 10 ➔ E6 ➔ 25L an toàn 100%!
                </>
              ) : rightState.elapsedSeconds < 6.5 ? (
                'Giai đoạn 1: KSVKL cấp huấn lệnh cho HVN216 tại Stand 10'
              ) : (
                'Giai đoạn 2: Đèn FtG xanh lá dẫn trước mũi tàu qua HS NS → E6/E4 → E6'
              )}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#22C55E]">FtG: ACTIVE</span>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
