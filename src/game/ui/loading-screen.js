import { ensureUiTheme, styleButton, styleHeading, styleOverlayRoot, stylePanel, styleSubtext } from "./ui-theme.js";

export function createLoadingScreen() {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, { zIndex: 80, background: "radial-gradient(circle at 20% 20%, rgba(126, 231, 255, 0.18), rgba(2, 6, 14, 0.94) 58%), linear-gradient(180deg, rgba(2, 4, 10, 0.82), rgba(5, 8, 18, 0.96))" });
  root.style.display = "none";
  document.body.appendChild(root);

  const panel = document.createElement("div");
  stylePanel(panel, { maxWidth: "640px", padding: "28px", accent: "rgba(126, 231, 255, 0.22)" });
  panel.style.textAlign = "center";
  panel.style.transform = "translateY(-2vh)";
  root.appendChild(panel);

  const kicker = document.createElement("div");
  kicker.textContent = "Loading";
  kicker.className = "cj-kicker";
  kicker.style.marginBottom = "10px";
  panel.appendChild(kicker);

  const title = document.createElement("div");
  title.textContent = "Cubic Journey";
  styleHeading(title, { align: "center" });
  title.style.letterSpacing = "0.12em";
  panel.appendChild(title);

  const message = document.createElement("div");
  message.textContent = "Preparing the world...";
  styleSubtext(message, { align: "center", marginBottom: "18px", fontSize: "1.02rem" });
  panel.appendChild(message);

  const barWrap = document.createElement("div");
  barWrap.style.height = "10px";
  barWrap.style.borderRadius = "999px";
  barWrap.style.overflow = "hidden";
  barWrap.style.background = "rgba(255,255,255,0.08)";
  barWrap.style.border = "1px solid rgba(255,255,255,0.1)";
  barWrap.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.08)";
  panel.appendChild(barWrap);

  const bar = document.createElement("div");
  bar.style.width = "28%";
  bar.style.height = "100%";
  bar.style.borderRadius = "999px";
  bar.style.background = "linear-gradient(90deg, #66a4ff, #7ee7ff, #ffd56c)";
  bar.style.boxShadow = "0 0 20px rgba(126, 231, 255, 0.5)";
  bar.style.animation = "cj-glow-pulse 1.2s ease-in-out infinite alternate";
  barWrap.appendChild(bar);

  const hint = document.createElement("div");
  hint.textContent = "If this takes a moment, the game is still building the scene.";
  styleSubtext(hint, { align: "center", marginBottom: "18px", fontSize: "0.92rem" });
  hint.style.opacity = "0.82";
  panel.appendChild(hint);

  const buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.gap = "10px";
  buttonRow.style.justifyContent = "center";
  buttonRow.style.flexWrap = "wrap";
  panel.appendChild(buttonRow);

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Still loading...";
  styleButton(cancelButton, { compact: true });
  cancelButton.disabled = true;
  buttonRow.appendChild(cancelButton);

  let visible = false;

  function setMessage(nextMessage) {
    message.textContent = nextMessage;
  }

  function show(nextMessage) {
    if (nextMessage) setMessage(nextMessage);
    root.style.display = "flex";
    visible = true;
  }

  function hide() {
    root.style.display = "none";
    visible = false;
  }

  function destroy() {
    root.remove();
  }

  return {
    show,
    hide,
    destroy,
    setMessage,
    isVisible: () => visible
  };
}
