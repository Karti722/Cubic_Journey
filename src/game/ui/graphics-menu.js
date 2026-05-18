import { ensureUiTheme, styleButton, styleOverlayRoot, stylePanel, styleHeading, styleSubtext } from "./ui-theme.js";

export function createGraphicsMenu({ getModel, onClose, onCloseToGame, renderer, scene }) {
  ensureUiTheme();

  const root = document.createElement("div");
  styleOverlayRoot(root, {
    zIndex: 31,
    background: "radial-gradient(circle at 30% 20%, rgba(95, 168, 255, 0.12), rgba(3, 5, 14, 0.94) 50%), linear-gradient(180deg, rgba(3, 5, 14, 0.88), rgba(0, 0, 0, 0.98))"
  });
  root.style.display = "none";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    root.innerHTML = "";

    const panel = document.createElement("div");
    stylePanel(panel, { maxWidth: "600px", padding: "16px" });
    panel.style.display = "grid";
    panel.style.gap = "12px";
    panel.style.maxHeight = "calc(100vh - 60px)";
    panel.style.overflowY = "auto";
    root.appendChild(panel);

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.alignItems = "center";
    titleRow.style.marginBottom = "4px";
    panel.appendChild(titleRow);

    const title = document.createElement("div");
    title.textContent = "Graphics Settings";
    styleHeading(title, { size: "1.6rem", marginBottom: "0" });
    titleRow.appendChild(title);

    const closeXButton = document.createElement("button");
    closeXButton.textContent = "✕";
    closeXButton.style.padding = "2px 8px";
    closeXButton.style.fontSize = "1.4rem";
    closeXButton.style.lineHeight = "1";
    closeXButton.style.backgroundColor = "rgba(100, 100, 100, 0.15)";
    closeXButton.style.border = "1px solid rgba(126, 231, 255, 0.3)";
    closeXButton.style.borderRadius = "3px";
    closeXButton.style.color = "rgba(255, 255, 255, 0.7)";
    closeXButton.style.cursor = "pointer";
    closeXButton.addEventListener("click", closeToGame);
    closeXButton.addEventListener("mouseover", () => {
      closeXButton.style.backgroundColor = "rgba(100, 100, 100, 0.3)";
      closeXButton.style.color = "rgba(255, 255, 255, 0.9)";
    });
    closeXButton.addEventListener("mouseout", () => {
      closeXButton.style.backgroundColor = "rgba(100, 100, 100, 0.15)";
      closeXButton.style.color = "rgba(255, 255, 255, 0.7)";
    });
    titleRow.appendChild(closeXButton);

    // Shadow Settings
    const shadowCard = createSettingCard("Shadows", [
      createToggleSetting(
        "Shadow Mapping",
        renderer.shadowMap.enabled,
        (enabled) => {
          renderer.shadowMap.enabled = enabled;
        }
      ),
      createSelectSetting(
        "Shadow Quality",
        renderer.shadowMap.type,
        {
          "1": { label: "Basic", value: 1 },
          "2": { label: "PCF (Soft)", value: 2 },
          "3": { label: "VSM", value: 3 }
        },
        (value) => {
          renderer.shadowMap.type = value;
        },
        renderer.shadowMap.enabled
      )
    ]);
    panel.appendChild(shadowCard);

    // Tone Mapping Settings
    const toneMappingCard = createSettingCard("Tone Mapping", [
      createSelectSetting(
        "Tone Mapping Mode",
        renderer.toneMapping,
        {
          "0": { label: "No Mapping", value: 0 },
          "1": { label: "Linear", value: 1 },
          "2": { label: "Reinhard", value: 2 },
          "3": { label: "ACES (Default)", value: 3 }
        },
        (value) => {
          renderer.toneMapping = value;
        }
      ),
      createSliderSetting(
        "Exposure",
        renderer.toneMappingExposure,
        0.5,
        2.0,
        0.05,
        (value) => {
          renderer.toneMappingExposure = value;
        }
      )
    ]);
    panel.appendChild(toneMappingCard);

    // Lighting Settings
    const lightingCard = createSettingCard("Lighting", [
      createToggleSetting(
        "Physically Correct Lights",
        renderer.physicallyCorrectLights,
        (enabled) => {
          renderer.physicallyCorrectLights = enabled;
        }
      ),
      createLightingIntensitySetting(
        "Ambient Light Intensity",
        scene,
        "ambient"
      ),
      createLightingIntensitySetting(
        "Sun Light Intensity",
        scene,
        "sun"
      )
    ]);
    panel.appendChild(lightingCard);

    // Quality Settings
    const qualityCard = createSettingCard("Quality", [
      createToggleSetting(
        "Anti-aliasing",
        true, // We can't directly check antialias, but we set it
        () => {
          // Note: This would require re-creating the renderer
          console.log("Anti-aliasing can only be changed on startup");
        },
        true // disabled, can't change at runtime
      ),
      createSelectSetting(
        "Pixel Ratio",
        Math.min(devicePixelRatio || 1, 2),
        {
          "1": { label: "1x (Normal)", value: 1 },
          "2": { label: "2x (High DPI)", value: 2 }
        },
        (value) => {
          renderer.setPixelRatio(value);
        }
      )
    ]);
    panel.appendChild(qualityCard);

    // Button Row
    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "8px";
    buttonRow.style.justifyContent = "flex-end";
    buttonRow.style.marginTop = "4px";
    panel.appendChild(buttonRow);

    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset to Default";
    styleButton(resetButton, { primary: false });
    resetButton.addEventListener("click", () => {
      // Reset to default settings
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = 2; // PCFSoftShadowMap
      renderer.toneMapping = 3; // ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15;
      renderer.physicallyCorrectLights = true;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      render();
    });
    buttonRow.appendChild(resetButton);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    styleButton(closeButton, { primary: true });
    closeButton.addEventListener("click", close);
    buttonRow.appendChild(closeButton);
  }

  function handleKeyPress(e) {
    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeToGame();
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    root.style.display = "flex";
    render();
    document.addEventListener("keydown", handleKeyPress, { capture: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.style.display = "none";
    document.removeEventListener("keydown", handleKeyPress, { capture: true });
    if (typeof onClose === "function") onClose();
  }

  function closeToGame() {
    if (!isOpen) return;
    isOpen = false;
    root.style.display = "none";
    document.removeEventListener("keydown", handleKeyPress, { capture: true });
    if (typeof onCloseToGame === "function") onCloseToGame();
  }

  return { open, close, render, isOpen: () => isOpen };
}

function createSettingCard(title, controls) {
  const card = document.createElement("div");
  card.className = "cj-card";
  card.style.padding = "10px";
  card.style.display = "grid";
  card.style.gap = "8px";

  const heading = document.createElement("div");
  heading.className = "cj-kicker";
  heading.textContent = title;
  heading.style.marginBottom = "2px";
  card.appendChild(heading);

  controls.forEach(control => card.appendChild(control));

  return card;
}

function createToggleSetting(label, initialValue, onChange, disabled = false) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.justifyContent = "space-between";
  container.style.alignItems = "center";
  container.style.padding = "6px";
  container.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
  container.style.borderRadius = "4px";
  container.style.opacity = disabled ? "0.5" : "1";

  const labelEl = document.createElement("div");
  labelEl.textContent = label;
  labelEl.style.fontSize = "0.85rem";
  labelEl.style.color = "rgba(255, 255, 255, 0.9)";
  container.appendChild(labelEl);

  const toggle = document.createElement("button");
  toggle.style.padding = "4px 12px";
  toggle.style.fontSize = "0.85rem";
  toggle.style.fontWeight = "600";
  toggle.style.border = "1px solid rgba(126, 231, 255, 0.3)";
  toggle.style.borderRadius = "3px";
  toggle.style.backgroundColor = initialValue ? "rgba(100, 180, 255, 0.2)" : "rgba(100, 100, 100, 0.15)";
  toggle.style.color = initialValue ? "#64b4ff" : "rgba(255, 255, 255, 0.6)";
  toggle.style.cursor = disabled ? "not-allowed" : "pointer";
  toggle.textContent = initialValue ? "On" : "Off";
  toggle.disabled = disabled;

  toggle.addEventListener("click", () => {
    const newValue = !initialValue;
    initialValue = newValue;
    toggle.textContent = newValue ? "On" : "Off";
    toggle.style.backgroundColor = newValue ? "rgba(100, 180, 255, 0.2)" : "rgba(100, 100, 100, 0.15)";
    toggle.style.color = newValue ? "#64b4ff" : "rgba(255, 255, 255, 0.6)";
    onChange(newValue);
  });

  container.appendChild(toggle);
  return container;
}

function createSelectSetting(label, initialValue, options, onChange, disabled = false) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.justifyContent = "space-between";
  container.style.alignItems = "center";
  container.style.padding = "6px";
  container.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
  container.style.borderRadius = "4px";
  container.style.opacity = disabled ? "0.5" : "1";

  const labelEl = document.createElement("div");
  labelEl.textContent = label;
  labelEl.style.fontSize = "0.85rem";
  labelEl.style.color = "rgba(255, 255, 255, 0.9)";
  container.appendChild(labelEl);

  const select = document.createElement("select");
  select.style.padding = "4px 8px";
  select.style.fontSize = "0.85rem";
  select.style.backgroundColor = "rgba(10, 20, 40, 0.8)";
  select.style.color = "rgba(255, 255, 255, 0.9)";
  select.style.border = "1px solid rgba(126, 231, 255, 0.3)";
  select.style.borderRadius = "3px";
  select.style.cursor = disabled ? "not-allowed" : "pointer";
  select.disabled = disabled;

  Object.entries(options).forEach(([key, opt]) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    option.selected = opt.value === initialValue;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    onChange(parseFloat(select.value));
  });

  container.appendChild(select);
  return container;
}

function createSliderSetting(label, initialValue, min, max, step, onChange) {
  const container = document.createElement("div");
  container.style.display = "grid";
  container.style.gap = "4px";
  container.style.padding = "6px";
  container.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
  container.style.borderRadius = "4px";

  const labelRow = document.createElement("div");
  labelRow.style.display = "flex";
  labelRow.style.justifyContent = "space-between";
  labelRow.style.alignItems = "center";

  const labelEl = document.createElement("div");
  labelEl.textContent = label;
  labelEl.style.fontSize = "0.85rem";
  labelEl.style.color = "rgba(255, 255, 255, 0.9)";
  labelRow.appendChild(labelEl);

  const valueDisplay = document.createElement("div");
  valueDisplay.textContent = initialValue.toFixed(2);
  valueDisplay.style.fontSize = "0.8rem";
  valueDisplay.style.color = "rgba(100, 180, 255, 0.9)";
  valueDisplay.style.fontWeight = "600";
  labelRow.appendChild(valueDisplay);

  container.appendChild(labelRow);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = initialValue;
  slider.style.width = "100%";
  slider.style.cursor = "pointer";

  slider.addEventListener("input", () => {
    const newValue = parseFloat(slider.value);
    valueDisplay.textContent = newValue.toFixed(2);
    onChange(newValue);
  });

  container.appendChild(slider);
  return container;
}

function createLightingIntensitySetting(label, scene, lightType) {
  let targetLight = null;

  if (lightType === "ambient") {
    targetLight = scene.children.find(child => child.isAmbientLight);
  } else if (lightType === "sun") {
    targetLight = scene.children.find(child => child.isDirectionalLight && !child._isFill);
  }

  if (!targetLight) {
    const container = document.createElement("div");
    container.textContent = `${label}: Not found`;
    container.style.fontSize = "0.85rem";
    container.style.color = "rgba(255, 100, 100, 0.8)";
    return container;
  }

  return createSliderSetting(
    label,
    targetLight.intensity,
    0,
    20,
    0.5,
    (value) => {
      targetLight.intensity = value;
    }
  );
}
