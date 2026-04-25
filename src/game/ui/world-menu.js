export function createWorldMenu({ getModel, onSelectHub, onSelectWorld, onResetSave }) {
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.top = "20px";
  root.style.right = "20px";
  root.style.width = "320px";
  root.style.maxHeight = "80vh";
  root.style.overflowY = "auto";
  root.style.background = "rgba(8, 10, 20, 0.9)";
  root.style.color = "white";
  root.style.padding = "14px";
  root.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  root.style.fontFamily = "sans-serif";
  root.style.display = "none";
  root.style.zIndex = "20";
  document.body.appendChild(root);

  let isOpen = false;

  function render() {
    const model = getModel();

    root.innerHTML = "";

    const title = document.createElement("div");
    title.textContent = "World Travel Menu";
    title.style.fontWeight = "700";
    title.style.marginBottom = "10px";
    root.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.textContent = `Key Cubes: ${model.keyCubes}/5`;
    subtitle.style.marginBottom = "8px";
    root.appendChild(subtitle);

    const hint = document.createElement("div");
    hint.textContent = "Press M to close menu. Press H to return to hub quickly.";
    hint.style.opacity = "0.8";
    hint.style.fontSize = "12px";
    hint.style.marginBottom = "12px";
    root.appendChild(hint);

    const hubButton = document.createElement("button");
    hubButton.textContent = "Travel to Hub";
    hubButton.style.width = "100%";
    hubButton.style.marginBottom = "12px";
    hubButton.addEventListener("click", () => {
      onSelectHub();
      close();
    });
    root.appendChild(hubButton);

    for (let i = 0; i < model.worlds.length; i += 1) {
      const world = model.worlds[i];

      const button = document.createElement("button");
      button.style.display = "block";
      button.style.width = "100%";
      button.style.textAlign = "left";
      button.style.marginBottom = "8px";
      button.style.padding = "8px";

      const status = world.accessible ? "Open" : "Locked";
      const progress = `Stage ${world.startStage + 1}/${world.totalStages}`;
      const boss = world.hasBoss ? (world.bossDefeated ? "Boss: Cleared" : "Boss: Pending") : "Final World";
      button.textContent = `${i + 1}. ${world.name} | ${status} | ${progress} | ${boss}`;
      button.disabled = !world.accessible;

      button.addEventListener("click", () => {
        onSelectWorld(i, world.startStage);
        close();
      });

      root.appendChild(button);
    }

    const reset = document.createElement("button");
    reset.textContent = "Reset Save";
    reset.style.width = "100%";
    reset.style.marginTop = "8px";
    reset.addEventListener("click", () => {
      onResetSave();
      render();
    });
    root.appendChild(reset);
  }

  function open() {
    isOpen = true;
    render();
    root.style.display = "block";
  }

  function close() {
    isOpen = false;
    root.style.display = "none";
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  return {
    open,
    close,
    toggle,
    render,
    isOpen: () => isOpen
  };
}
