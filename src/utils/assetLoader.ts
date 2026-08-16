// Asset Loader with Exponential Backoff Retry Policy
// Retries up to 3 times (500ms, 1000ms, 2000ms) and reports status.

export type AssetLoadingStatus = 'loading' | 'retrying' | 'success' | 'error';

export interface AssetLoadState {
  status: AssetLoadingStatus;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
}

/**
 * Load an image with exponential backoff retry policy
 */
export function loadImageWithRetry(
  src: string,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    onStatusChange?: (state: AssetLoadState) => void;
  } = {}
): Promise<HTMLImageElement> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelayMs ?? 500;
  let attempt = 0;

  return new Promise((resolve, reject) => {
    function tryLoad() {
      if (attempt === 0) {
        options.onStatusChange?.({ status: 'loading', retryCount: 0, maxRetries });
      } else {
        options.onStatusChange?.({
          status: 'retrying',
          retryCount: attempt,
          maxRetries,
          errorMessage: `Đang thử tải lại... (Lần ${attempt}/${maxRetries})`,
        });
      }

      const img = new Image();
      // Cache-buster parameter only on retry attempts to bypass broken caching
      img.src = attempt > 0 ? `${src}?retry=${attempt}&t=${Date.now()}` : src;

      img.onload = () => {
        options.onStatusChange?.({ status: 'success', retryCount: attempt, maxRetries });
        resolve(img);
      };

      img.onerror = () => {
        attempt++;
        if (attempt <= maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.warn(`[AssetLoader] Failed to load "${src}". Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
          setTimeout(tryLoad, delay);
        } else {
          const errMsg = `Không thể tải tài nguyên sau ${maxRetries} lần thử.`;
          console.error(`[AssetLoader] Permanently failed to load "${src}".`);
          options.onStatusChange?.({
            status: 'error',
            retryCount: maxRetries,
            maxRetries,
            errorMessage: errMsg,
          });
          reject(new Error(errMsg));
        }
      };
    }

    tryLoad();
  });
}
