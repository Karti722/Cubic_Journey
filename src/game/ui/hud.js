import { styleButton } from "./ui-theme.js";

export function createHud(uiElement, { onOpenInfo } = {}) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.left = "16px";
  root.style.bottom = "16px";
  root.style.width = "min(340px, calc(100vw - 32px))";
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

  const content = document.createElement("div");
  content.style.display = "grid";
  content.style.gap = "6px";
  panel.appendChild(content);

  function update(model) {
    const rows = [
      makeRow("World", model.mode === "hub" ? "Hub" : model.worldName),
      makeRow("Status", model.mode === "hub" ? `${model.completedStages}/${model.totalStages} stages • ${model.keyCubes}/5 cubes` : `Stage ${model.stageNumber}/${model.stageCount} • ${model.collectedCoins} loot`),
      makeRow("Currency", `${model.currency} coins • ${model.skillCount} skills`)
    ];

    if (model.mode === "hub") {
      rows.push(makeRow("Action", "E enter portal • M world menu"));
      if (model.portalPrompt) rows.push(makeAlert(model.portalPrompt));
      if (model.finalWin) rows.push(makeAlert("Campaign complete!", true));
    } else {
      rows.push(makeRow("Objective", model.isBossStage ? "Boss stage" : "Reach the goal cube"));
      if (model.bossName) rows.push(makeAlert(`Boss: ${model.bossName}`));
    }

    const infoRow = document.createElement("div");
    infoRow.style.display = "flex";
    infoRow.style.gap = "8px";
    infoRow.style.flexWrap = "wrap";
    infoRow.style.marginTop = "4px";

    const infoButton = document.createElement("button");
    infoButton.textContent = "Campaign Info";
    infoButton.style.pointerEvents = "auto";
    styleButton(infoButton, { compact: true, fullWidth: true });
    if (typeof onOpenInfo === "function") {
      infoButton.addEventListener("click", onOpenInfo);
    } else {
      infoButton.disabled = true;
    }
    content.replaceChildren(...rows, infoRow);
    infoRow.appendChild(infoButton);

  }

  return { update };
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
