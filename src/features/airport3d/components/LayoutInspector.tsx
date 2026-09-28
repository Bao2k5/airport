import type { AirportLayout } from '../layout';
import { useRef, useState } from 'react';

export default function LayoutInspector({
  objects,
  selectedId,
  onSelect,
  onAdjust,
  onSetValue,
  onColor,
  onRename,
  onAddObject,
  onDeleteObject,
  onSave,
  onClose,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onImport,
  message,
}: {
  objects: AirportLayout;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdjust: (field: 'x' | 'y' | 'z' | 'rotationY' | 'scale', amount: number) => void;
  onSetValue: (field: 'x' | 'y' | 'z' | 'rotationY' | 'scale', value: number) => void;
  onColor: (color: string) => void;
  onRename?: (id: string, name: string) => void;
  onAddObject?: (kind: 'mast' | 'vehicle') => void;
  onDeleteObject?: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
  message: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const current = objects.find(item => item.id === selectedId) ?? objects[0];
  const nudge = (field: 'x' | 'y' | 'z', amount: number) => onAdjust(field, amount);
  const numericInput = (key: string, value: number, field: 'x' | 'y' | 'z' | 'rotationY' | 'scale', displayValue = value.toFixed(1), step = 0.1) => (
    <input
      aria-label={key === 'rotationY' ? 'Góc xoay' : key === 'scale' ? 'Tỉ lệ kích thước' : `Tọa độ ${key.toUpperCase()}`}
      type="number"
      inputMode="decimal"
      step={step}
      value={numericDrafts[key] ?? displayValue}
      onFocus={() => setNumericDrafts(drafts => ({ ...drafts, [key]: displayValue }))}
      onChange={event => setNumericDrafts(drafts => ({ ...drafts, [key]: event.target.value }))}
      onBlur={() => {
        const raw = numericDrafts[key];
        if (raw !== undefined && raw.trim() !== '' && Number.isFinite(Number(raw))) onSetValue(field, Number(raw));
        setNumericDrafts(drafts => { const next = { ...drafts }; delete next[key]; return next; });
      }}
      className="h-9 min-w-0 rounded border border-white/10 bg-black/30 text-center font-mono text-[11px] text-white"
    />
  );

  return (
    <section className="absolute right-2 top-[6.6rem] bottom-11 z-10 flex w-[min(20rem,calc(100%-1rem))] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#07111af5] text-white shadow-2xl backdrop-blur-md">
      <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <div className="text-xs font-bold tracking-wide">EDITOR BỐ CỤC 3D</div>
          <div className="text-[10px] text-slate-400">Thêm, bớt & tùy chỉnh đèn, vật thể</div>
        </div>
        <button type="button" className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10" onClick={onClose}>Đóng</button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        {/* Nút thêm đèn và vật thể */}
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Thêm vật thể mới</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onAddObject?.('mast')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/20 py-2 px-2 text-center text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/30 cursor-pointer shadow-xs"
            >
              <span>💡</span> + Đèn sân đỗ
            </button>
            <button
              type="button"
              onClick={() => onAddObject?.('vehicle')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 py-2 px-2 text-center text-[11px] font-medium text-slate-200 transition hover:bg-slate-700 cursor-pointer shadow-xs"
            >
              <span>🚜</span> + Xe phục vụ
            </button>
          </div>
        </div>

        {/* Danh sách vật thể */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Danh sách vật thể ({objects.length})</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-white/10 bg-black/20 p-1.5 pr-1">
            {objects.map(item => {
              const icon = item.kind === 'mast' ? '💡' : item.kind === 'terminal' ? '🏢' : item.kind === 'tower' ? '🗼' : '🚜';
              const isSelected = current?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/60 font-semibold'
                      : 'bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span>{icon}</span>
                    <span className="truncate">{item.name}</span>
                  </span>
                  {isSelected && <span className="text-[10px] font-mono text-cyan-300">●</span>}
                </button>
              );
            })}
          </div>
        </div>

        {current && (
          <>
            {/* Tên và nút Xóa vật thể */}
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={current.name}
                  onChange={e => onRename?.(current.id, e.target.value)}
                  className="h-8 flex-1 rounded border border-white/15 bg-black/40 px-2 font-medium text-xs text-white"
                  placeholder="Tên đối tượng"
                />
                {current.id !== 'tower' && current.id !== 'terminal_zone' && (
                  <button
                    type="button"
                    onClick={() => onDeleteObject?.(current.id)}
                    className="flex items-center gap-1 rounded bg-rose-600/30 border border-rose-500/50 px-2 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-600/50 transition cursor-pointer"
                    title="Xóa đối tượng này"
                  >
                    <span>🗑️</span> Xóa
                  </button>
                )}
              </div>
            </div>

            {/* Điều khiển vị trí X, Y, Z */}
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Di chuyển theo trục · bước 1</div>
              {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis} className="mb-1 flex items-center justify-between">
                  <span className="w-8 font-mono text-slate-300">{axis.toUpperCase()}</span>
                  <button type="button" onClick={() => nudge(axis, -1)} className="min-h-9 min-w-10 rounded bg-white/10 text-lg hover:bg-white/20 cursor-pointer" aria-label={`Giảm ${axis}`}>−</button>
                  {numericInput(axis, current.position[axis === 'x' ? 0 : axis === 'y' ? 1 : 2], axis, current.position[axis === 'x' ? 0 : axis === 'y' ? 1 : 2].toFixed(1))}
                  <button type="button" onClick={() => nudge(axis, 1)} className="min-h-9 min-w-10 rounded bg-white/10 text-lg hover:bg-white/20 cursor-pointer" aria-label={`Tăng ${axis}`}>+</button>
                </div>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-[10px] text-slate-400">
                  Xoay Y (độ)
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => onAdjust('rotationY', -Math.PI / 12)} className="min-h-9 min-w-9 rounded bg-white/10 text-lg cursor-pointer">−</button>
                    {numericInput('rotationY', current.rotationY, 'rotationY', (current.rotationY * 180 / Math.PI).toFixed(0), 15)}
                    <button type="button" onClick={() => onAdjust('rotationY', Math.PI / 12)} className="min-h-9 min-w-9 rounded bg-white/10 text-lg cursor-pointer">+</button>
                  </div>
                </label>
                <label className="text-[10px] text-slate-400">
                  Kích thước (Scale)
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => onAdjust('scale', -0.1)} className="min-h-9 min-w-9 rounded bg-white/10 text-lg cursor-pointer">−</button>
                    {numericInput('scale', current.scale, 'scale', current.scale.toFixed(2))}
                    <button type="button" onClick={() => onAdjust('scale', 0.1)} className="min-h-9 min-w-9 rounded bg-white/10 text-lg cursor-pointer">+</button>
                  </div>
                </label>
              </div>
            </div>

            {/* Màu sắc & Ánh sáng */}
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>{current.kind === 'mast' ? 'Màu ánh sáng đèn' : 'Màu vật liệu'}</span>
                <input aria-label="Màu vật liệu" type="color" value={current.color} onChange={event => onColor(event.target.value)} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" />
              </div>
              {current.kind === 'mast' && (
                <div className="flex gap-1.5 text-[10px]">
                  <button type="button" onClick={() => onColor('#fff0bf')} className="flex-1 rounded py-1 bg-[#fff0bf]/20 border border-[#fff0bf]/40 text-[#fff0bf] font-medium cursor-pointer">Vàng ấm</button>
                  <button type="button" onClick={() => onColor('#ffffff')} className="flex-1 rounded py-1 bg-white/20 border border-white/40 text-white font-medium cursor-pointer">Trắng</button>
                  <button type="button" onClick={() => onColor('#ffb74d')} className="flex-1 rounded py-1 bg-[#ffb74d]/20 border border-[#ffb74d]/40 text-[#ffb74d] font-medium cursor-pointer">Vàng cam</button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="rounded-md border border-amber-400/20 bg-amber-400/5 p-2 text-[10px] leading-relaxed text-amber-100/80">
          Tip: Bạn có thể click chuột trực tiếp vào vật thể trong 3D để chọn và kéo thả bằng mũi tên Gizmo.
        </div>
      </div>

      <footer className="space-y-2 border-t border-white/10 p-2.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" disabled={!canUndo} onClick={onUndo} className="min-h-9 rounded bg-white/10 disabled:opacity-40 cursor-pointer">↶ Hoàn tác</button>
          <button type="button" disabled={!canRedo} onClick={onRedo} className="min-h-9 rounded bg-white/10 disabled:opacity-40 cursor-pointer">↷ Làm lại</button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={onSave} className="min-h-10 rounded bg-cyan-500 font-bold text-slate-950 cursor-pointer">Lưu bố cục</button>
          <button type="button" onClick={onReset} className="min-h-10 rounded bg-white/10 cursor-pointer">Mặc định</button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={onExport} className="min-h-9 rounded border border-white/15 cursor-pointer">Xuất JSON</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="min-h-9 rounded border border-white/15 cursor-pointer">Nhập JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = ''; }} />
        </div>
        <p role="status" className="min-h-4 text-[10px] text-slate-400">{message}</p>
      </footer>
    </section>
  );
}
