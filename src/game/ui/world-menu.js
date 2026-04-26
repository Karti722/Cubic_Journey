import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, styleSubtext } from "./ui-theme.js";

export function createWorldMenu({ getModel, onSelectHub, onSelectWorld, onResetSave }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 20, align: "flex-start", justify: "flex-end", padding: "20px", background: "transparent" });
  root.style.pointerEvents = "auto";
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();

    root.innerHTML = "";

    const panel = document.createElement("div");
    styleCard(panel, { padding: "16px" });
    panel.style.width = "340px";
    panel.style.maxHeight = "80vh";
    panel.style.overflowY = "auto";
    panel.classList.add("cj-scrollbar");
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "World Travel Menu";
    styleHeading(title, { size: "1.6rem", marginBottom: "6px" });
    panel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.textContent = `Key Cubes: ${model.keyCubes}/5`;
    styleSubtext(subtitle, { marginBottom: "8px", fontSize: "0.95rem" });
    panel.appendChild(subtitle);

    const hint = document.createElement("div");
    hint.textContent = "Press M to close menu. Press H to return to hub quickly.";
    styleSubtext(hint, { marginBottom: "12px", fontSize: "0.85rem" });
    panel.appendChild(hint);

    const hubButton = document.createElement("button");
    hubButton.textContent = "Travel to Hub";
    styleButton(hubButton, { primary: true, fullWidth: true });
    hubButton.style.marginBottom = "12px";
    hubButton.addEventListener("click", () => {
      onSelectHub();
      close();
    });
    panel.appendChild(hubButton);

    for (let i = 0; i < model.worlds.length; i += 1) {
      const world = model.worlds[i];

      const button = document.createElement("button");
      button.style.display = "block";
      button.style.width = "100%";
      button.style.textAlign = "left";
      button.style.marginBottom = "8px";
      button.style.padding = "8px";
      button.className = "cj-button";

      const status = world.accessible ? "Open" : "Locked";
      const progress = `Stage ${world.startStage + 1}/${world.totalStages}`;
      const boss = world.hasBoss ? (world.bossDefeated ? "Boss: Cleared" : "Boss: Pending") : "Final World";
      button.textContent = `${i + 1}. ${world.name} | ${status} | ${progress} | ${boss}`;
      button.disabled = !world.accessible;

      button.addEventListener("click", () => {
        onSelectWorld(i, world.startStage);
        close();
      });

      panel.appendChild(button);
    }

    const reset = document.createElement("button");
    reset.textContent = "Reset Save";
    styleButton(reset, { danger: true, fullWidth: true });
    reset.style.marginTop = "8px";
    reset.addEventListener("click", () => {
      onResetSave();
      render();
    });
    panel.appendChild(reset);
  }

  function open() {
    isOpen = true;
    render();
    root.style.display = "block";
  }

  function close() {
    isOpen = false;
    root.style.display = "none";
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  return {
    open,
    close,
    toggle,
    render,
    isOpen: () => isOpen
  };
}
