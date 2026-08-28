import { ArrowLeft, RotateCcw, Pause, Play, X, Gauge } from 'lucide-react';
import StatusBadge, { type BadgeStatus } from './StatusBadge';
import SecondaryButton from './SecondaryButton';

interface PageHeaderProps {
  category?: string;
  title: string;
  description?: string;
  status: BadgeStatus;
  statusLabel?: string;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export default function PageHeader({
  category = 'Kịch bản mẫu',
  title,
  description,
  status,
  statusLabel,
  speedMultiplier,
  onSpeedChange,
  isPaused,
  onTogglePause,
  onRestart,
  onExit,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0E1523] border-b border-[rgba(148,163,184,0.16)] flex-shrink-0 select-none">
      {/* Left: Breadcrumb & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full md:w-auto">
        <button
          onClick={onExit}
          className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 rounded-[8px] bg-[#131E2E] hover:bg-[#18263A] active:bg-[#1C2C42] text-[#94A3B8] hover:text-[#F1F5F9] border border-[rgba(148,163,184,0.16)] transition-colors cursor-pointer flex items-center justify-center flex-shrink-0 shadow-xs"
          title="Quay lại danh sách kịch bản"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
              {category}
            </span>
            <span className="text-[#64748B] text-xs">/</span>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-[#F1F5F9] leading-snug break-words">
              {title}
            </h1>
            <StatusBadge status={status} label={statusLabel} />
          </div>
          {description && (
            <p className="text-[11px] sm:text-xs text-[#94A3B8] leading-relaxed mt-0.5 line-clamp-1 sm:line-clamp-2 md:line-clamp-none">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Controls Toolbar */}
      <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 flex-wrap pt-1 md:pt-0 border-t md:border-t-0 border-[rgba(148,163,184,0.1)]">
        {/* Speed Selector */}
        <div className="flex items-center bg-[#070B13] p-0.5 sm:p-1 rounded-[8px] border border-[rgba(148,163,184,0.16)]">
          <span className="text-[10px] text-[#64748B] font-bold px-1.5 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="hidden sm:inline">TỐC ĐỘ</span>
          </span>
          {[0.5, 1, 2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-mono font-bold rounded-[6px] transition-colors cursor-pointer min-h-[36px] sm:min-h-[38px] flex items-center justify-center ${
                speedMultiplier === s
                  ? 'bg-[#06B6D4] text-white shadow-xs font-black'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131E2E]'
              }`}
              title={`Tốc độ ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pause / Resume */}
          <SecondaryButton
            onClick={onTogglePause}
            icon={isPaused ? <Play className="w-4 h-4 text-[#22C55E]" /> : <Pause className="w-4 h-4 text-[#F59E0B]" />}
            className="min-h-[38px] sm:min-h-[44px] px-2.5 sm:px-3 text-xs"
          >
            {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          </SecondaryButton>

          {/* Restart */}
          <SecondaryButton
            onClick={onRestart}
            icon={<RotateCcw className="w-4 h-4" />}
            className="min-h-[38px] sm:min-h-[44px] px-2.5 sm:px-3 text-xs"
          >
            <span className="hidden xs:inline">Chạy lại</span>
          </SecondaryButton>

          {/* Exit */}
          <SecondaryButton
            variant="danger"
            onClick={onExit}
            icon={<X className="w-4 h-4" />}
            className="min-h-[38px] sm:min-h-[44px] px-2.5 sm:px-3 text-xs"
          >
            Thoát
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
