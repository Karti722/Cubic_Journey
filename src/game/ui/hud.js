export function createHud(uiElement) {
  function update(model) {
    const lines = [];

    lines.push("WASD move  |  Space jump  |  Mouse drag / Arrow keys camera");

    if (model.mode === "hub") {
      lines.push(`Hub World  |  Progress: ${model.completedLevels}/${model.totalLevels}`);
      lines.push("Walk into a portal and press E to enter that world");
      lines.push(`Unlocked worlds: ${model.unlockedWorldIndex + 1}/${model.worldCount}`);
      if (model.portalPrompt) lines.push(model.portalPrompt);
      if (model.finalWin) lines.push("Campaign complete! You cleared every stage.");
    } else {
      lines.push(`${model.worldName}  |  Stage ${model.levelNumber}/${model.levelCount}`);
      lines.push(`Total progress: ${model.completedLevels}/${model.totalLevels}`);
      lines.push(`Collectibles: ${model.collectedCoins}`);
      lines.push("Reach the glowing green cube");
    }

    uiElement.innerHTML = lines.join("<br>");
  }

  return { update };
}
