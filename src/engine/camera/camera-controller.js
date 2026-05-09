import { THREE } from "../three.js";

export function createCameraController(camera, player) {
  let yaw = Math.atan2(-7, 9);
  let pitch = 0.35;

  const distance = 12;
  const lookHeight = 1;
  const minPitch = 0.15;
  const maxPitch = 1.2;

  function rotateByMouse(deltaX, deltaY) {
    yaw -= deltaX * 0.005;
    pitch = THREE.MathUtils.clamp(pitch + deltaY * 0.003, minPitch, maxPitch);
  }

  function updateFromKeys(keys, dt) {
    const rotateSpeed = 1.8;
    const tiltSpeed = 1.3;

    if (keys.ArrowLeft) yaw += rotateSpeed * dt;
    if (keys.ArrowRight) yaw -= rotateSpeed * dt;
    if (keys.ArrowUp) pitch = THREE.MathUtils.clamp(pitch + tiltSpeed * dt, minPitch, maxPitch);
    if (keys.ArrowDown) pitch = THREE.MathUtils.clamp(pitch - tiltSpeed * dt, minPitch, maxPitch);
  }

  function getMoveBasis() {
    return {
      forwardX: -Math.sin(yaw),
      forwardZ: -Math.cos(yaw),
      rightX: Math.cos(yaw),
      rightZ: -Math.sin(yaw)
    };
  }

  // Camera shake state
  let shakeUntil = 0;
  let shakeIntensity = 0;

  function shake(intensity = 0.6, duration = 0.4) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
    shakeUntil = Math.max(shakeUntil, performance.now() / 1000 + duration);
  }

  function updateCamera(dt) {
    const horizontalDistance = Math.cos(pitch) * distance;
    const targetCameraPos = new THREE.Vector3(
      player.position.x + Math.sin(yaw) * horizontalDistance,
      player.position.y + Math.sin(pitch) * distance,
      player.position.z + Math.cos(yaw) * horizontalDistance
    );

    camera.position.lerp(targetCameraPos, 0.12);

    // apply shake as a short lived jitter on the camera position
    const now = performance.now() / 1000;
    if (now < shakeUntil && shakeIntensity > 0) {
      const remaining = Math.max(0, shakeUntil - now);
      const fade = remaining / Math.max(0.0001, shakeUntil - (now - remaining));
      const s = shakeIntensity * fade;
      camera.position.x += (Math.random() * 2 - 1) * s;
      camera.position.y += (Math.random() * 2 - 1) * s * 0.6;
      camera.position.z += (Math.random() * 2 - 1) * s;
    }

    camera.lookAt(player.position.x, player.position.y + lookHeight, player.position.z);
  }

  return {
    getMoveBasis,
    rotateByMouse,
    updateFromKeys,
    updateCamera
  };
}
