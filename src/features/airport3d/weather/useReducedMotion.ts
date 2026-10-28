import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const getSnapshot = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;

/** true khi người dùng bật "giảm chuyển động" trong hệ điều hành/trình duyệt. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
