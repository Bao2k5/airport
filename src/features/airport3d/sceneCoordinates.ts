import type { AirportNode, AirportGraph, Aircraft } from '../../types';
import { worldPoint, isStand } from './surface/geometry';
import { getPositionForAircraft, getStandParkingHeading } from '../../presentation/aircraftPose';
export const toWorld = (node: AirportNode): [number, number, number] => {
  const point = worldPoint(node);
  return [point.x, 0, point.z];
};

// GLB export maps Blender nose +Y to glTF -Z. Compass headings increase
// clockwise in SVG coordinates, whereas Three.js yaw uses the opposite sign.
export const headingToYaw = (heading: number) => -heading * Math.PI / 180;

export function getAircraftWorldPose(aircraft: Aircraft | undefined, graph: AirportGraph) {
  if (!aircraft) return null;
  const pose = getPositionForAircraft(aircraft, graph);
  if (!pose) return null;
  const node = graph.nodes.find(item => item.id === aircraft.currentNodeId);
  const stationary = ['parked', 'idle', 'queued', 'arrived'].includes(aircraft.status);
  const heading = stationary && node && isStand(node) ? getStandParkingHeading(node.id, node) : pose.heading;
  const point = stationary && node && isStand(node) ? worldPoint(node) : { x: (pose.x - 600) * 0.075, z: (pose.y - 430) * 0.075 };
  return { position: [point.x, aircraft.flight?.altitudeWorld ?? 0, point.z] as [number, number, number], yaw: headingToYaw(heading), pitch: aircraft.flight?.pitch ?? 0 };
}

export function getCurrentWorldPosition(aircraft: Aircraft | undefined, graph: AirportGraph): [number, number, number] | null {
  return getAircraftWorldPose(aircraft, graph)?.position ?? null;
}
