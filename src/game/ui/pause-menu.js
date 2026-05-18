import { ensureUiTheme, styleButton, styleOverlayRoot, stylePanel } from "./ui-theme.js";

export function createPauseMenu({ getModel, onResume, onSelectHub, onSelectWorld, onReturnTitle, onResetSave, onToggleMusic, onOpenControls, onOpenShop, onOpenInfo, onEnterMinigame, onPlayPauseSfx }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, {
    zIndex: 30,
    background: "radial-gradient(circle at 20% 10%, rgba(102, 164, 255, 0.16), rgba(3, 5, 14, 0.96) 60%), linear-gradient(180deg, rgba(3, 5, 14, 0.86), rgba(0, 0, 0, 0.98))"
  });
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    stylePanel(panel, { maxWidth: "1100px", padding: "16px" });
    panel.style.display = "grid";
    panel.style.gridTemplateColumns = "260px 1fr";
    panel.style.gap = "14px";
    root.appendChild(panel);

    const left = document.createElement("div");
    left.style.display = "grid";
    left.style.gap = "10px";
    panel.appendChild(left);

    const right = document.createElement("div");
    right.style.display = "grid";
    right.style.gap = "12px";
    panel.appendChild(right);

    left.appendChild(card("Paused", `Cubic Journey${model.mode === "hub" ? "" : ` - ${model.worldName}`}`, model.mode === "hub" ? "You are in the hub world." : "Pause shell"));

    const actions = document.createElement("div");
    actions.className = "cj-card";
    actions.style.padding = "12px";
    actions.style.display = "grid";
    actions.style.gap = "8px";
    left.appendChild(actions);

    addRailButton(actions, "Resume", onResume, true);
    if (!model.minigameActive) {
      addRailButton(actions, "Play Slash Minigame", () => typeof onEnterMinigame === "function" && onEnterMinigame());
    }
    addRailButton(actions, model.musicEnabled ? "Music On" : "Music Off", onToggleMusic);
    addRailButton(actions, "Controls", () => typeof onOpenControls === "function" && onOpenControls());
    addRailButton(actions, "Shop", () => typeof onOpenShop === "function" && onOpenShop());
    addRailButton(actions, "Campaign Info", () => typeof onOpenInfo === "function" && onOpenInfo());
    addRailButton(actions, "Back to Title", () => typeof onReturnTitle === "function" && onReturnTitle());
    addRailButton(actions, "Travel to Hub", () => {
      onSelectHub();
      close();
    });
    addRailButton(actions, "Reset Save", onResetSave, false, true);

    const statsRow = document.createElement("div");
    statsRow.style.display = "grid";
    statsRow.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    statsRow.style.gap = "10px";
    right.appendChild(statsRow);
    statsRow.appendChild(statCard("Stages", `${model.completedStages}/${model.totalStages}`));
    statsRow.appendChild(statCard("Key Cubes", `${model.keyCubes}/5`));
    statsRow.appendChild(statCard("Coins", `${model.currency}`));

    const sections = document.createElement("div");
    sections.style.display = "grid";
    sections.style.gridTemplateColumns = "1fr 1fr";
    sections.style.gap = "12px";
    right.appendChild(sections);

    sections.appendChild(section("Controls", ["WASD movement", "Space jump / double jump", "Shift dash", "F 360 slash", "M world menu", "P / Esc pause"]));
    sections.appendChild(section("Progress", [`Bosses cleared: ${model.bossesClearedCount}/${model.worldCount}`, `Skills owned: ${model.skillCount}`, `Saved world: ${model.saveSummary}`, model.finalWin ? "Campaign complete." : "Keep collecting key cubes."]));

    const story = document.createElement("div");
    story.className = "cj-card";
    story.style.padding = "14px";
    story.innerHTML = `<div class="cj-kicker" style="margin-bottom: 8px;">Mission Brief</div><div style="line-height: 1.5; color: rgba(255,255,255,0.9);">${model.storyBlurb}</div><div style="margin-top: 10px; line-height: 1.5; color: rgba(255,255,255,0.76);">${model.worldBlurb}</div>`;
    right.appendChild(story);

    const worldHeader = document.createElement("div");
    worldHeader.className = "cj-kicker";
    worldHeader.textContent = "World Travel";
    right.appendChild(worldHeader);

    const worldList = document.createElement("div");
    worldList.style.display = "grid";
    worldList.style.gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))";
    worldList.style.gap = "10px";
    right.appendChild(worldList);

    model.worlds.forEach((world, index) => {
      const button = document.createElement("button");
      button.className = "cj-card";
      button.style.textAlign = "left";
      button.style.padding = "12px";
      button.style.cursor = world.accessible ? "pointer" : "not-allowed";
      button.style.color = world.accessible ? "white" : "rgba(255,255,255,0.45)";
      button.style.background = world.accessible ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)";
      button.disabled = !world.accessible;
      button.innerHTML = `
        <div class="cj-kicker" style="margin-bottom: 5px;">World ${index + 1}</div>
        <div style="font-weight: 800; margin-bottom: 4px; text-transform: uppercase;">${world.name}</div>
        <div style="color: rgba(255,255,255,0.72); font-size: 0.9rem; line-height: 1.45;">Stage ${world.startStage + 1}/${world.totalStages}${world.hasBoss ? (world.bossDefeated ? " • Boss cleared" : " • Boss active") : ""}</div>
      `;
      button.addEventListener("click", () => {
        onSelectWorld(index, world.startStage);
        close();
      });
      worldList.appendChild(button);
    });

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "center";
    footer.style.gap = "10px";
    right.appendChild(footer);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    styleButton(closeButton, { primary: true });
    closeButton.addEventListener("click", close);
    footer.appendChild(closeButton);
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    if (typeof onPlayPauseSfx === "function") onPlayPauseSfx();
    render();
    root.style.display = "flex";
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    if (typeof onPlayPauseSfx === "function") onPlayPauseSfx();
    root.style.display = "none";
  }

  function toggle() {
    if (isOpen) close(); else open();
  }

  return { open, close, toggle, render, isOpen: () => isOpen };
}

function addRailButton(parent, label, handler, primary = false, danger = false) {
  const button = document.createElement("button");
  button.textContent = label;
  styleButton(button, { compact: false, primary, danger, fullWidth: true });
  button.addEventListener("click", handler);
  parent.appendChild(button);
  return button;
}

function card(kicker, title, subtitle) {
  const wrapper = document.createElement("div");
  wrapper.className = "cj-card";
  wrapper.style.padding = "14px";
  wrapper.innerHTML = `
    <div class="cj-kicker" style="margin-bottom: 6px;">${kicker}</div>
    <div style="font-size: 1.25rem; font-weight: 800; line-height: 1.05; text-transform: uppercase;">${title}</div>
    <div style="margin-top: 8px; color: rgba(255,255,255,0.72); line-height: 1.45; font-size: 0.92rem;">${subtitle}</div>
  `;
  return wrapper;
}

function statCard(label, value) {
  const card = document.createElement("div");
  card.className = "cj-card";
  card.style.padding = "10px 12px";
  card.innerHTML = `
    <div class="cj-kicker" style="margin-bottom: 4px;">${label}</div>
    <div style="font-weight: 800; font-size: 1rem;">${value}</div>
  `;
  return card;
}

function section(title, items) {
  const wrapper = document.createElement("div");
  wrapper.className = "cj-card";
  wrapper.style.padding = "12px";

  const heading = document.createElement("div");
  heading.className = "cj-kicker";
  heading.style.marginBottom = "8px";
  heading.textContent = title;
  wrapper.appendChild(heading);

  const list = document.createElement("div");
  list.style.display = "grid";
  list.style.gap = "6px";
  items.forEach((item) => {
    const line = document.createElement("div");
    line.style.color = "rgba(255,255,255,0.84)";
    line.style.fontSize = "0.9rem";
    line.style.lineHeight = "1.35";
    line.textContent = item;
    list.appendChild(line);
  });
  wrapper.appendChild(list);
  return wrapper;
}