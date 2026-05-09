import { ensureUiTheme, styleButton, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";

export function createTitleScreen({ onStart, onStartMinigame, onOpenControls }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, {
    zIndex: 50,
    background: "radial-gradient(circle at 50% 12%, rgba(117, 169, 255, 0.28), rgba(2, 5, 14, 0.92) 60%), linear-gradient(180deg, rgba(4, 7, 15, 0.86), rgba(0, 0, 0, 0.98))"
  });
  document.body.appendChild(root);

  // Animated background layer (subtle motion)
  const bgAnim = document.createElement("div");
  bgAnim.style.position = "absolute";
  bgAnim.style.inset = "0";
  bgAnim.style.pointerEvents = "none";
  bgAnim.style.zIndex = "48";
  bgAnim.style.transition = "opacity 300ms ease";
  bgAnim.style.mixBlendMode = "overlay";
  bgAnim.style.opacity = "0.9";
  root.appendChild(bgAnim);

  let _animId = null;
  let _start = performance.now();
  function _tick(now) {
    const t = (now - _start) * 0.00012; // slow motion
    const x = Math.cos(t * 0.6) * 40 + 50;
    const y = Math.sin(t * 0.4) * 30 + 50;
    // moving radial gradients to give subtle parallax
    bgAnim.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(78,120,180,0.08), transparent 12%), radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(180,120,90,0.04), transparent 18%)`;
    _animId = requestAnimationFrame(_tick);
  }
  _animId = requestAnimationFrame(_tick);

  let destroyed = false;
  let started = false;

  const panel = document.createElement("div");
  stylePanel(panel, { maxWidth: "760px", padding: "18px", accent: "rgba(95, 168, 255, 0.16)" });
  panel.style.display = "grid";
  panel.style.gap = "14px";
  root.appendChild(panel);

  const title = document.createElement("div");
  title.textContent = "Cubic Journey";
  styleHeading(title, { align: "left", size: "clamp(3rem, 6vw, 4.6rem)" });
  title.style.margin = "0";
  panel.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.textContent = "Made by Kartikeya Kumaria. Best played full screen.";
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
  prompt.textContent = "Press the Play button to start";
  prompt.style.fontWeight = "600";
  prompt.style.letterSpacing = "0.01em";
  prompt.style.textTransform = "none";
  prompt.style.fontSize = "0.92rem";
  launchBar.appendChild(prompt);

  const playButton = document.createElement("button");
  playButton.textContent = "Play";
  styleButton(playButton, { primary: true });
  playButton.style.padding = "0.95rem 1.5rem";
  playButton.style.fontSize = "1rem";
  playButton.style.letterSpacing = "0.06em";
  playButton.style.textTransform = "uppercase";
  playButton.style.boxShadow = "0 16px 32px rgba(0,0,0,0.28), 0 0 0 1px rgba(126, 231, 255, 0.18), 0 0 28px rgba(95, 168, 255, 0.28)";
  playButton.style.transition = "transform 140ms ease, box-shadow 140ms ease, filter 140ms ease";
  playButton.addEventListener("pointerenter", () => {
    playButton.style.transform = "translateY(-1px) scale(1.02)";
    playButton.style.filter = "brightness(1.08) saturate(1.08)";
    playButton.style.boxShadow = "0 18px 38px rgba(0,0,0,0.3), 0 0 0 1px rgba(126, 231, 255, 0.26), 0 0 36px rgba(95, 168, 255, 0.38)";
  });
  playButton.addEventListener("pointerleave", () => {
    playButton.style.transform = "translateY(0) scale(1)";
    playButton.style.filter = "none";
    playButton.style.boxShadow = "0 16px 32px rgba(0,0,0,0.28), 0 0 0 1px rgba(126, 231, 255, 0.18), 0 0 28px rgba(95, 168, 255, 0.28)";
  });
  playButton.addEventListener("click", begin);
  launchBar.appendChild(playButton);

  const minigameButton = document.createElement("button");
  minigameButton.textContent = "Slash Minigame";
  styleButton(minigameButton, { primary: true });
  minigameButton.style.padding = "0.95rem 1.35rem";
  minigameButton.style.fontSize = "0.95rem";
  minigameButton.style.letterSpacing = "0.05em";
  minigameButton.style.textTransform = "uppercase";
  minigameButton.style.background = "linear-gradient(135deg, #8a2b28, #dc6d30)";
  minigameButton.style.boxShadow = "0 16px 30px rgba(0,0,0,0.28), 0 0 0 1px rgba(255, 178, 129, 0.2), 0 0 28px rgba(220, 109, 48, 0.32)";
  minigameButton.addEventListener("pointerenter", () => {
    minigameButton.style.transform = "translateY(-1px) scale(1.02)";
    minigameButton.style.filter = "brightness(1.08) saturate(1.08)";
  });
  minigameButton.addEventListener("pointerleave", () => {
    minigameButton.style.transform = "translateY(0) scale(1)";
    minigameButton.style.filter = "none";
  });
  minigameButton.addEventListener("click", beginMinigame);
  launchBar.appendChild(minigameButton);

  const linksWrap = document.createElement("div");
  linksWrap.style.display = "flex";
  linksWrap.style.gap = "8px";
  linksWrap.style.alignItems = "center";
  launchBar.appendChild(linksWrap);

  const sourceButton = document.createElement("button");
  sourceButton.textContent = "Source Code";
  styleButton(sourceButton, { primary: false });
  sourceButton.style.padding = "0.55rem 0.9rem";
  sourceButton.style.fontSize = "0.82rem";
  sourceButton.style.background = "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))";
  sourceButton.style.boxShadow = "0 8px 18px rgba(0,0,0,0.36)";
  sourceButton.addEventListener("click", () => {
    window.open("https://github.com/Karti722/Cubic_Journey", "_blank");
  });
  linksWrap.appendChild(sourceButton);

  function begin() {
    if (started) return;
    started = true;
    setTimeout(() => {
      destroy();
      if (typeof onStart === "function") onStart();
    }, 120);
  }

  function beginMinigame() {
    if (started) return;
    started = true;
    setTimeout(() => {
      destroy();
      if (typeof onStartMinigame === "function") onStartMinigame();
      else if (typeof onStart === "function") onStart();
    }, 120);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    root.remove();
    if (_animId) cancelAnimationFrame(_animId);
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
