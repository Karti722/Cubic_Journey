export function collectNearby(player, collectibles, radius) {
  let collected = 0;

  for (const item of collectibles) {
    if (item.collected) continue;
    if (player.position.distanceTo(item.mesh.position) > radius) continue;

    item.collected = true;
    item.mesh.visible = false;
    collected += item.value;
  }

  return collected;
}

export function applyJumpPads(player, velocity, jumpPads, radius, boostBase, elapsed) {
  let activated = false;

  for (const pad of jumpPads) {
    if (elapsed < pad.cooldownUntil) continue;
    if (player.position.distanceTo(pad.mesh.position) > radius) continue;

    velocity.y = boostBase * pad.power;
    pad.cooldownUntil = elapsed + 0.45;
    activated = true;
  }

  return activated;
}

export function collectDashOrbs(player, dashOrbs, radius) {
  let collected = 0;

  for (const orb of dashOrbs) {
    if (orb.collected) continue;
    if (player.position.distanceTo(orb.mesh.position) > radius) continue;

    orb.collected = true;
    orb.mesh.visible = false;
    collected += 1;
  }

  return collected;
}

export function isGoalReached(player, goal, radius) {
  if (!goal) return false;
  return player.position.distanceTo(goal.position) <= radius;
}

export function findNearbyPortal(player, portals, radius) {
  for (const portal of portals) {
    const portalPos = portal.position || portal.ring.position;
    const distance = player.position.distanceTo(portalPos);
    if (distance <= radius) return portal;
  }
  return null;
}

export function resolveEnemyContacts(player, velocity, enemies, options = {}) {
  const contactRadius = options.contactRadius ?? 1.05;
  const stompMinFallSpeed = options.stompMinFallSpeed ?? -1.8;
  const stompHeightBias = options.stompHeightBias ?? 0.18;
  const stompBounceSpeed = options.stompBounceSpeed ?? 8;

  let defeated = 0;
  let playerHit = false;

  for (const enemy of enemies || []) {
    if (enemy.defeated || !enemy.mesh.visible) continue;

    const radius = enemy.radius || 0.6;
    const distance = player.position.distanceTo(enemy.mesh.position);
    if (distance > contactRadius + radius) continue;

    const playerBottom = player.position.y - 0.5;
    const enemyTop = enemy.mesh.position.y + radius;
    const fromAbove = playerBottom >= enemyTop - stompHeightBias;
    const descendingFastEnough = velocity.y <= stompMinFallSpeed;

    if (fromAbove && descendingFastEnough) {
      const nextHealth = Math.max(0, (enemy.health ?? 1) - 1);
      enemy.health = nextHealth;
      if (nextHealth <= 0) {
        enemy.defeated = true;
        enemy.mesh.visible = false;
      }
      velocity.y = Math.max(velocity.y, stompBounceSpeed);
      defeated += nextHealth <= 0 ? 1 : 0;
    } else {
      playerHit = true;
      break;
    }
  }

  return { defeated, playerHit };
}

export function resolveSwordSlash(player, enemies, options = {}) {
  const radius = options.radius ?? 3.2;
  const damage = Math.max(1, options.damage ?? 1);
  const forwardX = options.forwardX ?? 0;
  const forwardZ = options.forwardZ ?? 1;
  const forwardDotThreshold = options.forwardDotThreshold ?? 0.15;
  const fullCircle = options.fullCircle ?? false;

  let hits = 0;
  let defeated = 0;
  let giantHit = false;
  let giantRemainingHealth = null;

  const forwardLength = Math.hypot(forwardX, forwardZ);
  const nx = forwardLength > 0.0001 ? forwardX / forwardLength : 0;
  const nz = forwardLength > 0.0001 ? forwardZ / forwardLength : 1;

  for (const enemy of enemies || []) {
    if (enemy.defeated || !enemy.mesh.visible) continue;

    const dx = enemy.mesh.position.x - player.position.x;
    const dz = enemy.mesh.position.z - player.position.z;
    const distance = Math.hypot(dx, dz);
    const enemyRadius = enemy.radius || 0.6;
    if (distance > radius + enemyRadius) continue;

    if (!fullCircle && distance > 0.001) {
      const dot = (dx / distance) * nx + (dz / distance) * nz;
      if (dot < forwardDotThreshold) continue;
    }

    enemy.health = Math.max(0, (enemy.health ?? 1) - damage);
    hits += 1;

    if (enemy.isGiant) {
      giantHit = true;
      giantRemainingHealth = enemy.health;
    }

    if (enemy.health <= 0) {
      enemy.defeated = true;
      enemy.mesh.visible = false;
      defeated += 1;
    }
  }

  return { hits, defeated, giantHit, giantRemainingHealth };
}

export function resolveBombContacts(player, bombs, elapsed, options = {}) {
  const touchPadding = options.touchPadding ?? 0.65;

  let exploded = 0;
  for (const bomb of bombs || []) {
    if (bomb.exploded || elapsed < bomb.cooldownUntil || !bomb.shell.visible) continue;

    const distance = player.position.distanceTo(bomb.shell.position);
    if (distance > bomb.radius + touchPadding) continue;

    bomb.exploded = true;
    bomb.explodedUntil = elapsed + 0.26;
    bomb.cooldownUntil = elapsed + bomb.cooldown;
    bomb.shell.visible = false;
    bomb.core.visible = false;
    exploded += 1;
  }

  return { exploded };
}
