let themeInjected = false;

export function ensureUiTheme() {
  if (themeInjected) return;
  themeInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&display=swap');

    :root {
      color-scheme: dark;
      --cj-text: #f7f8ff;
      --cj-muted: rgba(247, 248, 255, 0.74);
      --cj-panel: rgba(8, 12, 24, 0.74);
      --cj-panel-strong: rgba(12, 18, 36, 0.94);
      --cj-border: rgba(255, 255, 255, 0.16);
      --cj-accent: #66a4ff;
      --cj-accent-strong: #7ee7ff;
      --cj-accent-warm: #ffd56c;
      --cj-danger: #ff6b87;
      --cj-shadow: 0 28px 90px rgba(0, 0, 0, 0.5);
    }

    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background:
        radial-gradient(circle at 20% 20%, rgba(71, 123, 255, 0.16), transparent 32%),
        radial-gradient(circle at 80% 10%, rgba(126, 231, 255, 0.12), transparent 22%),
        radial-gradient(circle at 50% 100%, rgba(255, 165, 96, 0.08), transparent 30%),
        linear-gradient(180deg, #03050d 0%, #07101d 58%, #020308 100%);
      color: var(--cj-text);
      font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
    }

    body::before,
    body::after {
      content: '';
      position: fixed;
      inset: auto;
      width: 56vmax;
      height: 56vmax;
      border-radius: 999px;
      pointer-events: none;
      z-index: 0;
      filter: blur(85px);
      opacity: 0.34;
      animation: cj-drift 18s ease-in-out infinite alternate;
    }

    body::before {
      left: -16vmax;
      top: -14vmax;
      background: radial-gradient(circle, rgba(88, 140, 255, 0.72), rgba(88, 140, 255, 0.05) 60%, transparent 72%);
    }

    body::after {
      right: -18vmax;
      bottom: -16vmax;
      background: radial-gradient(circle, rgba(126, 231, 255, 0.6), rgba(126, 231, 255, 0.04) 60%, transparent 74%);
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
      backdrop-filter: blur(18px) saturate(150%);
    }

    .cj-glass {
      background: linear-gradient(180deg, rgba(15, 20, 38, 0.92), rgba(8, 11, 22, 0.88));
      border: 1px solid var(--cj-border);
      border-radius: 24px;
      box-shadow: var(--cj-shadow);
      position: relative;
      overflow: hidden;
    }

    .cj-glass::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(255,255,255,0.12), transparent 30%, transparent 70%, rgba(255,255,255,0.06));
      pointer-events: none;
      opacity: 0.5;
    }

    .cj-title {
      margin: 0;
      font-size: clamp(2rem, 4vw, 4.8rem);
      line-height: 0.9;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-shadow: 0 8px 36px rgba(0, 0, 0, 0.45);
    }

    .cj-kicker {
      margin: 0;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.62);
      font-size: 0.78rem;
    }

    .cj-subtitle {
      color: var(--cj-muted);
      line-height: 1.55;
    }

    .cj-button {
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 999px;
      color: white;
      background: rgba(255,255,255,0.1);
      box-shadow: 0 8px 24px rgba(0,0,0,0.22);
      cursor: pointer;
      transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease;
      font-family: inherit;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .cj-button:hover {
      transform: translateY(-1px) scale(1.01);
      box-shadow: 0 12px 28px rgba(0,0,0,0.28);
      border-color: rgba(126, 231, 255, 0.4);
    }

    .cj-button:active {
      transform: translateY(0) scale(0.99);
    }

    .cj-button-primary {
      background: linear-gradient(135deg, var(--cj-accent), #4dd1ff);
      border-color: rgba(126, 231, 255, 0.7);
      color: #03101e;
    }

    .cj-button-danger {
      background: linear-gradient(135deg, #ff6c8d, #ff9a6c);
      border-color: rgba(255, 170, 190, 0.7);
      color: #1a0410;
    }

    .cj-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border-radius: 999px;
      padding: 0.4rem 0.75rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.88);
      font-size: 0.82rem;
      letter-spacing: 0.03em;
    }

    .cj-grid {
      display: grid;
      gap: 12px;
    }

    .cj-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
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
      background: linear-gradient(180deg, rgba(126, 231, 255, 0.72), rgba(102, 164, 255, 0.72));
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
    padding = "24px",
    align = "center",
    justify = "center",
    background = "radial-gradient(circle at 20% 20%, rgba(84, 122, 255, 0.28), rgba(3, 6, 14, 0.92) 56%), linear-gradient(180deg, rgba(2, 4, 10, 0.84), rgba(5, 9, 18, 0.96))"
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
  const { maxWidth = "960px", padding = "24px", accent = "rgba(126, 231, 255, 0.15)" } = options;
  panel.classList.add("cj-glass", "cj-pop-in");
  panel.style.width = "100%";
  panel.style.maxWidth = maxWidth;
  panel.style.margin = "0 auto";
  panel.style.padding = padding;
  panel.style.animation = "cj-pop-in 320ms ease both";
  panel.style.boxShadow = `0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px ${accent}`;
}

export function styleHeading(node, options = {}) {
  const { size = "clamp(2rem, 4vw, 4.25rem)", marginBottom = "0.25rem", align = "left" } = options;
  node.classList.add("cj-title");
  node.style.fontSize = size;
  node.style.marginBottom = marginBottom;
  node.style.textAlign = align;
}

export function styleKicker(node) {
  node.classList.add("cj-kicker");
}

export function styleSubtext(node, options = {}) {
  const { marginBottom = "0", fontSize = "1rem", align = "left" } = options;
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
  button.style.padding = compact ? "8px 12px" : "11px 16px";
  button.style.minHeight = compact ? "34px" : "42px";
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
  const { columns = "repeat(auto-fit, minmax(220px, 1fr))", gap = "12px" } = options;
  node.classList.add("cj-grid");
  node.style.gridTemplateColumns = columns;
  node.style.gap = gap;
}
