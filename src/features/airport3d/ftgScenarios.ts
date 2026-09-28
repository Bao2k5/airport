import type { AirportGraph } from '../../types';
import { getPresetScenarioDefs, setupScenario5FTG } from '../../data/presetScenarios';
import { startScenario } from '../../simulation/scenarioRunner';
import { createFlightMotion } from '../../simulation/flightMotion';

// The existing scenario setups already supply FTG routes. Only the 2D comparison
// views instantiate traditional setups; 3D exposes one FTG run per situation.
export function getFtgScenarioDefs(graph: AirportGraph): ReturnType<typeof getPresetScenarioDefs> {
  const defs = getPresetScenarioDefs(graph);
  return {
    ...defs,
    lvc_wrong_turn_radio_failure: {
      ...defs.lvc_wrong_turn_radio_failure,
      teaser: 'FTG dẫn HVN216 từ STAND 10 qua HS NS, E6 tới điểm chờ 25L.',
      situation: 'HVN216 nhận tuyến STAND 10 → HS NS → E6/E4 → E6 → STOP BAR 25L. Tàu đẩy lùi khỏi stand rồi lăn theo đèn xanh đang được cấp. Quan sát đèn dẫn đường tại nút E6/E4 và điểm dừng cuối tuyến.',
      challenges: ['Nhận tuyến từ STAND 10 và theo dõi pushback.', 'Theo dõi FTG qua HS NS và nhánh E6.', 'Dừng tại STOP BAR 25L.'],
    },
    lvc_peak_runway_direction_change: {
      ...defs.lvc_peak_runway_direction_change,
      teaser: 'FTG điều phối sáu tàu bay khi đổi hướng khai thác sang 07R.',
      situation: 'Chạy luồng Follow-the-Green: INB01 về STAND 17 và nhường đường tại W7A; OUT01/OUT02 rời stand, sau đó nhận tuyến đổi hướng về 07R. Nhóm tàu tiếp theo pushback và lần lượt nhập tuyến theo điều phối của kịch bản.',
      challenges: ['Theo dõi điểm giữ tại W7A.', 'Theo dõi tuyến FTG cập nhật khi đổi hướng 07R.', 'Quan sát thứ tự pushback và nhập tuyến của các tàu tiếp theo.'],
      watchFor: ['Đèn FTG bật theo trạng thái cấp tuyến.', 'Tàu được giữ tại điểm xung đột và tiếp tục sau khi được giải phóng.'],
    },
  };
}

export function startFtgScenario(id: string, graph: AirportGraph) {
  const state = startScenario(id, graph);
  if (id === 'lvc_peak_runway_direction_change') {
    state.scenarioAircraft = setupScenario5FTG(graph).aircraft.map(ac => {
      const isLanding = ac.role === 'arriving';
      const flight = isLanding && ac.assignedRoute && ac.assignedRoute.length >= 2
        ? createFlightMotion(ac, graph, 'arrival')
        : undefined;
      return {
        ...ac,
        releaseAtSeconds: undefined,
        flight,
        speedKts: flight ? 140 : ac.speedKts,
        scenarioLabel: flight ? '🛬 TIẾP CẬN ĐƯỜNG BĂNG 25R' : ac.scenarioLabel,
      };
    });
  }
  const def = getFtgScenarioDefs(graph)[id];
  return {
    ...state,
    renderMode: 'ftg' as const,
    scenario: state.scenario ? { ...state.scenario, situation: def.situation, challenges: def.challenges, watchFor: def.watchFor } : state.scenario,
  };
}
