import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, styleSubtext } from "./ui-theme.js";

export function createWorldMenu({ getModel, onSelectHub, onSelectWorld, onResetSave }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 20, align: "flex-start", justify: "flex-end", padding: "20px", background: "rgba(2, 5, 14, 0.72)" });
  root.style.pointerEvents = "auto";
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;
  let guideExpanded = false;

  function render() {
    const model = getModel();

    root.innerHTML = "";

    const panel = document.createElement("div");
    styleCard(panel, { padding: "16px" });
    panel.style.width = "min(980px, calc(100vw - 24px))";
    panel.style.maxHeight = "82vh";
    panel.style.overflowY = "auto";
    panel.style.background = "rgba(10, 16, 28, 0.96)";
    panel.style.border = "1px solid rgba(126, 231, 255, 0.22)";
    panel.style.boxShadow = "0 28px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)";
    panel.classList.add("cj-scrollbar");
    panel.style.display = "grid";
    panel.style.gridTemplateColumns = "280px 1fr";
    panel.style.gap = "14px";
    root.appendChild(panel);

    const left = document.createElement("div");
    left.style.display = "grid";
    left.style.gap = "10px";
    left.style.alignContent = "start";
    panel.appendChild(left);

    const right = document.createElement("div");
    right.style.display = "grid";
    right.style.gap = "10px";
    right.style.alignContent = "start";
    panel.appendChild(right);

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "start";
    header.style.gap = "10px";
    left.appendChild(header);

    const title = document.createElement("div");
    title.textContent = "World Travel Menu";
    styleHeading(title, { size: "1.6rem", marginBottom: "2px" });
    header.appendChild(title);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Exit";
    styleButton(closeButton, { compact: true, danger: true });
    closeButton.addEventListener("click", close);
    header.appendChild(closeButton);

    const subtitle = document.createElement("div");
    subtitle.textContent = `Key Cubes: ${model.keyCubes}/5`;
    styleSubtext(subtitle, { marginBottom: "0", fontSize: "0.95rem" });
    left.appendChild(subtitle);

    const worldSummary = document.createElement("div");
    worldSummary.className = "cj-card";
    worldSummary.style.padding = "12px";
    worldSummary.innerHTML = `
      <div class="cj-kicker" style="margin-bottom: 6px;">Route Summary</div>
      <div style="line-height: 1.5; color: rgba(255,255,255,0.86);">Choose a world, or jump back to the hub. Worlds unlock as you collect key cubes and clear stages.</div>
    `;
    left.appendChild(worldSummary);

    const guideToggle = document.createElement("button");
    guideToggle.className = "cj-button";
    guideToggle.style.width = "100%";
    guideToggle.style.padding = "12px 14px";
    guideToggle.style.textAlign = "left";
    guideToggle.style.display = "flex";
    guideToggle.style.justifyContent = "space-between";
    guideToggle.style.alignItems = "center";
    guideToggle.style.marginTop = "2px";
    guideToggle.textContent = guideExpanded ? "Hide player guide" : "Show player guide";
    guideToggle.addEventListener("click", () => {
      guideExpanded = !guideExpanded;
      render();
    });
    left.appendChild(guideToggle);

    if (guideExpanded) {
      left.appendChild(buildGuideCard());
    }

    const hubButton = document.createElement("button");
    hubButton.textContent = "Travel to Hub";
    styleButton(hubButton, { primary: true, fullWidth: true });
    hubButton.style.marginTop = "2px";
    hubButton.addEventListener("click", () => {
      onSelectHub();
      close();
    });
    left.appendChild(hubButton);

    const reset = document.createElement("button");
    reset.textContent = "Reset Save";
    styleButton(reset, { danger: true, fullWidth: true });
    reset.addEventListener("click", () => {
      onResetSave();
      render();
    });
    left.appendChild(reset);

    const routeHeader = document.createElement("div");
    routeHeader.className = "cj-kicker";
    routeHeader.textContent = "World Routes";
    right.appendChild(routeHeader);

    const routeGrid = document.createElement("div");
    routeGrid.style.display = "grid";
    routeGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
    routeGrid.style.gap = "10px";
    right.appendChild(routeGrid);

    for (let i = 0; i < model.worlds.length; i += 1) {
      const world = model.worlds[i];

      const button = document.createElement("button");
      button.style.textAlign = "left";
      button.style.padding = "12px";
      button.className = "cj-button";
      button.style.whiteSpace = "normal";
      button.style.minHeight = "92px";
      button.style.display = "grid";
      button.style.gap = "6px";

      const status = world.accessible ? "Open" : "Locked";
      const progress = `Stage ${world.startStage + 1}/${world.totalStages}`;
      const boss = world.hasBoss ? (world.bossDefeated ? "Boss: Cleared" : "Boss: Pending") : "Final World";
      button.innerHTML = `
        <div style="font-weight: 800; font-size: 1rem;">${i + 1}. ${world.name}</div>
        <div style="color: rgba(255,255,255,0.82); font-size: 0.84rem; line-height: 1.4;">${status} • ${progress} • ${boss}</div>
      `;
      button.disabled = !world.accessible;

      button.addEventListener("click", () => {
        onSelectWorld(i, world.startStage);
        close();
      });

      routeGrid.appendChild(button);
    }

    const footerNote = document.createElement("div");
    footerNote.className = "cj-subtitle";
    footerNote.textContent = "Press M to close the menu and H to return to the hub quickly.";
    right.appendChild(footerNote);

    const footerRow = document.createElement("div");
    footerRow.style.display = "flex";
    footerRow.style.justifyContent = "flex-end";
    right.appendChild(footerRow);

    const exitButton = document.createElement("button");
    exitButton.textContent = "Exit";
    styleButton(exitButton, { primary: true });
    exitButton.addEventListener("click", close);
    footerRow.appendChild(exitButton);
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

function buildGuideCard() {
  const card = document.createElement("div");
  card.className = "cj-card";
  card.style.padding = "12px";
  card.style.display = "grid";
  card.style.gap = "8px";

  card.innerHTML = `
    <div class="cj-kicker">Player Guide</div>
    <div style="color: rgba(255,255,255,0.88); line-height: 1.5; font-size: 0.9rem;">Movement is built around jump timing, dash control, and quick retries. The menu is intentionally compact so you can check progress without feeling like you left the game.</div>
  `;

  const items = [
    ["WASD", "Move"],
    ["Space", "Jump / double jump"],
    ["Shift", "Dash"],
    ["M", "Open / close world menu"],
    ["H", "Return to hub"],
    ["P or Esc", "Pause the game"],
    ["E", "Interact with portals and objects"],
    ["Campaign Info", "Use the HUD or pause menu for story details"],
  ];

  items.forEach(([key, value]) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "64px 1fr";
    row.style.gap = "8px";
    row.style.alignItems = "start";

    const keyChip = document.createElement("div");
    keyChip.className = "cj-chip";
    keyChip.style.justifyContent = "center";
    keyChip.textContent = key;
    row.appendChild(keyChip);

    const valueNode = document.createElement("div");
    valueNode.style.color = "rgba(255,255,255,0.78)";
    valueNode.style.fontSize = "0.88rem";
    valueNode.style.lineHeight = "1.35";
    valueNode.textContent = value;
    row.appendChild(valueNode);

    card.appendChild(row);
  });

  const note = document.createElement("div");
  note.style.marginTop = "4px";
  note.style.color = "rgba(255,255,255,0.66)";
  note.style.fontSize = "0.82rem";
  note.textContent = "If you forget anything, this guide is here as a quick reference before you launch into a stage.";
  card.appendChild(note);

  return card;
}
