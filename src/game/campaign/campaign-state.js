import { GAME_CONFIG, getWorldStageCount } from "../config/game-config.js";
import { createDefaultSkillState } from "../skills/skill-data.js";

export function createDefaultCampaignSave(worlds) {
  return {
    keyCubes: 0,
    totalCompletedStages: 0,
    currency: 0,
    skills: createDefaultSkillState(),
    worldProgress: worlds.map(() => ({
      highestUnlockedStage: 0,
      highestCompletedStage: -1,
      bossDefeated: false,
      keyCubeClaimed: false
    }))
  };
}

export function createCampaignState(worlds, saveData) {
  const totalStages = worlds.reduce((sum, world) => sum + getWorldStageCount(world), 0);

  const state = {
    mode: "hub",
    worldIndex: 0,
    stageIndex: 0,
    totalStages,
    finalWin: false,
    keyCubes: saveData.keyCubes,
    totalCompletedStages: saveData.totalCompletedStages,
    currency: saveData.currency,
    skills: saveData.skills,
    worldProgress: saveData.worldProgress
  };

  function canAccessWorld(worldIndex) {
    if (worldIndex !== GAME_CONFIG.finalWorldIndex) return true;
    return state.keyCubes >= GAME_CONFIG.requiredKeyCubes;
  }

  function enterHub() {
    state.mode = "hub";
    state.worldIndex = 0;
    state.stageIndex = 0;
  }

  function enterWorld(worldIndex, stageIndex) {
    if (!canAccessWorld(worldIndex)) return false;

    const worldStageCount = getWorldStageCount(worlds[worldIndex]);
    const highestUnlocked = Math.min(state.worldProgress[worldIndex].highestUnlockedStage, worldStageCount - 1);
    const targetStage = clamp(stageIndex ?? highestUnlocked, 0, highestUnlocked);

    state.mode = "level";
    state.worldIndex = worldIndex;
    state.stageIndex = targetStage;
    return true;
  }

  function completeCurrentStage() {
    if (state.mode !== "level") return { transition: "none" };

    const world = worlds[state.worldIndex];
    const worldStageCount = getWorldStageCount(world);
    const progress = state.worldProgress[state.worldIndex];
    const currentStage = state.stageIndex;
    const isBossStage = world.hasBoss && currentStage === worldStageCount - 1;
    const completedWorldIndex = state.worldIndex;
    let awardedKeyCube = false;

    if (currentStage > progress.highestCompletedStage) {
      progress.highestCompletedStage = currentStage;
      state.totalCompletedStages += 1;
    }

    if (currentStage < worldStageCount - 1) {
      progress.highestUnlockedStage = Math.max(progress.highestUnlockedStage, currentStage + 1);
      state.stageIndex = Math.min(currentStage + 1, progress.highestUnlockedStage);
    } else {
      enterHub();
    }

    if (isBossStage) {
      progress.bossDefeated = true;

      if (world.keyCubeReward && !progress.keyCubeClaimed) {
        progress.keyCubeClaimed = true;
        state.keyCubes = Math.min(state.keyCubes + 1, GAME_CONFIG.requiredKeyCubes);
        awardedKeyCube = true;
      }

      if (completedWorldIndex === GAME_CONFIG.finalWorldIndex) {
        state.finalWin = true;
      }
    }

    return {
      transition: state.mode === "hub" ? "hub" : "next-stage",
      isBossStage,
      awardedKeyCube
    };
  }

  function getSaveData() {
    return {
      keyCubes: state.keyCubes,
      totalCompletedStages: state.totalCompletedStages,
      currency: state.currency,
      skills: state.skills,
      worldProgress: state.worldProgress
    };
  }

  function earnCurrency(amount) {
    state.currency += Math.max(0, Math.floor(amount));
  }

  function canAfford(cost) {
    return state.currency >= cost;
  }

  function spendCurrency(cost) {
    if (!canAfford(cost)) return false;
    state.currency -= cost;
    return true;
  }

  function unlockSkill(skillId) {
    state.skills[skillId] = true;
  }

  return {
    state,
    canAccessWorld,
    enterHub,
    enterWorld,
    completeCurrentStage,
    getSaveData,
    earnCurrency,
    canAfford,
    spendCurrency,
    unlockSkill
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
