import { useState, useEffect, useRef, useCallback } from 'react';
import type { SimulationState } from '../types';

interface AtcToastMessage {
  id: string;
  text: string;
  time: number;
  severity?: string;
  durationSec?: number;
}

function parseToastMeta(text: string) {
  const isPilot = text.includes('👨‍✈️') || text.toLowerCase().includes('pilot') || text.toLowerCase().includes('phi công');
  const isFod = text.includes('FOD') || text.includes('vật thể lạ');
  const isEmergency = text.includes('🚨') || text.includes('khẩn nguy') || text.includes('STOP');
  const isFtg = text.includes('🟢') || text.includes('FTG') || text.includes('Follow-the-Green');

  const callsignMatch = text.match(/\b(HVN\d+|BAV\d+|THA\d+|RESCUE\d+|VJ\d+|VN\d+|INB\d+|OUT\d+|OUTB\d+)\b/i);
  const callsign = callsignMatch ? callsignMatch[1].toUpperCase() : null;

  const quoteMatch = text.match(/"([^"]+)"/);
  const content = quoteMatch ? quoteMatch[1] : text.replace(/^[^:]+:\s*/, '');

  return { isPilot, isFod, isEmergency, isFtg, callsign, content };
}

export default function ScenarioAtcHudBar({ state }: { state: SimulationState }) {
  const [toasts, setToasts] = useState<AtcToastMessage[]>([]);
  const prevEventsLength = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scenario = state.scenario;
  const events = scenario?.events ?? [];

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Reset khi đổi kịch bản hoặc khi kịch bản chạy lại từ đầu
  useEffect(() => {
    clearAllTimers();
    setToasts([]);
    prevEventsLength.current = 0;
  }, [scenario?.id, state.elapsedSeconds === 0, clearAllTimers]);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Bắt sự kiện huấn lệnh mới phát sinh từ kịch bản
  useEffect(() => {
    if (!scenario) return;

    if (events.length < prevEventsLength.current) {
      prevEventsLength.current = 0;
      clearAllTimers();
      setToasts([]);
    }

    if (events.length <= prevEventsLength.current) return;

    const newEvents = events.slice(prevEventsLength.current);
    prevEventsLength.current = events.length;

    // Lọc bỏ thông báo hoàn thành kịch bản
    const actionableEvents = newEvents.filter((ev: any) =>
      !ev.message.includes('100%') &&
      !ev.message.includes('HOÀN THÀNH') &&
      !ev.message.includes('Kịch bản hoàn tất') &&
      !ev.message.includes('Khởi chạy')
    );
    if (actionableEvents.length === 0) return;

    const now = Date.now();

    if (actionableEvents.length === 1) {
      const t: AtcToastMessage = {
        id: `${now}-0-${Math.random()}`,
        text: actionableEvents[0].message,
        time: actionableEvents[0].atSeconds,
        severity: actionableEvents[0].severity,
        durationSec: 4.0,
      };
      setToasts(prev => [...prev.slice(-3), t]);
      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== t.id));
      }, 4000);
      timeoutsRef.current.push(timer);
    } else if (actionableEvents.length === 2) {
      const t0: AtcToastMessage = {
        id: `${now}-0-${Math.random()}`,
        text: actionableEvents[0].message,
        time: actionableEvents[0].atSeconds,
        durationSec: 4.2,
      };
      const t1: AtcToastMessage = {
        id: `${now}-1-${Math.random()}`,
        text: actionableEvents[1].message,
        time: actionableEvents[1].atSeconds,
        durationSec: 3.8,
      };
      setToasts(prev => [...prev.slice(-2), t0]);
      const timer0 = setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== t0.id));
      }, 4200);
      timeoutsRef.current.push(timer0);

      const s1 = setTimeout(() => {
        setToasts(prev => [...prev, t1]);
        const timer1 = setTimeout(() => {
          setToasts(prev => prev.filter(item => item.id !== t1.id));
        }, 3800);
        timeoutsRef.current.push(timer1);
      }, 400);
      timeoutsRef.current.push(s1);
    } else {
      // 3 thông báo trở lên: lần lượt trồi lên cách nhau 400ms
      const items: AtcToastMessage[] = actionableEvents.slice(0, 3).map((ev: any, idx: number) => ({
        id: `${now}-${idx}-${Math.random()}`,
        text: ev.message,
        time: ev.atSeconds,
        severity: ev.severity,
        durationSec: idx === 0 ? 4.5 : idx === 1 ? 4.1 : 3.7,
      }));

      // Stage 0: Hiện ngay thông báo 1
      setToasts([items[0]]);
      const timer0 = setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== items[0].id));
      }, 4500);
      timeoutsRef.current.push(timer0);

      // Stage 1: Trồi lên thông báo 2 sau 400ms
      const s1 = setTimeout(() => {
        setToasts(prev => [...prev, items[1]]);
        const timer1 = setTimeout(() => {
          setToasts(prev => prev.filter(item => item.id !== items[1].id));
        }, 4100);
        timeoutsRef.current.push(timer1);
      }, 400);
      timeoutsRef.current.push(s1);

      // Stage 2: Trồi lên thông báo 3 sau 800ms
      const s2 = setTimeout(() => {
        setToasts(prev => [...prev, items[2]]);
        const timer2 = setTimeout(() => {
          setToasts(prev => prev.filter(item => item.id !== items[2].id));
        }, 3700);
        timeoutsRef.current.push(timer2);
      }, 800);
      timeoutsRef.current.push(s2);
    }
  }, [events, events.length, scenario, clearAllTimers]);

  if (!scenario) return null;

  // Thẻ kịch bản bên phải
  const scenarioTag = scenario.id === 'emergency_priority_engine_fire'
    ? 'KỊCH BẢN 2'
    : scenario.id === 'lvc_hsns_intersection_conflict'
    ? 'KỊCH BẢN 3'
    : scenario.id === 'lvc_w7a_sudden_closure'
    ? 'KỊCH BẢN 4'
    : scenario.id === 'lvc_wrong_turn_radio_failure'
    ? 'KỊCH BẢN 1'
    : scenario.id === 'lvc_peak_runway_direction_change'
    ? 'KỊCH BẢN 5'
    : 'A-SMGCS';

  const elapsed = state.elapsedSeconds;
  const statusText = scenario.id === 'lvc_peak_runway_direction_change'
    ? (elapsed < 5
        ? 'GĐ 1: INB01 nhường đường tự động tại W7A; OUT01 & OUT02 lăn thông suốt.'
        : elapsed < 16
        ? 'GĐ 2: OUT01 & OUT02 đổi hướng 07R; INB01 tiếp tục lăn về Stand 17.'
        : 'GĐ 3: Stand 8, 11, 4 pushback nối đuôi cách nhau ra 07R.')
    : scenario.id === 'emergency_priority_engine_fire'
    ? 'GĐ 1: BAV456 ưu tiên hạ cánh khẩn nguy 25R; HVN123 dừng chờ tại W6.'
    : scenario.id === 'lvc_wrong_turn_radio_failure'
    ? 'HVN216 lăn theo đèn xanh Follow-the-Green từ Stand 10 ra STOP BAR 25L.'
    : scenario.id === 'lvc_hsns_intersection_conflict'
    ? 'Điều phối tự động phân luồng tránh xung đột tại giao lộ HS NS.'
    : scenario.id === 'lvc_w7a_sudden_closure'
    ? 'Đổi tuyến tự động khi phát hiện vật thể lạ (FOD) trên đường lăn.'
    : 'Hệ thống giám sát mặt đất A-SMGCS đang hoạt động.';

  return (
    <div className="w-full bg-[#0E1523]/95 backdrop-blur-md border-t border-[rgba(148,163,184,0.16)] flex flex-col flex-shrink-0 font-mono select-none relative z-20">
      {/* ── DANH SÁCH THÔNG BÁO TRỒI LÊN THEO CỘT (XẾP CHỒNG NHIỀU DÒNG NHƯ MÀN 2D) ── */}
      {toasts.length > 0 && (
        <div className="w-full flex flex-col font-mono select-none">
          {toasts.map(toast => {
            const meta = parseToastMeta(toast.text);
            const durationSec = toast.durationSec ?? 4.0;

            const pingColor = meta.isEmergency || meta.isFod
              ? 'bg-rose-400 text-rose-400'
              : meta.isPilot
              ? 'bg-amber-400 text-amber-400'
              : 'bg-emerald-400 text-emerald-400';

            const badgeBg = meta.isEmergency || meta.isFod
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : meta.isPilot
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';

            const badgeText = meta.isEmergency ? 'EMG' : meta.isFod ? 'FOD' : meta.isPilot ? 'PILOT' : 'FTG';

            return (
              <div
                key={toast.id}
                className="relative overflow-hidden w-full px-3 py-1.5 flex items-center justify-between text-xs transition-all duration-300 border-b border-white/5 last:border-b-0 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-900/40 cursor-pointer island-card-pop-in"
                onClick={() => handleDismissToast(toast.id)}
                title="Bấm để đóng thông báo này"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full inline-block animate-pulse shadow-[0_0_8px_currentColor] shrink-0 ${pingColor}`} />
                  <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full border leading-none shrink-0 ${badgeBg}`}>
                    {badgeText}
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
                    handleDismissToast(toast.id);
                  }}
                  className="text-[#94A3B8] hover:text-white text-xs px-1.5 py-0.5 hover:bg-white/20 rounded-full transition-colors shrink-0 ml-1 cursor-pointer"
                  title="Đóng lệnh này"
                >
                  ✕
                </button>

                <div
                  className="absolute bottom-0 left-0 h-[1.5px] bg-emerald-400/80 island-countdown-bar"
                  style={{ animationDuration: `${durationSec}s` }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── THANH TRẠNG THÁI DƯỚI CÙNG (STATUS BANNER + FTG ACTIVE TAG) ── */}
      <div className="w-full h-8 px-3 flex items-center justify-between select-none font-mono text-xs border-t border-[rgba(148,163,184,0.1)] bg-[#070e19]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-2 h-2 rounded-full inline-block bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399] shrink-0" />
          <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 leading-none shrink-0">
            FTG LIVE
          </span>
          <span className="text-slate-300 text-[11px] truncate flex-1 min-w-0">
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] border bg-[rgba(34,197,94,0.12)] text-[#22C55E] border-[rgba(34,197,94,0.3)] shadow-xs">
            FtG: ACTIVE
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] border bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border-[rgba(59,130,246,0.3)] shadow-xs hidden sm:inline-block">
            {scenarioTag}
          </span>
        </div>
      </div>
    </div>
  );
}
