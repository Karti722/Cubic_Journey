import { ensureUiTheme, styleButton, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";

export function createTitleScreen({ onStart, onOpenControls }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, {
    zIndex: 50,
    background: "radial-gradient(circle at 50% 12%, rgba(117, 169, 255, 0.28), rgba(2, 5, 14, 0.92) 60%), linear-gradient(180deg, rgba(4, 7, 15, 0.86), rgba(0, 0, 0, 0.98))"
  });
  document.body.appendChild(root);

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
  subtitle.textContent = "Best played full screen.";
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
  prompt.style.fontWeight = "800";
  prompt.style.letterSpacing = "0.03em";
  prompt.style.textTransform = "uppercase";
  prompt.style.fontSize = "0.82rem";
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

  function begin() {
    if (started) return;
    started = true;
    setTimeout(() => {
      destroy();
      if (typeof onStart === "function") onStart();
    }, 120);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    root.remove();
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
