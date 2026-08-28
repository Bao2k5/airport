import type { ReactNode } from 'react';
import PageHeader from './PageHeader';
import type { BadgeStatus } from './StatusBadge';

interface AppShellProps {
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
  children: ReactNode;
}

export default function AppShell({
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
  children,
}: AppShellProps) {
  return (
    <div className="fixed inset-0 w-full min-h-screen md:h-screen z-50 bg-[#090D16] flex flex-col text-[#F1F5F9] select-none overflow-y-auto md:overflow-hidden font-sans">
      {/* 1. Header Cảnh báo Giáo dục VAA chuẩn */}
      <header className="bg-[#0E1523] border-b border-[rgba(148,163,184,0.12)] text-[#94A3B8] text-center py-1 px-3 text-[10px] sm:text-[11px] font-medium tracking-wide flex-shrink-0">
        <span>HỌC VIỆN HÀNG KHÔNG VIỆT NAM — MÔ PHỎNG GIÁO DỤC A-SMGCS (KHÔNG DÙNG TRONG HOẠT ĐỘNG THỰC TẾ)</span>
      </header>

      {/* 2. Unified Page Header / Toolbar */}
      <PageHeader
        category={category}
        title={title}
        description={description}
        status={status}
        statusLabel={statusLabel}
        speedMultiplier={speedMultiplier}
        onSpeedChange={onSpeedChange}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
        onRestart={onRestart}
        onExit={onExit}
      />

      {/* 3. Main Dual Viewport Content */}
      <main className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
