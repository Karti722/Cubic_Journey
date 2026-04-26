import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";

export function createCampaignInfoMenu({ getModel, onClose }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 35, background: "radial-gradient(circle at 50% 12%, rgba(95, 168, 255, 0.12), rgba(2, 4, 10, 0.94) 58%), linear-gradient(180deg, rgba(2, 4, 10, 0.8), rgba(0, 0, 0, 0.95))" });
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    stylePanel(panel, { maxWidth: "760px", padding: "18px" });
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "Campaign Overview";
    styleHeading(title, { size: "1.9rem", marginBottom: "6px" });
    panel.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.textContent = model.mode === "hub" ? "Current hub status and campaign notes." : `Current world: ${model.worldName}`;
    styleSubtext(subtitle, { marginBottom: "14px" });
    panel.appendChild(subtitle);

    const storyCard = document.createElement("div");
    styleCard(storyCard, { padding: "14px" });
    storyCard.style.marginBottom = "12px";
    storyCard.innerHTML = `<div class="cj-kicker" style="margin-bottom: 8px;">Story</div><div style="line-height: 1.5; color: rgba(255,255,255,0.9);">${model.storyLine}</div>`;
    panel.appendChild(storyCard);

    const summaryGrid = document.createElement("div");
    summaryGrid.style.display = "grid";
    summaryGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    summaryGrid.style.gap = "10px";
    panel.appendChild(summaryGrid);

    summaryGrid.appendChild(makeCard("Progress", `${model.completedStages}/${model.totalStages} stages`));
    summaryGrid.appendChild(makeCard("Key Cubes", `${model.keyCubes}/5`));
    summaryGrid.appendChild(makeCard("Coins", String(model.currency)));
    summaryGrid.appendChild(makeCard("Skills", String(model.skillCount)));

    if (model.mode !== "hub") {
      summaryGrid.appendChild(makeCard("Objective", model.isBossStage ? "Boss stage" : "Reach the goal cube"));
      if (model.bossName) summaryGrid.appendChild(makeCard("Boss", model.bossName));
    }

    const note = document.createElement("div");
    note.style.marginTop = "12px";
    note.style.color = "rgba(255,255,255,0.72)";
    note.style.fontSize = "0.9rem";
    note.textContent = model.mode === "hub"
      ? "Use this menu for the longer campaign and hub text so the HUD stays compact during play."
      : "This menu keeps the longer story and status text separated from the in-game HUD.";
    panel.appendChild(note);

    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.justifyContent = "flex-end";
    buttonRow.style.marginTop = "16px";
    panel.appendChild(buttonRow);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    styleButton(closeButton, { primary: true });
    closeButton.addEventListener("click", () => {
      close();
      if (typeof onClose === "function") onClose();
    });
    buttonRow.appendChild(closeButton);
  }

  function open() {
    isOpen = true;
    render();
    root.style.display = "flex";
  }

  function close() {
    isOpen = false;
    root.style.display = "none";
  }

  return { open, close, render, isOpen: () => isOpen };
}

function makeCard(label, value) {
  const card = document.createElement("div");
  styleCard(card, { padding: "12px" });

  const labelNode = document.createElement("div");
  labelNode.className = "cj-kicker";
  labelNode.style.marginBottom = "4px";
  labelNode.textContent = label;
  card.appendChild(labelNode);

  const valueNode = document.createElement("div");
  valueNode.style.color = "rgba(255,255,255,0.92)";
  valueNode.style.lineHeight = "1.4";
  valueNode.textContent = value;
  card.appendChild(valueNode);

  return card;
}