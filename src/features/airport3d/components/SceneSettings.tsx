export interface ScenePreferences {
  quality: 'low' | 'high';
  modelsEnabled: boolean;
  vehicles: boolean;
  density: number;
  reflections: boolean;
  shadows: boolean;
  people: boolean;
  lightScale: number;
}
export const DEFAULT_SCENE_PREFERENCES: ScenePreferences = { modelsEnabled: true, vehicles: false, density: 0, reflections: true, quality: 'high', shadows: true, people: true, lightScale: 1 };

export default function SceneSettings({ value, onChange }: { value: ScenePreferences; onChange: (value: ScenePreferences) => void }) {
  return <details className="relative text-xs text-[#0C2444]">
    <summary className="flex min-h-9 cursor-pointer items-center rounded-lg border border-[#CBD5E1] bg-white px-3 font-bold hover:bg-slate-100">Thiết lập cảnh ▾</summary>
    <div className="absolute right-0 top-full z-30 mt-2 grid max-h-[60vh] w-64 gap-3 overflow-auto rounded-xl border border-[#CBD5E1] bg-white p-4 shadow-xl">
      <label className="flex items-center justify-between">Đồ họa<select value={value.quality} onChange={e => onChange({ ...value, quality: e.target.value as ScenePreferences['quality'] })} className="rounded border border-slate-300 bg-slate-50 p-2"><option value="low">Tiết kiệm</option><option value="high">Chi tiết</option></select></label>
      <label className="flex items-center justify-between">Bóng đổ<input type="checkbox" checked={value.shadows} onChange={e => onChange({ ...value, shadows: e.target.checked })} /></label>
      <label className="flex items-center justify-between">Nhân vật KSVKL<input type="checkbox" checked={value.people} onChange={e => onChange({ ...value, people: e.target.checked })} /></label>
      <label className="flex items-center justify-between">Xe / thiết bị sân đỗ<input type="checkbox" checked={value.vehicles} onChange={e => onChange({ ...value, vehicles: e.target.checked, density: e.target.checked ? (value.density || 4) : 0 })} /></label>
      <label className="flex items-center justify-between">Model nhà ga bên ngoài<input type="checkbox" checked={value.modelsEnabled} onChange={e => onChange({ ...value, modelsEnabled: e.target.checked })} /></label>
      {value.vehicles && <label>Mật độ thiết bị: {value.density}<input className="w-full" type="range" min="0" max="16" step="1" value={value.density} onChange={e => onChange({ ...value, density: Number(e.target.value) })} /></label>}
      <label className="flex items-center justify-between">Phản chiếu môi trường<input type="checkbox" checked={value.reflections} onChange={e => onChange({ ...value, reflections: e.target.checked })} /></label>
      <label>Độ rõ đèn: {value.lightScale.toFixed(1)}×<input className="mt-2 w-full" type="range" min="0.6" max="2" step="0.1" value={value.lightScale} onChange={e => onChange({ ...value, lightScale: Number(e.target.value) })} /></label>
      <p className="text-slate-500">Chỉ thay đổi hiển thị; không đổi tuyến, thời tiết hoặc huấn lệnh.</p>
    </div>
  </details>;
}
