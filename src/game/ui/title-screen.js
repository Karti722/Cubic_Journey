import { ensureUiTheme, styleButton, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";

export function createTitleScreen({ onStart, onOpenControls }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, {
    zIndex: 50,
    background: "radial-gradient(circle at 50% 12%, rgba(117, 169, 255, 0.28), rgba(2, 5, 14, 0.92) 60%), linear-gradient(180deg, rgba(4, 7, 15, 0.86), rgba(0, 0, 0, 0.98))"
  });
  document.body.appendChild(root);

  const music = new Audio("src/game/audio/music/title.mp3");
  music.loop = true;
  music.volume = 0.5;
  music.preload = "auto";

  let started = false;
  let startTriggered = false;

  const panel = document.createElement("div");
  stylePanel(panel, { maxWidth: "720px", padding: "22px 24px", accent: "rgba(95, 168, 255, 0.18)" });
  panel.style.textAlign = "left";
  root.appendChild(panel);

  const headerRow = document.createElement("div");
  headerRow.style.display = "flex";
  headerRow.style.justifyContent = "space-between";
  headerRow.style.alignItems = "center";
  headerRow.style.gap = "12px";
  headerRow.style.marginBottom = "16px";
  panel.appendChild(headerRow);

  const kicker = document.createElement("div");
  kicker.textContent = "Steam-style campaign launcher";
  kicker.className = "cj-chip";
  headerRow.appendChild(kicker);

  const chips = document.createElement("div");
  chips.style.display = "flex";
  chips.style.gap = "8px";
  chips.style.flexWrap = "wrap";
  chips.style.justifyContent = "flex-end";
  headerRow.appendChild(chips);

  ["3D platformer", "Boss stages", "Remappable controls"].forEach(label => {
    const chip = document.createElement("div");
    chip.className = "cj-chip";
    chip.textContent = label;
    chips.appendChild(chip);
  });

  const title = document.createElement("div");
  title.textContent = "Cubic Journey";
  styleHeading(title, { align: "left", size: "clamp(2.2rem, 4vw, 3.8rem)" });
  title.style.marginTop = "0";
  panel.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.textContent = "A fast 3D platform campaign with glowing worlds, boss stages, and compact Steam-like menus.";
  styleSubtext(subtitle, { align: "left", marginBottom: "0", fontSize: "0.95rem" });
  subtitle.style.maxWidth = "56ch";
  subtitle.style.marginTop = "8px";
  panel.appendChild(subtitle);

  const prompt = document.createElement("div");
  prompt.textContent = "Press any key, click, or tap to start";
  prompt.style.marginTop = "16px";
  prompt.className = "cj-chip";
  prompt.style.padding = "0.55rem 0.85rem";
  prompt.style.fontWeight = "700";
  prompt.style.animation = "cj-pop-in 340ms ease both, cj-glow-pulse 1.6s ease-in-out infinite alternate";
  panel.appendChild(prompt);

  const row = document.createElement("div");
  row.style.marginTop = "14px";
  row.style.display = "flex";
  row.style.justifyContent = "flex-start";
  row.style.gap = "10px";
  row.style.flexWrap = "wrap";
  panel.appendChild(row);

  if (typeof onOpenControls === "function") {
    addButton(row, "Controls", () => {
      onOpenControls();
    });
  }

  function begin() {
    if (startTriggered) return;
    startTriggered = true;
    safePlay(music);
    setTimeout(() => {
      destroy();
      if (typeof onStart === "function") onStart();
    }, 120);
  }

  function onPointerDown() {
    begin();
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    begin();
  }

  addEventListener("pointerdown", onPointerDown, { once: true });
  addEventListener("keydown", onKeyDown, { once: true });

  function destroy() {
    if (started) return;
    started = true;
    music.pause();
    root.remove();
    removeEventListener("pointerdown", onPointerDown);
    removeEventListener("keydown", onKeyDown);
  }

  return { destroy };
}

function addButton(parent, label, handler) {
  const button = document.createElement("button");
  button.textContent = label;
  styleButton(button, { primary: true });
  button.addEventListener("click", handler);
  parent.appendChild(button);
  return button;
}

function safePlay(audio) {
  const result = audio.play();
  if (result && typeof result.catch === "function") {
    result.catch(() => {});
  }
}
