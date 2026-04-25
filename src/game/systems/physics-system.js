export function createAbilityState(extraAirJumps) {
  return {
    extraJumpsLeft: extraAirJumps,
    dashAvailable: true,
    dashTimeLeft: 0,
    wallNormal: null
  };
}

export function resetAbilityState(ability, extraAirJumps) {
  ability.extraJumpsLeft = extraAirJumps;
  ability.dashAvailable = true;
  ability.dashTimeLeft = 0;
  ability.wallNormal = null;
}

export function stepPlayerPhysics({
  player,
  velocity,
  colliders,
  dt,
  grounded,
  fallLimit,
  config,
  input,
  ability
}) {
  if (grounded) {
    ability.extraJumpsLeft = config.extraAirJumps;
    ability.dashAvailable = true;
  }

  if (input.jumpPressed) {
    if (grounded) {
      velocity.y = config.jumpVelocity;
      grounded = false;
    } else if (ability.wallNormal) {
      velocity.y = config.jumpVelocity * 0.95;
      velocity.x = ability.wallNormal.x * config.wallJumpPush;
      velocity.z = ability.wallNormal.z * config.wallJumpPush;
      ability.extraJumpsLeft = config.extraAirJumps;
      ability.dashAvailable = true;
      ability.wallNormal = null;
    } else if (ability.extraJumpsLeft > 0) {
      velocity.y = config.jumpVelocity * 0.92;
      ability.extraJumpsLeft -= 1;
    }
  }

  if (input.dashPressed && !grounded && ability.dashAvailable) {
    const direction = normalize2D(input.dashDirection.x, input.dashDirection.z);
    velocity.x = direction.x * config.dashSpeed;
    velocity.z = direction.z * config.dashSpeed;
    velocity.y = Math.max(0, velocity.y);

    ability.dashAvailable = false;
    ability.dashTimeLeft = config.dashDuration;
  }

  if (ability.dashTimeLeft > 0) {
    ability.dashTimeLeft = Math.max(0, ability.dashTimeLeft - dt);
  } else {
    velocity.y -= config.gravity * dt;
  }

  const previousX = player.position.x;
  const previousY = player.position.y;
  const previousZ = player.position.z;

  player.position.addScaledVector(velocity, dt);

  grounded = false;
  let wallNormal = null;

  for (const collider of colliders) {
    const halfX = collider.sx / 2 + config.halfHeight;
    const halfZ = collider.sz / 2 + config.halfHeight;

    const dx = player.position.x - collider.x;
    const dz = player.position.z - collider.z;

    const overlapX = halfX - Math.abs(dx);
    const overlapZ = halfZ - Math.abs(dz);
    if (overlapX <= 0 || overlapZ <= 0) continue;

    const platformTop = collider.y + collider.sy / 2;
    const platformBottom = collider.y - collider.sy / 2;
    const playerBottom = player.position.y - config.halfHeight;
    const playerTop = player.position.y + config.halfHeight;
    const previousBottom = previousY - config.halfHeight;

    const hasVerticalOverlap = playerTop > platformBottom && playerBottom < platformTop;
    if (!hasVerticalOverlap) continue;

    const crossedTop = previousBottom >= platformTop - 0.2 && playerBottom <= platformTop + 0.35;
    if (velocity.y <= 0 && crossedTop) {
      player.position.y = platformTop + config.halfHeight;
      velocity.y = 0;
      grounded = true;
      continue;
    }

    if (overlapX < overlapZ) {
      const signX = dx === 0 ? Math.sign(previousX - collider.x || 1) : Math.sign(dx);
      player.position.x += overlapX * signX;
      velocity.x = 0;
      wallNormal = { x: signX, z: 0 };
    } else {
      const signZ = dz === 0 ? Math.sign(previousZ - collider.z || 1) : Math.sign(dz);
      player.position.z += overlapZ * signZ;
      velocity.z = 0;
      wallNormal = { x: 0, z: signZ };
    }
  }

  if (grounded) {
    ability.extraJumpsLeft = config.extraAirJumps;
    ability.dashAvailable = true;
    ability.wallNormal = null;
  } else {
    ability.wallNormal = wallNormal;
  }

  return {
    grounded,
    fell: player.position.y < fallLimit
  };
}

function normalize2D(x, z) {
  const length = Math.hypot(x, z);
  if (length < 0.0001) return { x: 0, z: 1 };
  return { x: x / length, z: z / length };
}
