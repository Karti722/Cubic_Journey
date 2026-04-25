export function updateHorizontalVelocity(input, cameraController, velocity, speed) {
  velocity.x = 0;
  velocity.z = 0;

  const { forwardX, forwardZ, rightX, rightZ } = cameraController.getMoveBasis();

  let moveX = 0;
  let moveZ = 0;

  if (isDown(input, "moveForward", "KeyW")) {
    moveX += forwardX;
    moveZ += forwardZ;
  }
  if (isDown(input, "moveBackward", "KeyS")) {
    moveX -= forwardX;
    moveZ -= forwardZ;
  }
  if (isDown(input, "moveLeft", "KeyA")) {
    moveX -= rightX;
    moveZ -= rightZ;
  }
  if (isDown(input, "moveRight", "KeyD")) {
    moveX += rightX;
    moveZ += rightZ;
  }

  const moveLength = Math.hypot(moveX, moveZ);
  if (moveLength > 0) {
    velocity.x = (moveX / moveLength) * speed;
    velocity.z = (moveZ / moveLength) * speed;
  }
}

function isDown(input, action, fallbackCode) {
  if (input && typeof input.isActionDown === "function") {
    return input.isActionDown(action);
  }

  return Boolean(input?.[fallbackCode]);
}
