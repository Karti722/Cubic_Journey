import { THREE } from "../engine/three.js";
import { createRenderContext, attachResize } from "../engine/core/render-context.js";
import { createCameraController } from "../engine/camera/camera-controller.js";
import { createInput } from "../engine/input/input.js";
import { GAME_CONFIG, PLAYER_CONFIG } from "../game/config/game-config.js";
import { createCampaignState } from "../game/campaign/campaign-state.js";
import { createHubDefinition, createLevelDefinition } from "../game/world/level-generator.js";
import { buildWorldRuntime } from "../game/world/runtime-builder.js";
import { updateHorizontalVelocity } from "../game/systems/movement-system.js";
import { stepPlayerPhysics } from "../game/systems/physics-system.js";
import { collectNearby, isGoalReached, findNearbyPortal } from "../game/systems/interaction-system.js";
import { createHud } from "../game/ui/hud.js";

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

  const campaign = createCampaignState(GAME_CONFIG.campaignWorlds);

  let runtime = null;
  let grounded = false;
  let collectedCoins = 0;

  const velocity = new THREE.Vector3();
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
    grounded = false;
    collectedCoins = 0;
  }

  function loadHub() {
    const definition = createHubDefinition(campaign.state);
    loadDefinition(definition);
  }

  function loadCurrentLevel() {
    const definition = createLevelDefinition(campaign.state.worldIndex, campaign.state.levelIndex);
    loadDefinition(definition);
  }

  loadHub();

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.033);
    const elapsed = clock.elapsedTime;

    if (!runtime) return;

    updateHorizontalVelocity(keys, cameraController, velocity, PLAYER_CONFIG.speed);
    cameraController.updateFromKeys(keys, dt);

    const physics = stepPlayerPhysics({
      player,
      velocity,
      colliders: runtime.colliders,
      dt,
      gravity: PLAYER_CONFIG.gravity,
      jumpVelocity: PLAYER_CONFIG.jumpVelocity,
      halfHeight: PLAYER_CONFIG.halfHeight,
      jumpPressed: keys.Space,
      grounded,
      fallLimit: PLAYER_CONFIG.fallLimit
    });

    grounded = physics.grounded;

    if (physics.fell) {
      player.position.set(runtime.spawn.x, runtime.spawn.y, runtime.spawn.z);
      velocity.set(0, 0, 0);
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
        const entered = campaign.enterWorld(nearbyPortal.worldIndex);
        if (entered) {
          loadCurrentLevel();
        }
      }

      hud.update({
        mode: "hub",
        completedLevels: campaign.state.completedLevels,
        totalLevels: campaign.state.totalLevels,
        unlockedWorldIndex: campaign.state.unlockedWorldIndex,
        worldCount: GAME_CONFIG.campaignWorlds.length,
        portalPrompt: nearbyPortal
          ? nearbyPortal.unlocked
            ? `Press E to enter ${nearbyPortal.name}`
            : `${nearbyPortal.name} is locked`
          : "",
        finalWin: campaign.state.finalWin
      });
    } else {
      collectedCoins += collectNearby(player, runtime.collectibles, 1.05);

      if (isGoalReached(player, runtime.goal, 2)) {
        campaign.completeCurrentLevel();
        if (campaign.state.mode === "hub") {
          loadHub();
        } else {
          loadCurrentLevel();
        }
      }

      const world = GAME_CONFIG.campaignWorlds[campaign.state.worldIndex];
      hud.update({
        mode: "level",
        worldName: world.name,
        levelNumber: campaign.state.levelIndex + 1,
        levelCount: world.levelCount,
        completedLevels: campaign.state.completedLevels,
        totalLevels: campaign.state.totalLevels,
        collectedCoins
      });
    }

    cameraController.updateCamera();
    renderer.render(scene, camera);
  }

  animate();
}
