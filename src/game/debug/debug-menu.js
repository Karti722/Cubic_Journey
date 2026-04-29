import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "../ui/ui-theme.js";

export function createDebugMenu({
  getModel,
  onClose,
  onTravelWorld,
  onTravelHub,
  onUnlockAllSkills,
  onResetSkills,
  onMaxCurrency,
  onSetCollectibles,
  onNearCompletion,
  onFreshStart,
  onMidCampaign,
  onUnlockAllWorlds,
  onFinalBossReady,
  onTriggerEndCredits,
  onToggleSkill,
  onSetWorldState
}) {
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
    stylePanel(panel, { maxWidth: "1180px", padding: "20px" });
    panel.style.background = "rgba(10, 10, 20, 0.97)";
    panel.style.border = "1px solid rgba(255, 122, 202, 0.24)";
    panel.style.boxShadow = "0 28px 70px rgba(0,0,0,0.55)";
    root.appendChild(panel);

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    panel.appendChild(header);

    const title = document.createElement("div");
    title.textContent = "Cheats Menu";
    styleHeading(title, { size: "clamp(2rem, 4vw, 3rem)", marginBottom: "8px" });
    header.appendChild(title);

    const closeButton = addButton(header, "Exit", () => {
      onClose();
      close();
    });
    closeButton.style.background = "#41255f";

    const subtitle = document.createElement("div");
    subtitle.style.marginTop = "8px";
    styleSubtext(subtitle, { marginBottom: "0" });
    subtitle.textContent = `Current: ${model.currentLabel}`;
    panel.appendChild(subtitle);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "10px";
    controls.style.marginTop = "14px";
    controls.style.flexWrap = "wrap";
    panel.appendChild(controls);

    const hubButton = addButton(controls, "Travel Hub", () => {
      onTravelHub();
      close();
    });
    hubButton.style.background = "#184f3a";

    const stats = document.createElement("div");
    stats.style.marginTop = "10px";
    stats.style.fontSize = "13px";
    stats.style.opacity = "0.86";
    stats.textContent = `Stages: ${model.completedStages || 0}/${model.totalStages || 0} | Cubes: ${model.keyCubes || 0}`;
    panel.appendChild(stats);

    if (
      typeof onFreshStart === "function"
      || typeof onMidCampaign === "function"
      || typeof onUnlockAllWorlds === "function"
      || typeof onNearCompletion === "function"
      || typeof onFinalBossReady === "function"
      || typeof onTriggerEndCredits === "function"
    ) {
      const progressLab = document.createElement("div");
      progressLab.style.marginTop = "16px";
      styleCard(progressLab, { padding: "12px" });
      panel.appendChild(progressLab);

      const progressTitle = document.createElement("div");
      progressTitle.textContent = "Progress Lab";
      progressTitle.style.fontWeight = "700";
      progressTitle.style.marginBottom = "10px";
      progressLab.appendChild(progressTitle);

      const progressButtons = document.createElement("div");
      progressButtons.style.display = "flex";
      progressButtons.style.gap = "10px";
      progressButtons.style.flexWrap = "wrap";
      progressLab.appendChild(progressButtons);

      if (typeof onFreshStart === "function") {
        addButton(progressButtons, "Fresh Start", () => onFreshStart());
      }

      if (typeof onMidCampaign === "function") {
        addButton(progressButtons, "Mid Campaign", () => onMidCampaign());
      }

      if (typeof onFinalBossReady === "function") {
        addButton(progressButtons, "Final Boss Ready", () => onFinalBossReady());
      }

      if (typeof onTriggerEndCredits === "function") {
        const creditsButton = addButton(progressButtons, "Trigger End Credits", () => {
          onTriggerEndCredits();
          close();
        });
        creditsButton.style.background = "#6e1f1f";
      }
    }

    if (
      typeof onUnlockAllSkills === "function"
      || typeof onResetSkills === "function"
      || typeof onMaxCurrency === "function"
      || typeof onSetCollectibles === "function"
    ) {
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


      if (typeof onSetCollectibles === "function") {
        addButton(skillButtons, "Set Currency", () => {
          const raw = window.prompt("Set collectible count (coins):", String(model.currency || 0));
          if (raw === null) return;
          const parsed = Number.parseInt(raw, 10);
          if (!Number.isFinite(parsed)) return;
          onSetCollectibles(parsed);
        });
      }

      if (typeof onToggleSkill === "function" && Array.isArray(model.skillEntries)) {
        const toggleGrid = document.createElement("div");
        toggleGrid.style.display = "grid";
        toggleGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
        toggleGrid.style.gap = "8px";
        toggleGrid.style.marginTop = "10px";
        skillLab.appendChild(toggleGrid);

        model.skillEntries.forEach(skill => {
          const toggleButton = addButton(toggleGrid, `${skill.enabled ? "Disable" : "Enable"} ${skill.name}`, () => onToggleSkill(skill.id));
          toggleButton.style.background = skill.enabled ? "#5e2a2a" : "#23503c";
        });
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
      info.textContent = `Stages: ${world.stageCount} | Boss stage: ${world.bossStage + 1} | ${world.bossDefeated ? "Boss defeated" : "Boss active"}`;
      card.appendChild(info);

      if (typeof onSetWorldState === "function") {
          if (!world.bossDefeated) {
            const worldStateButtons = document.createElement("div");
            worldStateButtons.style.display = "flex";
            worldStateButtons.style.gap = "6px";
            worldStateButtons.style.marginBottom = "8px";
            worldStateButtons.style.flexWrap = "wrap";
  
            const clearButton = addButton(worldStateButtons, "Boss Clear", () => onSetWorldState(world.index, "bossCleared"));
            clearButton.style.padding = "5px 8px";
            clearButton.style.background = "#5b4a16";
  
            card.appendChild(worldStateButtons);
          }
      }

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
