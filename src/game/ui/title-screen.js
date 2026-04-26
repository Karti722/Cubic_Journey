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
  stylePanel(panel, { maxWidth: "840px", padding: "30px 34px", accent: "rgba(126, 231, 255, 0.22)" });
  panel.style.textAlign = "center";
  root.appendChild(panel);

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.justifyContent = "center";
  topRow.style.marginBottom = "16px";
  panel.appendChild(topRow);

  const kicker = document.createElement("div");
  kicker.textContent = "Zero-bundle 3D platform campaign";
  kicker.className = "cj-chip";
  kicker.style.animation = "cj-glow-pulse 1.6s ease-in-out infinite alternate";
  topRow.appendChild(kicker);

  const title = document.createElement("div");
  title.textContent = "Cubic Journey";
  styleHeading(title, { align: "center" });
  title.style.marginTop = "4px";
  panel.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.textContent = "A fast, expanding 3D platform campaign with cinematic menus, glowing worlds, and reactive combat effects.";
  styleSubtext(subtitle, { align: "center", marginBottom: "0", fontSize: "1.02rem" });
  subtitle.style.maxWidth = "58ch";
  subtitle.style.marginLeft = "auto";
  subtitle.style.marginRight = "auto";
  subtitle.style.marginTop = "8px";
  panel.appendChild(subtitle);

  const featureRow = document.createElement("div");
  featureRow.style.display = "flex";
  featureRow.style.gap = "10px";
  featureRow.style.justifyContent = "center";
  featureRow.style.flexWrap = "wrap";
  featureRow.style.marginTop = "18px";
  panel.appendChild(featureRow);

  ["Glowing 3D hubs", "Remappable controls", "Boss stages", "Loading overlays"].forEach(label => {
    const chip = document.createElement("div");
    chip.className = "cj-chip";
    chip.textContent = label;
    featureRow.appendChild(chip);
  });

  const prompt = document.createElement("div");
  prompt.textContent = "Press any key, click, or tap to start";
  prompt.style.marginTop = "24px";
  prompt.className = "cj-chip";
  prompt.style.padding = "0.75rem 1rem";
  prompt.style.fontWeight = "700";
  prompt.style.animation = "cj-pop-in 340ms ease both, cj-glow-pulse 1.6s ease-in-out infinite alternate";
  panel.appendChild(prompt);

  const row = document.createElement("div");
  row.style.marginTop = "18px";
  row.style.display = "flex";
  row.style.justifyContent = "center";
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
