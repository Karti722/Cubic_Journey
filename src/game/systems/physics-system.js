export function createAbilityState(extraAirJumps) {
  return {
    extraJumpsLeft: extraAirJumps,
    dashAvailable: true,
    dashTimeLeft: 0,
    // time left before another ground dash can be used
    groundDashCooldownTimeLeft: 0,
    wallNormal: null
  };
}

export function resetAbilityState(ability, extraAirJumps) {
  ability.extraJumpsLeft = extraAirJumps;
  ability.dashAvailable = true;
  ability.dashTimeLeft = 0;
  ability.groundDashCooldownTimeLeft = 0;
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
  ability,
  skills = {}
}) {
  const jumpHeld = Boolean(input.jumpHeld);
  let jumped = false;
  let dashed = false;
  const hasWallClimb = Boolean(skills.wallClimb);
  const hasGlide = Boolean(skills.glide);
  const hasPlatformMagnet = Boolean(skills.platformMagnet);
  const hasDashBoost = Boolean(skills.dashBoost);

  if (grounded) {
    ability.extraJumpsLeft = config.extraAirJumps;
    ability.dashAvailable = true;
  }

  if (input.jumpPressed) {
    // Apply jump (grounded jump, wall jump, or mid-air extra jump)
    if (grounded) {
      velocity.y = config.jumpVelocity;
      grounded = false;
      jumped = true;
    } else if (ability.wallNormal) {
      velocity.y = config.jumpVelocity * (hasWallClimb ? 1.06 : 0.95);
      velocity.x = ability.wallNormal.x * config.wallJumpPush;
      velocity.z = ability.wallNormal.z * config.wallJumpPush;
      ability.extraJumpsLeft = config.extraAirJumps;
      ability.dashAvailable = true;
      ability.wallNormal = null;
      jumped = true;
    } else if (ability.extraJumpsLeft > 0) {
      velocity.y = config.jumpVelocity * 0.92;
      ability.extraJumpsLeft -= 1;
      jumped = true;
    }
  }

  if (!grounded && hasWallClimb && jumpHeld && ability.wallNormal && velocity.y <= config.jumpVelocity * 0.55) {
    velocity.y = Math.max(velocity.y, config.jumpVelocity * 0.58);
    velocity.x = ability.wallNormal.x * (config.wallJumpPush * 0.22);
    velocity.z = ability.wallNormal.z * (config.wallJumpPush * 0.22);
  }

  // tick down ground dash cooldown
  if (ability.groundDashCooldownTimeLeft > 0) {
    ability.groundDashCooldownTimeLeft = Math.max(0, ability.groundDashCooldownTimeLeft - dt);
  }

  if (input.dashPressed && (ability.dashAvailable || grounded) && (grounded ? ability.groundDashCooldownTimeLeft <= 0 : true)) {
    const direction = normalize2D(input.dashDirection.x, input.dashDirection.z);
    // make dash stronger to compensate
    const STRICTER_DASH_MULT = 1.45;
    const dashBase = hasDashBoost ? config.dashSpeed * 1.18 : config.dashSpeed;
    const dashSpeed = dashBase * STRICTER_DASH_MULT;
    velocity.x = direction.x * dashSpeed;
    velocity.z = direction.z * dashSpeed;
    velocity.y = Math.max(0, velocity.y);
    if (!grounded) {
      ability.dashAvailable = false;
    }
    ability.dashTimeLeft = config.dashDuration;
    dashed = true;
    // if dashing from ground, add a short cooldown before next ground dash
    if (grounded) ability.groundDashCooldownTimeLeft = 0.4;
  }

  if (ability.dashTimeLeft > 0) {
    ability.dashTimeLeft = Math.max(0, ability.dashTimeLeft - dt);
  } else {
    const gravityScale = !grounded && hasGlide && jumpHeld ? 0.48 : 1;
    velocity.y -= config.gravity * gravityScale * dt;
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

  if (!grounded && hasPlatformMagnet && velocity.y <= 0) {
    const magnetResult = magnetToPlatform(player, colliders, config);
    if (magnetResult.grounded) {
      grounded = true;
      velocity.y = 0;
      wallNormal = null;
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
    fell: player.position.y < fallLimit,
    jumped: !!jumped,
    dashed: !!dashed
  };
}

function magnetToPlatform(player, colliders, config) {
  const playerBottom = player.position.y - config.halfHeight;
  const playerTop = player.position.y + config.halfHeight;

  for (const collider of colliders) {
    const top = collider.y + collider.sy / 2;
    const horizontalReachX = collider.sx / 2 + config.halfHeight * 0.7;
    const horizontalReachZ = collider.sz / 2 + config.halfHeight * 0.7;
    const dx = Math.abs(player.position.x - collider.x);
    const dz = Math.abs(player.position.z - collider.z);

    if (dx > horizontalReachX || dz > horizontalReachZ) continue;
    if (playerBottom < top - 1.4 || playerTop > top + 0.4) continue;

    player.position.y = top + config.halfHeight;
    return { grounded: true };
  }

  return { grounded: false };
}

function normalize2D(x, z) {
  const length = Math.hypot(x, z);
  if (length < 0.0001) return { x: 0, z: 1 };
  return { x: x / length, z: z / length };
}
