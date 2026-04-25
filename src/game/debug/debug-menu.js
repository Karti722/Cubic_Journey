export function createDebugMenu({ getModel, onClose, onTravelWorld, onTravelHub }) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.background = "rgba(10, 6, 20, 0.9)";
  root.style.color = "#f8f6ff";
  root.style.padding = "24px";
  root.style.fontFamily = "monospace";
  root.style.display = "none";
  root.style.zIndex = "40";
  root.style.overflowY = "auto";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    panel.style.maxWidth = "1120px";
    panel.style.margin = "0 auto";
    panel.style.background = "rgba(20, 12, 38, 0.95)";
    panel.style.border = "1px solid rgba(255, 255, 255, 0.25)";
    panel.style.padding = "18px";
    panel.style.boxShadow = "0 20px 50px rgba(0,0,0,0.45)";
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "Debug Menu";
    title.style.fontSize = "28px";
    title.style.fontWeight = "700";
    panel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.style.marginTop = "8px";
    subtitle.style.opacity = "0.85";
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

    const worldsWrap = document.createElement("div");
    worldsWrap.style.display = "grid";
    worldsWrap.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
    worldsWrap.style.gap = "12px";
    worldsWrap.style.marginTop = "18px";
    panel.appendChild(worldsWrap);

    model.worlds.forEach(world => {
      const card = document.createElement("div");
      card.style.padding = "12px";
      card.style.border = "1px solid rgba(255,255,255,0.2)";
      card.style.background = "rgba(255,255,255,0.06)";

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
  button.style.padding = "8px 12px";
  button.style.border = "1px solid rgba(255,255,255,0.22)";
  button.style.color = "#f8f6ff";
  button.style.background = "#25324a";
  button.style.cursor = "pointer";
  button.addEventListener("click", onClick);
  parent.appendChild(button);
  return button;
}
