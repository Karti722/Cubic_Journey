const SAVE_KEY = "cubic-journey-save-v2";

export function loadSave(defaultState) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(defaultState);

    const parsed = JSON.parse(raw);
    return mergeState(defaultState, parsed);
  } catch {
    return structuredClone(defaultState);
  }
}

export function writeSave(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures so gameplay continues.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function mergeState(defaultState, loadedState) {
  const merged = structuredClone(defaultState);

  merged.keyCubes = clampNumber(loadedState.keyCubes, 0, 5, defaultState.keyCubes);
  merged.totalCompletedStages = clampNumber(
    loadedState.totalCompletedStages,
    0,
    Number.MAX_SAFE_INTEGER,
    0
  );

  if (Array.isArray(loadedState.worldProgress)) {
    for (let i = 0; i < merged.worldProgress.length; i += 1) {
      const incoming = loadedState.worldProgress[i];
      if (!incoming) continue;

      merged.worldProgress[i].highestUnlockedStage = clampNumber(
        incoming.highestUnlockedStage,
        0,
        Number.MAX_SAFE_INTEGER,
        0
      );
      merged.worldProgress[i].highestCompletedStage = clampNumber(
        incoming.highestCompletedStage,
        -1,
        Number.MAX_SAFE_INTEGER,
        -1
      );
      merged.worldProgress[i].bossDefeated = Boolean(incoming.bossDefeated);
      merged.worldProgress[i].keyCubeClaimed = Boolean(incoming.keyCubeClaimed);
    }
  }

  return merged;
}

function clampNumber(value, min, max, fallback) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
