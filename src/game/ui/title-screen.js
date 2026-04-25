export function createTitleScreen({ onStart, onOpenControls }) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.display = "flex";
  root.style.alignItems = "center";
  root.style.justifyContent = "center";
  root.style.background = "radial-gradient(circle at top, rgba(40, 75, 140, 0.85), rgba(0, 0, 0, 0.96) 65%)";
  root.style.color = "white";
  root.style.fontFamily = "sans-serif";
  root.style.zIndex = "50";
  root.style.overflow = "hidden";
  document.body.appendChild(root);

  const music = new Audio("src/game/audio/music/title.mp3");
  music.loop = true;
  music.volume = 0.5;
  music.preload = "auto";

  let started = false;
  let startTriggered = false;

  const panel = document.createElement("div");
  panel.style.textAlign = "center";
  panel.style.padding = "24px 32px";
  panel.style.border = "1px solid rgba(255,255,255,0.18)";
  panel.style.background = "rgba(8, 12, 24, 0.7)";
  panel.style.backdropFilter = "blur(8px)";
  panel.style.boxShadow = "0 30px 80px rgba(0,0,0,0.45)";
  panel.style.maxWidth = "720px";
  root.appendChild(panel);

  const title = document.createElement("div");
  title.textContent = "Cubic Journey";
  title.style.fontSize = "clamp(42px, 8vw, 84px)";
  title.style.fontWeight = "900";
  title.style.letterSpacing = "0.08em";
  title.style.textTransform = "uppercase";
  panel.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.textContent = "A fast, expanding 3D platform campaign";
  subtitle.style.marginTop = "12px";
  subtitle.style.opacity = "0.82";
  subtitle.style.fontSize = "18px";
  panel.appendChild(subtitle);

  const prompt = document.createElement("div");
  prompt.textContent = "Press any key, click, or tap to start";
  prompt.style.marginTop = "28px";
  prompt.style.padding = "12px 18px";
  prompt.style.border = "1px solid rgba(255,255,255,0.18)";
  prompt.style.display = "inline-block";
  prompt.style.background = "rgba(255,255,255,0.08)";
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
  button.style.padding = "12px 18px";
  button.style.border = "none";
  button.style.background = "#2e7dff";
  button.style.color = "white";
  button.style.fontWeight = "700";
  button.style.cursor = "pointer";
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
