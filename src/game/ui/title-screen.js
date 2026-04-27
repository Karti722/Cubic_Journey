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

  let destroyed = false;
  let started = false;

  const panel = document.createElement("div");
  stylePanel(panel, { maxWidth: "760px", padding: "18px", accent: "rgba(95, 168, 255, 0.16)" });
  panel.style.display = "grid";
  panel.style.gap = "14px";
  root.appendChild(panel);

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.justifyContent = "space-between";
  topRow.style.alignItems = "center";
  topRow.style.gap = "10px";
  panel.appendChild(topRow);

  const badge = document.createElement("div");
  badge.className = "cj-chip";
  badge.textContent = "Browser game";
  topRow.appendChild(badge);

  const tinyHint = document.createElement("div");
  tinyHint.className = "cj-chip";
  tinyHint.textContent = "Best played full screen";
  topRow.appendChild(tinyHint);

  const title = document.createElement("div");
  title.textContent = "Cubic Journey";
  styleHeading(title, { align: "left", size: "clamp(3rem, 6vw, 4.6rem)" });
  title.style.margin = "0";
  panel.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.textContent = "Press any button to play.";
  styleSubtext(subtitle, { align: "left", marginBottom: "0", fontSize: "1rem" });
  subtitle.style.maxWidth = "44ch";
  panel.appendChild(subtitle);

  const launchBar = document.createElement("div");
  launchBar.className = "cj-card";
  launchBar.style.padding = "14px";
  launchBar.style.display = "flex";
  launchBar.style.justifyContent = "space-between";
  launchBar.style.alignItems = "center";
  launchBar.style.gap = "12px";
  launchBar.style.flexWrap = "wrap";
  panel.appendChild(launchBar);

  const prompt = document.createElement("div");
  prompt.textContent = "Press any key, click, or tap to start";
  prompt.style.fontWeight = "800";
  prompt.style.letterSpacing = "0.03em";
  prompt.style.textTransform = "uppercase";
  prompt.style.fontSize = "0.82rem";
  launchBar.appendChild(prompt);

  const playButton = document.createElement("button");
  playButton.textContent = "Play";
  styleButton(playButton, { primary: true });
  playButton.addEventListener("click", begin);
  launchBar.appendChild(playButton);

  const footerRow = document.createElement("div");
  footerRow.style.display = "flex";
  footerRow.style.justifyContent = "space-between";
  footerRow.style.alignItems = "center";
  footerRow.style.gap = "10px";
  footerRow.style.flexWrap = "wrap";
  panel.appendChild(footerRow);

  const sourceText = document.createElement("div");
  sourceText.className = "cj-subtitle";
  sourceText.style.maxWidth = "44ch";
  sourceText.textContent = "This is the GitHub repo for Cubic Journey. Download the zip, make your own version, remix it, or do whatever you want with this codebase.";
  footerRow.appendChild(sourceText);

  if (typeof onOpenControls === "function") {
    const controlsButton = document.createElement("button");
    controlsButton.textContent = "Controls";
    styleButton(controlsButton, { primary: false });
    controlsButton.addEventListener("click", onOpenControls);
    footerRow.appendChild(controlsButton);
  }

  const sourceLink = document.createElement("a");
  sourceLink.href = "https://github.com/Karti722/Cubic_Journey";
  sourceLink.target = "_blank";
  sourceLink.rel = "noreferrer";
  sourceLink.textContent = "Open source repo";
  sourceLink.className = "cj-chip";
  sourceLink.style.display = "inline-flex";
  sourceLink.style.width = "fit-content";
  sourceLink.style.textDecoration = "none";
  sourceLink.style.color = "white";
  footerRow.appendChild(sourceLink);

  addEventListener("pointerdown", begin, { once: true });
  addEventListener("keydown", onKeyDown, { once: true });

  function begin() {
    if (started) return;
    started = true;
    safePlay(music);
    setTimeout(() => {
      destroy();
      if (typeof onStart === "function") onStart();
    }, 120);
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    begin();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    music.pause();
    root.remove();
    removeEventListener("pointerdown", begin);
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