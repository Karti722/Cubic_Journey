import { THREE } from "../engine/three.js";
import { createRenderContext, attachResize } from "../engine/core/render-context.js";
import { createCameraController } from "../engine/camera/camera-controller.js";
import { createInput } from "../engine/input/input.js";
import { GAME_CONFIG, PLAYER_CONFIG, getWorldStageCount } from "../game/config/game-config.js";
import { createCampaignState, createDefaultCampaignSave } from "../game/campaign/campaign-state.js";
import { createHubDefinition, createStageDefinition } from "../game/world/level-generator.js";
import { buildWorldRuntime } from "../game/world/runtime-builder.js";
import { updateHorizontalVelocity } from "../game/systems/movement-system.js";
import { createAbilityState, resetAbilityState, stepPlayerPhysics } from "../game/systems/physics-system.js";
import {
  applyJumpPads,
  collectDashOrbs,
  collectNearby,
  isGoalReached,
  findNearbyPortal,
  resolveEnemyContacts
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

export function startGame(uiElement) {
  const { scene, camera, renderer, clock } = createRenderContext();
  attachResize(camera, renderer);

  const playerMaterial = new THREE.MeshStandardMaterial({
    color: 0xff5555,
    emissive: 0x000000,
    emissiveIntensity: 1
  });

  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    playerMaterial
  );
  player.castShadow = true;
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

  let campaignInfoReturnToPause = false;

  function openCampaignInfo(fromPause = false) {
    campaignInfoReturnToPause = fromPause;
    campaignInfoMenu.open();
    audio.pauseMusic();
  }

  const velocity = new THREE.Vector3();
  const ability = createAbilityState(PLAYER_CONFIG.extraAirJumps);
  let debugToggleLatch = false;

  function loadDefinition(definition, loadingMessage = "Building the world...") {
    const loadToken = ++worldLoadToken;
    isWorldLoading = true;
    loadingScreen.show(loadingMessage);

    setTimeout(() => {
      if (loadToken !== worldLoadToken) return;

      if (runtime) runtime.dispose();
      runtime = buildWorldRuntime(scene, definition);
      player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
      velocity.set(0, 0, 0);
      resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
      grounded = false;
      collectedCoins = 0;

      if (runtime.enemies && runtime.enemies.length > 0) {
        audio.playSfx("enemy", 0.45);
      }

      setMusicForCurrentState();
      hud.update(buildHudModel());
      isWorldLoading = false;
      loadingScreen.hide();
    }, 0);
  }

  function triggerDamageFeedback(elapsed) {
    damageCooldownUntil = elapsed + 0.85;
    audio.playSfx("damage", 0.82);
    playerMaterial.emissive.setHex(0xff3311);
  }

  function setMusicForCurrentState() {
    const trackName = campaign.state.mode === "hub"
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
    const definition = createHubDefinition({ canAccessWorld: campaign.canAccessWorld });
    loadDefinition(definition, "Entering the hub...");
  }

  function loadCurrentStage() {
    const definition = createStageDefinition(campaign.state.worldIndex, campaign.state.stageIndex);
    loadDefinition(definition, "Loading the next stage...");
  }

  function persistProgress() {
    writeSave(campaign.getSaveData());
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
      unlockedWorldCount: GAME_CONFIG.campaignWorlds.filter((_, index) => campaign.canAccessWorld(index)).length,
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
    if (campaign.state.mode === "hub") {
      return {
        mode: "hub",
        storyLine: STORY.premise,
        completedStages: campaign.state.totalCompletedStages,
        totalStages: campaign.state.totalStages,
        keyCubes: campaign.state.keyCubes,
        currency: campaign.state.currency,
        skillCount: countOwnedSkills(campaign.state.skills),
        portalPrompt: "",
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
    return {
      mode: "level",
      worldName: world.name,
      stageNumber: campaign.state.stageIndex + 1,
      stageCount: getWorldStageCount(world),
      completedStages: campaign.state.totalCompletedStages,
      totalStages: campaign.state.totalStages,
      collectedCoins,
      keyCubes: campaign.state.keyCubes,
      currency: campaign.state.currency,
      skillCount: countOwnedSkills(campaign.state.skills),
      storyLine: STORY.worldNarratives[campaign.state.worldIndex],
      isBossStage: runtime.isBossStage,
      bossName: runtime.isBossStage ? STORY.bossNames[campaign.state.worldIndex] : ""
    };
  }

  function buildCampaignInfoModel() {
    if (campaign.state.mode === "hub") {
      return {
        mode: "hub",
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

  const debugMenu = createDebugMenu({
    getModel: () => ({
      currentLabel: campaign.state.mode === "hub"
        ? "Hub"
        : `${GAME_CONFIG.campaignWorlds[campaign.state.worldIndex]?.name || "Unknown"} - Stage ${campaign.state.stageIndex + 1}`,
      currency: campaign.state.currency,
      skillCount: countOwnedSkills(campaign.state.skills),
      worlds: GAME_CONFIG.campaignWorlds.map((world, index) => {
        const stageCount = getWorldStageCount(world);
        return {
          index,
          name: world.name,
          stageCount,
          bossStage: stageCount - 1
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
      persistProgress();
      pauseMenu.render();
      debugMenu.render();
    },
    onResetSkills: () => {
      for (const skillId of Object.keys(campaign.state.skills)) {
        campaign.state.skills[skillId] = false;
      }
      persistProgress();
      pauseMenu.render();
      debugMenu.render();
    },
    onMaxCurrency: () => {
      campaign.state.currency = 999;
      persistProgress();
      pauseMenu.render();
      debugMenu.render();
    }
  });

  function unlockAudio() {
    audio.unlock();
    setMusicForCurrentState();
    removeEventListener("pointerdown", unlockAudio);
    removeEventListener("keydown", unlockAudio);
  }

  addEventListener("pointerdown", unlockAudio);
  addEventListener("keydown", unlockAudio);

  loadHub();
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

    if (isWorldLoading) {
      renderer.render(scene, camera);
      return;
    }

    if (!runtime) return;

    if (controlsMenu.isOpen() || shopMenu.isOpen() || debugMenu.isOpen()) {
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
      if (!paused) worldMenu.toggle();
    }

    if (controls.isActionPressed("hub")) {
      travelToHub();
    }

    if (paused) {
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
      effects.emit("dash", player.position, getDashDirectionVector(), 0.55, 8);
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
    }

    if (enemyContact.playerHit && elapsed >= damageCooldownUntil) {
      triggerDamageFeedback(elapsed);
      effects.emit("hit", player.position, { x: 0, y: 1.2, z: 0 }, 0.55, 10);
      player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
      velocity.set(0, 0, 0);
      resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
      grounded = false;
    }

    if (elapsed >= damageCooldownUntil) {
      playerMaterial.emissive.setHex(0x000000);
    } else {
      const pulse = (Math.sin(elapsed * 30) + 1) / 2;
      playerMaterial.emissive.setHex(pulse > 0.5 ? 0xff6633 : 0x441100);
    }

    if (physics.fell) {
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
    if (Math.hypot(velocity.x, velocity.z) > 0.01) {
      player.rotation.y = Math.atan2(velocity.x, velocity.z);
    }

    const rotationDelta = Math.abs(normalizeAngle(player.rotation.y - previousRotationY));
    if (rotationDelta > 0.2 && turnEffectCooldown <= 0) {
      effects.emit("turn", player.position, { x: 0, y: 0.3, z: 0 }, 0.18, 2);
      turnEffectCooldown = 0.14;
    }

    lastRotationY = player.rotation.y;
    lastGrounded = grounded;

    runtime.update(dt, elapsed);
    effects.update(dt, elapsed);

    if (campaign.state.mode === "hub") {
      const nearbyPortal = findNearbyPortal(player, runtime.portals, GAME_CONFIG.portalRadius);
      const pressedEnter = controls.isActionPressed("interact");

      if (nearbyPortal && pressedEnter && nearbyPortal.unlocked) {
        const progress = campaign.state.worldProgress[nearbyPortal.worldIndex];
        audio.playSfx("portal", 0.75);
        travelToWorld(nearbyPortal.worldIndex, progress.highestUnlockedStage);
      }

      hud.update({
        ...buildHudModel(),
        portalPrompt: nearbyPortal
          ? nearbyPortal.unlocked
            ? `Press E to enter ${nearbyPortal.name}`
            : `${nearbyPortal.name} is locked (need key cubes)`
          : ""
      });
    } else {
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

        if (result.transition === "hub") {
          loadHub();
        } else {
          loadCurrentStage();
        }
      }

      hud.update(buildHudModel());
    }

    cameraController.updateCamera();
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
