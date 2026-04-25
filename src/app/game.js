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
  findNearbyPortal
} from "../game/systems/interaction-system.js";
import { createHud } from "../game/ui/hud.js";
import { createWorldMenu } from "../game/ui/world-menu.js";
import { createPauseMenu } from "../game/ui/pause-menu.js";
import { STORY } from "../game/story/story-data.js";
import { clearSave, loadSave, writeSave } from "../game/persistence/save-store.js";
import { createAudioEngine } from "../game/audio/audio-engine.js";

export function startGame(uiElement) {
  const { scene, camera, renderer, clock } = createRenderContext();
  attachResize(camera, renderer);

  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff5555 })
  );
  player.castShadow = true;
  player.position.set(0, 3, 0);
  scene.add(player);

  const cameraController = createCameraController(camera, player);
  const { keys } = createInput(renderer.domElement, cameraController.rotateByMouse);
  const hud = createHud(uiElement);
  const audio = createAudioEngine();

  const defaultSave = createDefaultCampaignSave(GAME_CONFIG.campaignWorlds);
  const loadedSave = loadSave(defaultSave);
  const campaign = createCampaignState(GAME_CONFIG.campaignWorlds, loadedSave);

  let runtime = null;
  let grounded = false;
  let collectedCoins = 0;
  let paused = false;
  let musicEnabled = true;

  const velocity = new THREE.Vector3();
  const ability = createAbilityState(PLAYER_CONFIG.extraAirJumps);
  const keyLatch = {};

  function isKeyPressedOnce(code) {
    if (keys[code]) {
      if (keyLatch[code]) return false;
      keyLatch[code] = true;
      return true;
    }

    keyLatch[code] = false;
    return false;
  }

  function loadDefinition(definition) {
    if (runtime) runtime.dispose();
    runtime = buildWorldRuntime(scene, definition);
    player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
    velocity.set(0, 0, 0);
    resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
    grounded = false;
    collectedCoins = 0;
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
    loadDefinition(definition);
    setMusicForCurrentState();
  }

  function loadCurrentStage() {
    const definition = createStageDefinition(campaign.state.worldIndex, campaign.state.stageIndex);
    loadDefinition(definition);
    setMusicForCurrentState();
  }

  function persistProgress() {
    writeSave(campaign.getSaveData());
  }

  function travelToHub() {
    campaign.enterHub();
    loadHub();
    persistProgress();
    worldMenu.render();
    pauseMenu.render();
  }

  function travelToWorld(worldIndex, stageIndex) {
    const entered = campaign.enterWorld(worldIndex, stageIndex);
    if (!entered) return false;

    loadCurrentStage();
    persistProgress();
    worldMenu.render();
    pauseMenu.render();
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
    getModel: () => ({
      mode: campaign.state.mode,
      worldName: GAME_CONFIG.campaignWorlds[campaign.state.worldIndex]?.name || "World Hub",
      storyBlurb: STORY.premise,
      worldBlurb: campaign.state.mode === "hub"
        ? "The hub lets you travel to any discovered world at any time."
        : STORY.worldNarratives[campaign.state.worldIndex],
      completedStages: campaign.state.totalCompletedStages,
      totalStages: campaign.state.totalStages,
      keyCubes: campaign.state.keyCubes,
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
    }),
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

    if (!runtime) return;

    if (isKeyPressedOnce("Escape") || isKeyPressedOnce("KeyP")) {
      paused = !paused;
      if (paused) {
        worldMenu.close();
        pauseMenu.open();
        audio.playSfx("pause", 0.6);
        audio.pauseMusic();
      } else {
        audio.playSfx("pause", 0.5);
        pauseMenu.close();
        if (musicEnabled) audio.resumeMusic();
      }
    }

    if (isKeyPressedOnce("KeyM")) {
      if (!paused) worldMenu.toggle();
    }

    if (isKeyPressedOnce("KeyH")) {
      travelToHub();
    }

    for (let i = 0; i < GAME_CONFIG.campaignWorlds.length; i += 1) {
      if (isKeyPressedOnce(`Digit${i + 1}`)) {
        const progress = campaign.state.worldProgress[i];
        travelToWorld(i, progress.highestUnlockedStage);
      }
    }

    if (paused) {
      renderer.render(scene, camera);
      return;
    }

    if (ability.dashTimeLeft <= 0) {
      updateHorizontalVelocity(keys, cameraController, velocity, PLAYER_CONFIG.speed);
    }

    cameraController.updateFromKeys(keys, dt);

    const jumpPressed = isKeyPressedOnce("Space");
    const dashPressed = isKeyPressedOnce("ShiftLeft") || isKeyPressedOnce("ShiftRight");

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
        dashDirection: getDashDirection()
      },
      ability
    });

    grounded = physics.grounded;

    if (jumpPressed) audio.playSfx("jump", 0.65);
    if (dashPressed) audio.playSfx("dash", 0.7);

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
    }

    if (physics.fell) {
      player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
      velocity.set(0, 0, 0);
      resetAbilityState(ability, PLAYER_CONFIG.extraAirJumps);
      grounded = false;
    }

    if (Math.hypot(velocity.x, velocity.z) > 0.01) {
      player.rotation.y = Math.atan2(velocity.x, velocity.z);
    }

    runtime.update(dt, elapsed);

    if (campaign.state.mode === "hub") {
      const nearbyPortal = findNearbyPortal(player, runtime.portals, GAME_CONFIG.portalRadius);
      const pressedEnter = isKeyPressedOnce("KeyE");

      if (nearbyPortal && pressedEnter && nearbyPortal.unlocked) {
        const progress = campaign.state.worldProgress[nearbyPortal.worldIndex];
        audio.playSfx("portal", 0.75);
        travelToWorld(nearbyPortal.worldIndex, progress.highestUnlockedStage);
      }

      hud.update({
        mode: "hub",
        storyLine: STORY.premise,
        completedStages: campaign.state.totalCompletedStages,
        totalStages: campaign.state.totalStages,
        keyCubes: campaign.state.keyCubes,
        portalPrompt: nearbyPortal
          ? nearbyPortal.unlocked
            ? `Press E to enter ${nearbyPortal.name}`
            : `${nearbyPortal.name} is locked (need key cubes)`
          : "",
        finalWin: campaign.state.finalWin
      });
    } else {
      const collectedThisFrame = collectNearby(player, runtime.collectibles, 1.05);
      if (collectedThisFrame > 0) {
        collectedCoins += collectedThisFrame;
        audio.playSfx("collect", 0.5);
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

      const world = GAME_CONFIG.campaignWorlds[campaign.state.worldIndex];
      hud.update({
        mode: "level",
        worldName: world.name,
        stageNumber: campaign.state.stageIndex + 1,
        stageCount: getWorldStageCount(world),
        completedStages: campaign.state.totalCompletedStages,
        totalStages: campaign.state.totalStages,
        collectedCoins,
        keyCubes: campaign.state.keyCubes,
        storyLine: STORY.worldNarratives[campaign.state.worldIndex],
        isBossStage: runtime.isBossStage,
        bossName: runtime.isBossStage ? STORY.bossNames[campaign.state.worldIndex] : ""
      });
    }

    cameraController.updateCamera();
    renderer.render(scene, camera);
  }

  animate();
}
