import { THREE } from "../engine/three.js";
import { createRenderContext, attachResize } from "../engine/core/render-context.js";
import { createCameraController } from "../engine/camera/camera-controller.js";
import { createInput } from "../engine/input/input.js";
import { GAME_CONFIG, PLAYER_CONFIG, getWorldStageCount } from "../game/config/game-config.js";
import { createCampaignState, createDefaultCampaignSave } from "../game/campaign/campaign-state.js";
import { createHubDefinition, createStageDefinition, createSwordMinigameDefinition, MINIGAME_MAX_LEVEL } from "../game/world/level-generator.js?v=5";
import { buildWorldRuntime } from "../game/world/runtime-builder.js";
import { updateHorizontalVelocity } from "../game/systems/movement-system.js";
import { createAbilityState, resetAbilityState, stepPlayerPhysics } from "../game/systems/physics-system.js";
import {
  applyJumpPads,
  collectDashOrbs,
  collectNearby,
  isGoalReached,
  findNearbyPortal,
  resolveEnemyContacts,
  resolveSwordSlash,
  resolveBombContacts
} from "../game/systems/interaction-system.js";
import { createHud } from "../game/ui/hud.js";
import { createCampaignInfoMenu } from "../game/ui/campaign-info-menu.js";
import { createWorldMenu } from "../game/ui/world-menu.js";
import { createPauseMenu } from "../game/ui/pause-menu.js";
import { createDebugMenu } from "../game/debug/debug-menu.js";
import { createControlsMenu } from "../game/ui/controls-menu.js";
import { createShopMenu } from "../game/ui/shop-menu.js";
import { createLoadingScreen } from "../game/ui/loading-screen.js";
import { STORY } from "../game/story/story-data.js";
import { clearSave, loadSave, writeSave } from "../game/persistence/save-store.js";
import { createAudioEngine } from "../game/audio/audio-engine.js";
import { loadControlBindings, resetControlBindings, saveControlBindings } from "../game/input/control-settings.js";
import { createActionEffects } from "../game/effects/action-effects.js";
import { SKILL_DEFINITIONS } from "../game/skills/skill-data.js";
import { createProceduralVisuals } from "../game/render/procedural-visuals.js";

export function startGame(uiElement, options = {}) {
  const { scene, camera, renderer, clock } = createRenderContext();
  attachResize(camera, renderer);
  const gameStartTimeMs = performance.now();

  const visuals = createProceduralVisuals();
  const player = visuals.createPlayerAvatar();
  player.spinActive = false;
  player.spinRemaining = 0;
  // tuned: faster spinSpeed for crisp 180° turns (~0.18s)
  player.spinSpeed = Math.PI * 5.5; // radians per second when spinning
  player.position.set(0, 3, 0);
  scene.add(player);

  const controlBindings = loadControlBindings();
  const cameraController = createCameraController(camera, player);
  const controls = createInput(renderer.domElement, cameraController.rotateByMouse, controlBindings);
  const { keys } = controls;
  const campaignInfoMenu = createCampaignInfoMenu({
    getModel: () => buildCampaignInfoModel(),
    onClose: () => {
      if (campaignInfoReturnToPause) {
        pauseMenu.open();
      } else {
        paused = false;
        if (musicEnabled) audio.resumeMusic();
      }
    }
  });
  const hud = createHud(uiElement, {
    onOpenInfo: () => {
      if (campaignInfoMenu.isOpen()) return;
      paused = true;
      openCampaignInfo(false);
    }
  });
  const audio = createAudioEngine();
  const effects = createActionEffects(scene);
  const loadingScreen = createLoadingScreen();

  const defaultSave = createDefaultCampaignSave(GAME_CONFIG.campaignWorlds);
  const loadedSave = loadSave(defaultSave);
  const campaign = createCampaignState(GAME_CONFIG.campaignWorlds, loadedSave);

  let runtime = null;
  let grounded = false;
  let collectedCoins = 0;
  let paused = false;
  let musicEnabled = true;
  let damageCooldownUntil = 0;
  let lastRotationY = player.rotation.y;
  let lastGrounded = false;
  let turnEffectCooldown = 0;
  let moveEffectCooldown = 0;
  let worldLoadToken = 0;
  let isWorldLoading = false;
  const loadingScreenDelayMs = 220;
  let endCreditsActive = false;
  let fps = 0;
  let fpsSmoothing = 0.92;
  const startMode = options.startMode || "campaign";

  const minigameState = {
    active: false,
    won: false,
    level: 1,
    maxLevel: MINIGAME_MAX_LEVEL,
    slashLatch: false,
    confirmLatch: false,
    slashCooldownUntil: 0,
    slashAnimUntil: 0,
    totalEnemies: 0,
    defeatedEnemies: 0,
    giantMaxHealth: 0,
    giantHealth: 0,
    // Charge explosion state
    chargeHeldSince: null,
    chargeCooldownUntil: 0,
    chargeLastVisual: 0,
    // whether we've emitted an immediate slash for the current key press
    slashFiredThisPress: false,
    // Whether we've already handled advancing after a win
    winHandled: false
  };
  // Regular (non-charged) sphere slash radius and visual scale (keeps VFX and hit radius identical)
  const REGULAR_SLASH_RADIUS = 2.25;



  let campaignInfoReturnToPause = false;

  function openCampaignInfo(fromPause = false) {
    campaignInfoReturnToPause = fromPause;
    campaignInfoMenu.open();
    audio.pauseMusic();
  }

  const velocity = new THREE.Vector3();
  const ability = createAbilityState(PLAYER_CONFIG.extraAirJumps);
  let debugToggleLatch = false;
  let skipKeyLatch = false;
  let lastMoveSignZ = 0;
  let prevSlashDown = false;
  let globalSlashCooldownUntil = 0;
  let minigameIntroTimer = null;
  let minigameAdvanceTimer = null;

  function isSwordSlashPressed() {
    // Use the controls action so bindings apply (e.g. KeyF, Numpad0)
    return controls.isActionPressed("slash");
  }

  function isMinigameConfirmPressed() {
    const pressed = keys.Enter || keys.NumpadEnter;
    if (pressed) {
      if (minigameState.confirmLatch) return false;
      minigameState.confirmLatch = true;
      return true;
    }

    minigameState.confirmLatch = false;
    return false;
  }

  function refreshMinigameStatus() {
    if (!runtime || !minigameState.active) return;
    let defeated = 0;
    let total = 0;
    let giantMax = 0;
    let giantHealth = 0;

    for (const enemy of runtime.enemies || []) {
      total += 1;
      if (enemy.defeated) defeated += 1;
      if (enemy.isGiant) {
        giantMax = enemy.maxHealth || 1;
        giantHealth = enemy.defeated ? 0 : (enemy.health || 0);
      }
    }

    minigameState.totalEnemies = total;
    minigameState.defeatedEnemies = defeated;
    minigameState.giantMaxHealth = giantMax;
    minigameState.giantHealth = giantHealth;
    minigameState.won = total > 0 && defeated >= total;
    if (minigameState.won && !minigameState.winHandled) {
      // prevent multiple advance timers stacking
      minigameState.winHandled = true;
      if (minigameAdvanceTimer) {
        clearTimeout(minigameAdvanceTimer);
        minigameAdvanceTimer = null;
      }
      const nextLevel = minigameState.level + 1; // capture target now to avoid mutation before timeout
      minigameAdvanceTimer = setTimeout(() => {
        minigameAdvanceTimer = null;
        if (!minigameState.active) return;
        if (nextLevel > minigameState.maxLevel) {
          // show an ending screen and return to title
          showMinigameEnding();
          return;
        }
        enterMinigameLevel(nextLevel);
      }, 600);
    }
  }

  function enterMinigame() {
    enterMinigameLevel(1);
  }

  function enterMinigameLevel(level) {
    const clampedLevel = Math.max(1, Math.min(MINIGAME_MAX_LEVEL, Math.floor(level)));
    // mark transitioning: prevent auto-advance triggers from previous runtime
    minigameState.active = true;
    minigameState.won = false;
    minigameState.winHandled = true;
    minigameState.level = clampedLevel;
    minigameState.slashCooldownUntil = 0;
    minigameState.slashAnimUntil = 0;
    minigameState.winHandled = false;
    minigameState.chargeHeldSince = null;
    minigameState.chargeCooldownUntil = 0;
    // show a level banner then load the level after a short intro delay to soften transitions
    const introMs = 700;
    try {
      if (hud && typeof hud.showCenterBanner === "function") {
        hud.showCenterBanner(`Slash Minigame`, `Level ${clampedLevel}` , introMs);
      }
    } catch (e) {
      // ignore UI errors
    }
    // dispose current runtime immediately so refreshMinigameStatus won't see defeated enemies
    try {
      if (runtime) {
        runtime.dispose();
        runtime = null;
      }
    } catch (e) {}

    if (minigameIntroTimer) {
      clearTimeout(minigameIntroTimer);
      minigameIntroTimer = null;
    }
    minigameIntroTimer = setTimeout(() => {
      minigameIntroTimer = null;
      loadDefinition(createSwordMinigameDefinition(clampedLevel), `Loading goblin wildlands L${clampedLevel}...`);
    }, introMs);
  }

  function loadDefinition(definition, loadingMessage = "Building the world...") {
    const loadToken = ++worldLoadToken;
    isWorldLoading = true;
    let loadingShown = false;
    const loadingTimer = setTimeout(() => {
      if (loadToken !== worldLoadToken || !isWorldLoading) return;
      loadingScreen.show(loadingMessage);
      loadingShown = true;
    }, loadingScreenDelayMs);

    setTimeout(() => {
      if (loadToken !== worldLoadToken) return;

      if (runtime) runtime.dispose();
      runtime = buildWorldRuntime(scene, definition, visuals);
      // clear the transitioning/handled flag now that a fresh runtime exists
      minigameState.winHandled = false;
      minigameState.active = definition.type === "minigame";
      if (minigameState.active) {
        minigameState.level = Math.max(1, definition.minigameLevel || minigameState.level || 1);
        minigameState.maxLevel = Math.max(1, definition.minigameMaxLevel || MINIGAME_MAX_LEVEL);
      }
      player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
      velocity.set(0, 0, 0);
      resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
      grounded = false;
      collectedCoins = 0;
      refreshMinigameStatus();

      setMusicForCurrentState();
      hud.update(buildHudModel());
      isWorldLoading = false;
      clearTimeout(loadingTimer);
      if (loadingShown) loadingScreen.hide();
    }, 0);
  }

  function playEndCredits() {
    if (endCreditsActive) return;
    endCreditsActive = true;
    paused = true;
    audio.pauseMusic();
    audio.playSfx("credits", 0.95);
    loadingScreen.hide();

    const creditsRoot = document.createElement("div");
    creditsRoot.style.position = "fixed";
    creditsRoot.style.inset = "0";
    creditsRoot.style.zIndex = "120";
    creditsRoot.style.display = "grid";
    creditsRoot.style.placeItems = "center";
    creditsRoot.style.background = "radial-gradient(circle at 50% 40%, rgba(6, 10, 20, 0.84), rgba(0, 0, 0, 0.98))";
    creditsRoot.style.color = "white";
    creditsRoot.style.pointerEvents = "auto";

    creditsRoot.innerHTML = `
      <div style="width:min(720px, calc(100vw - 32px)); padding: 28px 24px; text-align:center; background: rgba(10, 16, 28, 0.94); border: 1px solid rgba(126, 231, 255, 0.22); border-radius: 18px; box-shadow: 0 28px 70px rgba(0,0,0,0.55);">
        <div style="font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 10px;">The End</div>
        <div style="font-size: clamp(2rem, 5vw, 3.6rem); font-weight: 800; letter-spacing: 0.08em; margin-bottom: 10px; text-transform: uppercase;">Cubic Journey</div>
        <div style="font-size: 1rem; line-height: 1.55; color: rgba(255,255,255,0.84); margin-bottom: 22px;">You cleared the final boss. The campaign will reset and return to the title screen.</div>
        <div style="display:grid; gap:8px; color: rgba(255,255,255,0.72); font-size: 0.9rem; line-height: 1.45; margin-bottom: 18px;">
          <div>Design, code, and vibe coding: one person.</div>
          <div>Art, music, and UI polish: the game itself.</div>
          <div>Thanks for playing.</div>
        </div>
        <div style="font-size: 0.82rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.56);">Returning to title screen...</div>
      </div>
    `;
    document.body.appendChild(creditsRoot);

    setTimeout(() => {
      clearAllPlayerData();
      location.reload();
    }, 7000);
  }

  function showMinigameEnding() {
    if (endCreditsActive) return;
    endCreditsActive = true;
    paused = true;
    audio.pauseMusic();
    audio.playSfx("credits", 0.95);
    loadingScreen.hide();

    const endRoot = document.createElement("div");
    endRoot.style.position = "fixed";
    endRoot.style.inset = "0";
    endRoot.style.zIndex = "120";
    endRoot.style.display = "grid";
    endRoot.style.placeItems = "center";
    endRoot.style.background = "radial-gradient(circle at 50% 40%, rgba(6, 10, 20, 0.84), rgba(0, 0, 0, 0.98))";
    endRoot.style.color = "white";
    endRoot.style.pointerEvents = "auto";

    endRoot.innerHTML = `
      <div style="width:min(720px, calc(100vw - 32px)); padding: 28px 24px; text-align:center; background: rgba(10, 16, 28, 0.94); border: 1px solid rgba(126, 231, 255, 0.22); border-radius: 18px; box-shadow: 0 28px 70px rgba(0,0,0,0.55);">
        <div style="font-size: 1rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 10px;">Minigame Complete</div>
        <div style="font-size: clamp(1.4rem, 4vw, 2.2rem); font-weight: 800; letter-spacing: 0.04em; margin-bottom: 10px;">Sword Trial Complete</div>
        <div style="font-size: 1rem; line-height: 1.55; color: rgba(255,255,255,0.84); margin-bottom: 22px;">You cleared the Goblin Wildlands minigame. Returning to title screen...</div>
      </div>
    `;
    document.body.appendChild(endRoot);

    setTimeout(() => {
      // return to title screen
      location.reload();
    }, 4200);
  }

  function triggerDamageFeedback(elapsed) {
    damageCooldownUntil = elapsed + 0.85;
    audio.playSfx("damage", 0.82);
    if (player.bodyMaterial?.emissive) {
      player.bodyMaterial.emissive.setHex(0xff3311);
    }
  }

  function cancelMinigameCharge() {
    minigameState.chargeHeldSince = null;
    minigameState.slashBufferAt = null;
    minigameState.chargeLastVisual = 0;
    minigameState.slashFiredThisPress = false;
  }

  function setMusicForCurrentState() {
    const trackName = minigameState.active
      ? "boss"
      : campaign.state.mode === "hub"
      ? "hub"
      : runtime?.isBossStage
        ? "boss"
        : GAME_CONFIG.campaignWorlds[campaign.state.worldIndex]?.id || "hub";

    audio.setTrack(trackName, { volume: musicEnabled ? 0.55 : 0 });
    if (!musicEnabled) {
      audio.pauseMusic();
    }
  }

  function loadHub() {
    const definition = createHubDefinition(campaign.state);
    loadDefinition(definition, "Entering the hub...");
  }

  function loadCurrentStage() {
    const definition = createStageDefinition(campaign.state.worldIndex, campaign.state.stageIndex);
    loadDefinition(definition, "Loading the next stage...");
  }

  function persistProgress() {
    writeSave(campaign.getSaveData());
  }

  function clearAllPlayerData() {
    clearSave();
    try {
      localStorage.removeItem("cubic-journey-controls-v1");
    } catch {
      // Ignore persistence failures.
    }
  }

  function isCampaignCompleteFromSave() {
    const bossWorlds = GAME_CONFIG.campaignWorlds
      .map((world, index) => ({ world, index }))
      .filter(({ world }) => world.hasBoss);

    return bossWorlds.length > 0 && bossWorlds.every(({ index }) => campaign.state.worldProgress[index]?.bossDefeated);
  }

  function updateBindingsFromControls() {
    saveControlBindings(controlBindings);
  }

  const controlsMenu = createControlsMenu({
    getBindings: () => controlBindings,
    onRebind: (action, code) => {
      if (code) {
        controls.rebindAction(action, code);
      } else {
        controls.clearAction(action);
      }
      updateBindingsFromControls();
    },
    onReset: () => {
      const defaults = resetControlBindings();
      syncBindings(controlBindings, defaults);
      updateBindingsFromControls();
    },
    onClose: () => {
      pauseMenu.open();
    }
  });

  const shopMenu = createShopMenu({
    getModel: () => ({
      currency: campaign.state.currency,
      skills: campaign.state.skills
    }),
    onBuySkill: skillId => {
      const skill = getSkillDefinition(skillId);
      if (!skill || campaign.state.skills[skillId]) return;
      if (!campaign.spendCurrency(skill.cost)) return;

      campaign.unlockSkill(skillId);
      persistProgress();
      hud.update(buildHudModel());
    },
    onClose: () => {
      pauseMenu.open();
    }
  });

  function travelToHub() {
    campaign.enterHub();
    loadHub();
    persistProgress();
  }

  function travelToWorld(worldIndex, stageIndex) {
    const entered = campaign.enterWorld(worldIndex, stageIndex);
    if (!entered) return false;

    loadCurrentStage();
    persistProgress();
    return true;
  }

  function debugTravelToWorld(worldIndex, stageIndex) {
    const world = GAME_CONFIG.campaignWorlds[worldIndex];
    if (!world) return false;

    const totalStages = getWorldStageCount(world);
    const targetStage = Math.max(0, Math.min(stageIndex ?? 0, totalStages - 1));

    campaign.state.mode = "level";
    campaign.state.worldIndex = worldIndex;
    campaign.state.stageIndex = targetStage;

    loadCurrentStage();
    persistProgress();
    return true;
  }

  const worldMenu = createWorldMenu({
    getModel: () => ({
      keyCubes: campaign.state.keyCubes,
      worlds: GAME_CONFIG.campaignWorlds.map((world, index) => {
        const progress = campaign.state.worldProgress[index];
        const totalStages = getWorldStageCount(world);
        const startStage = Math.min(progress.highestUnlockedStage, totalStages - 1);

        return {
          name: world.name,
          accessible: campaign.canAccessWorld(index),
          startStage,
          totalStages,
          hasBoss: world.hasBoss,
          bossDefeated: progress.bossDefeated
        };
      })
    }),
    onSelectHub: () => {
      paused = false;
      travelToHub();
    },
    onSelectWorld: (worldIndex, stageIndex) => {
      paused = false;
      travelToWorld(worldIndex, stageIndex);
    },
    onResetSave: () => {
      clearSave();
      location.reload();
    }
  });

  const pauseMenu = createPauseMenu({
    getModel: () => buildPauseModel(),
    onResume: () => {
      audio.playSfx("pause", 0.55);
      paused = false;
      pauseMenu.close();
      if (musicEnabled) audio.resumeMusic();
    },
    onSelectHub: () => {
      audio.playSfx("portal", 0.6);
      paused = false;
      pauseMenu.close();
      travelToHub();
      if (musicEnabled) audio.resumeMusic();
    },
    onSelectWorld: (worldIndex, stageIndex) => {
      audio.playSfx("portal", 0.6);
      paused = false;
      pauseMenu.close();
      travelToWorld(worldIndex, stageIndex);
      if (musicEnabled) audio.resumeMusic();
    },
    onReturnTitle: () => {
      audio.playSfx("pause", 0.55);
      paused = false;
      pauseMenu.close();
      location.reload();
    },
    onResetSave: () => {
      clearSave();
      location.reload();
    },
    onToggleMusic: () => {
      musicEnabled = !musicEnabled;
      audio.setMusicEnabled(musicEnabled);
      audio.playSfx("pause", 0.45);
      pauseMenu.render();
    },
    onOpenControls: () => {
      pauseMenu.close();
      controlsMenu.open();
    },
    onOpenShop: () => {
      pauseMenu.close();
      shopMenu.open();
    },
    onOpenInfo: () => {
      pauseMenu.close();
      paused = true;
      openCampaignInfo(true);
    }
  });

  function buildPauseModel() {
    const bossesClearedCount = campaign.state.worldProgress.filter((progress, index) => {
      const world = GAME_CONFIG.campaignWorlds[index];
      return world?.hasBoss ? progress.bossDefeated : true;
    }).filter(Boolean).length;

    return {
      mode: campaign.state.mode,
      worldName: GAME_CONFIG.campaignWorlds[campaign.state.worldIndex]?.name || "World Hub",
      storyBlurb: STORY.premise,
      worldBlurb: campaign.state.mode === "hub"
        ? "The hub lets you travel to any discovered world at any time."
        : STORY.worldNarratives[campaign.state.worldIndex],
      completedStages: campaign.state.totalCompletedStages,
      totalStages: campaign.state.totalStages,
      keyCubes: campaign.state.keyCubes,
      currency: campaign.state.currency,
      skillCount: countOwnedSkills(campaign.state.skills),
      musicEnabled,
      finalWin: campaign.state.finalWin,
      worldCount: GAME_CONFIG.campaignWorlds.length,
      bossesClearedCount,
      saveSummary: `${campaign.state.worldProgress.map(progress => `${progress.highestCompletedStage + 1}/${1 + progress.highestUnlockedStage}`).join(" | ")}`,
      worlds: GAME_CONFIG.campaignWorlds.map((world, index) => {
        const progress = campaign.state.worldProgress[index];
        const totalStages = getWorldStageCount(world);
        const startStage = Math.min(progress.highestUnlockedStage, totalStages - 1);
        return {
          name: world.name,
          accessible: campaign.canAccessWorld(index),
          startStage,
          totalStages,
          hasBoss: world.hasBoss,
          bossDefeated: progress.bossDefeated,
          keyCubeReward: world.keyCubeReward
        };
      })
    };
  }

  function buildHudModel() {
    if (minigameState.active) {
      return {
        mode: "level",
        fps,
        worldName: `Slash Minigame — Goblin Wildlands L${minigameState.level}`,
        stageNumber: minigameState.level,
        stageCount: minigameState.maxLevel,
        completedStages: minigameState.defeatedEnemies,
        totalStages: minigameState.totalEnemies,
        collectedCoins: minigameState.defeatedEnemies,
        keyCubes: campaign.state.keyCubes,
        currency: campaign.state.currency,
        skillCount: countOwnedSkills(campaign.state.skills),
        // whether the charged explosion is currently available (not on cooldown)
        chargeReady: (performance.now() - gameStartTimeMs) / 1000 >= (minigameState.chargeCooldownUntil || 0) && !minigameState.won,
        // show a friendly level-clear message but do not instruct pressing Enter (auto-advance)
        skipPrompt: minigameState.won
          ? (minigameState.level >= minigameState.maxLevel
            ? "All levels clear!"
            : `Level clear!`)
          : (minigameState.giantHealth > 0
            ? `Giant HP: ${minigameState.giantHealth}/${Math.max(1, minigameState.giantMaxHealth)}`
            : ""),
        storyLine: "Open-world sword trial with moving platforms, bomb hazards, and diving goblins.",
        isBossStage: minigameState.giantHealth > 0,
        bossName: minigameState.giantHealth > 0 ? "Giant Goblin" : ""
      };
    }

    if (campaign.state.mode === "hub") {
      return {
        mode: "hub",
        fps,
        storyLine: STORY.premise,
        completedStages: campaign.state.totalCompletedStages,
        totalStages: campaign.state.totalStages,
        keyCubes: campaign.state.keyCubes,
        currency: campaign.state.currency,
        skillCount: countOwnedSkills(campaign.state.skills),
        portalPrompt: "",
        skipPrompt: "",
        finalWin: campaign.state.finalWin,
        worldName: "",
        stageNumber: 0,
        stageCount: 0,
        collectedCoins: 0,
        isBossStage: false,
        bossName: ""
      };
    }

    const world = GAME_CONFIG.campaignWorlds[campaign.state.worldIndex];
    const regularLevelSkipPrompt = runtime && !runtime.isBossStage && campaign.canAfford(20)
      ? "Press 1 to skip this level (Charge: 20 coins)"
      : "";
    return {
      mode: "level",
      fps,
      worldName: world.name,
      stageNumber: campaign.state.stageIndex + 1,
      stageCount: getWorldStageCount(world),
      completedStages: campaign.state.totalCompletedStages,
      totalStages: campaign.state.totalStages,
      collectedCoins,
      keyCubes: campaign.state.keyCubes,
      currency: campaign.state.currency,
      skillCount: countOwnedSkills(campaign.state.skills),
      skipPrompt: regularLevelSkipPrompt,
      storyLine: STORY.worldNarratives[campaign.state.worldIndex],
      isBossStage: runtime.isBossStage,
      bossName: runtime.isBossStage ? STORY.bossNames[campaign.state.worldIndex] : ""
    };
  }

  function buildCampaignInfoModel() {
    if (minigameState.active) {
      return {
        mode: "level",
        fps,
        worldName: `Slash Minigame — Goblin Wildlands L${minigameState.level}`,
        stageNumber: minigameState.level,
        stageCount: minigameState.maxLevel,
        storyLine: "Sword-only side minigame. Slash swarms of goblins and finish the giant boss.",
        completedStages: minigameState.defeatedEnemies,
        totalStages: minigameState.totalEnemies,
        keyCubes: campaign.state.keyCubes,
        currency: campaign.state.currency,
        skillCount: countOwnedSkills(campaign.state.skills),
        isBossStage: minigameState.giantHealth > 0,
        bossName: minigameState.giantHealth > 0 ? "Giant Goblin" : ""
      };
    }

    if (campaign.state.mode === "hub") {
      return {
        mode: "hub",
        fps,
        worldName: "World Hub",
        storyLine: STORY.premise,
        completedStages: campaign.state.totalCompletedStages,
        totalStages: campaign.state.totalStages,
        keyCubes: campaign.state.keyCubes,
        currency: campaign.state.currency,
        skillCount: countOwnedSkills(campaign.state.skills),
        isBossStage: false,
        bossName: "",
      };
    }

    const world = GAME_CONFIG.campaignWorlds[campaign.state.worldIndex];
    return {
      mode: "level",
      worldName: world.name,
      storyLine: STORY.worldNarratives[campaign.state.worldIndex],
      completedStages: campaign.state.totalCompletedStages,
      totalStages: campaign.state.totalStages,
      keyCubes: campaign.state.keyCubes,
      currency: campaign.state.currency,
      skillCount: countOwnedSkills(campaign.state.skills),
      isBossStage: runtime.isBossStage,
      bossName: runtime.isBossStage ? STORY.bossNames[campaign.state.worldIndex] : ""
    };
  }

  function countOwnedSkills(skills) {
    return Object.values(skills || {}).filter(Boolean).length;
  }

  function getSkillDefinition(skillId) {
    return SKILL_DEFINITIONS.find(skill => skill.id === skillId) || null;
  }

  function getDashDirectionVector() {
    const dashDirection = getDashDirection();
    return { x: dashDirection.x, y: 0, z: dashDirection.z };
  }

  function syncBindings(target, source) {
    for (const key of Object.keys(target)) delete target[key];
    for (const [key, value] of Object.entries(source)) target[key] = Array.isArray(value) ? [...value] : value;
  }

  function isDebugMenuTogglePressed() {
    const pressed = keys.F10 || keys.Backquote;
    if (pressed) {
      if (debugToggleLatch) return false;
      debugToggleLatch = true;
      return true;
    }

    debugToggleLatch = false;
    return false;
  }

  function isSkipKeyPressed() {
    const pressed = keys.Digit1 || keys.Numpad1;
    if (pressed) {
      if (skipKeyLatch) return false;
      skipKeyLatch = true;
      return true;
    }

    skipKeyLatch = false;
    return false;
  }

  function refreshAfterDebugMutation({ reloadHub = true } = {}) {
    campaign.state.finalWin = false;

    if (reloadHub) {
      campaign.enterHub();
      loadHub();
    }

    persistProgress();
    hud.update(buildHudModel());
    worldMenu.render();
    pauseMenu.render();
    debugMenu.render();
  }

  function recalculateProgressTotals({ forceKeyCubes = null } = {}) {
    let completed = 0;
    let cubes = 0;

    campaign.state.worldProgress.forEach((progress, index) => {
      const world = GAME_CONFIG.campaignWorlds[index];
      const stageCount = getWorldStageCount(world);
      const completedStagesInWorld = Math.max(0, Math.min(stageCount, progress.highestCompletedStage + 1));
      completed += completedStagesInWorld;

      if (progress.bossDefeated && world.keyCubeReward) {
        progress.keyCubeClaimed = true;
      }

      if (progress.keyCubeClaimed && world.keyCubeReward) {
        cubes += 1;
      }
    });

    campaign.state.totalCompletedStages = completed;
    campaign.state.keyCubes = forceKeyCubes === null
      ? Math.min(cubes, GAME_CONFIG.requiredKeyCubes)
      : Math.max(0, Math.min(forceKeyCubes, GAME_CONFIG.requiredKeyCubes));
  }

  function setWorldProgressState(worldIndex, stateType) {
    const world = GAME_CONFIG.campaignWorlds[worldIndex];
    const progress = campaign.state.worldProgress[worldIndex];
    if (!world || !progress) return;

    const stageCount = getWorldStageCount(world);
    const bossStage = stageCount - 1;

    if (stateType === "fresh") {
      progress.highestUnlockedStage = 0;
      progress.highestCompletedStage = -1;
      progress.bossDefeated = false;
      progress.keyCubeClaimed = false;
      return;
    }

    if (stateType === "unlocked") {
      progress.highestUnlockedStage = bossStage;
      progress.highestCompletedStage = Math.max(progress.highestCompletedStage, bossStage - 1);
      progress.bossDefeated = false;
      progress.keyCubeClaimed = false;
      return;
    }

    if (stateType === "bossCleared") {
      progress.highestUnlockedStage = bossStage;
      progress.highestCompletedStage = bossStage;
      progress.bossDefeated = true;
      progress.keyCubeClaimed = !!world.keyCubeReward;
    }
  }

  const debugMenu = createDebugMenu({
    getModel: () => ({
      currentLabel: campaign.state.mode === "hub"
        ? "Hub"
        : `${GAME_CONFIG.campaignWorlds[campaign.state.worldIndex]?.name || "Unknown"} - Stage ${campaign.state.stageIndex + 1}`,
      currency: campaign.state.currency,
      skillCount: countOwnedSkills(campaign.state.skills),
      completedStages: campaign.state.totalCompletedStages,
      totalStages: campaign.state.totalStages,
      keyCubes: campaign.state.keyCubes,
      skillEntries: SKILL_DEFINITIONS.map(skill => ({
        id: skill.id,
        name: skill.name,
        enabled: Boolean(campaign.state.skills[skill.id])
      })),
      worlds: GAME_CONFIG.campaignWorlds.map((world, index) => {
        const stageCount = getWorldStageCount(world);
        const progress = campaign.state.worldProgress[index];
        return {
          index,
          name: world.name,
          stageCount,
          bossStage: stageCount - 1,
          bossDefeated: Boolean(progress?.bossDefeated)
        };
      })
    }),
    onClose: () => {
      paused = false;
      if (musicEnabled) audio.resumeMusic();
    },
    onTravelHub: () => {
      paused = false;
      travelToHub();
      if (musicEnabled) audio.resumeMusic();
    },
    onTravelWorld: (worldIndex, stageIndex) => {
      paused = false;
      debugTravelToWorld(worldIndex, stageIndex);
      if (musicEnabled) audio.resumeMusic();
    },
    onUnlockAllSkills: () => {
      for (const skillId of Object.keys(campaign.state.skills)) {
        campaign.unlockSkill(skillId);
      }
      campaign.state.currency = Math.max(campaign.state.currency, 999);
      refreshAfterDebugMutation({ reloadHub: false });
    },
    onResetSkills: () => {
      for (const skillId of Object.keys(campaign.state.skills)) {
        campaign.state.skills[skillId] = false;
      }
      refreshAfterDebugMutation({ reloadHub: false });
    },
    onMaxCurrency: () => {
      campaign.state.currency = 999;
      refreshAfterDebugMutation({ reloadHub: false });
    },
    onSetCollectibles: amount => {
      campaign.state.currency = Math.max(0, Math.floor(amount));
      refreshAfterDebugMutation({ reloadHub: false });
    },
    onFreshStart: () => {
      const fresh = createDefaultCampaignSave(GAME_CONFIG.campaignWorlds);
      campaign.state.worldProgress = structuredClone(fresh.worldProgress);
      campaign.state.skills = structuredClone(fresh.skills);
      campaign.state.currency = fresh.currency;
      campaign.state.totalCompletedStages = fresh.totalCompletedStages;
      campaign.state.keyCubes = fresh.keyCubes;
      refreshAfterDebugMutation();
    },
    onMidCampaign: () => {
      campaign.state.worldProgress.forEach((_, index) => {
        if (index <= 1) {
          setWorldProgressState(index, "bossCleared");
        } else if (index === 2) {
          setWorldProgressState(index, "unlocked");
        } else {
          setWorldProgressState(index, "fresh");
        }
      });

      campaign.state.currency = Math.max(campaign.state.currency, 120);
      recalculateProgressTotals();
      refreshAfterDebugMutation();
    },
    onUnlockAllWorlds: () => {
      campaign.state.worldProgress.forEach((_, index) => setWorldProgressState(index, "unlocked"));
      recalculateProgressTotals({ forceKeyCubes: GAME_CONFIG.requiredKeyCubes });
      refreshAfterDebugMutation();
    },
    onNearCompletion: () => {
      campaign.state.worldProgress.forEach((_, index) => {
        if (index === GAME_CONFIG.finalWorldIndex) {
          setWorldProgressState(index, "unlocked");
        } else {
          setWorldProgressState(index, "bossCleared");
        }
      });

      recalculateProgressTotals({ forceKeyCubes: GAME_CONFIG.requiredKeyCubes });
      campaign.state.currency = 999;

      refreshAfterDebugMutation();
    },
    onFinalBossReady: () => {
      campaign.state.worldProgress.forEach((_, index) => {
        if (index === GAME_CONFIG.finalWorldIndex) {
          setWorldProgressState(index, "unlocked");
        } else {
          setWorldProgressState(index, "bossCleared");
        }
      });

      recalculateProgressTotals({ forceKeyCubes: GAME_CONFIG.requiredKeyCubes });
      refreshAfterDebugMutation();
    },
    onTriggerEndCredits: () => {
      setWorldProgressState(GAME_CONFIG.finalWorldIndex, "bossCleared");
      recalculateProgressTotals({ forceKeyCubes: GAME_CONFIG.requiredKeyCubes });
      campaign.state.finalWin = true;
      persistProgress();
      playEndCredits();
    },
    onToggleSkill: skillId => {
      if (!(skillId in campaign.state.skills)) return;
      campaign.state.skills[skillId] = !campaign.state.skills[skillId];
      refreshAfterDebugMutation({ reloadHub: false });
    },
    onSetWorldState: (worldIndex, stateType) => {
      setWorldProgressState(worldIndex, stateType);
      recalculateProgressTotals();
      refreshAfterDebugMutation();
    }
  });

  function unlockAudio(event) {
    if (performance.now() - gameStartTimeMs < 1200) return;
    if (event?.type === "keydown") {
      if (event.repeat) return;
      if (event.code === "Enter" || event.code === "NumpadEnter" || event.code === "Space") return;
    }
    audio.unlock();
    setMusicForCurrentState();
    removeEventListener("pointerdown", unlockAudio);
    removeEventListener("touchstart", unlockAudio);
    removeEventListener("keydown", unlockAudio);
  }

  addEventListener("pointerdown", unlockAudio);
  addEventListener("touchstart", unlockAudio, { passive: true });
  addEventListener("keydown", unlockAudio);

  if (startMode === "minigame") {
    enterMinigame();
  } else if (isCampaignCompleteFromSave()) {
    campaign.state.finalWin = true;
    playEndCredits();
  } else {
    loadHub();
  }
  worldMenu.render();
  pauseMenu.render();
  debugMenu.render();
  controlsMenu.render();
  shopMenu.render();

  function getDashDirection() {
    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed > 0.01) {
      return { x: velocity.x / speed, z: velocity.z / speed };
    }

    const basis = cameraController.getMoveBasis();
    return { x: basis.forwardX, z: basis.forwardZ };
  }

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.033);
    const elapsed = clock.elapsedTime;
    const frameFps = dt > 0 ? 1 / dt : 0;
    fps = fps > 0 ? fps * fpsSmoothing + frameFps * (1 - fpsSmoothing) : frameFps;

    if (isWorldLoading) {
      hud.update(buildHudModel());
      renderer.render(scene, camera);
      return;
    }

    if (!runtime) return;

    if (controlsMenu.isOpen() || shopMenu.isOpen() || debugMenu.isOpen()) {
      hud.update(buildHudModel());
      renderer.render(scene, camera);
      return;
    }

    if (isDebugMenuTogglePressed()) {
      if (!debugMenu.isOpen()) {
        paused = true;
        worldMenu.close();
        pauseMenu.close();
        debugMenu.open();
        audio.pauseMusic();
      } else {
        debugMenu.close();
        paused = false;
        if (musicEnabled) audio.resumeMusic();
      }
    }

    if (controls.isActionPressed("pause")) {
      paused = !paused;
      if (paused) {
        worldMenu.close();
        debugMenu.close();
        pauseMenu.open();
        audio.playSfx("pause", 0.6);
        audio.pauseMusic();
      } else {
        audio.playSfx("pause", 0.5);
        pauseMenu.close();
        if (musicEnabled) audio.resumeMusic();
      }
    }

    if (controls.isActionPressed("worldMenu")) {
      if (!paused && !minigameState.active) worldMenu.toggle();
    }

    if (controls.isActionPressed("hub")) {
      if (minigameState.active) {
        location.reload();
        return;
      }
      travelToHub();
    }

    if (paused) {
      hud.update(buildHudModel());
      renderer.render(scene, camera);
      return;
    }

    if (ability.dashTimeLeft <= 0) {
      updateHorizontalVelocity(controls, cameraController, velocity, PLAYER_CONFIG.speed);
    }

    cameraController.updateFromKeys(keys, dt);

    const jumpPressed = controls.isActionPressed("jump");
    const jumpHeld = controls.isActionDown("jump");
    const dashPressed = controls.isActionPressed("dash");

    const physics = stepPlayerPhysics({
      player,
      velocity,
      colliders: runtime.colliders,
      dt,
      grounded,
      fallLimit: PLAYER_CONFIG.fallLimit,
      config: PLAYER_CONFIG,
      input: {
        jumpPressed,
        dashPressed,
        jumpHeld,
        dashDirection: getDashDirection()
      },
      ability,
      skills: campaign.state.skills
    });

    grounded = physics.grounded;

    if (jumpPressed) {
      audio.playSfx("jump", 0.65);
      effects.emit("jump", player.position, { x: 0, y: 1.4, z: 0 }, 0.35, 6);
    }
    if (dashPressed) {
      audio.playSfx("dash", 0.7);
      effects.emit("dash", player.position, getDashDirectionVector(), 0.8, 14);
    }

    if (minigameState.active) {
      // Buffered tap vs hold heuristic: short taps register as slashes,
      // holds starting after `chargeStartDelay` begin charging for explosion.
      const slashDown = controls.isActionDown("slash");
      const slashPressed = controls.isActionPressed("slash");
      const tapWindow = 0.06; // small window to consider fast taps
      const chargeStartDelay = 0.18; // how long before we treat hold as charge
      const chargeHoldDuration = 0.75;

      if (slashPressed) {
        minigameState.slashBufferAt = elapsed;
        // Immediate full-circle slash on keydown for instant feel (short taps).
        if (minigameState.chargeHeldSince == null && elapsed >= minigameState.slashCooldownUntil && !minigameState.won) {
          const direction = getDashDirection();
          const slashResult = resolveSwordSlash(player, runtime.enemies, {
            radius: REGULAR_SLASH_RADIUS,
            damage: 1,
            forwardX: direction.x,
            forwardZ: direction.z,
            forwardDotThreshold: -0.15,
            fullCircle: true,
            sphere: true
          });
          minigameState.slashCooldownUntil = elapsed + 0.22;
          minigameState.slashAnimUntil = elapsed + 0.19;
          audio.playSfx("enemy", slashResult.hits > 0 ? 0.72 : 0.48);
          effects.emit("hit", player.position, { x: direction.x * 0.9, y: 0.7, z: direction.z * 0.9 }, 0.75, slashResult.hits > 0 ? 12 : 5);
          effects.emitSlash(player.position, direction, {
            color: 0xffd45c,
            scale: REGULAR_SLASH_RADIUS,
            life: 0.18,
            fullCircle: true,
            sphere: true
          });
          if (slashResult.defeated > 0) {
            audio.playSfx("enemyDefeat", 0.84);
            effects.emit("dash", player.position, { x: direction.x * 0.6, y: 0.5, z: direction.z * 0.6 }, 0.7, 10);
          }
          refreshMinigameStatus();
          minigameState.slashFiredThisPress = true;
        } else {
          minigameState.slashFiredThisPress = false;
        }
      }

      // start charging only after the chargeStartDelay has passed since keydown
      if (slashDown) {
        if (minigameState.slashBufferAt != null && minigameState.chargeHeldSince == null) {
          const since = elapsed - minigameState.slashBufferAt;
          if (since >= chargeStartDelay && elapsed >= ((minigameState.chargeCooldownUntil) || 0)) {
            minigameState.chargeHeldSince = minigameState.slashBufferAt;
            minigameState.slashBufferAt  = null;
            minigameState.chargeLastVisual = 0;
          }
        }

        // while charging, emit visuals
        if (minigameState.chargeHeldSince != null) {
          const held = elapsed - (minigameState.chargeHeldSince || 0);
          const ratio = Math.min(1, held / chargeHoldDuration);
          if (elapsed - (minigameState.chargeLastVisual || 0) >= 0.12) {
            const ready = ratio >= 1 && elapsed >= ((minigameState.chargeCooldownUntil) || 0);
            effects.emitSlash(player.position, { x: 0, z: 1 }, {
              color: ready ? 0xff3b3b : 0xffffff,
              scale: ready ? 4.2 : (1.6 + ratio * 3.2),
              life: ready ? 0.36 : 0.24,
              fullCircle: true,
              opacity: ready ? 0.96 : 0.72
            });
            minigameState.chargeLastVisual = elapsed;
          }
        }
      } else {
        // released: decide between instant tap, short tap, or charged explosion
        if (minigameState.chargeHeldSince != null) {
          const held = elapsed - minigameState.chargeHeldSince;
          if (held >= chargeHoldDuration && elapsed >= (minigameState.chargeCooldownUntil || 0) && !minigameState.won) {
            audio.playSfx("explosion", 0.95);
            const baseBlast = 5.0;
            const blastRadius = baseBlast * 3.6; // 1.2x larger than the prior charged radius
            const explosionScale = Math.max(10, Math.round(blastRadius * 0.85 * 10) / 10);
            effects.emitExplosion(player.position, { scale: explosionScale, life: 1.0, color: 0xffe8cc });
            if (cameraController && typeof cameraController.shake === "function") {
              cameraController.shake(1.6, 0.32);
            }
            let obliterated = 0;
            for (const enemy of runtime.enemies || []) {
              if (enemy.defeated) continue;
              const dx = enemy.mesh.position.x - player.position.x;
              const dz = enemy.mesh.position.z - player.position.z;
              const dist = Math.hypot(dx, dz);
              if (dist <= blastRadius) {
                enemy.defeated = true;
                enemy.health = 0;
                if (enemy.mesh) enemy.mesh.visible = false;
                obliterated++;
              }
            }
            if (obliterated > 0) audio.playSfx("enemyDefeat", 0.9);
            effects.emit("dash", player.position, { x: 0, y: 0.8, z: 0 }, 1.2, 18);
            minigameState.chargeCooldownUntil = elapsed + 8.0;
            refreshMinigameStatus();
          } else if (held > 0 && held < 1.0) {
            // released after starting charge but not fully charged: treat as short tap
            const direction = getDashDirection();
            const slashResult = resolveSwordSlash(player, runtime.enemies, {
              radius: REGULAR_SLASH_RADIUS,
              damage: 1,
              forwardX: direction.x,
              forwardZ: direction.z,
              forwardDotThreshold: -0.15,
              fullCircle: true,
              sphere: true
            });
            minigameState.slashCooldownUntil = elapsed + 0.22;
            minigameState.slashAnimUntil = elapsed + 0.19;
            audio.playSfx("enemy", slashResult.hits > 0 ? 0.72 : 0.48);
            effects.emit("hit", player.position, { x: direction.x * 0.9, y: 0.7, z: direction.z * 0.9 }, 0.75, slashResult.hits > 0 ? 12 : 5);
            effects.emitSlash(player.position, direction, {
              color: 0xffd45c,
              scale: REGULAR_SLASH_RADIUS,
              life: 0.18,
              fullCircle: true,
              sphere: true
            });
            if (slashResult.defeated > 0) {
              audio.playSfx("enemyDefeat", 0.84);
              effects.emit("dash", player.position, { x: direction.x * 0.6, y: 0.5, z: direction.z * 0.6 }, 0.7, 10);
            }
            refreshMinigameStatus();
          }
        } else if (minigameState.slashBufferAt != null) {
          const bufferedHeld = elapsed - minigameState.slashBufferAt;
          // quick tap -> instant-feel slash (on release within tapWindow)
          if (bufferedHeld <= tapWindow && elapsed >= minigameState.slashCooldownUntil && !minigameState.won && !minigameState.slashFiredThisPress) {
            const direction = getDashDirection();
            const slashResult = resolveSwordSlash(player, runtime.enemies, {
              radius: REGULAR_SLASH_RADIUS,
              damage: 1,
              forwardX: direction.x,
              forwardZ: direction.z,
              forwardDotThreshold: -0.15,
              fullCircle: true,
              sphere: true
            });
            minigameState.slashCooldownUntil = elapsed + 0.22;
            minigameState.slashAnimUntil = elapsed + 0.19;
            audio.playSfx("enemy", slashResult.hits > 0 ? 0.72 : 0.48);
            effects.emit("hit", player.position, { x: direction.x * 0.9, y: 0.7, z: direction.z * 0.9 }, 0.75, slashResult.hits > 0 ? 12 : 5);
            effects.emitSlash(player.position, direction, {
              color: 0xffd45c,
              scale: REGULAR_SLASH_RADIUS,
              life: 0.18,
              fullCircle: true,
              sphere: true
            });
            if (slashResult.defeated > 0) {
              audio.playSfx("enemyDefeat", 0.84);
              effects.emit("dash", player.position, { x: direction.x * 0.6, y: 0.5, z: direction.z * 0.6 }, 0.7, 10);
            }
            refreshMinigameStatus();
            minigameState.slashFiredThisPress = false;
          }
        }

        minigameState.chargeHeldSince = null;
        minigameState.slashBufferAt = null;
      }
    }

    // Restore regular forward slash when not in the minigame.
    if (!minigameState.active) {
      if (controls.isActionPressed("slash") && elapsed >= globalSlashCooldownUntil) {
        const direction = getDashDirection();
        const slashResult = resolveSwordSlash(player, runtime.enemies, {
          radius: REGULAR_SLASH_RADIUS,
          damage: 1,
          forwardX: direction.x,
          forwardZ: direction.z,
          fullCircle: true,
          sphere: true
        });
        globalSlashCooldownUntil = elapsed + 0.26;
        audio.playSfx("enemy", slashResult.hits > 0 ? 0.68 : 0.42);
        effects.emit("hit", player.position, { x: direction.x * 0.9, y: 0.7, z: direction.z * 0.9 }, 0.75, slashResult.hits > 0 ? 12 : 5);
        effects.emitSlash(player.position, direction, {
          color: 0xffd45c,
          scale: REGULAR_SLASH_RADIUS,
          life: 0.18,
          fullCircle: true,
          sphere: true
        });
        if (slashResult.defeated > 0) audio.playSfx("enemyDefeat", 0.8);
      }
    }

    const launched = applyJumpPads(
      player,
      velocity,
      runtime.jumpPads,
      1.2,
      PLAYER_CONFIG.jumpPadBoost,
      elapsed
    );

    if (launched) {
      grounded = false;
      ability.dashAvailable = true;
    }

    const dashOrbCount = collectDashOrbs(player, runtime.dashOrbs, 1.1);
    if (dashOrbCount > 0) {
      ability.dashAvailable = true;
      audio.playSfx("collect", 0.55);
      effects.emit("collect", player.position, { x: 0, y: 0.9, z: 0 }, 0.25, 4);
    }

    const enemyContact = resolveEnemyContacts(player, velocity, runtime.enemies, {
      contactRadius: 1,
      stompMinFallSpeed: -1.6,
      stompHeightBias: 0.22,
      stompBounceSpeed: Math.max(PLAYER_CONFIG.jumpVelocity * 0.95, 7.8)
    });

    if (enemyContact.defeated > 0) {
      audio.playSfx("enemyDefeat", 0.78);
      grounded = false;
      effects.emit("hit", player.position, { x: 0, y: 1.3, z: 0 }, 0.5, 8);
      if (minigameState.active) refreshMinigameStatus();
    }

    if (enemyContact.playerHit && elapsed >= damageCooldownUntil) {
      cancelMinigameCharge();
      triggerDamageFeedback(elapsed);
      effects.emit("hit", player.position, { x: 0, y: 1.2, z: 0 }, 0.55, 10);
      player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
      velocity.set(0, 0, 0);
      resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
      grounded = false;
    }

    if (minigameState.active) {
      const bombResult = resolveBombContacts(player, runtime.bombs, elapsed, { touchPadding: 0.6 });
      if (bombResult.exploded > 0 && elapsed >= damageCooldownUntil) {
        audio.playSfx("explosion", 0.9);
        cancelMinigameCharge();
        effects.emit("hit", player.position, { x: 0, y: 1.1, z: 0 }, 0.9, 18);
        triggerDamageFeedback(elapsed);
        player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
        velocity.set(0, 0, 0);
        resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
        grounded = false;
      }
    }

    if (elapsed >= damageCooldownUntil) {
      if (player.bodyMaterial?.emissive) {
        player.bodyMaterial.emissive.setHex(0x000000);
      }
    } else {
      const pulse = (Math.sin(elapsed * 30) + 1) / 2;
      if (player.bodyMaterial?.emissive) {
        player.bodyMaterial.emissive.setHex(pulse > 0.5 ? 0xff6633 : 0x441100);
      }
    }

    if (physics.fell) {
      triggerDamageFeedback(elapsed);
      player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
      velocity.set(0, 0, 0);
      resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
      grounded = false;
    }

    if (grounded && !lastGrounded) {
      effects.emit("land", player.position, { x: 0, y: 0.6, z: 0 }, 0.2, 4);
    }

    if (Math.hypot(velocity.x, velocity.z) > 0.1 && grounded && moveEffectCooldown <= 0) {
      effects.emit("move", player.position, { x: 0, y: 0.15, z: 0 }, 0.16, 2);
      moveEffectCooldown = 0.1;
    }

    turnEffectCooldown = Math.max(0, turnEffectCooldown - dt);
    moveEffectCooldown = Math.max(0, moveEffectCooldown - dt);
    const previousRotationY = player.rotation.y;
    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed > 0.01) {
      const baseYaw = Math.atan2(velocity.x, velocity.z);
      const moveSignZ = Math.sign(velocity.z || 0);

      // compute angular difference between desired move yaw and current facing
      const angleDiff = Math.abs(normalizeAngle(baseYaw - previousRotationY));
      const opposite = angleDiff >= (Math.PI * 0.9); // roughly 162°+ considered opposite

      // if the player is moving roughly opposite their facing, do a smooth 180° turn
      if (opposite && Math.abs(velocity.z) > 0.8 && !player.spinActive) {
        player.spinActive = true;
        player.spinRemaining = Math.PI; // 180 degrees
        player.spinBaseYaw = previousRotationY;
      }

      if (player.spinActive) {
        const rotateDelta = player.spinSpeed * dt;
        player.spinRemaining -= rotateDelta;
        const spun = Math.PI - Math.max(0, player.spinRemaining);
        player.rotation.y = (player.spinBaseYaw || baseYaw) + spun;
        if (player.spinRemaining <= 0) {
          player.spinActive = false;
          player.spinRemaining = 0;
          lastMoveSignZ = moveSignZ;
        }
      } else {
        player.rotation.y = baseYaw;
        lastMoveSignZ = moveSignZ;
      }
    }

    const rotationDelta = Math.abs(normalizeAngle(player.rotation.y - previousRotationY));
    if (rotationDelta > 0.2 && turnEffectCooldown <= 0) {
      effects.emit("turn", player.position, { x: 0, y: 0.3, z: 0 }, 0.18, 2);
      turnEffectCooldown = 0.14;
    }

    lastRotationY = player.rotation.y;
    lastGrounded = grounded;

    if (minigameState.active && player.rightArm) {
      const baseArmRotation = -0.42;
      if (elapsed < minigameState.slashAnimUntil) {
        const swingProgress = 1 - (minigameState.slashAnimUntil - elapsed) / 0.19;
        const swingWave = Math.sin(Math.min(1, Math.max(0, swingProgress)) * Math.PI);
        player.rightArm.rotation.z = baseArmRotation - swingWave * 1.55;
      } else {
        player.rightArm.rotation.z += (baseArmRotation - player.rightArm.rotation.z) * Math.min(1, dt * 10);
      }
    }

    runtime.update(dt, elapsed, { playerPosition: player.position });
    effects.update(dt, elapsed);

    if (minigameState.active) {
      refreshMinigameStatus();
      if (minigameState.won && isMinigameConfirmPressed()) {
        if (minigameState.level >= minigameState.maxLevel) {
          location.reload();
          return;
        }
        enterMinigameLevel(minigameState.level + 1);
        return;
      }

      hud.update(buildHudModel());
      cameraController.updateCamera(dt);
      renderer.render(scene, camera);
      return;
    }

    if (campaign.state.mode === "hub") {
      const nearbyPortal = findNearbyPortal(player, runtime.portals, GAME_CONFIG.portalRadius);
      const pressedEnter = controls.isActionPressed("interact");
      const pressedSkip = isSkipKeyPressed();
      const canSkipWorld = nearbyPortal && nearbyPortal.unlocked && campaign.canAfford(100);

      if (nearbyPortal && pressedEnter && nearbyPortal.unlocked) {
        const progress = campaign.state.worldProgress[nearbyPortal.worldIndex];
        audio.playSfx("portal", 0.75);
        travelToWorld(nearbyPortal.worldIndex, progress.highestUnlockedStage);
      }

      if (pressedSkip && canSkipWorld && campaign.spendCurrency(100)) {
        audio.playSfx("explosion", 0.85);
        const worldIndex = nearbyPortal.worldIndex;
        const world = GAME_CONFIG.campaignWorlds[worldIndex];
        const progress = campaign.state.worldProgress[worldIndex];
        const bossStage = getWorldStageCount(world) - 1;

        progress.highestUnlockedStage = bossStage;
        progress.highestCompletedStage = bossStage;
        progress.bossDefeated = true;
        progress.keyCubeClaimed = !!world.keyCubeReward;

        recalculateProgressTotals();
        persistProgress();
        worldMenu.render();
        pauseMenu.render();

        if (worldIndex === GAME_CONFIG.finalWorldIndex) {
          campaign.state.finalWin = true;
          playEndCredits();
          return;
        }

        loadHub();
        return;
      }

      hud.update({
        ...buildHudModel(),
        portalPrompt: nearbyPortal
          ? nearbyPortal.unlocked
            ? `Press E to enter ${nearbyPortal.name}`
            : `${nearbyPortal.name} is locked (need key cubes)`
          : "",
        skipPrompt: canSkipWorld
          ? `Press 1 to skip ${nearbyPortal.name} for 100 currency and claim its boss cube`
          : ""
      });
    } else {
      const skipCost = runtime.isBossStage ? 60 : 20;
      const canSkipLevel = campaign.canAfford(skipCost);
      const pressedSkip = isSkipKeyPressed();

      if (pressedSkip && canSkipLevel && campaign.spendCurrency(skipCost)) {
        const skippedBossStage = runtime.isBossStage;
        const result = campaign.completeCurrentStage();
        if (skippedBossStage) {
          audio.playSfx("boss", 0.9);
        } else {
          audio.playSfx("portal", 0.7);
        }
        persistProgress();
        worldMenu.render();
        pauseMenu.render();

        if (campaign.state.finalWin) {
          playEndCredits();
          return;
        }

        if (result.transition === "hub") {
          loadHub();
        } else {
          loadCurrentStage();
        }
        return;
      }

      const collectedThisFrame = collectNearby(player, runtime.collectibles, 1.05);
      if (collectedThisFrame > 0) {
        collectedCoins += collectedThisFrame;
        campaign.earnCurrency(collectedThisFrame);
        audio.playSfx("collect", 0.5);
        effects.emit("collect", player.position, { x: 0, y: 0.8, z: 0 }, 0.25, 3);
        persistProgress();
      }

      if (isGoalReached(player, runtime.goal, 2)) {
        const result = campaign.completeCurrentStage();
        if (result.isBossStage) {
          audio.playSfx("boss", 0.9);
          if (result.awardedKeyCube) audio.playSfx("key", 0.9);
        } else {
          audio.playSfx("portal", 0.7);
        }
        persistProgress();
        worldMenu.render();
        pauseMenu.render();

        if (campaign.state.finalWin) {
          playEndCredits();
          return;
        }

        if (result.transition === "hub") {
          loadHub();
        } else {
          loadCurrentStage();
        }
      }

      const hudModel = buildHudModel();
      hud.update({
        ...hudModel,
        skipPrompt: hudModel.skipPrompt || (campaign.canAfford(60) ? "Press 1 to claim the boss cube (Charge: 60 coins)" : "")
      });
    }

    cameraController.updateCamera(dt);
    renderer.render(scene, camera);
  }

  animate();
}

function normalizeAngle(angle) {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}
