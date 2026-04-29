import { styleButton } from "./ui-theme.js";

export function createHud(uiElement, { onOpenInfo } = {}) {
  const root = document.createElement("div");
  const expandedRootWidth = "min(340px, calc(100vw - 32px))";
  root.style.position = "fixed";
  root.style.left = "16px";
  root.style.bottom = "16px";
  root.style.width = expandedRootWidth;
  root.style.zIndex = "12";
  root.style.pointerEvents = "none";
  root.style.color = "white";
  root.style.fontFamily = "Inter, 'Segoe UI', sans-serif";
  uiElement.appendChild(root);

  const panel = document.createElement("div");
  panel.className = "cj-glass cj-scrollbar";
  panel.style.padding = "12px 12px 10px";
  panel.style.maxHeight = "calc(100vh - 32px)";
  panel.style.overflow = "auto";
  panel.style.backdropFilter = "blur(8px) saturate(120%)";
  panel.style.background = "rgba(12, 18, 28, 0.82)";
  panel.style.boxShadow = "0 14px 30px rgba(0,0,0,0.28)";
  root.appendChild(panel);

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.flexWrap = "wrap";
  header.style.gap = "8px";
  header.style.marginBottom = "10px";
  panel.appendChild(header);

  const title = document.createElement("div");
  title.className = "cj-chip";
  title.style.fontWeight = "700";
  title.textContent = "Cubic Journey";
  header.appendChild(title);

  const status = document.createElement("div");
  status.className = "cj-chip";
  status.textContent = "HUD";
  header.appendChild(status);

  const collapseHudButton = document.createElement("button");
  collapseHudButton.className = "cj-chip";
  collapseHudButton.style.pointerEvents = "auto";
  collapseHudButton.style.cursor = "pointer";
  collapseHudButton.style.marginLeft = "auto";
  collapseHudButton.textContent = "Hide ◂";
  header.appendChild(collapseHudButton);

  const content = document.createElement("div");
  content.style.display = "grid";
  content.style.gap = "6px";
  panel.appendChild(content);

  const portalPromptDock = document.createElement("div");
  portalPromptDock.style.position = "fixed";
  portalPromptDock.style.left = "50%";
  portalPromptDock.style.bottom = "140px";
  portalPromptDock.style.zIndex = "12";
  portalPromptDock.style.pointerEvents = "none";
  portalPromptDock.style.width = "min(420px, calc(100vw - 32px))";
  portalPromptDock.style.transform = "translateX(-50%)";
  uiElement.appendChild(portalPromptDock);

  const portalPrompt = document.createElement("div");
  portalPrompt.className = "cj-card";
  portalPrompt.style.display = "none";
  portalPrompt.style.padding = "10px 12px";
  portalPrompt.style.background = "rgba(38, 28, 6, 0.94)";
  portalPrompt.style.border = "1px solid rgba(255, 221, 117, 0.4)";
  portalPrompt.style.boxShadow = "0 14px 30px rgba(0,0,0,0.32), 0 0 24px rgba(255, 221, 117, 0.18)";
  portalPrompt.style.color = "#ffe79a";
  portalPrompt.style.fontSize = "0.9rem";
  portalPrompt.style.lineHeight = "1.35";
  portalPromptDock.appendChild(portalPrompt);

  const skipPromptDock = document.createElement("div");
  skipPromptDock.style.position = "fixed";
  skipPromptDock.style.left = "50%";
  skipPromptDock.style.bottom = "24px";
  skipPromptDock.style.zIndex = "12";
  skipPromptDock.style.pointerEvents = "none";
  skipPromptDock.style.width = "min(460px, calc(100vw - 32px))";
  skipPromptDock.style.transform = "translateX(-50%)";
  uiElement.appendChild(skipPromptDock);

  const skipPrompt = document.createElement("div");
  skipPrompt.className = "cj-card";
  skipPrompt.style.display = "none";
  skipPrompt.style.padding = "10px 12px";
  skipPrompt.style.background = "rgba(18, 24, 38, 0.94)";
  skipPrompt.style.border = "1px solid rgba(126, 231, 255, 0.32)";
  skipPrompt.style.boxShadow = "0 14px 30px rgba(0,0,0,0.32), 0 0 24px rgba(126, 231, 255, 0.12)";
  skipPrompt.style.color = "#d8f8ff";
  skipPrompt.style.fontSize = "0.9rem";
  skipPrompt.style.lineHeight = "1.35";
  skipPromptDock.appendChild(skipPrompt);

  const centerBannerDock = document.createElement("div");
  centerBannerDock.style.position = "fixed";
  centerBannerDock.style.left = "50%";
  centerBannerDock.style.top = "50%";
  centerBannerDock.style.transform = "translate(-50%, -50%)";
  centerBannerDock.style.zIndex = "14";
  centerBannerDock.style.pointerEvents = "none";
  centerBannerDock.style.width = "min(560px, calc(100vw - 40px))";
  uiElement.appendChild(centerBannerDock);

  const centerBanner = document.createElement("div");
  centerBanner.className = "cj-card";
  centerBanner.style.display = "none";
  centerBanner.style.padding = "16px 18px";
  centerBanner.style.background = "rgba(8, 14, 22, 0.92)";
  centerBanner.style.border = "1px solid rgba(126, 231, 255, 0.22)";
  centerBanner.style.boxShadow = "0 20px 52px rgba(0,0,0,0.42)";
  centerBanner.style.textAlign = "center";
  centerBanner.style.letterSpacing = "0.04em";
  centerBanner.style.textTransform = "uppercase";
  centerBanner.style.color = "white";
  centerBanner.style.opacity = "0";
  centerBanner.style.transform = "translateY(10px) scale(0.98)";
  centerBanner.style.transition = "opacity 220ms ease, transform 220ms ease";
  centerBannerDock.appendChild(centerBanner);

  const centerBannerTitle = document.createElement("div");
  centerBannerTitle.style.fontSize = "0.76rem";
  centerBannerTitle.style.fontWeight = "800";
  centerBannerTitle.style.color = "rgba(255,255,255,0.68)";
  centerBannerTitle.style.marginBottom = "8px";
  centerBanner.appendChild(centerBannerTitle);

  const centerBannerBody = document.createElement("div");
  centerBannerBody.style.fontSize = "clamp(1.6rem, 4vw, 2.6rem)";
  centerBannerBody.style.fontWeight = "900";
  centerBannerBody.style.lineHeight = "1.1";
  centerBannerBody.style.color = "#fff2c4";
  centerBanner.appendChild(centerBannerBody);

  let centerBannerTimer = null;
  let lastBossBannerKey = "";

  let campaignInfoExpanded = false;
  let hudCollapsed = false;

  const collapsedHudTab = document.createElement("button");
  collapsedHudTab.className = "cj-chip";
  collapsedHudTab.style.pointerEvents = "auto";
  collapsedHudTab.style.cursor = "pointer";
  collapsedHudTab.style.display = "none";
  collapsedHudTab.style.padding = "0.45rem 0.75rem";
  collapsedHudTab.style.background = "rgba(10, 16, 28, 0.96)";
  collapsedHudTab.style.border = "1px solid rgba(126, 231, 255, 0.22)";
  collapsedHudTab.style.boxShadow = "0 14px 30px rgba(0,0,0,0.32)";
  collapsedHudTab.textContent = "Show HUD ▸";
  root.appendChild(collapsedHudTab);

  function setHudCollapsed(nextState) {
    hudCollapsed = nextState;
    panel.style.display = hudCollapsed ? "none" : "block";
    collapsedHudTab.style.display = hudCollapsed ? "inline-flex" : "none";
    root.style.width = hudCollapsed ? "auto" : expandedRootWidth;
    collapseHudButton.textContent = hudCollapsed ? "Show ▸" : "Hide ◂";
  }

  collapseHudButton.addEventListener("click", () => setHudCollapsed(!hudCollapsed));
  collapsedHudTab.addEventListener("click", () => setHudCollapsed(false));

  const helpDock = document.createElement("div");
  helpDock.style.position = "fixed";
  helpDock.style.right = "64px";
  helpDock.style.top = "16px";
  helpDock.style.zIndex = "13";
  helpDock.style.pointerEvents = "auto";
  helpDock.style.width = "min(380px, calc(100vw - 32px))";
  uiElement.appendChild(helpDock);

  const helpToggle = document.createElement("div");
  helpToggle.className = "cj-card";
  helpToggle.style.width = "100%";
  helpToggle.style.padding = "12px 14px";
  helpToggle.style.display = "flex";
  helpToggle.style.justifyContent = "space-between";
  helpToggle.style.alignItems = "center";
  helpToggle.style.gap = "10px";
  helpToggle.style.cursor = "pointer";
  helpToggle.style.color = "white";
  helpToggle.style.textAlign = "left";
  helpToggle.style.background = "rgba(10, 16, 28, 0.96)";
  helpToggle.style.border = "1px solid rgba(126, 231, 255, 0.22)";
  helpToggle.style.boxShadow = "0 18px 44px rgba(0,0,0,0.42)";
  helpToggle.innerHTML = `
    <span style="font-weight: 800; letter-spacing: 0.02em;">How to Play</span>
    <span style="display:flex; gap:8px; align-items:center;">
      <span data-help-arrow style="font-size: 1.1rem; line-height: 1;">▸</span>
      <span data-help-exit style="font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.82;">Open</span>
    </span>
  `;
  helpDock.appendChild(helpToggle);

  const helpPanel = document.createElement("div");
  helpPanel.className = "cj-card cj-scrollbar";
  helpPanel.style.marginTop = "8px";
  helpPanel.style.padding = "12px 12px 10px";
  helpPanel.style.maxHeight = "0";
  helpPanel.style.overflow = "hidden";
  helpPanel.style.opacity = "0";
  helpPanel.style.transform = "translateY(-6px)";
  helpPanel.style.transition = "max-height 220ms ease, opacity 180ms ease, transform 220ms ease";
  helpPanel.style.pointerEvents = "none";
  helpPanel.style.background = "rgba(10, 16, 28, 0.98)";
  helpPanel.style.border = "1px solid rgba(126, 231, 255, 0.22)";
  helpPanel.style.boxShadow = "0 22px 54px rgba(0,0,0,0.5)";
  helpDock.appendChild(helpPanel);

  let helpOpen = false;
  const helpArrow = helpToggle.querySelector("[data-help-arrow]");
  const helpExit = helpToggle.querySelector("[data-help-exit]");

  function setHelpOpen(nextState) {
    helpOpen = nextState;
    helpPanel.innerHTML = helpOpen ? buildHelpContent() : "";
    helpPanel.style.maxHeight = helpOpen ? "70vh" : "0";
    helpPanel.style.opacity = helpOpen ? "1" : "0";
    helpPanel.style.transform = helpOpen ? "translateY(0)" : "translateY(-6px)";
    helpPanel.style.pointerEvents = helpOpen ? "auto" : "none";
    if (helpArrow) helpArrow.textContent = helpOpen ? "▾" : "▸";
    if (helpExit) helpExit.textContent = helpOpen ? "Close" : "Open";
  }

  helpToggle.addEventListener("click", () => setHelpOpen(!helpOpen));
  setHelpOpen(false);

  function update(model) {
    const skipDockBottom = 24;
    const promptSeparation = 18;

    const rows = [
      makeRow("World", model.mode === "hub" ? "Hub" : model.worldName),
      makeRow("Status", model.mode === "hub" ? `${model.completedStages}/${model.totalStages} stages • ${model.keyCubes}/5 cubes` : `Stage ${model.stageNumber}/${model.stageCount} • ${model.collectedCoins} loot`),
      makeRow("Currency", `${model.currency} coins • ${model.skillCount} skills`)
    ];

    if (model.mode === "hub") {
      rows.push(makeRow("Action", "E enter portal • M world menu"));
      if (model.portalPrompt) rows.push(makeAlert(model.portalPrompt));
      if (model.skipPrompt) rows.push(makeAlert(model.skipPrompt));
      if (model.finalWin) rows.push(makeAlert("Campaign complete!", true));
    } else {
      rows.push(makeRow("Objective", model.isBossStage ? "Boss stage" : "Reach the goal cube"));
      if (model.skipPrompt) rows.push(makeAlert(model.skipPrompt));
    }

    const infoRow = document.createElement("div");
    infoRow.style.display = "grid";
    infoRow.style.gap = "8px";
    infoRow.style.marginTop = "4px";

    const infoToggle = document.createElement("button");
    infoToggle.className = "cj-card";
    infoToggle.style.pointerEvents = "auto";
    infoToggle.style.display = "flex";
    infoToggle.style.justifyContent = "space-between";
    infoToggle.style.alignItems = "center";
    infoToggle.style.padding = "10px 12px";
    infoToggle.style.cursor = "pointer";
    infoToggle.style.color = "white";
    infoToggle.style.textAlign = "left";
    infoToggle.innerHTML = `<span style="font-weight: 700;">Campaign Info</span>`;
    infoToggle.addEventListener("click", () => {
      campaignInfoExpanded = !campaignInfoExpanded;
      update(model);
    });
    infoRow.appendChild(infoToggle);

    if (campaignInfoExpanded) {
      const infoModal = document.createElement("div");
      infoModal.className = "cj-card";
      infoModal.style.padding = "10px";
      infoModal.style.display = "grid";
      infoModal.style.gap = "8px";

      const infoText = document.createElement("div");
      infoText.style.color = "rgba(255,255,255,0.82)";
      infoText.style.fontSize = "0.86rem";
      infoText.style.lineHeight = "1.45";
      infoText.textContent = "Open the full campaign modal for story details, progression, objectives, and hub/world status.";
      infoModal.appendChild(infoText);

      const modalActions = document.createElement("div");
      modalActions.style.display = "grid";
      modalActions.style.gridTemplateColumns = "1fr 1fr";
      modalActions.style.gap = "8px";
      infoModal.appendChild(modalActions);

      const openButton = document.createElement("button");
      openButton.textContent = "Open Modal";
      openButton.style.pointerEvents = "auto";
      styleButton(openButton, { compact: true, primary: true, fullWidth: true });
      if (typeof onOpenInfo === "function") {
        openButton.addEventListener("click", onOpenInfo);
      } else {
        openButton.disabled = true;
      }
      modalActions.appendChild(openButton);

      const collapseButton = document.createElement("button");
      collapseButton.textContent = "Collapse";
      collapseButton.style.pointerEvents = "auto";
      styleButton(collapseButton, { compact: true, fullWidth: true });
      collapseButton.addEventListener("click", () => {
        campaignInfoExpanded = false;
        update(model);
      });
      modalActions.appendChild(collapseButton);

      infoRow.appendChild(infoModal);
    }

    content.replaceChildren(...rows, infoRow);

    if (model.portalPrompt) {
      portalPrompt.textContent = model.portalPrompt;
      portalPrompt.style.display = "block";
    } else {
      portalPrompt.style.display = "none";
    }

    if (model.skipPrompt) {
      skipPrompt.textContent = model.skipPrompt;
      skipPrompt.style.display = "block";
    } else {
      skipPrompt.style.display = "none";
    }

    // Keep prompts low enough to avoid the action area, and stack them with consistent spacing.
    skipPromptDock.style.bottom = `${skipDockBottom}px`;
    if (model.portalPrompt && model.skipPrompt) {
      const stackedBottom = skipDockBottom + skipPrompt.offsetHeight + promptSeparation;
      portalPromptDock.style.bottom = `${stackedBottom}px`;
    } else {
      portalPromptDock.style.bottom = `${skipDockBottom}px`;
    }

    updateBossBanner(model);

  }

  function updateBossBanner(model) {
    const bossText = model.mode !== "hub" && model.bossName ? model.bossName : "";
    const bossKey = bossText ? `${model.worldName || ""}::${model.stageNumber || 0}::${bossText}` : "";

    if (!bossText) {
      hideBossBanner();
      lastBossBannerKey = "";
      return;
    }

    if (bossKey === lastBossBannerKey) return;

    lastBossBannerKey = bossKey;
    centerBannerTitle.textContent = "Boss Encounter";
    centerBannerBody.textContent = bossText;
    centerBanner.style.display = "block";
    centerBanner.style.opacity = "0";
    centerBanner.style.transform = "translateY(10px) scale(0.98)";
    requestAnimationFrame(() => {
      centerBanner.style.opacity = "1";
      centerBanner.style.transform = "translateY(0) scale(1)";
    });

    if (centerBannerTimer) {
      clearTimeout(centerBannerTimer);
    }

    centerBannerTimer = setTimeout(() => {
      hideBossBanner();
    }, 2200);
  }

  function hideBossBanner() {
    centerBanner.style.opacity = "0";
    centerBanner.style.transform = "translateY(-8px) scale(0.985)";
    if (centerBannerTimer) {
      clearTimeout(centerBannerTimer);
      centerBannerTimer = null;
    }
    setTimeout(() => {
      if (centerBanner.style.opacity === "0") {
        centerBanner.style.display = "none";
      }
    }, 280);
  }

  setHudCollapsed(false);

  return { update };
}

function buildHelpContent() {
  return `
    <div class="cj-kicker" style="margin-bottom: 8px;">Player Guide</div>
    <div style="display:grid; gap:10px;">
      <div style="color: rgba(255,255,255,0.86); line-height: 1.45; font-size: 0.9rem;">This game was made with $0 budget and pure vibe coding. It is meant to feel like a browser game, not a technical project showcase.</div>
      <div style="color: rgba(255,255,255,0.78); line-height: 1.5; font-size: 0.88rem;">Core controls: WASD to move, Space to jump and double jump, Shift to dash, E to interact, M for the world menu, P or Esc to pause, H to return to the hub from the world menu.</div>
      <div style="color: rgba(255,255,255,0.78); line-height: 1.5; font-size: 0.88rem;">Menus: the pause menu handles resume, travel, music, controls, shop, and campaign info. The campaign info screen holds the long story text. The controls menu lets you rebind keys. The shop menu spends coins on skills. The world menu is your stage selector.</div>
      <div style="color: rgba(255,255,255,0.78); line-height: 1.5; font-size: 0.88rem;">Cheats Menu: a developer utility panel for fast progression, teleporting, and skill/currency setup while testing. Activate it anytime with F10 or the backquote key ( 0060).</div>
      <div style="color: rgba(255,255,255,0.78); line-height: 1.5; font-size: 0.88rem;">Tips: collect key cubes to unlock new worlds, watch for portals in the hub, and use the pause menu if you need to change audio or open another screen.</div>
      <div style="color: rgba(255,255,255,0.55); line-height: 1.4; font-size: 0.76rem;">Build marker: skip-v1</div>
    </div>
  `;
}

function makeRow(label, value) {
  const row = document.createElement("div");
  row.className = "cj-card";
  row.style.padding = "8px 10px";
  row.style.display = "grid";
  row.style.gap = "3px";

  const labelNode = document.createElement("div");
  labelNode.className = "cj-kicker";
  labelNode.textContent = label;
  row.appendChild(labelNode);

  const valueNode = document.createElement("div");
  valueNode.style.lineHeight = "1.35";
  valueNode.style.fontSize = "0.92rem";
  valueNode.textContent = value;
  row.appendChild(valueNode);

  return row;
}

function makeAlert(text, success = false) {
  const row = document.createElement("div");
  row.className = "cj-chip";
  row.style.justifyContent = "space-between";
  row.style.background = success ? "rgba(100, 255, 168, 0.14)" : "rgba(255, 221, 117, 0.14)";
  row.style.borderColor = success ? "rgba(100, 255, 168, 0.25)" : "rgba(255, 221, 117, 0.25)";
  row.style.fontSize = "0.75rem";
  row.textContent = text;
  return row;
}
