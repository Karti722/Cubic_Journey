import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "../ui/ui-theme.js";

export function createDebugMenu({ getModel, onClose, onTravelWorld, onTravelHub, onUnlockAllSkills, onResetSkills, onMaxCurrency }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 40, background: "radial-gradient(circle at 50% 8%, rgba(255, 122, 202, 0.18), rgba(5, 2, 12, 0.96) 58%), linear-gradient(180deg, rgba(5, 2, 12, 0.84), rgba(0, 0, 0, 0.96))" });
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    stylePanel(panel, { maxWidth: "1180px", padding: "22px" });
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "Debug Menu";
    styleHeading(title, { size: "clamp(2rem, 4vw, 3rem)", marginBottom: "8px" });
    panel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.style.marginTop = "8px";
    styleSubtext(subtitle, { marginBottom: "0" });
    subtitle.textContent = `Current: ${model.currentLabel} | Locks: bypassed in this branch`;
    panel.appendChild(subtitle);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "10px";
    controls.style.marginTop = "14px";
    controls.style.flexWrap = "wrap";
    panel.appendChild(controls);

    const closeButton = addButton(controls, "Close Debug", () => {
      onClose();
      close();
    });
    closeButton.style.background = "#41255f";

    const hubButton = addButton(controls, "Travel Hub", () => {
      onTravelHub();
      close();
    });
    hubButton.style.background = "#184f3a";

    if (typeof onUnlockAllSkills === "function" || typeof onResetSkills === "function" || typeof onMaxCurrency === "function") {
      const skillLab = document.createElement("div");
      skillLab.style.marginTop = "18px";
      styleCard(skillLab, { padding: "12px" });
      panel.appendChild(skillLab);

      const skillTitle = document.createElement("div");
      skillTitle.textContent = `Skill Lab | Owned: ${model.skillCount || 0} | Coins: ${model.currency || 0}`;
      skillTitle.style.fontWeight = "700";
      skillTitle.style.marginBottom = "10px";
      skillLab.appendChild(skillTitle);

      const skillButtons = document.createElement("div");
      skillButtons.style.display = "flex";
      skillButtons.style.gap = "10px";
      skillButtons.style.flexWrap = "wrap";
      skillLab.appendChild(skillButtons);

      if (typeof onUnlockAllSkills === "function") {
        addButton(skillButtons, "Unlock All Skills", () => onUnlockAllSkills());
      }

      if (typeof onResetSkills === "function") {
        addButton(skillButtons, "Reset Skills", () => onResetSkills());
      }

      if (typeof onMaxCurrency === "function") {
        addButton(skillButtons, "Max Currency", () => onMaxCurrency());
      }
    }

    const worldsWrap = document.createElement("div");
    worldsWrap.style.display = "grid";
    worldsWrap.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
    worldsWrap.style.gap = "12px";
    worldsWrap.style.marginTop = "18px";
    panel.appendChild(worldsWrap);

    model.worlds.forEach(world => {
      const card = document.createElement("div");
      styleCard(card, { padding: "12px" });

      const worldTitle = document.createElement("div");
      worldTitle.style.fontWeight = "700";
      worldTitle.style.marginBottom = "8px";
      worldTitle.textContent = `${world.index + 1}. ${world.name}`;
      card.appendChild(worldTitle);

      const info = document.createElement("div");
      info.style.fontSize = "13px";
      info.style.opacity = "0.85";
      info.style.marginBottom = "8px";
      info.textContent = `Stages: ${world.stageCount} | Boss stage: ${world.bossStage + 1}`;
      card.appendChild(info);

      const stageButtons = document.createElement("div");
      stageButtons.style.display = "grid";
      stageButtons.style.gridTemplateColumns = "repeat(auto-fit, minmax(54px, 1fr))";
      stageButtons.style.gap = "6px";

      for (let stageIndex = 0; stageIndex < world.stageCount; stageIndex += 1) {
        const isBoss = stageIndex === world.bossStage;
        const stageButton = addButton(stageButtons, `${stageIndex + 1}`, () => {
          onTravelWorld(world.index, stageIndex);
          close();
        });
        stageButton.title = isBoss ? "Boss stage" : "Standard stage";
        stageButton.style.padding = "6px 8px";
        stageButton.style.background = isBoss ? "#6e1f1f" : "#2a3150";
      }

      card.appendChild(stageButtons);
      worldsWrap.appendChild(card);
    });
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
      onClose();
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

function addButton(parent, label, onClick) {
  const button = document.createElement("button");
  button.textContent = label;
  styleButton(button, { compact: true });
  button.addEventListener("click", onClick);
  parent.appendChild(button);
  return button;
}
