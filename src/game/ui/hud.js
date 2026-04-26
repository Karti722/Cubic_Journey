export function createHud(uiElement) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.left = "20px";
  root.style.top = "20px";
  root.style.maxWidth = "560px";
  root.style.zIndex = "12";
  root.style.pointerEvents = "none";
  root.style.color = "white";
  root.style.fontFamily = "'Space Grotesk', 'Segoe UI', sans-serif";
  uiElement.appendChild(root);

  const panel = document.createElement("div");
  panel.className = "cj-glass cj-scrollbar";
  panel.style.padding = "14px 16px";
  panel.style.maxHeight = "calc(100vh - 40px)";
  panel.style.overflow = "auto";
  panel.style.backdropFilter = "blur(16px) saturate(145%)";
  panel.style.background = "rgba(10, 14, 28, 0.55)";
  panel.style.boxShadow = "0 18px 50px rgba(0,0,0,0.26)";
  root.appendChild(panel);

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.flexWrap = "wrap";
  header.style.gap = "10px";
  header.style.marginBottom = "12px";
  panel.appendChild(header);

  const title = document.createElement("div");
  title.className = "cj-chip";
  title.style.fontWeight = "800";
  title.textContent = "Cubic Journey HUD";
  header.appendChild(title);

  const status = document.createElement("div");
  status.className = "cj-chip";
  status.textContent = "Live campaign telemetry";
  header.appendChild(status);

  const content = document.createElement("div");
  content.style.display = "grid";
  content.style.gap = "8px";
  panel.appendChild(content);

  function update(model) {
    const rows = [];

    rows.push(makeRow("Movement", "WASD move, Space jump/double jump, Shift air dash, wall jump on contact"));
    rows.push(makeRow("Camera", "Mouse drag or arrow keys rotate and tilt the camera"));
    rows.push(makeRow("Menus", "M world menu, H return to hub, P / Esc pause"));

    if (model.mode === "hub") {
      rows.push(makeRow("Hub World", model.storyLine));
      rows.push(makeRow("Progress", `${model.completedStages}/${model.totalStages} stages`));
      rows.push(makeRow("Inventory", `${model.keyCubes}/5 key cubes • ${model.currency} coins • ${model.skillCount} skills`));
      rows.push(makeRow("Action", "Walk into a portal and press E, or use the world menu (M)"));
      if (model.portalPrompt) rows.push(makeAlert(model.portalPrompt));
      if (model.finalWin) rows.push(makeAlert("Campaign complete! You cleared every stage.", true));
    } else {
      rows.push(makeRow("World", `${model.worldName} • Stage ${model.stageNumber}/${model.stageCount}`));
      rows.push(makeRow("Story", model.storyLine));
      rows.push(makeRow("Progress", `${model.completedStages}/${model.totalStages} total stages`));
      rows.push(makeRow("Loot", `${model.collectedCoins} collectibles • ${model.keyCubes}/5 key cubes • ${model.currency} coins`));
      rows.push(makeRow("Skills", `${model.skillCount} owned`));
      rows.push(makeRow("Objective", model.isBossStage ? "Boss stage: claim the key cube core" : "Reach the stage goal cube"));
      if (model.bossName) rows.push(makeAlert(`Boss: ${model.bossName}`));
    }

    content.replaceChildren(...rows);
  }

  return { update };
}

function makeRow(label, value) {
  const row = document.createElement("div");
  row.className = "cj-card";
  row.style.padding = "10px 12px";
  row.style.display = "grid";
  row.style.gap = "4px";

  const labelNode = document.createElement("div");
  labelNode.className = "cj-kicker";
  labelNode.textContent = label;
  row.appendChild(labelNode);

  const valueNode = document.createElement("div");
  valueNode.style.lineHeight = "1.45";
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
  row.textContent = text;
  return row;
}
