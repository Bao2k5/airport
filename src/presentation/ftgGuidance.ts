import type { Aircraft, AirportGraph } from '../types';

// Existing 2D educational settings, in SVG units (not certified distances).
// Both renderers consume these values; changing them changes both views.
export const FTG_GUIDANCE_CONFIG = Object.freeze({ dotStepSvg: 14, lookAheadSvg: 142, maxEdges: 5, behindToleranceSvg: 2 });

interface GuidanceDot {
  x: number;
  y: number;
  isPreview?: boolean;
}

export function computeSegmentedGuidanceDots(
  aircraft: Aircraft,
  graph: AirportGraph,
  blockedEdgeIds: Set<string> = new Set(),
): { activeDots: GuidanceDot[]; previewDots: GuidanceDot[] } | null {
  if (!aircraft.assignedRoute || aircraft.assignedRoute.length < 2) return null;
  if (aircraft.routeEdgeIndex >= aircraft.assignedRoute.length - 1) return null;

  const currentIdx = Math.max(0, Math.min(aircraft.assignedRoute.length - 2, aircraft.routeEdgeIndex ?? 0));
  const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[currentIdx]);
  const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[currentIdx + 1]);
  if (!fromNode || !toNode) return null;

  // Check if current edge is blocked
  const currentEdge = graph.edges.find(
    e => (e.fromNodeId === fromNode.id && e.toNodeId === toNode.id) ||
         (e.bidirectional && e.fromNodeId === toNode.id && e.toNodeId === fromNode.id)
  );
  if (currentEdge && blockedEdgeIds.has(currentEdge.id)) {
    return null;
  }

  const { dotStepSvg: DOT_STEP_PX, lookAheadSvg: MAX_LOOKAHEAD_PX, maxEdges: MAX_BLOCK_EDGES } = FTG_GUIDANCE_CONFIG;

  const activeDots: GuidanceDot[] = [];
  const prog = Math.max(0, Math.min(1, aircraft.progressOnEdge ?? 0));

  // 1. Phân đoạn hiện tại (Current Edge)
  const curDx = toNode.x - fromNode.x;
  const curDy = toNode.y - fromNode.y;
  const curLen = Math.hypot(curDx, curDy);
  const curNumLights = Math.max(1, Math.round(curLen / DOT_STEP_PX));

  for (let k = 0; k < (curLen < 1 ? 0 : curNumLights); k++) {
    const t = (k + 0.5) / curNumLights;
    const distFromNose = curLen * (t - prog);
    // Chỉ sáng các đèn ngay phía trước mũi tàu trong phạm vi MAX_LOOKAHEAD_PX (4-5 đèn)
    if (distFromNose >= -FTG_GUIDANCE_CONFIG.behindToleranceSvg && distFromNose <= MAX_LOOKAHEAD_PX) {
      activeDots.push({
        x: fromNode.x + curDx * t,
        y: fromNode.y + curDy * t,
        isPreview: false,
      });
    }
  }

  // 2. Các phân đoạn tiếp theo nếu đoạn hiện tại ngắn hơn phạm vi MAX_LOOKAHEAD_PX
  let accumulatedDist = Math.max(0, curLen * (1 - prog));

  for (let step = 1; step <= MAX_BLOCK_EDGES && accumulatedDist < MAX_LOOKAHEAD_PX; step++) {
    const nextIdx = currentIdx + step;
    if (nextIdx >= aircraft.assignedRoute.length - 1) break;

    const sNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[nextIdx]);
    const eNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[nextIdx + 1]);
    if (!sNode || !eNode) break;

    const segEdge = graph.edges.find(
      e => (e.fromNodeId === sNode.id && e.toNodeId === eNode.id) ||
           (e.bidirectional && e.fromNodeId === eNode.id && e.toNodeId === sNode.id)
    );

    // Dừng phân đoạn nếu phía trước có Stop Bar hoặc cạnh bị đóng
    if (segEdge && blockedEdgeIds.has(segEdge.id)) {
      break;
    }

    const sdx = eNode.x - sNode.x;
    const sdy = eNode.y - sNode.y;
    const slen = Math.hypot(sdx, sdy);
    if (slen < 1) continue;

    const segNumLights = Math.max(1, Math.round(slen / DOT_STEP_PX));
    for (let k = 0; k < segNumLights; k++) {
      const t = (k + 0.5) / segNumLights;
      const totalDist = accumulatedDist + slen * t;
      if (totalDist <= MAX_LOOKAHEAD_PX) {
        activeDots.push({
          x: sNode.x + sdx * t,
          y: sNode.y + sdy * t,
          isPreview: false,
        });
      }
    }

    accumulatedDist += slen;
  }

  // Khi tàu dừng chờ (Stop Bar / Holding): chỉ hiển thị đèn đỏ cảnh báo ngay trước mũi tàu
  // (Kịch bản 2 - VJ302: 4 đèn; Kịch bản 5 - INB01 và các trường hợp khác: 3 đèn),
  // tránh dải đèn kéo dài tràn lên phía trên hoặc tràn xuống dưới nút giao.
  const isHolding = aircraft.status === 'holding' || aircraft.holdReason === 'stop-bar';
  const holdingLimit = (aircraft.callsign === 'VJ302' || aircraft.callsign === 'HVN302') ? 4 : 3;
  const resultDots = isHolding ? activeDots.slice(0, holdingLimit) : activeDots;

  return { activeDots: resultDots, previewDots: [] };
}

