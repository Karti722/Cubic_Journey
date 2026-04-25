export function stepPlayerPhysics({
  player,
  velocity,
  colliders,
  dt,
  gravity,
  jumpVelocity,
  halfHeight,
  jumpPressed,
  grounded,
  fallLimit
}) {
  if (grounded && jumpPressed) {
    velocity.y = jumpVelocity;
    grounded = false;
  }

  const previousY = player.position.y;

  velocity.y -= gravity * dt;
  player.position.addScaledVector(velocity, dt);

  grounded = false;

  for (const collider of colliders) {
    const withinX = Math.abs(player.position.x - collider.x) <= collider.sx / 2 + halfHeight;
    const withinZ = Math.abs(player.position.z - collider.z) <= collider.sz / 2 + halfHeight;
    if (!withinX || !withinZ) continue;

    const platformTop = collider.y + collider.sy / 2;
    const feetY = player.position.y - halfHeight;
    const previousFeetY = previousY - halfHeight;

    const crossedTop = previousFeetY >= platformTop - 0.15 && feetY <= platformTop + 0.35;
    if (velocity.y <= 0 && crossedTop) {
      player.position.y = platformTop + halfHeight;
      velocity.y = 0;
      grounded = true;
    }
  }

  return {
    grounded,
    fell: player.position.y < fallLimit
  };
}
