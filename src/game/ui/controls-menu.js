export function createControlsMenu({ getBindings, onRebind, onReset, onClose }) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.background = "rgba(0, 0, 0, 0.82)";
  root.style.color = "white";
  root.style.padding = "24px";
  root.style.fontFamily = "sans-serif";
  root.style.display = "none";
  root.style.zIndex = "40";
  root.style.overflowY = "auto";
  document.body.appendChild(root);

  let isOpen = false;
  let pendingAction = null;

  function render() {
    const bindings = getBindings();
    root.innerHTML = "";

    const panel = document.createElement("div");
    panel.style.maxWidth = "920px";
    panel.style.margin = "0 auto";
    panel.style.background = "rgba(8, 12, 24, 0.95)";
    panel.style.border = "1px solid rgba(255,255,255,0.15)";
    panel.style.padding = "20px";
    panel.style.boxShadow = "0 20px 60px rgba(0,0,0,0.35)";
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "Controls";
    title.style.fontSize = "28px";
    title.style.fontWeight = "800";
    title.style.marginBottom = "8px";
    panel.appendChild(title);

    const hint = document.createElement("div");
    hint.textContent = pendingAction
      ? `Press any key to bind ${getActionLabel(pendingAction)}`
      : "Click Rebind, then press a new key for that action.";
    hint.style.opacity = "0.8";
    hint.style.marginBottom = "16px";
    panel.appendChild(hint);

    const controlsList = document.createElement("div");
    controlsList.style.display = "grid";
    controlsList.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";
    controlsList.style.gap = "12px";
    panel.appendChild(controlsList);

    ACTION_ORDER.forEach(action => {
      const row = document.createElement("div");
      row.style.padding = "12px";
      row.style.background = "rgba(255,255,255,0.05)";
      row.style.border = pendingAction === action ? "1px solid rgba(80, 160, 255, 0.85)" : "1px solid rgba(255,255,255,0.12)";

      const label = document.createElement("div");
      label.style.fontWeight = "700";
      label.textContent = getActionLabel(action);
      row.appendChild(label);

      const current = document.createElement("div");
      current.style.margin = "6px 0 10px";
      current.style.opacity = "0.85";
      current.textContent = `Current: ${describeCodes(bindings[action])}`;
      row.appendChild(current);

      const buttonRow = document.createElement("div");
      buttonRow.style.display = "flex";
      buttonRow.style.gap = "8px";
      buttonRow.style.flexWrap = "wrap";
      row.appendChild(buttonRow);

      addButton(buttonRow, pendingAction === action ? "Listening..." : "Rebind", () => {
        pendingAction = action;
        render();
      });

      addButton(buttonRow, "Clear", () => {
        onRebind(action, "");
        render();
      });

      controlsList.appendChild(row);
    });

    const bottom = document.createElement("div");
    bottom.style.display = "flex";
    bottom.style.gap = "10px";
    bottom.style.flexWrap = "wrap";
    bottom.style.marginTop = "18px";
    panel.appendChild(bottom);

    addButton(bottom, "Reset Defaults", () => {
      pendingAction = null;
      onReset();
      render();
    });

    addButton(bottom, "Close", () => {
      pendingAction = null;
      close();
      if (typeof onClose === "function") onClose();
    });
  }

  function open() {
    isOpen = true;
    render();
    root.style.display = "block";
    addEventListener("keydown", captureKeyDown, true);
  }

  function close() {
    isOpen = false;
    root.style.display = "none";
    pendingAction = null;
    removeEventListener("keydown", captureKeyDown, true);
  }

  function captureKeyDown(event) {
    if (!isOpen || !pendingAction) return;
    event.preventDefault();
    if (event.code === "Escape") {
      pendingAction = null;
      render();
      return;
    }

    onRebind(pendingAction, event.code);
    pendingAction = null;
    render();
  }

  return { open, close, render, isOpen: () => isOpen };
}

const ACTION_ORDER = ["moveForward", "moveBackward", "moveLeft", "moveRight", "jump", "dash", "pause", "worldMenu", "hub", "interact", "shop", "controls"];

function getActionLabel(action) {
  const labels = {
    moveForward: "Move Forward",
    moveBackward: "Move Backward",
    moveLeft: "Move Left",
    moveRight: "Move Right",
    jump: "Jump",
    dash: "Dash",
    pause: "Pause",
    worldMenu: "World Menu",
    hub: "Return to Hub",
    interact: "Interact",
    shop: "Shop",
    controls: "Controls"
  };

  return labels[action] || action;
}

function describeCodes(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return "Unbound";
  return codes.join(", ").replace(/Key/g, "");
}

function addButton(parent, label, handler) {
  const button = document.createElement("button");
  button.textContent = label;
  button.style.padding = "8px 12px";
  button.style.border = "none";
  button.style.background = "rgba(255,255,255,0.12)";
  button.style.color = "inherit";
  button.style.cursor = "pointer";
  button.addEventListener("click", handler);
  parent.appendChild(button);
  return button;
}
