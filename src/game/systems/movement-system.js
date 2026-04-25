export function updateHorizontalVelocity(keys, cameraController, velocity, speed) {
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
    velocity.x = (moveX / moveLength) * speed;
    velocity.z = (moveZ / moveLength) * speed;
  }
}
