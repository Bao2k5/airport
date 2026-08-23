import { useState, useEffect, useRef, useCallback } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import AirportMap from './AirportMap';
import { scenarioTick, startScenario } from '../simulation/scenarioRunner';
import { scenario1WrongTurn } from '../data/scenarios/scenario1_wrongTurn';

interface Props {
  graph: AirportGraph;
  bgImage: string;
  onExit: () => void;
}

import { routeToEdges } from '../simulation/pathfinding';

export default function Scenario1ComparisonView({ graph, bgImage, onExit }: Props) {
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2);
  const [isPaused, setIsPaused] = useState(false);



  // Tuyến đường Truyền thống — vòng qua T35→E4/25L→T63→E2/25L→E6/E2→INTL_S2→E6→STOP BAR
  const traditionalRoute = [
    'v3_line_33_p00', 'v3_line_33_p01', 'v3_line_32_p01', 'v3_line_12_p03',
    'v3_line_31_p01', 'v3_line_30_p01', 'v3_line_28_p00', 'v3_line_27_p00',
    'v3_line_17_p09', 'v3_line_17_p10', 'v3_line_21_p00', 'v3_line_13_p03',
    'v3_line_22_p00', 'v3_line_15_p01', 'v3_line_23_p00', 'v3_line_24_p00',
    'v3_line_25_p00', 'v3_line_17_p11', 'v3_line_17_p12',
    'v3_line_26_p03', // E6/E4
    'v3_line_26_p02', // T35
    'v3_line_26_p01', // E4/25L
    'v3_line_26_p00',
    'v3_line_05_p06',
    'v3_line_09_p01',
    'v3_line_13_p00',
    'v3_line_05_p05', // T63
    'v3_line_13_p01', // E2/25L
    'v3_line_13_p02', // E6/E2
    'v3_line_15_p00',
    'v3_line_15_p01', // INTL_S2
    'v3_line_23_p00', // INTL_S3
    'v3_line_24_p00', // INTL_S4
    'v3_line_25_p00', // T38
    'v3_line_17_p11',
    'v3_line_17_p12', // T39
    'v3_line_17_p13', // E6
    'v3_line_17_p14',
    'v3_line_17_p15', // L03_P18
    'v3_line_05_p07',
    'v3_line_17_p16', // STOP BAR 25L
  ];

  // Khởi tạo màn Truyền thống với tuyến vòng dài hơn
  const initLeftState = () => {
    const s = startScenario('lvc_wrong_turn_radio_failure', graph);
    const edges = routeToEdges(traditionalRoute, graph.edges) ?? [];
    s.scenarioAircraft = [{
      id: 'S1', callsign: 'HVN216', airlineCode: 'VN',
      airlineName: 'Vietnam Airlines', aircraftAsset: '/assets/aircraft-vna.png', aircraftType: 'A321',
      currentNodeId: traditionalRoute[0], targetNodeId: traditionalRoute[traditionalRoute.length - 1],
      currentEdgeId: edges[0] ?? null, progressOnEdge: 0,
      speedKts: 12, speedLimitKts: 12, status: 'taxiing',
      assignedRoute: traditionalRoute, routeEdgeIndex: 0,
      role: 'departing', priority: 1,
      scenarioLabel: 'KHỞI HÀNH 25L (THOẠI THỦ CÔNG)',
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
      next.scenarioAircraft = next.scenarioAircraft.map(ac => ({ ...ac, guidanceVisible: false, routeVisible: false }));
    }
    if (countCompleted(next.scenarioAircraft) >= 1 && !leftDone) {
      setLeftDone(true);
      setLeftFinalTime(Math.round(next.elapsedSeconds * 10) / 10);
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
  const both = leftDone && rightDone;
  const saved = Math.max(0, (leftFinalTime || 0) - (rightFinalTime || 0));
  const pct = leftFinalTime ? Math.round(saved / leftFinalTime * 1000) / 10 : 0;
  const faster = (leftFinalTime || 0) > (rightFinalTime || 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#070D18] flex flex-col text-white select-none">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0C192E] border-b border-[#1E3A8A] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-[#1E3A8A] text-[#93C5FD] font-mono text-xs font-bold border border-[#3B82F6]/40">SO SÁNH KỊCH BẢN 1</div>
          <h2 className="text-sm font-bold text-white">HVN216 — STAND_10 → STOP BAR 25L (Sương mù LVC)</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#071326] p-0.5 rounded-lg border border-[#1E3A8A]">
            <span className="text-[10px] text-[#94A3B8] font-bold px-2">TỐC ĐỘ:</span>
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${speedMultiplier === s ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'}`}>
                {s}x
              </button>
            ))}
          </div>
          <button onClick={() => setIsPaused(p => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${isPaused ? 'bg-[#059669] text-white' : 'bg-[#D97706] text-white'}`}>
            {isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
          </button>
          <button onClick={handleRestart} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E293B] text-[#CBD5E1] border border-[#475569] cursor-pointer">🔄 Chạy lại</button>
          <button onClick={onExit} className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#DC2626] text-white cursor-pointer">✕ Thoát</button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 min-h-0 overflow-hidden relative">

        {/* LEFT: Truyền thống */}
        <div className="flex flex-col bg-[#0F172A] rounded-xl border border-[#334155] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 bg-[#1E293B] border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${leftDone ? 'bg-[#10B981]' : 'bg-[#EF4444] animate-pulse'}`}></span>
              <span className="font-bold text-xs text-[#F87171]">MÀN TRÁI: ĐIỀU HÀNH TRUYỀN THỐNG (KHÔNG FTG)</span>
            </div>
            <span className="font-mono text-xs font-black text-[#F87171]">{fmt(lE)}</span>
          </div>
          <div className="flex-1 relative min-h-0">
            <AirportMap state={leftState} graph={graph} bgImage={bgImage} renderMode="traditional" />
            <div className="absolute top-2 left-2 z-10 bg-[#0F172A]/90 border border-[#334155] rounded-lg p-2 text-[10px] pointer-events-none">
              <div className="text-[#F87171] font-bold mb-1">📻 Thoại VHF thủ công — Không có đèn dẫn đường</div>
              <div className="text-[#94A3B8]">Vị trí: <span className="text-[#FCA5A5] font-mono">{leftState.scenarioAircraft?.[0]?.currentNodeId || '—'}</span></div>
              <div className="text-[#94A3B8]">Tốc độ: <span className="text-[#FCA5A5] font-mono">{leftState.scenarioAircraft?.[0]?.speedKts?.toFixed(1) || '0'} kts</span></div>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-[#090D16] border-t border-[#1E293B] text-[10px] text-[#94A3B8] flex justify-between">
            <span>{leftDone ? `✓ Hoàn thành lúc ${fmt(lE)}` : 'Lăn theo thoại VHF — không có đèn tim đường hỗ trợ'}</span>
            <span className="text-[#EF4444] font-bold">FtG: OFF</span>
          </div>
        </div>

        {/* RIGHT: FtG */}
        <div className="flex flex-col bg-[#0F172A] rounded-xl border border-[#059669] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 bg-[#064E3B] border-b border-[#059669]">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${rightDone ? 'bg-[#34D399]' : 'bg-[#10B981] animate-pulse'}`}></span>
              <span className="font-bold text-xs text-[#34D399]">MÀN PHẢI: A-SMGCS + FOLLOW-THE-GREEN</span>
            </div>
            <span className="font-mono text-xs font-black text-[#34D399]">{fmt(rE)}</span>
          </div>
          <div className="flex-1 relative min-h-0">
            <AirportMap state={rightState} graph={graph} bgImage={bgImage} renderMode="ftg" />
            <div className="absolute top-2 left-2 z-10 bg-[#062419]/90 border border-[#059669] rounded-lg p-2 text-[10px] pointer-events-none">
              <div className="text-[#34D399] font-bold mb-1">⚡ Đèn xanh FtG dẫn hướng tự động</div>
              <div className="text-[#A7F3D0]">Vị trí: <span className="text-[#34D399] font-mono">{rightState.scenarioAircraft?.[0]?.currentNodeId || '—'}</span></div>
              <div className="text-[#A7F3D0]">Tốc độ: <span className="text-[#34D399] font-mono">{rightState.scenarioAircraft?.[0]?.speedKts?.toFixed(1) || '0'} kts</span></div>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-[#062419] border-t border-[#059669] text-[10px] text-[#A7F3D0] flex justify-between">
            <span>{rightDone ? `✓ Hoàn thành lúc ${fmt(rE)} — nhanh và an toàn` : '✓ Đèn xanh rolling window dẫn HVN216 thông suốt qua HS NS → E6/E4 → 25L'}</span>
            <span className="text-[#34D399] font-bold">FtG: ACTIVE</span>
          </div>
        </div>

        {/* SUMMARY MODAL */}
        {both && (
          <div className="absolute inset-0 z-30 bg-[#070D18]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border-2 border-[#3B82F6] rounded-2xl p-6 max-w-xl w-full shadow-2xl text-center">
              <div className="text-2xl mb-2">⏱️</div>
              <h3 className="text-lg font-black text-white mb-1">KẾT QUẢ SO SÁNH HIỆU QUẢ ĐIỀU HÀNH</h3>
              <p className="text-xs text-[#94A3B8] mb-5">Kịch bản 1: HVN216 khởi hành STAND_10 → STOP BAR 25L trong điều kiện LVC</p>
              <div className="grid grid-cols-2 gap-4 mb-5 text-left">
                <div className="bg-[#1E293B] p-3.5 rounded-xl border border-[#334155]">
                  <div className="text-[11px] font-bold text-[#F87171] mb-1">ĐIỀU HÀNH TRUYỀN THỐNG</div>
                  <div className="font-mono text-2xl font-black text-white">{fmt(leftFinalTime || 0)}</div>
                  <div className="text-[10px] text-[#94A3B8] mt-1">Thoại VHF thủ công · Không có đèn dẫn đường</div>
                </div>
                <div className="bg-[#064E3B] p-3.5 rounded-xl border border-[#059669]">
                  <div className="text-[11px] font-bold text-[#34D399] mb-1">A-SMGCS + FOLLOW-THE-GREEN</div>
                  <div className="font-mono text-2xl font-black text-[#34D399]">{fmt(rightFinalTime || 0)}</div>
                  <div className="text-[10px] text-[#A7F3D0] mt-1">Đèn xanh FtG dẫn hướng · Tự động</div>
                </div>
              </div>
              <div className={`p-4 rounded-xl mb-5 border ${faster ? 'bg-[#062419] border-[#10B981]' : 'bg-[#3E1F1F] border-[#EF4444]'}`}>
                {faster ? (
                  <>
                    <div className="text-xs font-bold text-[#34D399] mb-1">✓ A-SMGCS + FtG Nhanh Hơn Vượt Trội</div>
                    <div className="text-xl font-black text-white font-mono">Tiết kiệm {fmt(saved)} ({pct}%)</div>
                    <div className="text-[11px] text-[#A7F3D0] mt-1">Giảm thiểu nguy cơ nhầm đường lăn trong điều kiện sương mù LVC.</div>
                  </>
                ) : (
                  <div className="text-xs font-bold text-[#F87171]">⚠️ Kết quả cần review.</div>
                )}
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={handleRestart} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E293B] text-white border border-[#475569] cursor-pointer">🔄 Chạy lại</button>
                <button onClick={onExit} className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3B82F6] text-white cursor-pointer">✓ Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
