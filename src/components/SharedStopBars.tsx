import { useMemo } from 'react';
import type { AirportGraph, SimulationState } from '../types';
import { getStopBarDefinitions, isStopBarOn } from '../presentation/stopBars';

export default function SharedStopBars({ graph, state }: { graph: AirportGraph; state: SimulationState }) {
  const bars = useMemo(() => getStopBarDefinitions(graph), [graph]);
  return <g pointerEvents="none" aria-label="Stopbar đồng bộ">
    {bars.map(bar => <g key={bar.id}>{[-6.4, -3.2, 0, 3.2, 6.4].map(offset => <circle key={offset}
      cx={bar.x + bar.nx * offset} cy={bar.y + bar.ny * offset} r={1.1}
      fill={isStopBarOn(bar, state) ? '#ff3535' : '#453538'} />)}</g>)}
  </g>;
}
