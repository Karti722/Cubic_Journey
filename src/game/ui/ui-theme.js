let themeInjected = false;

export function ensureUiTheme() {
  if (themeInjected) return;
  themeInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :root {
      color-scheme: dark;
      --cj-text: #f3f6fb;
      --cj-muted: rgba(243, 246, 251, 0.72);
      --cj-panel: rgba(18, 24, 35, 0.92);
      --cj-panel-strong: rgba(15, 20, 30, 0.98);
      --cj-border: rgba(255, 255, 255, 0.1);
      --cj-accent: #5fa8ff;
      --cj-accent-strong: #8ad3ff;
      --cj-accent-warm: #f5c45e;
      --cj-danger: #ff6f87;
      --cj-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
    }

    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: linear-gradient(180deg, #060a12 0%, #0b1220 55%, #05070d 100%);
      color: var(--cj-text);
      font-family: Inter, 'Segoe UI', sans-serif;
    }

    body::before,
    body::after {
      content: '';
      position: fixed;
      inset: auto;
      width: 40vmax;
      height: 40vmax;
      border-radius: 999px;
      pointer-events: none;
      z-index: 0;
      filter: blur(80px);
      opacity: 0.2;
      animation: cj-drift 18s ease-in-out infinite alternate;
    }

    body::before {
      left: -10vmax;
      top: -10vmax;
      background: radial-gradient(circle, rgba(88, 140, 255, 0.7), rgba(88, 140, 255, 0.04) 60%, transparent 72%);
    }

    body::after {
      right: -12vmax;
      bottom: -12vmax;
      background: radial-gradient(circle, rgba(126, 231, 255, 0.48), rgba(126, 231, 255, 0.04) 60%, transparent 74%);
      animation-delay: -9s;
    }

    canvas {
      position: fixed;
      inset: 0;
      z-index: 1;
      display: block;
    }

    #ui {
      position: fixed;
      inset: 0;
      z-index: 5;
      pointer-events: none;
    }

    .cj-overlay {
      pointer-events: auto;
      backdrop-filter: blur(10px) saturate(130%);
    }

    .cj-glass {
      background: linear-gradient(180deg, var(--cj-panel), var(--cj-panel-strong));
      border: 1px solid var(--cj-border);
      border-radius: 14px;
      box-shadow: var(--cj-shadow);
      position: relative;
      overflow: hidden;
    }

    .cj-glass::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(255,255,255,0.08), transparent 30%, transparent 70%, rgba(255,255,255,0.04));
      pointer-events: none;
      opacity: 0.4;
    }

    .cj-title {
      margin: 0;
      font-size: clamp(1.6rem, 3vw, 3.4rem);
      line-height: 0.95;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .cj-kicker {
      margin: 0;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.56);
      font-size: 0.7rem;
    }

    .cj-subtitle {
      color: var(--cj-muted);
      line-height: 1.45;
      font-size: 0.95rem;
    }

    .cj-button {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      color: white;
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
      box-shadow: 0 8px 18px rgba(0,0,0,0.16);
      cursor: pointer;
      transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease;
      font-family: inherit;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .cj-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.24);
      border-color: rgba(95, 168, 255, 0.45);
    }

    .cj-button:active {
      transform: translateY(0) scale(0.99);
    }

    .cj-button-primary {
      background: linear-gradient(180deg, rgba(95, 168, 255, 0.96), rgba(55, 136, 230, 0.96));
      border-color: rgba(140, 209, 255, 0.52);
      color: #f5fbff;
    }

    .cj-button-danger {
      background: linear-gradient(180deg, #ff6c8d, #ff8e6c);
      border-color: rgba(255, 170, 190, 0.52);
      color: #1a0410;
    }

    .cj-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border-radius: 10px;
      padding: 0.35rem 0.65rem;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.84);
      font-size: 0.75rem;
      letter-spacing: 0.03em;
    }

    .cj-grid {
      display: grid;
      gap: 12px;
    }

    .cj-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
    }

    .cj-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(126, 231, 255, 0.4) rgba(255,255,255,0.06);
    }

    .cj-scrollbar::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    .cj-scrollbar::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 999px;
    }

    .cj-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, rgba(126, 231, 255, 0.6), rgba(102, 164, 255, 0.72));
      border-radius: 999px;
      border: 2px solid rgba(0,0,0,0.18);
    }

    @keyframes cj-drift {
      from { transform: translate3d(0, 0, 0) scale(1); }
      to { transform: translate3d(3vmax, 2vmax, 0) scale(1.08); }
    }

    @keyframes cj-pop-in {
      from { opacity: 0; transform: translateY(14px) scale(0.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes cj-glow-pulse {
      from { opacity: 0.5; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1.04); }
    }
  `;

  document.head.appendChild(style);
}

export function styleOverlayRoot(root, options = {}) {
  ensureUiTheme();
  const {
    zIndex = 40,
    padding = "18px",
    align = "center",
    justify = "center",
    background = "radial-gradient(circle at 20% 20%, rgba(84, 122, 255, 0.18), rgba(3, 6, 14, 0.94) 56%), linear-gradient(180deg, rgba(2, 4, 10, 0.82), rgba(5, 9, 18, 0.96))"
  } = options;

  root.classList.add("cj-overlay");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.display = "flex";
  root.style.alignItems = align;
  root.style.justifyContent = justify;
  root.style.padding = padding;
  root.style.background = background;
  root.style.color = "white";
  root.style.fontFamily = "'Space Grotesk', 'Segoe UI', sans-serif";
  root.style.zIndex = String(zIndex);
  root.style.overflow = "auto";
}

export function stylePanel(panel, options = {}) {
  const { maxWidth = "860px", padding = "18px", accent = "rgba(95, 168, 255, 0.18)" } = options;
  panel.classList.add("cj-glass", "cj-pop-in");
  panel.style.width = "100%";
  panel.style.maxWidth = maxWidth;
  panel.style.margin = "0 auto";
  panel.style.padding = padding;
  panel.style.animation = "cj-pop-in 320ms ease both";
  panel.style.boxShadow = `0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px ${accent}`;
}

export function styleHeading(node, options = {}) {
  const { size = "clamp(1.5rem, 3vw, 2.8rem)", marginBottom = "0.2rem", align = "left" } = options;
  node.classList.add("cj-title");
  node.style.fontSize = size;
  node.style.marginBottom = marginBottom;
  node.style.textAlign = align;
}

export function styleKicker(node) {
  node.classList.add("cj-kicker");
}

export function styleSubtext(node, options = {}) {
  const { marginBottom = "0", fontSize = "0.95rem", align = "left" } = options;
  node.classList.add("cj-subtitle");
  node.style.marginBottom = marginBottom;
  node.style.fontSize = fontSize;
  node.style.textAlign = align;
}

export function styleButton(button, options = {}) {
  const { primary = false, danger = false, compact = false, fullWidth = false } = options;
  button.classList.add("cj-button");
  if (primary) button.classList.add("cj-button-primary");
  if (danger) button.classList.add("cj-button-danger");
  button.style.padding = compact ? "7px 10px" : "9px 14px";
  button.style.minHeight = compact ? "30px" : "36px";
  button.style.width = fullWidth ? "100%" : "auto";
}

export function styleCard(card, options = {}) {
  const { padding = "14px", active = false } = options;
  card.classList.add("cj-card");
  card.style.padding = padding;
  card.style.borderColor = active ? "rgba(126, 231, 255, 0.48)" : "rgba(255,255,255,0.12)";
  card.style.boxShadow = active ? "0 0 0 1px rgba(126, 231, 255, 0.26), inset 0 1px 0 rgba(255,255,255,0.05)" : "inset 0 1px 0 rgba(255,255,255,0.05)";
}

export function styleChip(node) {
  node.classList.add("cj-chip");
}

export function styleGrid(node, options = {}) {
  const { columns = "repeat(auto-fit, minmax(200px, 1fr))", gap = "10px" } = options;
  node.classList.add("cj-grid");
  node.style.gridTemplateColumns = columns;
  node.style.gap = gap;
}
