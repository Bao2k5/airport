import type { ReactNode } from 'react';
import AppShell from './AppShell';
import type { BadgeStatus } from './StatusBadge';

interface ScenarioRunPageProps {
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

export default function ScenarioRunPage({
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
}: ScenarioRunPageProps) {
  return (
    <AppShell
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
    >
      <div className="h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 min-h-0 overflow-y-auto lg:overflow-hidden">
        {children}
      </div>
    </AppShell>
  );
}
