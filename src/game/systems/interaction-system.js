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
