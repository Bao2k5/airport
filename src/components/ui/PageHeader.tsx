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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-4 py-2.5 bg-[#0E1523] border-b border-[rgba(148,163,184,0.16)] flex-shrink-0 select-none">
      {/* Left: Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onExit}
          className="p-1.5 rounded-[8px] bg-[#131E2E] hover:bg-[#18263A] text-[#94A3B8] hover:text-[#F1F5F9] border border-[rgba(148,163,184,0.16)] transition-colors cursor-pointer"
          title="Quay lại danh sách kịch bản"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
              {category}
            </span>
            <span className="text-[#64748B]">/</span>
            <h1 className="text-sm font-bold text-[#F1F5F9] truncate">{title}</h1>
            <StatusBadge status={status} label={statusLabel} />
          </div>
          {description && (
            <p className="text-xs text-[#94A3B8] truncate mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Right: Controls Toolbar */}
      <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
        {/* Speed Selector */}
        <div className="flex items-center bg-[#070B13] p-0.5 rounded-[8px] border border-[rgba(148,163,184,0.16)]">
          <span className="text-[10px] text-[#64748B] font-bold px-1.5 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="hidden sm:inline">TỐC ĐỘ</span>
          </span>
          {[0.5, 1, 2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded-[6px] transition-colors cursor-pointer ${
                speedMultiplier === s
                  ? 'bg-[#06B6D4] text-white shadow-xs'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131E2E]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Pause / Resume */}
        <SecondaryButton
          onClick={onTogglePause}
          icon={isPaused ? <Play className="w-3.5 h-3.5 text-[#22C55E]" /> : <Pause className="w-3.5 h-3.5 text-[#F59E0B]" />}
        >
          {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        </SecondaryButton>

        {/* Restart */}
        <SecondaryButton
          onClick={onRestart}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Chạy lại
        </SecondaryButton>

        {/* Exit */}
        <SecondaryButton
          variant="danger"
          onClick={onExit}
          icon={<X className="w-3.5 h-3.5" />}
        >
          Thoát
        </SecondaryButton>
      </div>
    </div>
  );
}
