import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";

export function createControlsMenu({ getBindings, onRebind, onReset, onClose }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 40, background: "radial-gradient(circle at 20% 10%, rgba(126, 231, 255, 0.18), rgba(2, 4, 10, 0.94) 58%), linear-gradient(180deg, rgba(2, 4, 10, 0.84), rgba(0, 0, 0, 0.96))" });
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;
  let pendingAction = null;

  function render() {
    const bindings = getBindings();
    root.innerHTML = "";

    const panel = document.createElement("div");
    stylePanel(panel, { maxWidth: "980px", padding: "20px" });
    panel.style.background = "rgba(10, 16, 28, 0.96)";
    panel.style.border = "1px solid rgba(126, 231, 255, 0.2)";
    panel.style.boxShadow = "0 28px 70px rgba(0,0,0,0.5)";
    root.appendChild(panel);

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    panel.appendChild(header);

    const title = document.createElement("div");
    title.textContent = "Controls";
    styleHeading(title, { size: "clamp(2rem, 4vw, 3rem)", marginBottom: "8px" });
    header.appendChild(title);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Exit";
    styleButton(closeButton, { compact: true, danger: true });
    closeButton.addEventListener("click", () => {
      pendingAction = null;
      close();
      if (typeof onClose === "function") onClose();
    });
    header.appendChild(closeButton);

    const hint = document.createElement("div");
    hint.textContent = pendingAction
      ? `Press any key to bind ${getActionLabel(pendingAction)}`
      : "Click Rebind, then press a new key for that action.";
    styleSubtext(hint, { marginBottom: "16px" });
    panel.appendChild(hint);

    const controlsList = document.createElement("div");
    controlsList.style.display = "grid";
    controlsList.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";
    controlsList.style.gap = "12px";
    panel.appendChild(controlsList);

    ACTION_ORDER.forEach(action => {
      const row = document.createElement("div");
      styleCard(row, { padding: "12px", active: pendingAction === action });

      const label = document.createElement("div");
      label.className = "cj-kicker";
      label.textContent = getActionLabel(action);
      row.appendChild(label);

      const current = document.createElement("div");
      current.style.margin = "6px 0 10px";
      current.style.color = "rgba(255,255,255,0.85)";
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
  styleButton(button, { compact: true });
  button.addEventListener("click", handler);
  parent.appendChild(button);
  return button;
}
