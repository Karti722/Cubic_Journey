export function createPauseMenu({ getModel, onResume, onSelectHub, onSelectWorld, onResetSave, onToggleMusic, onOpenControls, onOpenShop }) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.background = "rgba(0, 0, 0, 0.78)";
  root.style.color = "white";
  root.style.padding = "24px";
  root.style.fontFamily = "sans-serif";
  root.style.display = "none";
  root.style.zIndex = "30";
  root.style.overflowY = "auto";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    panel.style.maxWidth = "980px";
    panel.style.margin = "0 auto";
    panel.style.background = "rgba(8, 12, 24, 0.92)";
    panel.style.border = "1px solid rgba(255,255,255,0.15)";
    panel.style.padding = "20px";
    panel.style.boxShadow = "0 20px 60px rgba(0,0,0,0.35)";
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "Pause Menu";
    title.style.fontSize = "28px";
    title.style.fontWeight = "800";
    title.style.marginBottom = "12px";
    panel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.textContent = model.mode === "hub" ? "You are in the hub world." : `Current world: ${model.worldName}`;
    subtitle.style.opacity = "0.85";
    subtitle.style.marginBottom = "18px";
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
    story.style.padding = "14px";
    story.style.background = "rgba(255,255,255,0.05)";
    story.innerHTML = `<strong>Story</strong><br>${model.storyBlurb}<br><br>${model.worldBlurb}`;
    panel.appendChild(story);

    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "10px";
    buttonRow.style.flexWrap = "wrap";
    buttonRow.style.marginTop = "18px";
    panel.appendChild(buttonRow);

    const resumeButton = addButton(buttonRow, "Resume", onResume);
    resumeButton.style.background = "#2e7dff";
    resumeButton.style.color = "white";

    addButton(buttonRow, model.musicEnabled ? "Music On" : "Music Off", onToggleMusic);
    addButton(buttonRow, "Controls", () => {
      if (typeof onOpenControls === "function") onOpenControls();
    });
    addButton(buttonRow, "Shop", () => {
      if (typeof onOpenShop === "function") onOpenShop();
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
      card.style.padding = "12px";
      card.style.border = "1px solid rgba(255,255,255,0.15)";
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
  button.style.padding = "10px 14px";
  button.style.border = "none";
  button.style.background = "rgba(255,255,255,0.12)";
  button.style.color = "inherit";
  button.style.cursor = "pointer";
  button.addEventListener("click", handler);
  parent.appendChild(button);
  return button;
}
