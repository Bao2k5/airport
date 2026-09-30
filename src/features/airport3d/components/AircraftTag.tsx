import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Aircraft } from '../../../types';

// Thẻ nhãn kiểu màn hình giám sát A-SMGCS: cỡ chữ cố định trên màn hình
// (không co theo khoảng cách như distanceFactor), chỉ co giãn nhẹ theo zoom
// trong giới hạn MIN/MAX để luôn đọc được.
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.1;

const PHASE_TEXT: Record<string, string> = {
    approach: 'TIẾP CẬN',
    flare: 'TIẾP ĐẤT',
    rollout: 'XẢ ĐÀ',
    lineup: 'VÀO ĐB',
    'takeoff-roll': 'CHẠY ĐÀ',
    rotate: 'RỜI ĐẤT',
    climb: 'LẤY ĐỘ CAO',
};

const STATUS_TEXT: Record<Aircraft['status'], string> = {
    parked: 'ĐỖ',
    idle: 'CHỜ',
    waiting: 'CHỜ',
    taxiing: 'LĂN',
    holding: 'GIỮ',
    stopped: 'DỪNG',
    arrived: 'ĐÃ ĐẾN',
    departed: 'CẤT CÁNH',
    queued: 'XẾP HÀNG',
};

export default function AircraftTag({ aircraft, worldPosition, accentColor, selected, emergency, onSelect }: {
    aircraft: Aircraft;
    worldPosition: [number, number, number];
    accentColor: string;
    selected: boolean;
    emergency: boolean;
    onSelect?: (aircraftId: string) => void;
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const target = useRef(new Vector3());
    const lastScale = useRef(0);

    useFrame(({ camera }) => {
        const el = wrapperRef.current;
        if (!el) return;
        target.current.set(worldPosition[0], worldPosition[1], worldPosition[2]);
        const distance = camera.position.distanceTo(target.current);
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, 1.25 - distance / 200));
        if (Math.abs(scale - lastScale.current) < 0.01) return;
        lastScale.current = scale;
        el.style.transform = `translate(-50%, -100%) scale(${scale.toFixed(3)})`;
    });

    const phase = aircraft.flight?.phase;
    const statusText = phase ? PHASE_TEXT[phase] ?? phase : STATUS_TEXT[aircraft.status] ?? aircraft.status;
    const speed = Math.max(0, Math.round(aircraft.speedKts ?? 0));
    const holding = aircraft.status === 'holding';
    const borderColor = emergency ? '#ef4444' : selected ? '#fbbf24' : accentColor;
    const label = `${aircraft.callsign}, ${aircraft.aircraftType ?? ''}, ${statusText}, ${speed} knots${emergency ? ', khẩn nguy' : ''}`;

    return (
        <Html position={[0, 1.4, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div
                ref={wrapperRef}
                style={{ transform: `translate(-50%, -100%) scale(1)`, transformOrigin: '50% 100%' }}
                className="flex select-none flex-col items-center"
            >
                <div
                    role={onSelect ? 'button' : undefined}
                    tabIndex={onSelect ? 0 : undefined}
                    aria-label={label}
                    aria-pressed={onSelect ? selected : undefined}
                    onClick={onSelect ? (event) => { event.stopPropagation(); onSelect(aircraft.id); } : undefined}
                    onKeyDown={onSelect ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(aircraft.id); } } : undefined}
                    style={{ borderColor, borderLeftColor: emergency ? '#ef4444' : accentColor, pointerEvents: onSelect ? 'auto' : 'none' }}
                    className={`whitespace-nowrap rounded-md border-2 border-l-[5px] px-2 py-1 font-mono leading-tight shadow-lg backdrop-blur-sm ${onSelect ? 'cursor-pointer' : ''} ${emergency ? 'bg-red-950/90 animate-pulse' : selected ? 'bg-slate-950/95 ring-2 ring-amber-300/70' : 'bg-slate-950/85'}`}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-extrabold tracking-wide text-white">{aircraft.callsign}</span>
                        {aircraft.aircraftType && <span className="text-[10px] font-semibold text-slate-300">{aircraft.aircraftType}</span>}
                        {emergency && <span className="rounded bg-red-500 px-1 text-[9px] font-black text-white">KHẨN NGUY</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className={holding ? 'text-amber-300' : emergency ? 'text-red-200' : 'text-emerald-300'}>{statusText}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-sky-200">{speed} kt</span>
                    </div>
                </div>
                {/* Que nối từ thẻ xuống máy bay */}
                <div className="h-4 w-[2px]" style={{ backgroundColor: borderColor }} aria-hidden="true" />
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: borderColor }} aria-hidden="true" />
            </div>
        </Html>
    );
}
