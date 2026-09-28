import type { Aircraft, AirportGraph, AirportNode } from '../types';
import { airportGraphV3 } from '../data/airportGraph.v3';
import { isLanding25RNode } from '../data/v3OperationalNodes';

export function getStandParkingHeading(nodeId: string, node?: AirportNode | null): number {
  if (!node && !nodeId) return 270;
  const label = (node?.label || '').toUpperCase();
  const id = (nodeId || '').toLowerCase();

  // Điểm hạ cánh STOP BAR 25R: Mũi tàu quay theo hướng hạ cánh đường băng 25R (248° / hướng Tây Nam)
  if (label.includes('25R') || id.includes('line_01_p03')) {
    return 248;
  }

  // Điểm cất cánh STOP BAR 25L: Mũi tàu quay theo hướng cất cánh đường băng 25L (68° / hướng Đông Bắc)
  if (label.includes('25L') || id.includes('line_17_p16') || id.includes('line_05_p07')) {
    return 68;
  }

  // Stands 10, 11, 12, 13 (Phía Tây của Line 12): Mũi quay thẳng qua trái vào bến (270° / West)
  if (label === 'STAND_10' || label === 'STAND_11' || label === 'STAND_12' || label === 'STAND_13' ||
      id.includes('line_33_p00') || id.includes('line_32_p00') || id.includes('line_31_p00') || id.includes('line_30_p00')) {
    return 270;
  }

  // Stands 7, 8, 9 (Phía Đông của Line 12): Mũi quay thẳng qua phải vào bến (90° / East)
  if (label === 'STAND_7' || label === 'STAND_8' || label === 'STAND_9' ||
      id.includes('line_27_p01') || id.includes('line_28_p01') || id.includes('line_29_p01') || id === 't49') {
    return 90;
  }

  // Stands 1, 2, 3, 4, 5 (Phía Nam bến đỗ - Stand 3: v3_line_34_p02): Mũi quay thẳng xuống phía Nam (180°)
  if (label === 'STAND_1' || label === 'STAND_2' || label === 'STAND_3' || label === 'STAND_4' || label === 'STAND_5' ||
      id.includes('line_37_p00') || id.includes('line_38_p00') || id.includes('line_35_p00') || id.includes('line_36_p00') ||
      id.includes('line_34_p02') || ['p1', 'p2', 'p3', 'p4', 'p5'].includes(id)) {
    return 180;
  }

  // Stands 16, 17, 18, 20, 21, 22 (Apron Đông/Quốc tế): Mũi quay thẳng theo đúng trục bến đỗ (~165° - 168°)
  if (label === 'STAND_22' || id.includes('line_26')) return 168;
  if (label === 'STAND_21' || id.includes('line_25')) return 161;
  if (label === 'STAND_20' || id.includes('line_24')) return 166;
  if (label === 'STAND_18' || id.includes('line_23')) return 163;
  if (label === 'STAND_17' || id.includes('line_22')) return 165;
  if (label === 'STAND_16' || id.includes('line_21')) return 166;
  if (label.includes('STAND_') || id.includes('line_2')) {
    return 165;
  }

  // Điểm dừng / xuất phát trên đường băng (Stop Bar 25R, 25L, 07R)
  if (id === 'v3_line_01_p03' || id === 'STOP_BAR_25R' || label.includes('25R')) {
    return 247.5;
  }
  if (id === 'v3_line_05_p07' || id === 'v3_line_17_p16' || id === 'STOP_BAR_25L' || label.includes('25L')) {
    return 247.5;
  }
  if (id === 'v3_line_16_p01' || id === 'v3_line_16_p00' || id === 'W11_07R' || label.includes('07R')) {
    return 67.5;
  }

  return 270;
}

// ── Interpolate aircraft position along its route ──────────────────────────────
export function getPositionForAircraft(aircraft: Aircraft | null, graph: AirportGraph = airportGraphV3) {
  if (!aircraft) return null;
  if (aircraft.flight) return { x: aircraft.flight.x, y: aircraft.flight.y, heading: aircraft.flight.heading };

  if (aircraft.assignedRoute && aircraft.assignedRoute.length >= 2) {
    const maxIdx = aircraft.assignedRoute.length - 2;
    const curIdx = Math.max(0, Math.min(maxIdx, aircraft.routeEdgeIndex ?? 0));
    const fromNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[curIdx]);
    const toNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[curIdx + 1]);

    if (fromNode && toNode) {
      const isArrivedAtFinal = aircraft.status === 'arrived' || (aircraft.routeEdgeIndex >= maxIdx && aircraft.progressOnEdge >= 0.999);
      const t = isArrivedAtFinal ? 1 : Math.max(0, Math.min(1, aircraft.progressOnEdge ?? 0));
      let x = fromNode.x + (toNode.x - fromNode.x) * t;
      let y = fromNode.y + (toNode.y - fromNode.y) * t;

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const forwardHeading = (Math.atan2(dx, -dy) * 180) / Math.PI;

      // Xử lý đẩy lùi (Pushback) rời bến đỗ:
      let heading = forwardHeading;

      const isActualStand = fromNode.type === 'stand' ||
                            (fromNode.label || '').toUpperCase().includes('STAND') ||
                            fromNode.id.includes('line_33_p00') || fromNode.id.includes('line_32_p00') ||
                            fromNode.id.includes('line_31_p00') || fromNode.id.includes('line_30_p00') ||
                            fromNode.id.includes('line_34_p02') || fromNode.id.includes('line_35_p00') ||
                            fromNode.id.includes('line_36_p00') || fromNode.id.includes('line_37_p00') ||
                            fromNode.id.includes('line_38_p00') || fromNode.id.includes('line_27_p01') ||
                            fromNode.id.includes('line_28_p01') || fromNode.id.includes('line_29_p01') ||
                            fromNode.id.includes('line_26_p04') || fromNode.id.includes('line_22_p01');

      // Xử lý đẩy lùi (Pushback) rời bến đỗ:
      // CHỈ áp dụng khi máy bay THỰC SỰ XUẤT PHÁT từ bến đỗ (cất cánh).
      // TUYỆT ĐỐI KHÔNG áp dụng cho máy bay đang hạ cánh từ STOP BAR 25R lăn về bến!
      const firstRouteNode = aircraft.assignedRoute[0] || '';
      const isLanding25R = isLanding25RNode(firstRouteNode, graph.nodes);

      const fromLabel = (fromNode.label || '').toUpperCase().trim();
      const isSouthStand = fromNode.id.includes('line_37') || fromNode.id.includes('line_38') ||
                           fromNode.id.includes('line_35') || fromNode.id.includes('line_36') ||
                           fromLabel === 'STAND_1' || fromLabel === 'STAND_2' ||
                           fromLabel === 'STAND_4' || fromLabel === 'STAND_5';

      const isDepartingFromSouthStand = !isLanding25R && (
        firstRouteNode.includes('line_37_p00') ||
        firstRouteNode.includes('line_38_p00') ||
        firstRouteNode.includes('line_35_p00') ||
        firstRouteNode.includes('line_36_p00') ||
        (curIdx === 0 && isSouthStand)
      );

      const isDepartingFromStand3 = !isLanding25R && (
        aircraft.callsign === 'PUSH02' ||
        firstRouteNode.includes('line_34_p02') ||
        (fromLabel === 'STAND_3' && curIdx === 0)
      );

      if (isDepartingFromStand3) {
        if (curIdx === 0) {
          heading = 180;
        } else if (curIdx >= 1 && curIdx <= 3) {
          heading = 90;
        } else if (curIdx === 4) {
          heading = 180;
        } else if (curIdx === 5) {
          heading = (90 - 90 * t + 360) % 360;
        } else {
          heading = forwardHeading;
        }
      } else if (isDepartingFromSouthStand) {
        // Tìm vị trí node hòa vào ngã ba tim trục chính Line 12 (v3_line_34_p00)
        const junctionIdx = aircraft.assignedRoute.findIndex(nId => nId.includes('line_34_p00'));

        if (junctionIdx !== -1 && curIdx <= junctionIdx) {
          if (curIdx === 0) {
            // Nhịp 1: Lùi thẳng đuôi ra khỏi bến Stand (mũi giữ 180°), cuối đoạn quẹo trái lần 1 bằng đuôi (180° -> 90°)
            if (t < 0.6) {
              heading = 180;
            } else {
              const pivot = (t - 0.6) / 0.4;
              heading = 180 - 90 * pivot; // Xoay mượt từ 180° sang 90° (hướng Đông)
            }
          } else if (curIdx === junctionIdx - 1) {
            // Nhịp 2: Tiếp tục lùi đuôi sang Tây trên đường nhánh (mũi 90°), khi tới gần ngã ba quẹo trái lần 2 (90° -> 0°)
            if (t < 0.65) {
              heading = 90;
            } else {
              const pivot = (t - 0.65) / 0.35;
              heading = 90 - 90 * pivot; // Xoay mượt từ 90° về 0° thẳng đứng lên phía Bắc
            }
          } else if (curIdx < junctionIdx - 1) {
            // Đoạn trung gian trên đường lăn nhánh (ví dụ line_37_p01 -> line_35_p01):
            // Đuôi hướng Tây, mũi hướng Đông (90°), tiếp tục lùi đuôi
            heading = 90;
          } else if (curIdx === junctionIdx) {
            // Nhịp 3 — LÙI NHẸ để quay đầu rồi chạy tiến:
            // Tàu lùi nhẹ (~15% đoạn edge) từ ngã ba line_34_p00 vào tim Line 12 phía Nam,
            // mũi giữ thẳng 0° (Bắc) trong suốt thao tác, đuôi chúi xuống Nam.
            // Từ t >= 0.15: tàu bắt đầu chạy TIẾN lên phía Bắc bình thường.
            const backupFrac = 0.15; // Chỉ lùi 15% của toàn edge để nhẹ nhàng
            const backupDx = fromNode.x - toNode.x; // Hướng lùi (ngược hướng tiến)
            const backupDy = fromNode.y - toNode.y;
            if (t < backupFrac) {
              // Lùi nhẹ: di chuyển ngược chiều edge, mũi giữ 0°
              const p = t / backupFrac;
              x = fromNode.x + backupDx * p * backupFrac;
              y = fromNode.y + backupDy * p * backupFrac;
              heading = 0;
            } else {
              // Tiến thẳng lên Bắc từ vị trí đã lùi nhẹ
              const backX = fromNode.x + backupDx * backupFrac;
              const backY = fromNode.y + backupDy * backupFrac;
              const p = (t - backupFrac) / (1 - backupFrac);
              x = backX + (toNode.x - backX) * p;
              y = backY + (toNode.y - backY) * p;
              heading = forwardHeading;
            }
          }
        } else {
          // Đã hoàn thành 3 bước lùi: tàu chạy tiến thẳng theo tim Line 12 lên phía Bắc
          heading = forwardHeading;
        }
      } else if (curIdx === 0 && !isLanding25R && (aircraft.role === 'pushback' || isActualStand)) {
        // Đối với các Stand khác (Stand 7, 8, 9, 10, 11, 12, 13, 17, 22...):
        // Lùi đuôi ra tim đường: mũi quay ngược lại (parkHeading), lùi đuôi ra, rồi xoay sang hướng lăn
        const parkHeading = getStandParkingHeading(fromNode.id, fromNode);
        let targetHeading = forwardHeading;
        if (aircraft.assignedRoute.length > 2) {
          const nextNode = graph.nodes.find(n => n.id === aircraft.assignedRoute[2]);
          if (nextNode) {
            targetHeading = (Math.atan2(nextNode.x - toNode.x, -(nextNode.y - toNode.y)) * 180) / Math.PI;
          }
        }
        
        if (t < 0.6) {
          heading = parkHeading;
        } else {
          const pivotProgress = (t - 0.6) / 0.4;
          let delta = targetHeading - parkHeading;
          while (delta > 180) delta -= 360;
          while (delta < -180) delta += 360;
          heading = (parkHeading + delta * pivotProgress + 360) % 360;
        }
      }

      return { x, y, heading };
    }
  }

  // Fallback to currentNodeId (e.g. idle/waiting at stand or single-node rescue vehicle)
  const node = graph.nodes.find(n => n.id === aircraft.currentNodeId);
  if (node) {
    const defaultHeading = (aircraft.aircraftAsset?.includes('xecuuhoa') || aircraft.callsign === 'RESCUE01')
      ? 0
      : getStandParkingHeading(node.id, node);
    return { x: node.x, y: node.y, heading: defaultHeading };
  }

  return null;
}

