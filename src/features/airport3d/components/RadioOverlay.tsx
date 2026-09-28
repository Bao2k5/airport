import type { SimulationState } from '../../../types';
import { getAirlineDef } from '../../../data/airlineTypes';

/** Displays authored core messages verbatim. Never invents ATC clearances. */
export default function RadioOverlay({ state }: { state: SimulationState }) {
  const bubble = state.comicBubble?.active ? state.comicBubble : null;
  const events = state.liveEventLog.slice(-3);
  const fleet = state.scenarioAircraft?.length ? state.scenarioAircraft : state.manualFleet ?? [];
  if (!bubble && !events.length) return null;
  return <details className="absolute bottom-20 left-3 z-10 max-w-[min(28rem,80%)] rounded-lg border border-slate-600 bg-[#0d2340ed] p-3 text-xs text-white shadow-lg">
    <summary className="cursor-pointer font-bold text-cyan-200">Liên lạc / nhật ký điều hành{bubble ? ` · ${bubble.speaker}` : ''}</summary>
    <div className="mt-2 max-h-44 space-y-2 overflow-y-auto" aria-live="polite">
      {bubble && <p><b>{bubble.speaker}: </b>{bubble.text}{bubble.subText && <span className="block text-slate-300">{bubble.subText}</span>}</p>}
      {events.map(event => <p key={event.id} className="border-t border-white/10 pt-2">
        <time className="mr-2 text-slate-400">{Math.floor(event.atSeconds)}s</time>
        {event.callsign && <b style={{ color: getAirlineDef(fleet.find(item => item.callsign === event.callsign)?.airlineCode ?? event.callsign).accentColor }}>{event.callsign} · </b>}
        {event.message}
      </p>)}
    </div>
  </details>;
}
