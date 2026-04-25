import { THREE } from "./three.js";
import { createCameraController } from "./camera-controller.js";
import { createInput } from "./input.js";
import { createWorld, intersectsPlatform } from "./world.js";

export function startGame(uiElement) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const { player, platforms, goal } = createWorld(scene);

  const cameraController = createCameraController(camera, player);
  const { keys } = createInput(renderer.domElement, cameraController.rotateByMouse);

  const velocity = new THREE.Vector3();
  let grounded = false;
  let won = false;

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.033);

    updateMovement(keys, cameraController, velocity, dt);
    cameraController.updateFromKeys(keys, dt);

    if (grounded && keys.Space) {
      velocity.y = 12;
      grounded = false;
    }

    velocity.y -= 25 * dt;
    player.position.addScaledVector(velocity, dt);

    grounded = false;
    for (const platform of platforms) {
      if (intersectsPlatform(player, platform) && velocity.y <= 0) {
        player.position.y = platform.position.y + 1;
        velocity.y = 0;
        grounded = true;
      }
    }

    if (player.position.y < -10) {
      player.position.set(0, 3, 0);
      velocity.set(0, 0, 0);
    }

    cameraController.updateCamera();

    goal.rotation.y += dt * 2;

    if (!won && player.position.distanceTo(goal.position) < 2) {
      won = true;
      uiElement.textContent = "You win! Refresh to play again.";
    }

    renderer.render(scene, camera);
  }

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  animate();
}

function updateMovement(keys, cameraController, velocity, dt) {
  const speed = 8;
  velocity.x = 0;
  velocity.z = 0;

  const { forwardX, forwardZ, rightX, rightZ } = cameraController.getMoveBasis();

  let moveX = 0;
  let moveZ = 0;

  if (keys.KeyW) {
    moveX += forwardX;
    moveZ += forwardZ;
  }
  if (keys.KeyS) {
    moveX -= forwardX;
    moveZ -= forwardZ;
  }
  if (keys.KeyA) {
    moveX -= rightX;
    moveZ -= rightZ;
  }
  if (keys.KeyD) {
    moveX += rightX;
    moveZ += rightZ;
  }

  const moveLength = Math.hypot(moveX, moveZ);
  if (moveLength > 0) {
    velocity.x = moveX / moveLength * speed;
    velocity.z = moveZ / moveLength * speed;
  }
}
