export function createCampaignState(worlds) {
  const totalLevels = worlds.reduce((sum, world) => sum + world.levelCount, 0);

  const state = {
    mode: "hub",
    worldIndex: 0,
    levelIndex: 0,
    unlockedWorldIndex: 0,
    completedLevels: 0,
    totalLevels,
    finalWin: false
  };

  function enterHub() {
    state.mode = "hub";
    state.worldIndex = 0;
    state.levelIndex = 0;
  }

  function enterWorld(worldIndex) {
    if (worldIndex > state.unlockedWorldIndex) return false;
    state.mode = "level";
    state.worldIndex = worldIndex;
    state.levelIndex = 0;
    return true;
  }

  function completeCurrentLevel() {
    if (state.mode !== "level") return;

    state.completedLevels += 1;

    const world = worlds[state.worldIndex];
    if (state.levelIndex < world.levelCount - 1) {
      state.levelIndex += 1;
      return;
    }

    if (state.worldIndex < worlds.length - 1) {
      state.unlockedWorldIndex = Math.max(state.unlockedWorldIndex, state.worldIndex + 1);
      enterHub();
      return;
    }

    state.finalWin = true;
    enterHub();
  }

  return {
    state,
    enterHub,
    enterWorld,
    completeCurrentLevel
  };
}
