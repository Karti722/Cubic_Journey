const CONTROL_SAVE_KEY = "cubic-journey-controls-v1";

export const DEFAULT_CONTROL_BINDINGS = {
  moveForward: ["KeyW"],
  moveBackward: ["KeyS"],
  moveLeft: ["KeyA"],
  moveRight: ["KeyD"],
  jump: ["Space"],
  dash: ["ShiftLeft", "ShiftRight"],
  pause: ["Escape", "KeyP"],
  worldMenu: ["KeyM"],
  hub: ["KeyH"],
  interact: ["KeyE"],
  shop: ["KeyO"],
  controls: ["KeyC"]
};

export function loadControlBindings() {
  try {
    const raw = localStorage.getItem(CONTROL_SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_CONTROL_BINDINGS);

    const parsed = JSON.parse(raw);
    return mergeBindings(DEFAULT_CONTROL_BINDINGS, parsed);
  } catch {
    return structuredClone(DEFAULT_CONTROL_BINDINGS);
  }
}

export function saveControlBindings(bindings) {
  try {
    localStorage.setItem(CONTROL_SAVE_KEY, JSON.stringify(bindings));
  } catch {
    // Ignore persistence failures.
  }
}

export function resetControlBindings() {
  saveControlBindings(DEFAULT_CONTROL_BINDINGS);
  return structuredClone(DEFAULT_CONTROL_BINDINGS);
}

function mergeBindings(defaultBindings, loadedBindings) {
  const merged = structuredClone(defaultBindings);

  for (const action of Object.keys(defaultBindings)) {
    const incoming = loadedBindings?.[action];
    if (Array.isArray(incoming) && incoming.length > 0) {
      merged[action] = incoming.filter(code => typeof code === "string" && code.length > 0);
    }
  }

  return merged;
}
