import { CheckCircle2, AlertCircle, Clock, Pause } from 'lucide-react';

export type BadgeStatus = 'running' | 'paused' | 'completed' | 'warning' | 'holding' | 'idle';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  switch (status) {
    case 'running':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(34,197,94,0.12)] text-[#22C55E] border border-[rgba(34,197,94,0.3)] ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
          {label || 'ĐANG CHẠY'}
        </span>
      );
    case 'paused':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] ${className}`}>
          <Pause className="w-3 h-3" />
          {label || 'TẠM DỪNG'}
        </span>
      );
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(6,182,212,0.12)] text-[#06B6D4] border border-[rgba(6,182,212,0.3)] ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          {label || 'HOÀN TẤT'}
        </span>
      );
    case 'warning':
    case 'holding':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(244,63,94,0.12)] text-[#F43F5E] border border-[rgba(244,63,94,0.3)] ${className}`}>
          <AlertCircle className="w-3 h-3" />
          {label || 'DỪNG CHỜ'}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(148,163,184,0.12)] text-[#94A3B8] border border-[rgba(148,163,184,0.2)] ${className}`}>
          <Clock className="w-3 h-3" />
          {label || 'CHỜ LỆNH'}
        </span>
      );
  }
}
