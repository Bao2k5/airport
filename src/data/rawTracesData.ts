// Raw Traces Data (V3 Complete Master Data) - TSN Airport Calibration
import v3CompleteExport from './v3_coordinates_complete.json';

export interface RawPoint {
  x: number;
  y: number;
  label?: string;
  nodeId?: string;
  note?: string;
}

export interface RawLine {
  id: string;
  name: string;
  description?: string;
  points: RawPoint[];
}

export interface TracePointItem {
  key: string;            // lineId_pointIndex
  lineId: string;
  lineName: string;
  pointIndex: number;
  markIndex: number;      // global 1-based index
  x: number;
  y: number;
  name?: string;          // operational/display name if assigned
  isNamed: boolean;
}

export const USER_RAW_TRACES: RawLine[] = (v3CompleteExport.rawLines as any[]) as RawLine[];

export const USER_TRACE_POINTS: TracePointItem[] = (() => {
  const points: TracePointItem[] = [];
  let globalIdx = 1;
  const nodeNames = (v3CompleteExport as any)?.nodeNames || {};

  USER_RAW_TRACES.forEach(line => {
    line.points.forEach((pt, pIdx) => {
      const key = `${line.id}_${pIdx}`;
      const assignedName = nodeNames[key] || pt.label || '';
      points.push({
        key,
        lineId: line.id,
        lineName: line.name || line.id,
        pointIndex: pIdx,
        markIndex: globalIdx++,
        x: pt.x,
        y: pt.y,
        name: assignedName,
        isNamed: Boolean(assignedName && assignedName.trim().length > 0),
      });
    });
  });
  return points;
})();
