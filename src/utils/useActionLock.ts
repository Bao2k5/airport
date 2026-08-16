import { useState, useRef, useCallback } from 'react';

export type ActionStatus = 'idle' | 'pending' | 'timeout';

export interface ActionLockState {
  status: ActionStatus;
  isPending: boolean;
  canRetry: boolean;
}

export function useActionLock(timeoutMs = 2000) {
  const [locks, setLocks] = useState<Record<string, ActionStatus>>({});
  const timersRef = useRef<Record<string, number>>({});

  const executeAction = useCallback(async <T>(
    actionKey: string,
    actionFn: () => Promise<T> | T
  ): Promise<T | undefined> => {
    // Nếu action đang trong trạng thái pending, chặn hoàn toàn click trùng lặp
    if (locks[actionKey] === 'pending') {
      console.warn(`[Anti-Spam] Action "${actionKey}" is currently locked. Ignoring duplicate execution.`);
      return undefined;
    }

    // Set trạng thái pending
    setLocks(prev => ({ ...prev, [actionKey]: 'pending' }));

    // Thiết lập timer 2 giây cho phép retry nếu handler bị nghẽn
    if (timersRef.current[actionKey]) {
      window.clearTimeout(timersRef.current[actionKey]);
    }

    timersRef.current[actionKey] = window.setTimeout(() => {
      setLocks(prev => {
        if (prev[actionKey] === 'pending') {
          console.warn(`[Action-Timeout] Action "${actionKey}" timed out after ${timeoutMs}ms. Allowing retry.`);
          return { ...prev, [actionKey]: 'timeout' };
        }
        return prev;
      });
    }, timeoutMs);

    try {
      const result = await actionFn();
      // Reset về idle khi hoàn tất thành công
      if (timersRef.current[actionKey]) {
        window.clearTimeout(timersRef.current[actionKey]);
        delete timersRef.current[actionKey];
      }
      setLocks(prev => ({ ...prev, [actionKey]: 'idle' }));
      return result;
    } catch (err) {
      console.error(`[Action-Error] Action "${actionKey}" threw error:`, err);
      // Cho phép retry khi gặp lỗi
      setLocks(prev => ({ ...prev, [actionKey]: 'timeout' }));
      throw err;
    }
  }, [locks, timeoutMs]);

  const getActionState = useCallback((actionKey: string): ActionLockState => {
    const status = locks[actionKey] || 'idle';
    return {
      status,
      isPending: status === 'pending',
      canRetry: status === 'timeout',
    };
  }, [locks]);

  const resetAction = useCallback((actionKey: string) => {
    if (timersRef.current[actionKey]) {
      window.clearTimeout(timersRef.current[actionKey]);
      delete timersRef.current[actionKey];
    }
    setLocks(prev => ({ ...prev, [actionKey]: 'idle' }));
  }, []);

  return {
    executeAction,
    getActionState,
    resetAction,
    locks,
  };
}
