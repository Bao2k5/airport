import type { ReactNode } from 'react';
import type { CameraPreset, SceneMode } from '../viewTypes';

export default function AirportToolbar({ sceneMode, preset, presets, editing, onScene, onPreset, onTerminal, onEditor, onWorkstation, children }: {
  sceneMode: SceneMode;
  preset: CameraPreset;
  presets: { id: CameraPreset; label: string }[];
  editing: boolean;
  onScene: (mode: SceneMode) => void;
  onPreset: (preset: CameraPreset) => void;
  onTerminal: () => void;
  onEditor: () => void;
  onWorkstation: () => void;
  children: ReactNode;
}) {
  const button = (active = false) => `min-h-9 shrink-0 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${active ? 'border-[#0C2444] bg-[#0C2444] text-white' : 'border-[#CBD5E1] bg-white text-[#475569] hover:bg-slate-100'}`;
  return <div className="relative z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-[#CBD5E1] bg-[#F8FAFC] p-2" aria-label="Thanh công cụ 3D">
    <div className="flex gap-1" role="group" aria-label="Cảnh 3D">
      <button type="button" className={button(sceneMode === 'airport')} aria-pressed={sceneMode === 'airport'} onClick={() => onScene('airport')}>Sa bàn sân bay</button>
      <button type="button" className={button(sceneMode !== 'airport')} aria-pressed={sceneMode !== 'airport'} onClick={() => onScene('room')}>Toàn phòng KSVKL</button>
    </div>
    {sceneMode === 'airport' ? <>
      <div className="flex max-w-full gap-1 overflow-x-auto" role="group" aria-label="Góc camera">
        {presets.map(item => <button type="button" key={item.id} className={button(preset === item.id)} aria-pressed={preset === item.id} onClick={() => onPreset(item.id)}>{item.label}</button>)}
        <button type="button" className={button(preset === 'follow')} aria-pressed={preset === 'follow'} onClick={() => onPreset('follow')}>Theo máy bay</button>
      </div>
      <button type="button" className={button()} onClick={onTerminal}>Khu nhà ga</button>
    </> : <button type="button" className={button()} onClick={onWorkstation}>Mở màn hình FTG</button>}
    <div className="ml-auto flex items-center gap-2">
      {children}
      {sceneMode === 'airport' && <button type="button" className={button(editing)} aria-pressed={editing} onClick={onEditor}>{editing ? 'Đóng và khóa' : 'Chỉnh bố cục'}</button>}
    </div>
  </div>;
}
