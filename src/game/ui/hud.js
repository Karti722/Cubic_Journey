export function createHud(uiElement) {
  function update(model) {
    const lines = [];

    lines.push("WASD move | Space jump/double jump | Shift air dash | Wall jump on contact");
    lines.push("Mouse drag / Arrow keys camera | M world menu | H return to hub");

    if (model.mode === "hub") {
      lines.push(`Hub World | Story: ${model.storyLine}`);
      lines.push(`Progress: ${model.completedStages}/${model.totalStages} stages`);
      lines.push(`Key Cubes: ${model.keyCubes}/5`);
      lines.push(`Coins: ${model.currency} | Skills: ${model.skillCount}`);
      lines.push("Walk into a portal and press E, or use the world menu (M)");
      if (model.portalPrompt) lines.push(model.portalPrompt);
      if (model.finalWin) lines.push("Campaign complete! You cleared every stage.");
    } else {
      lines.push(`${model.worldName} | Stage ${model.stageNumber}/${model.stageCount}`);
      lines.push(`Story: ${model.storyLine}`);
      lines.push(`Total progress: ${model.completedStages}/${model.totalStages}`);
      lines.push(`Collectibles: ${model.collectedCoins} | Key Cubes: ${model.keyCubes}/5`);
      lines.push(`Coins: ${model.currency} | Skills: ${model.skillCount}`);
      lines.push(model.isBossStage ? "Boss Stage: claim the key cube core" : "Reach the stage goal cube");
      if (model.bossName) lines.push(`Boss: ${model.bossName}`);
    }

    uiElement.innerHTML = lines.join("<br>");
  }

  return { update };
}
