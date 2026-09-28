import NewFlightForm from './components/NewFlightForm';
import type { NewFlightInput } from '../../simulation/manualFlights';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  CircleAlert,
  Clock3,
  Headphones,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Route,
} from 'lucide-react';
import FlightIdentityFields from './components/FlightIdentityFields';
import { getAirlineDef } from '../../data/airlineTypes';
import { getFtgScenarioDefs } from './ftgScenarios';
import type { ScenarioAircraft, ScenarioState } from '../../data/presetScenarios';
import { isLanding25RNode, isStandNode, V3_OPERATIONAL_STANDS } from '../../data/v3OperationalNodes';
import type { Aircraft, AirportGraph, SimulationState, SimulationConfig } from '../../types';

type ConsoleMode = 'scenario' | 'practice';
type ControllerRole = 'GND' | 'TWR';

interface Airport3DConsoleProps {
  graph: AirportGraph;
  state: SimulationState;
  mode: ConsoleMode;
  onModeChange: (mode: ConsoleMode) => void;
  onStartScenario: (id: string) => void;
  onExitScenario: () => void;
  onPause: () => void;
  simSpeed: number;
  onSimSpeedChange: (speed: number) => void;
  onSelectAircraft: (id: string) => void;
  onEnterPractice: () => void;
  onSetRole: (role: ControllerRole) => void;
  onCreateFlight: (input: NewFlightInput) => void;
  onConfigChange: (patch: Partial<SimulationConfig>) => void;
  onSetStart: (nodeId: string) => void;
  onSetDestination: (nodeId: string) => void;
  onAcceptRoute: () => void;
  onConfirmReadback: () => void;
  onStartAircraft: () => void;
  onRequestHandoff: () => void;
  onAcceptHandoff: () => void;
  onClearRunway: () => void;
  onReset: () => void;
}

const STATUS_TEXT: Record<Aircraft['status'], string> = {
  parked: 'Đang đỗ',
  idle: 'Chờ lệnh',
  waiting: 'Chờ lệnh',
  taxiing: 'Đang lăn',
  holding: 'Đang giữ',
  stopped: 'Đã dừng',
  arrived: 'Đã đến',
  departed: 'Đã cất cánh',
  queued: 'Xếp hàng',
};

function formatTime(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function ConsoleSection({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-300/70 bg-white p-3.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700">{title}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function ActionButton({ children, onClick, disabled, tone = 'cyan' }: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'cyan' | 'amber' | 'green' | 'red' | 'muted';
}) {
  const tones = {
    cyan: 'border-[#3B82F6]/50 bg-[#0C2444] text-white hover:bg-[#163660] shadow-xs',
    amber: 'border-amber-400/60 bg-amber-400 text-slate-950 hover:bg-amber-300',
    green: 'border-emerald-400/60 bg-emerald-500 text-slate-950 hover:bg-emerald-400',
    red: 'border-rose-400/60 bg-rose-500 text-white hover:bg-rose-400',
    muted: 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2444] disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export default function Airport3DConsole({
  graph,
  state,
  mode,
  onModeChange,
  onStartScenario,
  onExitScenario,
  onPause,
  simSpeed,
  onSimSpeedChange,
  onSelectAircraft,
  onEnterPractice,
  onSetRole,
  onCreateFlight,
  onConfigChange,
  onSetStart,
  onSetDestination,
  onAcceptRoute,
  onConfirmReadback,
  onStartAircraft,
  onRequestHandoff,
  onAcceptHandoff,
  onClearRunway,
  onReset,
}: Airport3DConsoleProps) {
  const scenarioDefs = useMemo(() => Object.values(getFtgScenarioDefs(graph)), [graph]);
  const aircraftCounts = useMemo(() => Object.fromEntries(scenarioDefs.map(def => {
    try {
      return [def.id, def.setup(graph).aircraft.length];
    } catch {
      return [def.id, 0];
    }
  })) as Record<string, number>, [scenarioDefs, graph]);
  const nodeLabels = useMemo(() => new Map(graph.nodes.map(node => [node.id, node.label || node.id])), [graph]);
  const [chosenScenarioId, setChosenScenarioId] = useState(scenarioDefs[0]?.id ?? '');
  const scenario = (state.scenario ?? null) as ScenarioState | null;
  const chosenScenario = scenarioDefs.find(def => def.id === chosenScenarioId) ?? scenarioDefs[0];
  const scenarioFleet = ((state.scenarioAircraft ?? []) as ScenarioAircraft[])
    .filter(aircraft => !aircraft.hidden && aircraft.status !== 'departed');
  const manualFleet = state.manualFleet ?? [];
  const selectedFlight = manualFleet.find(aircraft => aircraft.id === state.selectedAircraftId) ?? manualFleet[0];
  const startOptions = useMemo(() => {
    if (!selectedFlight) return [];
    const current = graph.nodes.find(node => node.id === selectedFlight.currentNodeId);
    const landing = graph.nodes.find(node => node.label === 'STOP BAR 25R' || node.id === 'v3_line_01_p03');
    const options: { value: string; label: string }[] = [];
    if (current && isStandNode(current.id, graph.nodes)) options.push({ value: current.id, label: `${current.label} · bến hiện tại` });
    if (landing) options.push({ value: landing.id, label: 'STOP BAR 25R · tàu đến' });
    return options;
  }, [selectedFlight, graph]);
  const destinationOptions = useMemo(() => {
    if (!selectedFlight) return [];
    if (isStandNode(selectedFlight.currentNodeId, graph.nodes)) {
      const current25L = ['v3_line_05_p07', 'v3_line_17_p16'].includes(selectedFlight.targetNodeId)
        ? graph.nodes.find(node => node.id === selectedFlight.targetNodeId)
        : undefined;
      const stop25L = current25L ?? graph.nodes.find(node => node.label === 'STOP BAR 25L' || node.id === 'v3_line_05_p07');
      const stop07R = graph.nodes.find(node => node.label === 'W11/07R' || node.id === 'v3_line_16_p01');
      return [
        stop25L && { value: stop25L.id, label: 'STOP BAR 25L · khởi hành', disabled: false },
        stop07R && { value: stop07R.id, label: 'W11/07R · đổi chiều đường băng', disabled: false },
      ].filter((option): option is { value: string; label: string; disabled: boolean } => Boolean(option));
    }
    if (!isLanding25RNode(selectedFlight.currentNodeId, graph.nodes)) return [];
    return V3_OPERATIONAL_STANDS.flatMap(stand => {
      const node = graph.nodes.find(candidate => candidate.label === stand.label || candidate.id === stand.id);
      if (!node) return [];
      const occupied = manualFleet.some(aircraft => aircraft.id !== selectedFlight.id && (
        (aircraft.currentNodeId === node.id && aircraft.status !== 'departed') ||
        (aircraft.targetNodeId === node.id && ['parked', 'waiting', 'taxiing', 'holding', 'arrived'].includes(aircraft.status))
      ));
      return [{ value: node.id, label: `${stand.label}${occupied ? ' · đã có tàu' : ''}`, disabled: occupied }];
    });
  }, [selectedFlight, graph, manualFleet]);
  const selectedScenarioFlight = scenarioFleet.find(aircraft => aircraft.id === state.selectedAircraftId) ?? scenarioFleet[0];
  const role = state.controllerRole ?? 'GND';
  const selectedId = selectedFlight?.id ?? '';
  const owner = state.controllerByAircraft?.[selectedId] ?? 'GND';
  const pendingHandoff = state.handoffRequests?.[selectedId];
  const canControl = role === owner;
  const readbackDone = Boolean(state.readbackConfirmed?.[selectedId]);
  const runwayClearancePending = Boolean(state.runwayClearancePending?.[selectedId]);
  const holdReason = selectedFlight?.holdReason;
  const atHandoff = selectedFlight?.status === 'holding' && holdReason?.startsWith('practice-handoff-to-');
  const atRunway = selectedFlight?.status === 'holding' && holdReason === 'practice-runway-clearance';
  const canIssueRoute = canControl && (role === 'GND' || (role === 'TWR' && isLanding25RNode(selectedFlight?.currentNodeId, graph.nodes))) && state.routeStatus === 'pending' &&
    ['parked', 'waiting', 'idle'].includes(selectedFlight?.status ?? '');
  const canStartFlight = canControl && state.routeStatus === 'accepted' && readbackDone &&
    ['parked', 'waiting', 'holding', 'stopped', 'idle'].includes(selectedFlight?.status ?? '') &&
    !atHandoff && !runwayClearancePending;
  const currentNodeLabel = selectedFlight ? nodeLabels.get(selectedFlight.currentNodeId) ?? selectedFlight.currentNodeId : '—';
  const targetNodeLabel = selectedFlight ? nodeLabels.get(selectedFlight.targetNodeId) ?? selectedFlight.targetNodeId : '—';
  const recentEvents = state.liveEventLog.slice(-3).reverse();

  useEffect(() => {
    if (mode === 'practice' && !state.practiceMode && !scenario) {
      onEnterPractice();
    }
  }, [mode, state.practiceMode, scenario, onEnterPractice]);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-2xl border border-slate-300 bg-[#f3f6fa] p-3.5 text-slate-800 shadow-2xl sm:p-4" aria-label="Bàn điều khiển mô phỏng 3D">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-300/80 pb-4">
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-[#0C2444]">SURFACE CONTROL · 3D</p>
          <h2 className="text-lg font-bold leading-tight text-[#102849]">Bàn điều hành sân bay</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Theo dõi sa bàn và điều khiển chuyến bay trong không gian 3D.</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${state.isRunning && !state.isPaused ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-amber-400'}`} aria-hidden="true" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-300 bg-[#E4E4E7]/60 p-1" role="group" aria-label="Chế độ 3D">
        {([
          ['practice', 'Điều khiển', Headphones],
          ['scenario', 'Kịch bản mẫu', Play],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => onModeChange(value)}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-[#0C2444] ${mode === value ? 'bg-[#0C2444] text-white shadow-xs' : 'text-[#2D3748] hover:text-[#0C2444] hover:bg-white/50'}`}
          >
            <Icon size={14} aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      {mode === 'scenario' ? (
        <div className="flex flex-col gap-3">
          {scenario ? (
            <ConsoleSection title="Kịch bản đang hoạt động" extra={<span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${scenario.completed ? 'bg-emerald-500/20 text-emerald-700' : state.isPaused ? 'bg-amber-500/20 text-amber-800' : 'bg-[#0C2444]/15 text-[#0C2444]'}`}>{scenario.completed ? 'HOÀN TẤT' : state.isPaused ? 'TẠM DỪNG' : 'ĐANG CHẠY'}</span>}>
              <h3 className="text-sm font-bold leading-snug text-[#102849]">{scenario.title}</h3>
              <div className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-600"><Clock3 size={14} aria-hidden="true" />{formatTime(state.elapsedSeconds)} · {simSpeed}×</div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-700">{scenarioDefs.find(def => def.id === scenario.id)?.situation ?? scenario.situation}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ActionButton onClick={onPause} disabled={scenario.completed} tone={state.isPaused ? 'green' : 'amber'}>{state.isPaused ? <><Play size={14} /> Tiếp tục</> : <><Pause size={14} /> Tạm dừng</>}</ActionButton>
                <ActionButton onClick={onExitScenario} tone="muted">Thoát kịch bản</ActionButton>
              </div>
              <div className="mt-3 border-t border-slate-300 pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Tốc độ mô phỏng</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0.5, 1, 2, 5, 10].map(speed => <button key={speed} type="button" aria-pressed={simSpeed === speed} onClick={() => onSimSpeedChange(speed)} className={`min-h-9 rounded-lg border text-[11px] font-bold transition-colors ${simSpeed === speed ? 'border-[#0C2444] bg-[#0C2444] text-white shadow-xs' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{speed}×</button>)}
                </div>
              </div>
            </ConsoleSection>
          ) : (
            <ConsoleSection title="Chọn kịch bản để trình diễn">
              <p className="text-[11px] leading-relaxed text-slate-600">Máy bay và đèn sẽ tự chạy theo tiến trình. Có thể tạm dừng, đổi tốc độ và theo dõi từng chuyến bay.</p>
              {chosenScenario && <div className="mt-3 rounded-xl border border-[#0C2444]/25 bg-[#0C2444]/5 p-3">
                <p className="font-mono text-[10px] font-bold text-[#0C2444]">KỊCH BẢN ĐÃ CHỌN</p>
                <h3 className="mt-1 text-sm font-bold text-[#102849]">{chosenScenario.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{chosenScenario.situation}</p>
              </div>}
              <div className="mt-3"><ActionButton onClick={() => chosenScenario && onStartScenario(chosenScenario.id)} disabled={!chosenScenario}><Play size={15} /> Chạy FTG trên sa bàn</ActionButton></div>
            </ConsoleSection>
          )}

          <ConsoleSection title="Tình huống FTG" extra={<span className="font-mono text-[10px] text-slate-600">{scenarioDefs.length} KỊCH BẢN FTG</span>}>
            <div className="flex flex-col gap-2">
              {scenarioDefs.map((def, index) => <button key={def.id} type="button" onClick={() => setChosenScenarioId(def.id)} aria-pressed={chosenScenarioId === def.id} className={`w-full rounded-xl border p-3 text-left transition-colors ${chosenScenarioId === def.id ? 'border-[#0C2444] bg-[#0C2444]/10 ring-1 ring-[#0C2444]/30' : 'border-slate-300 bg-white hover:border-slate-500'}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${chosenScenarioId === def.id ? 'bg-[#0C2444] text-white shadow-xs' : 'bg-slate-100 text-slate-700'}`}>{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-bold leading-snug text-[#102849]">{def.title}</span><span className="mt-1 block text-[10px] leading-relaxed text-slate-600">{def.teaser}</span></span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-600">{aircraftCounts[def.id]} tàu</span>
                </div>
              </button>)}
            </div>
            {scenario && chosenScenarioId !== scenario.id && <div className="mt-3"><ActionButton onClick={() => onStartScenario(chosenScenarioId)} tone="muted"><RotateCcw size={14} /> Chạy kịch bản đã chọn</ActionButton></div>}
          </ConsoleSection>

          {scenario && <ConsoleSection title="Đội bay trên sa bàn" extra={<span className="font-mono text-[10px] text-slate-600">{scenarioFleet.length} TÀU BAY</span>}>
            <div className="flex flex-col gap-2">
              {scenarioFleet.map(aircraft => <button key={aircraft.id} type="button" onClick={() => onSelectAircraft(aircraft.id)} aria-pressed={selectedScenarioFlight?.id === aircraft.id} className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${selectedScenarioFlight?.id === aircraft.id ? 'border-[#0C2444] bg-[#0C2444]/10 ring-1 ring-[#0C2444]/25' : 'border-slate-300 bg-slate-50 hover:bg-slate-200'}`}><span className="min-w-0"><span style={{ color: getAirlineDef(aircraft.airlineCode ?? aircraft.callsign).accentColor }} className="block font-mono text-xs font-bold">{aircraft.callsign}</span><span className="block truncate text-[10px] text-slate-600">{nodeLabels.get(aircraft.currentNodeId) ?? aircraft.currentNodeId}</span></span><span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${aircraft.status === 'taxiing' ? 'bg-emerald-500/20 text-emerald-700' : aircraft.status === 'holding' ? 'bg-amber-500/20 text-amber-800' : 'bg-slate-700 text-slate-700'}`}>{('flight' in aircraft ? (aircraft as Aircraft).flight?.phase : undefined) ?? STATUS_TEXT[aircraft.status]}</span></button>)}
            </div>
          </ConsoleSection>}

          {scenario && scenario.events.length > 0 && <ConsoleSection title="Diễn biến gần nhất"><p className="text-[11px] leading-relaxed text-slate-700">{scenario.events[scenario.events.length - 1].message}</p></ConsoleSection>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {scenario ? <ConsoleSection title="Kịch bản đang hoạt động"><p className="mb-3 text-[11px] leading-relaxed text-amber-800">Đang chạy kịch bản mẫu. Bấm dừng kịch bản để chuyển sang chế độ tự do điều phối tàu bay.</p><ActionButton onClick={onExitScenario} tone="amber">Dừng kịch bản để tự điều khiển</ActionButton></ConsoleSection> : !state.practiceMode ? <ConsoleSection title="Bảng điều khiển KSVKL"><p className="mb-3 text-[11px] leading-relaxed text-slate-700">Điều phối đội bay, phân quyền GND/TWR và cấp huấn lệnh lăn Follow-the-Green.</p><ActionButton onClick={onEnterPractice}><Headphones size={15} /> Bật bảng điều khiển</ActionButton></ConsoleSection> : (
            <>
              <ConsoleSection title="Vị trí trực" extra={<span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />TRỰC TUYẾN</span>}>
                <div className="grid grid-cols-2 gap-2">
                  {(['GND', 'TWR'] as const).map(value => <button key={value} type="button" onClick={() => onSetRole(value)} aria-pressed={role === value} className={`min-h-12 rounded-xl border p-2 text-left transition-colors ${role === value ? 'border-[#0C2444] bg-[#0C2444] text-white shadow-xs' : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200'}`}><span className="block font-mono text-sm font-bold">{value}</span><span className="block text-[10px]">{value === 'GND' ? 'Mặt đất · tuyến lăn' : 'Đường băng · điểm chờ'}</span></button>)}
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-600">Đổi vị trí trực không tự chuyển quyền kiểm soát tàu bay.</p>
              </ConsoleSection>

              <NewFlightForm graph={graph} onCreate={onCreateFlight} />
              <ConsoleSection title="Phiếu bay" extra={<span className="font-mono text-[10px] text-slate-600">{manualFleet.length} TÀU BAY</span>}>
                {manualFleet.length ? <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-0.5">{manualFleet.map(aircraft => {
                  const flightOwner = state.controllerByAircraft?.[aircraft.id] ?? 'GND';
                  const hasHandoff = Boolean(state.handoffRequests?.[aircraft.id]);
                  return <button key={aircraft.id} type="button" onClick={() => onSelectAircraft(aircraft.id)} aria-pressed={selectedId === aircraft.id} className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${selectedId === aircraft.id ? 'border-[#0C2444] bg-[#0C2444]/10 ring-1 ring-[#0C2444]/25' : 'border-slate-300 bg-white hover:border-slate-500'}`}><span className={`h-2 w-2 shrink-0 rounded-full ${aircraft.status === 'taxiing' ? 'bg-emerald-400' : aircraft.status === 'holding' ? 'bg-amber-400' : 'bg-slate-500'}`} /><span className="min-w-0 flex-1"><span style={{ color: getAirlineDef(aircraft.airlineCode ?? aircraft.callsign).accentColor }} className="block truncate font-mono text-xs font-bold">{aircraft.callsign}</span><span className="block truncate text-[10px] text-slate-600">{nodeLabels.get(aircraft.currentNodeId) ?? aircraft.currentNodeId} · {('flight' in aircraft ? (aircraft as Aircraft).flight?.phase : undefined) ?? STATUS_TEXT[aircraft.status]}</span></span><span className={`rounded-md px-1.5 py-1 font-mono text-[10px] font-bold ${hasHandoff ? 'bg-amber-500/20 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{hasHandoff ? 'BÀN GIAO' : flightOwner}</span></button>;
                })}</div> : <p className="text-xs text-slate-600">Chưa có tàu bay trong phiên thực hành.</p>}
              </ConsoleSection>

              {selectedFlight && <ConsoleSection title="Lệnh cho tàu bay" extra={<span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-[#0C2444]">{selectedFlight.callsign}</span>}>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]"><div><dt className="text-slate-500">Vị trí</dt><dd className="mt-0.5 font-medium text-[#102849]">{currentNodeLabel}</dd></div><div><dt className="text-slate-500">Điểm đến</dt><dd className="mt-0.5 font-medium text-[#102849]">{targetNodeLabel}</dd></div><div><dt className="text-slate-500">Trạng thái</dt><dd className="mt-0.5 font-medium text-[#102849]">{selectedFlight.flight?.phase ?? STATUS_TEXT[selectedFlight.status]}</dd></div><div><dt className="text-slate-500">Đang kiểm soát</dt><dd className={`mt-0.5 font-mono font-bold ${canControl ? 'text-emerald-700' : 'text-amber-800'}`}>{owner}</dd></div></dl>
                {canControl && <FlightIdentityFields aircraft={selectedFlight} onChange={onConfigChange} />}
                {canControl && ['parked', 'waiting', 'idle'].includes(selectedFlight.status) && <div className="mt-3 grid gap-2 border-t border-slate-300 pt-3">
                  <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600" htmlFor={`3d-start-${selectedId}`}>Vị trí xuất phát
                    <select id={`3d-start-${selectedId}`} value={startOptions.some(option => option.value === selectedFlight.currentNodeId) ? selectedFlight.currentNodeId : ''} onChange={event => onSetStart(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-600 bg-white px-2.5 text-xs font-semibold normal-case tracking-normal text-[#102849] focus-visible:outline-2 focus-visible:outline-[#0C2444]">
                      {!startOptions.some(option => option.value === selectedFlight.currentNodeId) && <option value="" disabled>Chọn vị trí xuất phát</option>}
                      {startOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  {destinationOptions.length > 0 && <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600" htmlFor={`3d-destination-${selectedId}`}>Điểm đến
                    <select id={`3d-destination-${selectedId}`} value={destinationOptions.some(option => option.value === selectedFlight.targetNodeId) ? selectedFlight.targetNodeId : ''} onChange={event => { const option = destinationOptions.find(item => item.value === event.target.value); if (option && !option.disabled) onSetDestination(option.value); }} className="min-h-11 w-full rounded-lg border border-slate-600 bg-white px-2.5 text-xs font-semibold normal-case tracking-normal text-[#102849] focus-visible:outline-2 focus-visible:outline-[#0C2444]">
                      {!destinationOptions.some(option => option.value === selectedFlight.targetNodeId) && <option value="" disabled>Chọn điểm đến</option>}
                      {destinationOptions.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
                    </select>
                  </label>}
                  <p className="text-[10px] leading-relaxed text-slate-500">Đổi vị trí hoặc điểm đến cần cấp tuyến và xác nhận lại readback. Tàu đến thuộc quyền TWR.</p>
                </div>}
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-300 bg-white p-2.5 text-[10px] text-slate-700"><Route size={14} className="mt-0.5 shrink-0 text-[#0C2444]" aria-hidden="true" /><span>Tuyến dự kiến: {selectedFlight.assignedRoute.length > 1 ? `${selectedFlight.assignedRoute.length} nút · ${nodeLabels.get(selectedFlight.assignedRoute[0]) ?? selectedFlight.assignedRoute[0]} → ${nodeLabels.get(selectedFlight.assignedRoute[selectedFlight.assignedRoute.length - 1]) ?? selectedFlight.assignedRoute[selectedFlight.assignedRoute.length - 1]}` : 'Chưa có tuyến hợp lệ'}</span></div>
                {!canControl && <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-[11px] text-amber-800"><CircleAlert size={14} className="mt-0.5 shrink-0" />Chuyển sang bàn {owner} để cấp lệnh cho tàu bay này.</p>}
                <div className="mt-3 flex flex-col gap-2">
                  {pendingHandoff && role === pendingHandoff && <ActionButton onClick={onAcceptHandoff} tone="amber"><Radio size={14} /> Tiếp nhận bàn giao từ {owner}</ActionButton>}
                  {pendingHandoff && role !== pendingHandoff && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-800">Đang chờ bàn {pendingHandoff} tiếp nhận. Chuyển vai để hoàn tất bàn giao.</p>}
                  {atHandoff && canControl && !pendingHandoff && <ActionButton onClick={onRequestHandoff} tone="amber"><ArrowRight size={14} /> Đề nghị bàn giao cho {owner === 'GND' ? 'TWR' : 'GND'}</ActionButton>}
                  {atRunway && canControl && role === 'TWR' && !runwayClearancePending && <ActionButton onClick={onClearRunway} tone="red">TWR cấp phép vào đường băng</ActionButton>}
                  {canIssueRoute && <ActionButton onClick={onAcceptRoute}><Route size={14} /> Chấp nhận tuyến lăn</ActionButton>}
                  {canControl && state.routeStatus === 'accepted' && !readbackDone && !atHandoff && (runwayClearancePending || !atRunway) && <ActionButton onClick={onConfirmReadback} tone="green"><Radio size={14} /> Xác nhận phi công nhắc lại</ActionButton>}
                  {canStartFlight && <ActionButton onClick={onStartAircraft} tone="green"><Play size={14} /> Cho {selectedFlight.callsign} lăn bánh</ActionButton>}
                  {selectedFlight.status === 'taxiing' && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-200">Tàu bay đang di chuyển. Theo dõi vị trí và điểm chờ trên sa bàn.</p>}
                </div>
              </ConsoleSection>}

              <ConsoleSection title="Điều khiển phiên">
                <div className="grid grid-cols-2 gap-2"><ActionButton onClick={onPause} disabled={!state.isRunning} tone="amber">{state.isPaused ? <><Play size={14} /> Tiếp tục</> : <><Pause size={14} /> Tạm dừng</>}</ActionButton><ActionButton onClick={onReset} disabled={!selectedFlight} tone="muted"><RotateCcw size={14} /> Đặt lại tàu</ActionButton></div>
                <p className="mt-2 font-mono text-[10px] text-slate-600">THỜI GIAN PHIÊN {formatTime(state.elapsedSeconds)}</p>
              </ConsoleSection>
            </>
          )}
        </div>
      )}

      {state.warningMessage && <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-800"><CircleAlert size={15} className="mt-0.5 shrink-0" />{state.warningMessage}</div>}
      {mode === 'practice' && state.practiceMode && recentEvents.length > 0 && <ConsoleSection title="Nhật ký liên lạc" extra={<span className="font-mono text-[10px] text-slate-500">MỚI NHẤT</span>}><ol className="space-y-2">{recentEvents.map(event => <li key={event.id} className="border-l-2 border-[#0C2444]/60 pl-2 text-[10px] leading-relaxed text-slate-700"><span className="mr-1 font-mono text-slate-500">{formatTime(event.atSeconds)}</span>{event.message}</li>)}</ol></ConsoleSection>}
      <p className="mt-4 border-t border-slate-300 pt-3 text-[10px] leading-relaxed text-slate-500">Mô phỏng giáo dục. Quy trình và phân quyền thực tế phải đối chiếu quy định địa phương.</p>
    </aside>
  );
}
