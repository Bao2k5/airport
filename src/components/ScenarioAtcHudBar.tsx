import { useState, useEffect, useRef, useCallback } from 'react';
import type { SimulationState } from '../types';

interface AtcToastMessage {
  id: string;
  text: string;
  time: number;
  severity?: string;
  durationSec?: number;
  createdAt: number;
}

function parseToastMeta(text: string) {
  const isPilot = text.includes('👨‍✈️') || text.toLowerCase().includes('pilot') || text.toLowerCase().includes('phi công');
  const isFod = text.includes('FOD') || text.includes('vật thể lạ');
  const isEmergency = text.includes('🚨') || text.includes('khẩn nguy') || text.includes('cháy động cơ') || text.includes('emergency');
  const isFtg = text.includes('🟢') || text.includes('FTG') || text.includes('Follow-the-Green');

  const callsignMatch = text.match(/\b(HVN\d+|BAV\d+|THA\d+|RESCUE\d+|VJ\d+|VN\d+|INB\d+|OUT\d+)\b/i);
  const callsign = callsignMatch ? callsignMatch[1].toUpperCase() : null;

  const quoteMatch = text.match(/"([^"]+)"/);
  let content = quoteMatch ? `"${quoteMatch[1]}"` : text.replace(/^[^:]+:\s*/, '');
  content = content.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  return { isPilot, isFod, isEmergency, isFtg, callsign, content };
}

export default function ScenarioAtcHudBar({ state }: { state: SimulationState }) {
  const [toasts, setToasts] = useState<AtcToastMessage[]>([]);
  const prevEventsLength = useRef(0);

  const scenario = state.scenario;
  const events = scenario?.events ?? [];

  // Reset khi đổi kịch bản hoặc khi kịch bản chạy lại từ đầu
  useEffect(() => {
    setToasts([]);
    prevEventsLength.current = 0;
  }, [scenario?.id, state.elapsedSeconds === 0]);

  // Chạy tuần tự từng lệnh trồi lên nhanh:
  // - Nếu có >= 3 lệnh: mỗi lệnh hiện đúng 2.5s rồi chuyển lệnh tiếp theo.
  // - Nếu có 2 lệnh: mỗi lệnh hiện đúng 3.0s.
  // - Nếu có 1 lệnh đơn lẻ: hiện 4.5s.
  useEffect(() => {
    if (toasts.length === 0) return;
    const currentId = toasts[0].id;
    const durationMs = (toasts[0].durationSec ?? 2.5) * 1000;
    const timer = setTimeout(() => {
      setToasts(prev => {
        if (prev.length === 0 || prev[0].id !== currentId) return prev;
        return prev.slice(1);
      });
    }, durationMs);
    return () => clearTimeout(timer);
  }, [toasts[0]?.id, toasts[0]?.durationSec]);

  // Bắt sự kiện huấn lệnh mới phát sinh từ kịch bản
  useEffect(() => {
    if (!scenario) return;

    if (events.length < prevEventsLength.current) {
      prevEventsLength.current = 0;
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
    const durationPerToast = actionableEvents.length >= 3 ? 2.5 : (actionableEvents.length === 2 ? 3.0 : 4.5);
    const newToasts: AtcToastMessage[] = actionableEvents.map((ev: any, i: number) => ({
      id: `${now}-${i}-${Math.random()}`,
      text: ev.message,
      time: ev.atSeconds,
      severity: ev.severity,
      durationSec: durationPerToast,
      createdAt: now,
    }));

    // Giữ tối đa 4 tin nhắn mới nhất trong hàng đợi tuần tự
    setToasts(prev => [...prev, ...newToasts].slice(-4));
  }, [events, events.length, scenario?.id]);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (!scenario) return null;

  const activeToast = toasts.length > 0 ? toasts[0] : null;
  const durationSec = activeToast?.durationSec ?? 2.5;
  const meta = activeToast ? parseToastMeta(activeToast.text) : null;

  const badgeBg = meta?.isEmergency || meta?.isFod
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
    : meta?.isPilot
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
    : meta?.isFtg
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
    : 'bg-sky-500/20 text-sky-300 border-sky-500/50';

  const pingColor = meta?.isEmergency || meta?.isFod
    ? 'bg-rose-400 text-rose-400'
    : meta?.isPilot
    ? 'bg-amber-400 text-amber-400'
    : meta?.isFtg
    ? 'bg-emerald-400 text-emerald-400'
    : 'bg-sky-400 text-sky-400';

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

  return (
    <div className="px-3 sm:px-3.5 py-1.5 bg-[#0E1523]/90 backdrop-blur-md border-t border-[rgba(148,163,184,0.16)] text-xs text-[#94A3B8] flex items-center justify-between flex-shrink-0 gap-2.5 h-10 overflow-hidden font-mono select-none relative">
      {/* Khối bên trái & Giữa: Hiển thị thông báo theo từng tàu bay hoặc Trạng thái A-SMGCS */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {activeToast && meta ? (
          <div key={activeToast.id} className="flex items-center gap-2 flex-1 min-w-0 island-card-pop-in">
            {/* 1. Đèn tín hiệu & Kênh phát lệnh */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`w-2 h-2 rounded-full inline-block animate-pulse shadow-[0_0_8px_currentColor] ${pingColor}`} />
              <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full border leading-none shrink-0 ${badgeBg}`}>
                {meta.isEmergency ? 'EMG' : meta.isFod ? 'FOD' : meta.isPilot ? 'PILOT' : meta.isFtg ? 'FTG' : 'ATC'}
              </span>
              {/* 2. Biển hiệu / Callsign của đúng tàu bay đó */}
              {meta.callsign && (
                <span className="text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-600/60 px-2 py-0.5 rounded-full tracking-wide leading-none shrink-0 shadow-xs">
                  {meta.callsign}
                </span>
              )}
            </div>

            {/* 3. Nội dung huấn lệnh / câu thoại ngắn gọn chuẩn của tàu bay */}
            <div className="font-mono text-[11px] sm:text-xs font-semibold leading-tight text-slate-100 drop-shadow-sm whitespace-nowrap truncate flex-1 min-w-0" title={meta.content}>
              {meta.content}
            </div>

            {/* 4. Chấm hiển thị hàng đợi các lệnh tiếp theo */}
            {toasts.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 shrink-0 px-1" title={`Còn ${toasts.length - 1} lệnh tiếp theo`}>
                {Array.from({ length: Math.min(toasts.length, 4) }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === 0
                        ? 'w-3 bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                        : 'w-1.5 bg-slate-600/80'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* 5. Nút đóng [✕] cho lệnh hiện tại */}
            <button
              type="button"
              onClick={() => handleDismissToast(activeToast.id)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 hover:bg-white/20 rounded transition-colors shrink-0 cursor-pointer"
              title="Đóng lệnh này"
            >
              ✕
            </button>
          </div>
        ) : (
          /* Trạng thái A-SMGCS Live khi chưa có lệnh mới */
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 leading-none">
              A-SMGCS LIVE
            </span>
            <span className="text-slate-400 text-xs font-mono truncate hidden sm:inline">
              Hệ thống giám sát mặt đất đang tự động điều phối luồng di chuyển trên khu bay
            </span>
          </div>
        )}
      </div>

      {/* Khối bên phải: Thẻ tên kịch bản */}
      <span className="text-[10px] sm:text-xs font-mono font-bold flex-shrink-0 px-2 py-0.5 rounded-[4px] border z-10 bg-[rgba(34,197,94,0.12)] text-[#22C55E] border-[rgba(34,197,94,0.3)] shadow-xs">
        {scenarioTag}
      </span>

      {/* Thanh đếm ngược countdown ở đáy */}
      {activeToast && (
        <div
          key={activeToast.id}
          className={`absolute bottom-0 left-0 h-[2px] ${
            meta?.isEmergency || meta?.isFod ? 'bg-rose-400/90' : meta?.isFtg ? 'bg-emerald-400/90' : 'bg-sky-400/90'
          } island-countdown-bar`}
          style={{ animationDuration: `${durationSec}s` }}
        />
      )}
    </div>
  );
}
