import type { Aircraft, AirportGraph, FlightMotion } from '../types';

/** Educational timing/height only. Coordinates always derive from graph. */
export const FLIGHT_ANIMATION = {
  approachSeconds: 28,
  flareSeconds: 6,
  rolloutSeconds: 14,
  lineupSeconds: 1,
  /** Thời gian chạy đà cất cánh. Dài hơn = tăng tốc từ từ hơn. */
  rollSeconds: 18,
  rotateSeconds: 3,
  climbSeconds: 12,
  approachDistanceSvg: 300,
  flareDistanceSvg: 45,
  cruiseHeightWorld: 12,
  /** Điểm chạm bánh (touchdown) dịch vào theo tỉ lệ chiều dài đường băng thật,
   * tính từ đầu đường băng (near). 1/3 = chạm bánh ở khoảng 1/3 đường băng
   * thay vì ngay tại ngưỡng/threshold. */
  touchdownRunwayRatio: 1 / 3
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Hệ số quy đổi tốc độ lăn của bộ mô phỏng: svg/giây = kts × 0.52
 * (khớp stepProgress trong scenarioRunner.ts). */
const TAXI_SVG_PER_KT = 0.52;
/** Tốc độ (kts) lúc bàn giao từ xả đà sang lăn, sao cho tốc độ trên màn hình
 * liền mạch với tốc độ tiếp đất; bộ lăn sau đó tăng dần lên tốc độ chuẩn. */
function rolloutHandoffKts(): number {
  return (FLIGHT_ANIMATION.flareDistanceSvg / FLIGHT_ANIMATION.flareSeconds) / TAXI_SVG_PER_KT;
}

/** Tỉ lệ tiến độ (0..1) của vị trí hiện tại trên đoạn route chứa điểm chạm bánh. */
function progressOnSegment(f: FlightMotion, fallback: number): number {
  if (!f.resumeSegment) return fallback;
  const [[ax, ay], [bx, by]] = f.resumeSegment;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return fallback;
  return Math.max(0, Math.min(1, ((f.x - ax) * dx + (f.y - ay) * dy) / len2));
}

export function createFlightMotion(aircraft: Aircraft, graph: AirportGraph, kind: FlightMotion['kind']): FlightMotion | undefined {
  const node = graph.nodes.find(n => n.id === (kind === 'arrival' ? aircraft.assignedRoute[0] : aircraft.currentNodeId));
  if (!node) return;
  const segments = graph.edges.filter(e => e.type === 'runway').flatMap(edge => {
    const a = graph.nodes.find(n => n.id === edge.fromNodeId), b = graph.nodes.find(n => n.id === edge.toNodeId);
    if (!a || !b) return [];
    return [{ edge, a, b }];
  });
  const nonZeroSegments = segments.filter(s => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y) >= 0.01);
  const closest = (nonZeroSegments.length > 0 ? nonZeroSegments : segments).sort((u, v) => Math.min(Math.hypot(u.a.x - node.x, u.a.y - node.y), Math.hypot(u.b.x - node.x, u.b.y - node.y)) - Math.min(Math.hypot(v.a.x - node.x, v.a.y - node.y), Math.hypot(v.b.x - node.x, v.b.y - node.y)))[0];
  if (!closest) return;
  const connected = new Set([closest.a.id, closest.b.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of segments) if (connected.has(s.a.id) || connected.has(s.b.id)) {
      if (!connected.has(s.a.id) || !connected.has(s.b.id)) changed = true;
      connected.add(s.a.id); connected.add(s.b.id);
    }
  }
  const runwayNodes = graph.nodes.filter(n => connected.has(n.id));
  const near = runwayNodes.reduce((a, b) => Math.hypot(a.x - node.x, a.y - node.y) < Math.hypot(b.x - node.x, b.y - node.y) ? a : b);
  const far = runwayNodes.reduce((a, b) => Math.hypot(a.x - near.x, a.y - near.y) > Math.hypot(b.x - near.x, b.y - near.y) ? a : b);
  let start: [number, number] = [near.x, near.y], end: [number, number] = [far.x, far.y], resumeIndex = 0;
  let resumeSegment: [[number, number], [number, number]] | undefined;
  let resumeEdgeId: string | null | undefined;
  if (kind === 'arrival') {
    const route = aircraft.assignedRoute;
    const runwayLength = Math.hypot(far.x - near.x, far.y - near.y);
    const ux = runwayLength > 0 ? (far.x - near.x) / runwayLength : 0;
    const uy = runwayLength > 0 ? (far.y - near.y) / runwayLength : 0;
    // Khoảng cách dọc tim đường băng tính từ ngưỡng (near).
    const along = (n: { x: number; y: number }) => (n.x - near.x) * ux + (n.y - near.y) * uy;
    const touchdownAlong = runwayLength * FLIGHT_ANIMATION.touchdownRunwayRatio;
    // Điểm kết thúc rollout = node đầu tiên của route nằm PHÍA TRƯỚC điểm chạm
    // bánh. Nếu lấy node kế tiếp như cũ (gần ngưỡng) thì máy bay chạm đất xong
    // phải lùi lại mới vào được route.
    let exitIdx = -1;
    for (let k = 1; k < route.length; k++) {
      const n = graph.nodes.find(candidate => candidate.id === route[k]);
      if (n && along(n) > touchdownAlong + 1) { exitIdx = k; break; }
    }
    if (exitIdx > 0) {
      start = [near.x + ux * touchdownAlong, near.y + uy * touchdownAlong];
      const exitNode = graph.nodes.find(n => n.id === route[exitIdx])!;
      end = [exitNode.x, exitNode.y];
      resumeIndex = exitIdx - 1;
    } else {
      // Route rời đường băng trước điểm 1/3: giữ cách cũ, chạm bánh tại ngưỡng.
      start = [node.x, node.y];
      const next = route.slice(1).map(id => graph.nodes.find(n => n.id === id)).find(n => n && Math.hypot(n.x - node.x, n.y - node.y) > 1);
      if (!next) return;
      end = [next.x, next.y];
      resumeIndex = route.indexOf(next.id) - 1;
    }
    const segFrom = graph.nodes.find(n => n.id === route[resumeIndex]);
    const segTo = graph.nodes.find(n => n.id === route[resumeIndex + 1]);
    if (segFrom && segTo) {
      resumeSegment = [[segFrom.x, segFrom.y], [segTo.x, segTo.y]];
      resumeEdgeId = graph.edges.find(e =>
        (e.fromNodeId === segFrom.id && e.toNodeId === segTo.id) ||
        (e.fromNodeId === segTo.id && e.toNodeId === segFrom.id))?.id ?? null;
    }
  }
  // Hướng bay khi approach phải luôn bám theo tim đường băng thật (near -> far),
  // KHÔNG theo hướng touchdown -> exit (điểm rẽ ra đường lăn thường chếch khỏi
  // tim đường băng, dùng hướng đó để bay xa sẽ lệch hẳn ra ngoài đường băng).
  const runwayDir: [number, number] = [far.x - near.x, far.y - near.y];
  const runwayDirLength = Math.hypot(runwayDir[0], runwayDir[1]);
  const runwayUnit: [number, number] = runwayDirLength > 0 ? [runwayDir[0] / runwayDirLength, runwayDir[1] / runwayDirLength] : [0, 0];
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  if (length < 1) return;
  // Hướng mũi máy bay khi arrival: bay qua ngưỡng hạ cánh (near, ví dụ 25R)
  // rồi lăn về phía đầu đối diện (far, ví dụ 07L), tức chiều +runwayUnit
  // (~247° với 25R, khớp getStandParkingHeading).
  const heading = kind === 'arrival' && runwayDirLength > 0
    ? Math.atan2(runwayUnit[0], -runwayUnit[1]) * 180 / Math.PI
    : Math.atan2(end[0] - start[0], start[1] - end[1]) * 180 / Math.PI;
  const approachOffset = FLIGHT_ANIMATION.approachDistanceSvg + FLIGHT_ANIMATION.flareDistanceSvg;
  const x = kind === 'arrival' && runwayDirLength > 0 ? start[0] - runwayUnit[0] * approachOffset : node.x;
  const y = kind === 'arrival' && runwayDirLength > 0 ? start[1] - runwayUnit[1] * approachOffset : node.y;
  return {
    kind, phase: kind === 'arrival' ? 'approach' : 'lineup', elapsed: 0, x, y, altitudeWorld: kind === 'arrival' ? 8.5 : 0, pitch: kind === 'arrival' ? 0.035 : 0, heading, start, end, entry: [x, y], resumeIndex,
    runwayAxis: kind === 'arrival' && runwayDirLength > 0 ? runwayUnit : undefined,
    resumeSegment, resumeEdgeId,
    corridor: closest.edge.id.includes('line_01') || closest.a.id.includes('line_01') ? 'NORTH' : 'SOUTH'
  };
}

export function advanceFlight(aircraft: Aircraft, dt: number): Aircraft {
  if (!aircraft.flight) return aircraft;
  const f = { ...aircraft.flight, elapsed: aircraft.flight.elapsed + Math.max(0, dt) };
  const c = FLIGHT_ANIMATION;
  let t = f.elapsed;
  const length = Math.hypot(f.end[0] - f.start[0], f.end[1] - f.start[1]);
  let along = 0;
  let speed = 0;
  if (f.kind === 'arrival') {
    if (t < c.approachSeconds) {
      const p = t / c.approachSeconds;
      f.phase = 'approach';
      along = -c.approachDistanceSvg * (1 - p) - c.flareDistanceSvg;
      f.altitudeWorld = lerp(8.5, 0.4, p);
      f.pitch = 0.035;
      speed = lerp(150, 135, p);
    } else if ((t -= c.approachSeconds) < c.flareSeconds) {
      const p = t / c.flareSeconds;
      f.phase = 'flare';
      along = -c.flareDistanceSvg * (1 - p);
      f.altitudeWorld = 0.4 * (1 - smooth(p));
      f.pitch = 0.035 + 0.065 * Math.sin(p * Math.PI);
      speed = lerp(135, 120, p);
    } else {
      t -= c.flareSeconds;
      const p = Math.min(1, t / c.rolloutSeconds);
      f.phase = 'rollout';
      f.altitudeWorld = 0;
      f.pitch = 0.035 * (1 - smooth(p));
      // Xả đà với tốc độ trên màn hình giữ đúng bằng lúc tiếp đất (flare), rồi
      // bàn giao cho bộ lăn ở đúng tốc độ tương ứng. Không ép máy bay chạy hết
      // quãng tới đường lăn thoát trong thời gian rollout cố định (gây vọt tốc
      // rồi phanh gấp gần W4); phần còn lại do bộ lăn chạy theo đèn FTG.
      const rolloutSvgPerSec = c.flareDistanceSvg / c.flareSeconds;
      speed = lerp(120, rolloutHandoffKts(), smooth(p));
      along = Math.min(length * 0.95, rolloutSvgPerSec * t);
      f.x = f.start[0] + (f.end[0] - f.start[0]) / length * along;
      f.y = f.start[1] + (f.end[1] - f.start[1]) / length * along;
      // Đã chạm bánh: gắn máy bay vào đúng đoạn route đang lăn để đèn FTG bật
      // ngay phía trước mũi, và khi hết rollout thì chuyển sang lăn tại chính
      // vị trí hiện tại (không giật lùi về đoạn gần ngưỡng).
      const onRoute = {
        routeEdgeIndex: f.resumeIndex,
        currentNodeId: aircraft.assignedRoute[f.resumeIndex],
        currentEdgeId: f.resumeEdgeId ?? aircraft.currentEdgeId,
        progressOnEdge: progressOnSegment(f, 0.85),
        guidanceVisible: true,
      };
      if (p === 1) return { ...aircraft, ...onRoute, flight: undefined, status: 'taxiing', speedKts: rolloutHandoffKts() };
      return { ...aircraft, ...onRoute, flight: f, status: 'taxiing', speedKts: speed };
    }
    // Pha approach/flare (chưa chạm bánh): bay dọc theo tim đường băng thật
    // (runwayAxis), không theo trục touchdown -> exit — tránh lệch ra ngoài
    // đường băng khi điểm touchdown không trùng ngưỡng.
    if (f.phase === 'approach' || f.phase === 'flare') {
      const axis = f.runwayAxis ?? [(f.end[0] - f.start[0]) / length, (f.end[1] - f.start[1]) / length];
      f.x = f.start[0] + axis[0] * along;
      f.y = f.start[1] + axis[1] * along;
      return { ...aircraft, flight: f, status: 'taxiing', speedKts: speed, guidanceVisible: false };
    }
  } else {
    if (t < c.lineupSeconds) {
      const p = smooth(t / c.lineupSeconds);
      f.phase = 'lineup';
      f.x = lerp(f.entry[0], f.start[0], p);
      f.y = lerp(f.entry[1], f.start[1], p);
      return { ...aircraft, flight: f, status: 'taxiing', speedKts: 15, guidanceVisible: false };
    }
    t -= c.lineupSeconds;
    // Tốc độ trên màn hình phải liền mạch: chạy đà tăng tốc đều từ 0, sau đó
    // giữ đúng tốc độ rời đất khi nâng mũi và bay lên. Công thức cũ bắt đầu
    // chạy đà đã có vận tốc (giật) và tụt tốc lúc nâng mũi (trông như phanh).
    // Tổng quãng đường (tới 1.35 chiều dài đường băng) và thời gian các pha
    // giữ như cũ.
    const liftoffSvgPerSec = length * 1.35 / (c.rollSeconds / 2 + c.rotateSeconds + c.climbSeconds);
    const rollDistance = liftoffSvgPerSec * c.rollSeconds / 2;
    if (t < c.rollSeconds) {
      const p = t / c.rollSeconds;
      f.phase = 'takeoff-roll';
      along = rollDistance * p * p;
      speed = lerp(35, 145, p);
    } else if ((t -= c.rollSeconds) < c.rotateSeconds) {
      const p = t / c.rotateSeconds;
      f.phase = 'rotate';
      along = rollDistance + liftoffSvgPerSec * t;
      f.altitudeWorld = 0.8 * p * p;
      f.pitch = 0.15 * smooth(p);
      speed = 145;
    } else {
      t -= c.rotateSeconds;
      const p = Math.min(1, t / c.climbSeconds);
      f.phase = 'climb';
      along = rollDistance + liftoffSvgPerSec * (c.rotateSeconds + Math.min(t, c.climbSeconds));
      f.altitudeWorld = lerp(0.8, c.cruiseHeightWorld, p);
      f.pitch = 0.15;
      speed = 165;
      if (p === 1) return { ...aircraft, flight: undefined, status: 'departed', hidden: true, speedKts: 0, guidanceVisible: false };
    }
  }
  f.x = f.start[0] + (f.end[0] - f.start[0]) / length * along;
  f.y = f.start[1] + (f.end[1] - f.start[1]) / length * along;
  return { ...aircraft, flight: f, status: 'taxiing', speedKts: speed, guidanceVisible: false };
}
