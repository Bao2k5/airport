import { useEffect, useRef, useState } from 'react';
import { isLayoutEditorPinValid } from '../editorAccess';

export default function LayoutUnlockDialog({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="layout-unlock-title" className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-xl border border-slate-300 bg-white p-6 text-[#0C2444] shadow-2xl backdrop:bg-slate-950/55">
    <form onSubmit={event => {
      event.preventDefault();
      if (!isLayoutEditorPinValid(pin)) { setError('Mã mở khóa không đúng. Vui lòng thử lại.'); setPin(''); return; }
      onUnlock();
    }}>
      <h2 id="layout-unlock-title" className="text-base font-bold">Mở khóa chỉnh bố cục</h2>
      <p className="mt-2 text-sm text-slate-600">Nhập mã 4 số để chỉnh vị trí và lưu bố cục sân bay.</p>
      <label className="mt-4 block text-sm font-semibold" htmlFor="layout-pin">Mã mở khóa</label>
      <input id="layout-pin" autoFocus type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={event => { setPin(event.target.value.replace(/\D/g, '')); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'layout-pin-error' : undefined} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-lg tracking-[0.6em] text-[#0C2444] focus:outline-2 focus:outline-blue-600" />
      {error && <p id="layout-pin-error" role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold hover:bg-slate-100">Hủy</button>
        <button type="submit" disabled={pin.length !== 4} className="min-h-10 rounded-lg bg-[#0C2444] px-4 text-sm font-bold text-white disabled:opacity-40">Mở khóa</button>
      </div>
    </form>
  </dialog>;
}
