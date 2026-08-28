import type { ReactNode } from 'react';
import AirportMap from '../AirportMap';
import SurfaceCard from './SurfaceCard';
import type { AirportGraph, SimulationState } from '../../types';

interface ScenarioComparisonPanelProps {
  title: string;
  renderMode: 'traditional' | 'ftg';
  timeFormatted: string;
  state: SimulationState;
  graph: AirportGraph;
  bgImage?: string;
  hudContent?: ReactNode;
  clearanceContent?: ReactNode;
  alertContent?: ReactNode;
  isDone?: boolean;
  doneLabel?: string;
  statusBanner: ReactNode;
  ftgTag: string;
  aircraftScale?: number;
}

export default function ScenarioComparisonPanel({
  title,
  renderMode,
  timeFormatted,
  state,
  graph,
  bgImage,
  hudContent,
  clearanceContent,
  alertContent,
  isDone = false,
  doneLabel,
  statusBanner,
  ftgTag,
  aircraftScale = 1.5,
}: ScenarioComparisonPanelProps) {
  const isFtg = renderMode === 'ftg';

  return (
    <SurfaceCard className="flex flex-col h-full min-h-[400px] sm:min-h-[460px] lg:min-h-0 overflow-hidden shadow-md relative">
      {/* 1. Panel Header */}
      <div className="flex items-center justify-between px-3 sm:px-3.5 py-2 sm:py-2.5 bg-[#131E2E] border-b border-[rgba(148,163,184,0.16)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isFtg ? 'bg-[#22C55E]' : 'bg-[#F43F5E]'}`} />
          <span className="font-bold text-xs sm:text-sm text-[#F1F5F9] uppercase tracking-wider truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs text-[#94A3B8] font-medium hidden xs:inline">Thời gian:</span>
          <span className={`font-mono text-xs sm:text-sm font-bold ${isFtg ? 'text-[#22C55E]' : 'text-[#F43F5E]'}`}>
            {timeFormatted}
          </span>
        </div>
      </div>

      {/* 2. Map Canvas Viewport */}
      <div className="flex-1 relative min-h-0 bg-[#070B13]">
        <AirportMap
          state={state}
          graph={graph}
          bgImage={bgImage}
          renderMode={renderMode}
          aircraftScale={aircraftScale}
        />

        {/* Clearance popup (Giai đoạn 1) */}
        {clearanceContent}

        {/* Alert notification popup */}
        {alertContent}

        {/* Top-Left Telemetry HUD Card */}
        {hudContent}

        {/* Done Completion Badge */}
        {isDone && doneLabel && (
          <SurfaceCard variant="active" className="absolute top-3 right-3 z-10 px-3 py-1.5 backdrop-blur-sm flex items-center gap-2 shadow-md animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-xs font-bold text-[#F1F5F9]">{doneLabel}</span>
          </SurfaceCard>
        )}
      </div>

      {/* 3. Bottom Live Status Banner */}
      <div className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-[#0E1523] border-t border-[rgba(148,163,184,0.16)] text-xs text-[#94A3B8] flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-1.5 leading-snug flex-1 min-w-0">
          {statusBanner}
        </div>
        <span className={`text-xs font-mono font-bold flex-shrink-0 ml-2 px-2 py-0.5 rounded-[4px] border ${
          isFtg
            ? 'bg-[rgba(34,197,94,0.12)] text-[#22C55E] border-[rgba(34,197,94,0.3)]'
            : 'bg-[rgba(148,163,184,0.1)] text-[#94A3B8] border-[rgba(148,163,184,0.2)]'
        }`}>
          {ftgTag}
        </span>
      </div>
    </SurfaceCard>
  );
}
