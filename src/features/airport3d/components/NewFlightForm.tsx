import { useMemo, useState } from 'react';
import type { AirportGraph } from '../../../types';
import { isLanding25RNode, isTakeoffRunwayNode } from '../../../data/v3OperationalNodes';
import type { NewFlightInput } from '../../../simulation/manualFlights';

export default function NewFlightForm({ graph, onCreate }: { graph: AirportGraph; onCreate: (input: NewFlightInput) => void }) {
  const [arrival, setArrival] = useState(false);
  const [callsign, setCallsign] = useState('');
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const stands = useMemo(() => graph.nodes.filter(n => /^STAND[_ -]?\d+/i.test(n.label)), [graph]);
  const starts = arrival ? graph.nodes.filter(n => isLanding25RNode(n.id, graph.nodes)) : stands;
  const ends = arrival ? stands : graph.nodes.filter(n => isTakeoffRunwayNode(n.id, graph.nodes));
  const startId = starts.some(n => n.id === start) ? start : starts[0]?.id ?? '';
  const endId = ends.some(n => n.id === destination) ? destination : ends[0]?.id ?? '';
  const field = 'mt-1 w-full rounded border border-slate-500 bg-slate-950 p-2 text-white';
  return <details className="rounded-xl border border-slate-600 bg-slate-900 p-3 text-xs text-white">
    <summary className="cursor-pointer font-bold text-cyan-200">Tạo chuyến bay thủ công</summary>
    <form className="mt-3 grid gap-3" onSubmit={e => { e.preventDefault(); onCreate({ callsign, startNodeId: startId, destinationNodeId: endId, aircraftType: 'A321', airlineCode: 'VN' }); }}>
      <label>Loại chuyến<select className={field} value={arrival ? 'arrival' : 'departure'} onChange={e => setArrival(e.target.value === 'arrival')}><option value="departure">Đi: stand → cất cánh</option><option value="arrival">Đến: tiếp cận → stand</option></select></label>
      <label>Hiệu gọi<input required pattern="[A-Za-z0-9-]{2,12}" maxLength={12} value={callsign} onChange={e => setCallsign(e.target.value)} className={field} /></label>
      <label>{arrival ? 'Đường băng hạ cánh' : 'Stand xuất phát'}<select className={field} value={startId} onChange={e => setStart(e.target.value)}>{starts.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
      <label>{arrival ? 'Stand đến' : 'Đường băng cất cánh'}<select className={field} value={endId} onChange={e => setDestination(e.target.value)}>{ends.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
      <button disabled={!startId || !endId} className="rounded bg-cyan-500 p-3 font-bold text-slate-950 disabled:opacity-40">Tạo chuyến</button>
      <p className="text-slate-300">Đổi loại tàu và hãng trong phiếu bay sau khi tạo. Cần cấp tuyến và readback trước khi khởi hành.</p>
    </form>
  </details>;
}
