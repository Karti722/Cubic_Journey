import { ensureUiTheme, styleButton, styleCard, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";
import { SKILL_DEFINITIONS } from "../skills/skill-data.js";

export function createShopMenu({ getModel, onBuySkill, onClose }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 40, background: "radial-gradient(circle at 85% 15%, rgba(255, 213, 108, 0.16), rgba(3, 4, 10, 0.94) 58%), linear-gradient(180deg, rgba(2, 4, 10, 0.84), rgba(0, 0, 0, 0.96))" });
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();
    root.innerHTML = "";

    const panel = document.createElement("div");
    stylePanel(panel, { maxWidth: "1100px", padding: "22px" });
    root.appendChild(panel);

    const title = document.createElement("div");
    title.textContent = "Skill Shop";
    styleHeading(title, { size: "clamp(2rem, 4vw, 3rem)", marginBottom: "8px" });
    panel.appendChild(title);

    const currency = document.createElement("div");
    currency.textContent = `Coins: ${model.currency}`;
    styleSubtext(currency, { marginBottom: "18px" });
    panel.appendChild(currency);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(240px, 1fr))";
    grid.style.gap = "12px";
    panel.appendChild(grid);

    SKILL_DEFINITIONS.forEach(skill => {
      const card = document.createElement("div");
      styleCard(card, { padding: "14px" });

      const heading = document.createElement("div");
      heading.className = "cj-kicker";
      heading.textContent = skill.name;
      card.appendChild(heading);

      const desc = document.createElement("div");
      desc.style.marginTop = "6px";
      desc.style.color = "rgba(255,255,255,0.84)";
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
      button.style.cursor = owned || model.currency < skill.cost ? "not-allowed" : "pointer";
      styleButton(button, { primary: !owned && model.currency >= skill.cost, fullWidth: true });
      if (owned) button.style.background = "rgba(100, 255, 168, 0.16)";
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
  styleButton(button, { compact: false });
  button.addEventListener("click", handler);
  parent.appendChild(button);
  return button;
}
