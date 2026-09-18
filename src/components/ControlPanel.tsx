// Bảng điều khiển mô phỏng — Chuẩn nhận diện Học viện Hàng không Việt Nam (VAA).

import React from 'react';
import { airportGraphV3 } from '../data/airportGraph.v3';
import { AIRLINES, type AirlineCode } from '../data/airlineTypes';
import { useActionLock } from '../utils/useActionLock';
import {
  V3_EXACT_OPERATIONAL_NODES,
  V3_OPERATIONAL_STANDS,
  toSafeNodeId,
  isStandNode,
  isTakeoffRunwayNode,
  isLanding25RNode,
} from '../data/v3OperationalNodes';
import type { AirportGraph, Aircraft, SimulationConfig } from '../types';

interface Props {
  config: SimulationConfig;
  graph?: AirportGraph;
  manualFleet?: Aircraft[];
  selectedAircraftId?: string;
  onSelectAircraft?: (id: string) => void;
  onConfigChange: (patch: Partial<SimulationConfig>) => void;
  onAcceptRoute: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  routeStatus: 'pending' | 'accepted';
  isRunning: boolean;
  isPaused: boolean;
  canStart: boolean;
  blockedCount: number;
  autoIncidents: boolean;
  onToggleAutoIncidents: () => void;
  onTriggerIncident: () => void;
  onClearIncidents: () => void;
}

export default function ControlPanel({
  config,
  graph = airportGraphV3,
  manualFleet = [],
  selectedAircraftId = 'VN001',
  onSelectAircraft,
  onConfigChange,
  onAcceptRoute,
  onStart,
  onPause,
  onReset,
  routeStatus,
  isRunning,
  isPaused,
  canStart,
  blockedCount,
  autoIncidents,
  onToggleAutoIncidents,
  onTriggerIncident,
  onClearIncidents,
}: Props) {
  const { executeAction, getActionState } = useActionLock(2000);

  const selectedAircraft = manualFleet.find(a => a.id === selectedAircraftId);
  const currentAirlineCode = (selectedAircraft?.airlineCode || config.airlineCode || 'VN') as AirlineCode;
  const currentAirline = AIRLINES[currentAirlineCode] || AIRLINES.VN;
  const currentCallsign = selectedAircraft?.callsign ?? config.callsign;
  const currentAircraftType = selectedAircraft?.aircraftType ?? config.aircraftType;
  const currentStartNodeId = (selectedAircraft?.status === 'parked' ? selectedAircraft?.currentNodeId : selectedAircraft?.assignedRoute?.[0]) ?? config.startNodeId;
  const currentDestNodeId = selectedAircraft?.targetNodeId ?? config.destinationNodeId;

  const operationalDropdownOptions = React.useMemo(() => {
    // Strictly format the exact 44 Operational Nodes in user-specified order
    return V3_EXACT_OPERATIONAL_NODES.map((opDef) => {
      // Find matching node ID in current graph
      const matchedNode = graph.nodes.find(
        n => n.label === opDef.label || n.id === opDef.id || toSafeNodeId(n.id) === opDef.id
      );

      let nodeId = matchedNode ? matchedNode.id : opDef.id;
      // Đồng bộ nếu là STOP_BAR_25L và điểm đến hiện tại là v3_line_05_p07 hoặc v3_line_17_p16
      if (opDef.id === 'STOP_BAR_25L' && (currentDestNodeId === 'v3_line_05_p07' || currentDestNodeId === 'v3_line_17_p16')) {
        nodeId = currentDestNodeId;
      }

      let label = opDef.label;
      if (opDef.id === 'STOP_BAR_25R') {
        label = 'STOP BAR 25R (Nơi máy bay hạ cánh)';
      } else if (opDef.id === 'STOP_BAR_25L') {
        label = 'STOP BAR 25L (Nơi máy bay cất cánh)';
      } else if (opDef.id === 'W11_07R') {
        label = 'W11/07R (Nơi máy bay cất cánh RWY 07R)';
      }

      return {
        value: nodeId,
        label,
      };
    });
  }, [graph, currentDestNodeId]);

  // 1. Điểm xuất phát: Chỉ giữ lại Bến đỗ (Stand) và Điểm hạ cánh duy nhất STOP BAR 25R
  const startOptions = React.useMemo(() => {
    return operationalDropdownOptions.filter(opt => {
      // Bến đỗ (Stand)
      const isStand = opt.value.includes('STAND') ||
        opt.label.includes('STAND') ||
        V3_OPERATIONAL_STANDS.some(s => s.id === opt.value || s.label === opt.label);
      if (isStand) return true;

      // Điểm hạ cánh: Chỉ duy nhất STOP BAR 25R
      const isLandingPoint =
        opt.value === 'STOP_BAR_25R' ||
        opt.value === 'v3_line_01_p03' ||
        opt.label.startsWith('STOP BAR 25R');
      if (isLandingPoint) return true;

      return false;
    });
  }, [operationalDropdownOptions]);

  // Tự động hồi phục về STAND_10 nếu điểm xuất phát hiện tại không nằm trong danh sách hợp lệ
  // CHỈ kiểm tra khi máy bay đang ở trạng thái 'parked' (chưa bấm cho lăn)
  React.useEffect(() => {
    if (selectedAircraft && selectedAircraft.status !== 'parked') return;
    if (startOptions.length > 0) {
      const isValidStart = startOptions.some(o => o.value === currentStartNodeId);
      if (!isValidStart) {
        const stand10 = startOptions.find(o => o.label.includes('STAND_10')) || startOptions[0];
        if (stand10) {
          onConfigChange({ startNodeId: stand10.value });
        }
      }
    }
  }, [currentStartNodeId, startOptions, onConfigChange, selectedAircraft?.status]);

  const isCurrentStartStand = React.useMemo(() => {
    return isStandNode(currentStartNodeId, graph.nodes);
  }, [currentStartNodeId, graph.nodes]);

  // Kiểm tra xem điểm xuất phát có phải là STOP BAR 25R (hạ cánh) không
  const isCurrentStartLanding25R = React.useMemo(() => {
    return isLanding25RNode(currentStartNodeId, graph.nodes);
  }, [currentStartNodeId, graph.nodes]);

  // Nếu tàu bay đang ở Stand (cất cánh) mà điểm đến không phải là đường băng cất cánh (25L hoặc 07R), tự động chuyển về STOP BAR 25L
  // CHỈ áp dụng khi máy bay đang 'parked' VÀ điểm xuất phát KHÔNG PHẢI là STOP BAR 25R (hạ cánh)
  React.useEffect(() => {
    if (selectedAircraft && selectedAircraft.status !== 'parked') return;
    // Nếu điểm xuất phát là STOP BAR 25R → máy bay hạ cánh → KHÔNG clamp đích về 25L
    if (isCurrentStartLanding25R) return;
    if (isCurrentStartStand) {
      const isAuthorizedTakeoff = isTakeoffRunwayNode(currentDestNodeId, graph.nodes);
      if (!isAuthorizedTakeoff) {
        const stopBar25L = graph.nodes.find(n => n.label === 'STOP BAR 25L' || n.id === 'v3_line_17_p16' || n.id === 'v3_line_05_p07');
        const defaultDestId = stopBar25L ? stopBar25L.id : 'v3_line_05_p07';
        onConfigChange({ destinationNodeId: defaultDestId });
      }
    }
  }, [isCurrentStartStand, isCurrentStartLanding25R, currentDestNodeId, graph.nodes, onConfigChange, selectedAircraft?.status]);

  // 2. Điểm đến:
  // - Nếu xuất phát từ Stand: Chỉ hiển thị STOP BAR 25L (mặc định qua E6) và W11/07R (dự phòng đổi chiều).
  // - Nếu xuất phát từ đường băng (hạ cánh): Chỉ hiển thị danh sách các Stand (khóa bến đã có tàu chiếm dụng).
  const destOptions = React.useMemo(() => {
    if (isCurrentStartStand) {
      const allowedTakeoff = operationalDropdownOptions.filter(opt => {
        const isDest25L = opt.value === 'STOP_BAR_25L' ||
          opt.value === 'v3_line_17_p16' ||
          opt.value === 'v3_line_05_p07' ||
          opt.label.includes('STOP BAR 25L');

        const isDest07R = opt.value === 'W11_07R' ||
          opt.value === 'v3_line_16_p01' ||
          opt.label.includes('W11/07R');

        return isDest25L || isDest07R;
      });

      return allowedTakeoff.map(opt => {
        return {
          value: opt.value,
          label: opt.label,
          disabled: false,
        };
      });
    }

    // Tàu bay hạ cánh: Hiển thị danh sách các Stand và điểm thoát ly W9B/W7A
    const standOptionsOnly = operationalDropdownOptions.filter(opt => {
      const isW9BW7A = opt.value === 'W9B_W7A' || opt.value === 'v3_line_18_p03' || opt.label.includes('W9B/W7A');
      const isStand = opt.value.includes('STAND') ||
        opt.label.includes('STAND') ||
        V3_OPERATIONAL_STANDS.some(s => s.id === opt.value || s.label === opt.label);
      return isStand || isW9BW7A;
    });

    // Tập hợp tất cả node ID của Stand từ graph để resolve nhất quán
    const resolveStandNodeId = (idOrLabel: string): string => {
      const n = graph.nodes.find(node => node.id === idOrLabel || node.label === idOrLabel);
      return n ? n.id : idOrLabel;
    };

    return standOptionsOnly.map(opt => {
      // Resolve opt.value về node ID chuẩn trong graph
      const optNodeId = resolveStandNodeId(opt.value);

      const occupyingAircraft = manualFleet.find(ac => {
        if (ac.id === selectedAircraftId) return false;

        // Resolve node ID của aircraft về chuẩn graph
        const acCurrentId = resolveStandNodeId(ac.currentNodeId);
        const acTargetId = resolveStandNodeId(ac.targetNodeId);

        // Tàu đang đứng ở stand này
        const isPhysicallyHere = acCurrentId === optNodeId;

        // Tàu đang được giao về stand này và chưa di chuyển đi (parked/arrived/waiting)
        const isAssignedHere = acTargetId === optNodeId &&
          (ac.status === 'parked' || ac.status === 'arrived' || ac.status === 'waiting');

        // Tàu đang taxiing và điểm cuối route là stand này (sắp chiếm)
        const isTaxiingHere = ac.status === 'taxiing' && acTargetId === optNodeId;

        return isPhysicallyHere || isAssignedHere || isTaxiingHere;
      });

      if (occupyingAircraft) {
        return {
          value: opt.value,
          label: `${opt.label} — 🚫 (Đã có ${occupyingAircraft.callsign} đỗ - Không thể chọn)`,
          disabled: true,
        };
      }

      return {
        value: opt.value,
        label: opt.label,
        disabled: false,
      };
    });
  }, [operationalDropdownOptions, isCurrentStartStand, manualFleet, selectedAircraftId, graph.nodes]);


  return (
    <div className="flex flex-col gap-3.5 p-3.5 sm:p-4 bg-white rounded-xl border border-[#E6ECF0] text-sm text-[#172033] shadow-sm">
      {/* Cấu hình tàu bay */}
      <Section title={`Cấu hình tàu bay: ${currentCallsign}`}>
        {/* ── Danh sách chọn tàu bay ── */}
        {manualFleet.length > 0 && (
          <div className="flex flex-col gap-1.5 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
            <div className="px-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0D254C] uppercase tracking-wider">Chọn tàu bay (Đội bay 6 chiếc):</span>
              <span className="text-[11px] font-mono text-[#64748B]">Bấm chọn để điều phối</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {manualFleet.map(ac => {
                const aDef = AIRLINES[ac.airlineCode as AirlineCode] || AIRLINES.VN;
                const isSelected = ac.id === selectedAircraftId;
                const isTaxiing = ac.status === 'taxiing';
                const isHolding = ac.status === 'holding';

                return (
                  <button
                    key={ac.id}
                    type="button"
                    data-testid={`fleet-${ac.id}`}
                    onClick={() => onSelectAircraft?.(ac.id)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition min-h-[62px] cursor-pointer ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-[#1C67DA] text-[#0D254C] shadow-sm ring-2 ring-[#1C67DA]/30'
                        : 'bg-white border-[#E2E8F0] text-[#334155] hover:border-[#94A3B8] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs" style={{ color: isSelected ? '#1C67DA' : aDef.accentColor }}>
                        {ac.callsign}
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-[#E2E8F0] text-[#475569] uppercase font-bold">
                        {ac.airlineCode}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748B] truncate w-full mt-1 font-mono">
                      {ac.currentNodeId} → {ac.targetNodeId}
                    </div>
                    <div className="text-[10px] font-bold mt-1 flex items-center gap-1" style={{ color: isTaxiing ? '#16845B' : (isHolding ? '#D32F2F' : '#64748B') }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isTaxiing ? '#16845B' : (isHolding ? '#D32F2F' : '#94A3B8') }} />
                      {ac.status.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569] font-medium">Số hiệu chuyến bay</label>
          <input
            type="text"
            value={currentCallsign}
            onChange={e => onConfigChange({ callsign: e.target.value.toUpperCase() })}
            maxLength={8}
            className="bg-white border border-[#CBD5E1] text-[#172033] rounded-lg px-3 py-2 min-h-[42px] text-xs sm:text-sm font-mono uppercase focus:outline-none focus:border-[#1C67DA] focus:ring-1 focus:ring-[#1C67DA]"
            placeholder="VN001"
          />
        </div>

        <LabeledSelect
          label="Loại tàu bay"
          value={currentAircraftType}
          onChange={v => onConfigChange({ aircraftType: v as SimulationConfig['aircraftType'] })}
          options={[
            { value: 'A321', label: 'Airbus A321 (Thân hẹp · lăn chuẩn)' },
            { value: 'B737', label: 'Boeing 737 (Thân hẹp · nhanh nhẹn)' },
            { value: 'A350', label: 'Airbus A350 (Thân rộng · lăn chậm, lớn)' },
            { value: 'ATR72', label: 'ATR 72 (Turboprop · nhỏ, chậm)' },
          ]}
        />

        {/* Dropdown Hãng hàng không / Livery */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569] font-medium">Hãng hàng không / Livery</label>
          <select
            value={currentAirlineCode}
            onChange={e => {
              const code = e.target.value as AirlineCode;
              onConfigChange({
                airlineCode: code,
              });
            }}
            className="bg-white border border-[#CBD5E1] text-[#172033] rounded-lg px-3 py-2 min-h-[42px] text-xs sm:text-sm focus:outline-none focus:border-[#1C67DA] focus:ring-1 focus:ring-[#1C67DA] cursor-pointer"
          >
            <option value="VJ">Vietjet Air (VJ)</option>
            <option value="VN">Vietnam Airlines (VN)</option>
            <option value="QH">Bamboo Airways (QH)</option>
            <option value="VU">Vietravel Airlines (VU)</option>
            <option value="SQ">Singapore Airlines (SQ)</option>
            <option value="TG">Thai Airways (TG)</option>
          </select>
        </div>

        {/* Livery Preview Card */}
        <div className="flex items-center gap-3 p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          <div className="w-16 h-10 bg-white rounded flex items-center justify-center p-1 border border-[#E2E8F0] shadow-2xs">
            <img
              src={currentAirline.asset}
              alt={currentAirline.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#172033]">{currentAirline.name}</span>
            <span className="text-[11px] text-[#64748B] font-mono">Mã ICAO/IATA: {currentAirline.code}</span>
          </div>
        </div>
      </Section>

      {/* Tuyến đường */}
      <Section title="Tuyến đường khai thác">
        <LabeledSelect
          label="Điểm xuất phát"
          value={currentStartNodeId}
          onChange={v => onConfigChange({ startNodeId: v })}
          options={startOptions}
        />
        <LabeledSelect
          label="Điểm đến"
          value={currentDestNodeId}
          onChange={v => onConfigChange({ destinationNodeId: v })}
          options={destOptions}
        />
      </Section>

      {/* Môi trường & Khí tượng */}
      <Section title="Điều kiện khí tượng & môi trường">
        <LabeledSelect
          label="Thời tiết"
          value={config.weather}
          onChange={v => onConfigChange({ weather: v as SimulationConfig['weather'] })}
          options={[
            { value: 'clear',        label: 'Quang đãng (VMC)' },
            { value: 'rain',         label: 'Mưa (giảm 30% tốc độ)' },
            { value: 'fog',          label: 'Sương mù / LVC (giảm 55% tốc độ)' },
            { value: 'thunderstorm', label: 'Dông bão (giảm 65% tốc độ)' },
          ]}
        />
        <LabeledSelect
          label="Thời điểm trong ngày"
          value={config.timeOfDay}
          onChange={v => onConfigChange({ timeOfDay: v as SimulationConfig['timeOfDay'] })}
          options={[
            { value: 'morning',   label: 'Buổi sáng' },
            { value: 'afternoon', label: 'Buổi chiều' },
            { value: 'night',     label: 'Ban đêm' },
          ]}
        />
        <LabeledSelect
          label="Mật độ giao thông"
          value={config.trafficLevel}
          onChange={v => onConfigChange({ trafficLevel: v as SimulationConfig['trafficLevel'] })}
          options={[
            { value: 'low',    label: 'Thấp' },
            { value: 'medium', label: 'Trung bình' },
            { value: 'high',   label: 'Cao' },
          ]}
        />
      </Section>

      {/* Tốc độ lăn */}
      <Section title="Tốc độ lăn bánh tiêu chuẩn">
        <div className="flex items-center gap-3">
          <input
            type="range" min={3} max={30} step={1}
            value={config.taxiSpeedKts}
            onChange={e => onConfigChange({ taxiSpeedKts: Number(e.target.value) })}
            className="flex-1 accent-[#1C67DA] min-h-[36px] cursor-pointer"
          />
          <span className="w-16 text-right text-[#1C67DA] font-mono font-bold text-sm">
            {config.taxiSpeedKts} kts
          </span>
        </div>
      </Section>

      {/* Sự cố trên đường lăn */}
      <Section title="Mô phỏng sự cố đường lăn (A-SMGCS)">
        <p className="text-xs text-[#5A6A80] leading-relaxed -mt-0.5">
          Tạo sự cố khi máy bay đang lăn — hệ thống tự động tính toán lại lộ trình vòng qua Dijkstra từ vị trí hiện tại.
        </p>

        <button
          data-testid="incident-btn"
          onClick={() => executeAction('trigger_incident', onTriggerIncident)}
          disabled={!isRunning || blockedCount >= 4 || getActionState('trigger_incident').isPending}
          className="w-full bg-[#D32F2F] hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition min-h-[44px] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <span>{getActionState('trigger_incident').isPending ? '⏳' : '⚠'}</span>
          {getActionState('trigger_incident').isPending
            ? 'Đang xử lý…'
            : blockedCount >= 4
            ? 'Đã đạt giới hạn tối đa (4 sự cố)'
            : getActionState('trigger_incident').canRetry
            ? 'Thử lại: Tạo sự cố'
            : `Tạo sự cố trên tuyến phía trước (${blockedCount}/4)`}
        </button>

        <div className="flex items-center gap-2.5 min-h-[34px]">
          <input
            id="autoincidents"
            type="checkbox"
            checked={autoIncidents}
            onChange={onToggleAutoIncidents}
            className="w-4 h-4 accent-[#1C67DA] cursor-pointer"
          />
          <label htmlFor="autoincidents" className="text-xs sm:text-sm text-[#334155] cursor-pointer select-none">
            Sự cố ngẫu nhiên (mỗi 4 giây khi đang lăn)
          </label>
        </div>

        <div className="flex items-center gap-2.5 min-h-[34px]">
          <input
            id="autoreroute"
            type="checkbox"
            checked={config.autoReroute}
            onChange={e => onConfigChange({ autoReroute: e.target.checked })}
            className="w-4 h-4 accent-[#16845B] cursor-pointer"
          />
          <label htmlFor="autoreroute" className="text-xs sm:text-sm text-[#334155] cursor-pointer select-none">
            Tự động tìm đường vòng (Dijkstra) khi bị chặn
          </label>
        </div>

        <div className="flex items-center justify-between mt-1 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
          <span className="text-xs text-[#5A6A80]">
            Số đoạn bị chặn: <span className="text-[#D32F2F] font-mono font-bold text-sm">{blockedCount}</span>
          </span>
          <button
            onClick={() => executeAction('clear_incidents', onClearIncidents)}
            disabled={blockedCount === 0 || getActionState('clear_incidents').isPending}
            className="text-xs text-[#1C67DA] hover:text-[#0D254C] hover:underline disabled:text-[#94A3B8] disabled:no-underline font-bold py-1 px-2 cursor-pointer"
          >
            {getActionState('clear_incidents').isPending
              ? 'Đang xử lý…'
              : getActionState('clear_incidents').canRetry
              ? 'Thử lại xóa'
              : 'Giải tỏa sự cố'}
          </button>
        </div>
      </Section>

      {/* Nút điều khiển */}
      <div className="flex flex-col gap-2.5 mt-2 border-t border-[#E6ECF0] pt-3">
        {(!selectedAircraft || selectedAircraft.status === 'parked' || selectedAircraft.status === 'waiting') && routeStatus === 'pending' && (
          <button
            data-testid="accept-route-btn"
            onClick={() => executeAction('accept_route', onAcceptRoute)}
            disabled={!canStart || getActionState('accept_route').isPending}
            className="w-full bg-[#0D254C] hover:bg-[#173A73] active:bg-[#091B38] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-bold py-3 rounded-xl transition text-sm min-h-[48px] flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>{getActionState('accept_route').isPending ? '⏳' : '✓'}</span>
            {getActionState('accept_route').isPending
              ? 'Đang xử lý…'
              : getActionState('accept_route').canRetry
              ? 'Thử lại: Chấp nhận tuyến'
              : 'Chấp nhận tuyến đường'}
          </button>
        )}

        {/* Điều khiển hành trình */}
        {(!selectedAircraft || selectedAircraft.status === 'parked' || selectedAircraft.status === 'waiting') && routeStatus === 'accepted' && (
          <button
            data-testid="start-aircraft-btn"
            onClick={() => executeAction('start', onStart)}
            disabled={!canStart || getActionState('start').isPending}
            className="w-full bg-[#16845B] hover:bg-[#116646] active:bg-[#0D4D34] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-bold py-3 rounded-xl transition text-sm min-h-[48px] shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{getActionState('start').isPending ? '⏳' : '▶'}</span>
            {getActionState('start').isPending
              ? 'Đang xử lý…'
              : getActionState('start').canRetry
              ? `Thử lại: Cho lăn bánh ${selectedAircraft?.callsign || selectedAircraftId}`
              : `Cho lăn bánh: ${selectedAircraft?.callsign || selectedAircraftId}`}
          </button>
        )}

        {selectedAircraft?.status === 'taxiing' && (
          <button
            onClick={() => executeAction('pause', onPause)}
            disabled={getActionState('pause').isPending}
            className="w-full bg-[#E8A72B] hover:bg-[#D49520] active:bg-[#B87D14] disabled:bg-[#E2E8F0] text-white font-bold py-3 rounded-xl transition text-sm min-h-[48px] flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>{getActionState('pause').isPending ? '⏳' : (isPaused ? '▶' : '⏸')}</span>
            {getActionState('pause').isPending
              ? 'Đang xử lý…'
              : getActionState('pause').canRetry
              ? 'Thử lại'
              : isPaused
              ? 'Tiếp tục mô phỏng'
              : 'Tạm dừng mô phỏng'}
          </button>
        )}

        {isPaused && (
          <button
            onClick={() => executeAction('pause', onPause)}
            disabled={getActionState('pause').isPending}
            className="w-full bg-[#1C67DA] hover:bg-[#1558BC] active:bg-[#0F4499] disabled:bg-[#E2E8F0] text-white font-bold py-3 rounded-xl transition text-sm min-h-[48px] flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>{getActionState('pause').isPending ? '⏳' : '▶'}</span>
            {getActionState('pause').isPending
              ? 'Đang xử lý…'
              : getActionState('pause').canRetry
              ? 'Thử lại'
              : 'Tiếp tục'}
          </button>
        )}

        <button
          data-testid="reset-aircraft-btn"
          onClick={() => executeAction('reset', onReset)}
          disabled={getActionState('reset').isPending}
          className="w-full bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] text-[#334155] border border-[#CBD5E1] font-bold py-2.5 rounded-xl transition text-sm min-h-[44px] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <span>{getActionState('reset').isPending ? '⏳' : '↺'}</span>
          {getActionState('reset').isPending
            ? 'Đang xử lý…'
            : getActionState('reset').canRetry
            ? 'Thử lại đặt lại'
            : `Đặt lại máy bay: ${selectedAircraft?.callsign || selectedAircraftId}`}
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-wider text-[#0D254C] border-b border-[#E6ECF0] pb-1 font-bold">
        {title}
      </div>
      {children}
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#475569] font-medium">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white border border-[#CBD5E1] text-[#172033] rounded-lg px-3 py-2 min-h-[42px] text-xs sm:text-sm focus:outline-none focus:border-[#1C67DA] focus:ring-1 focus:ring-[#1C67DA] cursor-pointer"
      >
        {options.map(o => (
          <option
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className={o.disabled ? 'text-[#94A3B8] bg-[#F1F5F9] font-medium' : ''}
          >
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
