import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";

export function createPauseMenu({ getModel, onResume, onSelectHub, onSelectWorld, onResetSave, onToggleMusic, onOpenControls, onOpenShop, onOpenInfo }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 30, background: "radial-gradient(circle at 20% 10%, rgba(102, 164, 255, 0.18), rgba(3, 5, 14, 0.94) 58%), linear-gradient(180deg, rgba(3, 5, 14, 0.84), rgba(0, 0, 0, 0.96))" });
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    stylePanel(panel, { maxWidth: "1120px", padding: "24px" });
    root.appendChild(panel);
    addButton(buttonRow, "Shop", () => {
      if (typeof onOpenShop === "function") onOpenShop();
    });
    addButton(buttonRow, "Campaign Info", () => {
      if (typeof onOpenInfo === "function") onOpenInfo();
    });
    styleHeading(title, { size: "clamp(2rem, 4vw, 3.2rem)", marginBottom: "8px" });
    panel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.textContent = model.mode === "hub" ? "You are in the hub world." : `Current world: ${model.worldName}`;
    styleSubtext(subtitle, { marginBottom: "18px" });
    panel.appendChild(subtitle);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "1.2fr 1fr 1fr";
    grid.style.gap = "16px";
    panel.appendChild(grid);

    grid.appendChild(makeSection("Controls", [
      "WASD: Move around using the camera angle",
      "Mouse drag / Arrow keys: Rotate and tilt the camera",
      "Space: Jump, double jump, or recover in-air",
      "Shift: Air dash",
      "Jump into walls: Wall jump",
      "E: Enter a portal from the hub",
      "M: Open quick world menu",
      "P / Esc: Pause and resume"
    ]));

    grid.appendChild(makeSection("Move Types", [
      "Double jump: Gives one extra jump while airborne",
      "Wall jump: Rebound away from nearby walls",
      "Air dash: Burst forward or in your movement direction",
      "Jump pads: Green pads launch you higher",
      "Dash orbs: Restore your air dash",
      "Key cubes: Boss rewards needed to unlock the final world"
    ]));

    grid.appendChild(makeSection("Progress", [
      `Stages cleared: ${model.completedStages}/${model.totalStages}`,
      `Key Cubes: ${model.keyCubes}/5`,
      `Coins: ${model.currency}`,
      `Skills owned: ${model.skillCount}`,
      `Unlocked worlds: ${model.unlockedWorldCount}/${model.worldCount}`,
      `Saved world: ${model.saveSummary}`,
      model.finalWin ? "Campaign complete." : "Keep collecting key cubes to access Core Rift."
    ]));

    const story = document.createElement("div");
    story.style.marginTop = "16px";
    styleCard(story, { padding: "14px" });
    story.innerHTML = `<strong>Story</strong><br>${model.storyBlurb}<br><br>${model.worldBlurb}`;
    panel.appendChild(story);

    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "10px";
    buttonRow.style.flexWrap = "wrap";
    buttonRow.style.marginTop = "18px";
    panel.appendChild(buttonRow);

    const resumeButton = addButton(buttonRow, "Resume", onResume);
    resumeButton.classList.add("cj-button-primary");

    addButton(buttonRow, model.musicEnabled ? "Music On" : "Music Off", onToggleMusic);
    addButton(buttonRow, "Controls", () => {
      if (typeof onOpenControls === "function") onOpenControls();
    });
    addButton(buttonRow, "Shop", () => {
      if (typeof onOpenShop === "function") onOpenShop();
    });
    addButton(buttonRow, "Campaign Info", () => {
      if (typeof onOpenInfo === "function") onOpenInfo();
    });
    addButton(buttonRow, "Travel to Hub", () => {
      onSelectHub();
      close();
    });
    addButton(buttonRow, "Reset Save", onResetSave);

    const worldsHeading = document.createElement("div");
    worldsHeading.style.marginTop = "22px";
    worldsHeading.style.marginBottom = "10px";
    worldsHeading.style.fontWeight = "700";
    worldsHeading.textContent = "World Travel";
    panel.appendChild(worldsHeading);

    const worldList = document.createElement("div");
    worldList.style.display = "grid";
    worldList.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
    worldList.style.gap = "10px";
    panel.appendChild(worldList);

    model.worlds.forEach((world, index) => {
      const card = document.createElement("button");
      card.style.textAlign = "left";
      styleCard(card, { padding: "12px", active: world.accessible });
      card.style.background = world.accessible ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
      card.style.color = world.accessible ? "white" : "rgba(255,255,255,0.45)";
      card.style.cursor = world.accessible ? "pointer" : "not-allowed";
      card.disabled = !world.accessible;
      card.innerHTML = `
        <div style="font-weight:700; margin-bottom:4px;">${index + 1}. ${world.name}</div>
        <div>Stage access: ${world.startStage + 1}/${world.totalStages}</div>
        <div>${world.hasBoss ? (world.bossDefeated ? "Boss cleared" : "Boss active") : "Final world"}</div>
        <div>${world.keyCubeReward ? "Awards a key cube on boss clear" : "Requires 5 key cubes"}</div>
      `;
      card.addEventListener("click", () => {
        onSelectWorld(index, world.startStage);
        close();
      });
      worldList.appendChild(card);
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
    if (isOpen) close(); else open();
  }

  return { open, close, toggle, render, isOpen: () => isOpen };
}

function makeSection(title, items) {
  const section = document.createElement("div");
  section.style.padding = "12px";
  section.style.background = "rgba(255,255,255,0.05)";

  const heading = document.createElement("div");
  heading.style.fontWeight = "700";
  heading.style.marginBottom = "8px";
  heading.textContent = title;
  section.appendChild(heading);

  const list = document.createElement("ul");
  list.style.margin = "0";
  list.style.paddingLeft = "18px";
  items.forEach(item => {
    const li = document.createElement("li");
    li.style.marginBottom = "6px";
    li.textContent = item;
    list.appendChild(li);
  });
  section.appendChild(list);
  return section;
}

function addButton(parent, label, handler) {
  const button = document.createElement("button");
  button.textContent = label;
  styleButton(button);
  button.addEventListener("click", handler);
  parent.appendChild(button);
  return button;
}
