import { SKILL_DEFINITIONS } from "../skills/skill-data.js";

export function createShopMenu({ getModel, onBuySkill, onClose }) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.background = "rgba(0, 0, 0, 0.82)";
  root.style.color = "white";
  root.style.padding = "24px";
  root.style.fontFamily = "sans-serif";
  root.style.display = "none";
  root.style.zIndex = "40";
  root.style.overflowY = "auto";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    panel.style.maxWidth = "1080px";
    panel.style.margin = "0 auto";
    panel.style.background = "rgba(8, 12, 24, 0.95)";
    panel.style.border = "1px solid rgba(255,255,255,0.15)";
    panel.style.padding = "20px";
    panel.style.boxShadow = "0 20px 60px rgba(0,0,0,0.35)";
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "Skill Shop";
    title.style.fontSize = "28px";
    title.style.fontWeight = "800";
    title.style.marginBottom = "8px";
    panel.appendChild(title);

    const currency = document.createElement("div");
    currency.textContent = `Coins: ${model.currency}`;
    currency.style.opacity = "0.85";
    currency.style.marginBottom = "18px";
    panel.appendChild(currency);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(240px, 1fr))";
    grid.style.gap = "12px";
    panel.appendChild(grid);

    SKILL_DEFINITIONS.forEach(skill => {
      const card = document.createElement("div");
      card.style.padding = "14px";
      card.style.background = "rgba(255,255,255,0.05)";
      card.style.border = "1px solid rgba(255,255,255,0.12)";

      const heading = document.createElement("div");
      heading.style.fontWeight = "700";
      heading.textContent = skill.name;
      card.appendChild(heading);

      const desc = document.createElement("div");
      desc.style.marginTop = "6px";
      desc.style.opacity = "0.84";
      desc.textContent = skill.description;
      card.appendChild(desc);

      const owned = Boolean(model.skills[skill.id]);
      const status = document.createElement("div");
      status.style.marginTop = "10px";
      status.textContent = owned ? "Owned" : `Cost: ${skill.cost}`;
      card.appendChild(status);

      const button = document.createElement("button");
      button.textContent = owned ? "Owned" : `Buy ${skill.cost}`;
      button.style.marginTop = "10px";
      button.style.padding = "8px 12px";
      button.style.border = "none";
      button.style.cursor = owned || model.currency < skill.cost ? "not-allowed" : "pointer";
      button.style.background = owned ? "rgba(128,255,160,0.18)" : model.currency >= skill.cost ? "#2e7dff" : "rgba(255,255,255,0.12)";
      button.style.color = "white";
      button.disabled = owned || model.currency < skill.cost;
      button.addEventListener("click", () => {
        onBuySkill(skill.id);
        render();
      });
      card.appendChild(button);

      grid.appendChild(card);
    });

    const bottom = document.createElement("div");
    bottom.style.marginTop = "18px";
    panel.appendChild(bottom);

    addButton(bottom, "Close", () => {
      close();
      if (typeof onClose === "function") onClose();
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

  return { open, close, render, isOpen: () => isOpen };
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
