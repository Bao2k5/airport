// Persistence utility for airport simulator state in localStorage
// Handles safe serialization, deserialization, migration, and reload loop prevention.

import type { SimulationConfig, SimulationState } from '../types';
import type { GraphId } from '../data/graphRegistry';

const STORAGE_KEY = 'airport_sim_saved_state_v1';
const RELOAD_GUARD_KEY = 'airport_sim_reload_guard_v1';
const MAX_RELOADS_PER_WINDOW = 3;
const RELOAD_WINDOW_MS = 10000;

export interface PersistedData {
  version: number;
  savedAt: number;
  selectedGraphId: GraphId;
  config: SimulationConfig;
  selectedAircraftId: string;
  blockedEdgeIds: string[];
  manualFleet?: any[];
  scenarioId?: string | null;
  elapsedSeconds?: number;
}

/**
 * Check and update reload guard to prevent infinite browser reload loops
 */
export function checkReloadGuard(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_GUARD_KEY);
    const now = Date.now();
    let reloads: number[] = raw ? JSON.parse(raw) : [];
    // Filter timestamps within window
    reloads = reloads.filter(t => now - t < RELOAD_WINDOW_MS);
    if (reloads.length >= MAX_RELOADS_PER_WINDOW) {
      console.error('[ReloadGuard] Infinite reload detected! Blocking automatic reload.');
      return false;
    }
    reloads.push(now);
    sessionStorage.setItem(RELOAD_GUARD_KEY, JSON.stringify(reloads));
    return true;
  } catch {
    return true;
  }
}

/**
 * Save simulation state to localStorage
 */
export function saveStateToStorage(
  selectedGraphId: GraphId,
  config: SimulationConfig,
  simState: SimulationState
): void {
  try {
    const data: PersistedData = {
      version: 1,
      savedAt: Date.now(),
      selectedGraphId,
      config,
      selectedAircraftId: simState.selectedAircraftId || 'VN001',
      blockedEdgeIds: Array.from(simState.blockedEdgeIds || []),
      manualFleet: simState.manualFleet,
      scenarioId: simState.scenario?.id || null,
      elapsedSeconds: simState.elapsedSeconds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[Persistence] Could not save state to localStorage:', err);
  }
}

/**
 * Load simulation state from localStorage
 */
export function loadStateFromStorage(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedData;
    if (!parsed || parsed.version !== 1 || !parsed.config) return null;
    return parsed;
  } catch (err) {
    console.warn('[Persistence] Could not load state from localStorage:', err);
    return null;
  }
}

/**
 * Clear persisted simulation state
 */
export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
