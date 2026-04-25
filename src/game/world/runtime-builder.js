import { THREE } from "../../engine/three.js";

export function buildWorldRuntime(scene, definition) {
  scene.background = new THREE.Color(definition.skyColor);

  const root = new THREE.Group();
  scene.add(root);

  const colliders = [];
  const collectibles = [];
  const jumpPads = [];
  const dashOrbs = [];
  const enemies = [];
  const portals = [];

  for (const platform of definition.platforms) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(platform.sx, platform.sy, platform.sz),
      new THREE.MeshStandardMaterial({ color: platform.color })
    );
    mesh.position.set(platform.x, platform.y, platform.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    colliders.push({
      x: platform.x,
      y: platform.y,
      z: platform.z,
      sx: platform.sx,
      sy: platform.sy,
      sz: platform.sz
    });
  }

  for (const item of definition.collectibles) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffd84d, emissive: 0x775500 })
    );
    mesh.position.set(item.x, item.y, item.z);
    root.add(mesh);
    collectibles.push({ mesh, collected: false, value: item.value || 1 });
  }

  for (const pad of definition.jumpPads || []) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x33ff99, emissive: 0x114422 })
    );
    mesh.position.set(pad.x, pad.y, pad.z);
    root.add(mesh);
    jumpPads.push({ mesh, power: pad.power || 1, cooldownUntil: 0 });
  }

  for (const orb of definition.dashOrbs || []) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 0),
      new THREE.MeshStandardMaterial({ color: 0x6ad7ff, emissive: 0x1b4c7a })
    );
    mesh.position.set(orb.x, orb.y, orb.z);
    root.add(mesh);
    dashOrbs.push({ mesh, collected: false });
  }

  for (const enemyDef of definition.enemies || []) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(enemyDef.radius || 0.6, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x331111 })
    );
    mesh.position.set(enemyDef.x, enemyDef.y, enemyDef.z);
    root.add(mesh);
    enemies.push({
      mesh,
      defeated: false,
      phase: enemyDef.phase || Math.random() * Math.PI * 2,
      originX: enemyDef.x,
      originY: enemyDef.y,
      originZ: enemyDef.z,
      driftX: enemyDef.driftX ?? (0.55 + Math.random() * 0.35),
      driftZ: enemyDef.driftZ ?? (0.45 + Math.random() * 0.3),
      driftY: enemyDef.driftY ?? (0.12 + Math.random() * 0.08)
    });
  }

  let goal = null;
  if (definition.goal) {
    goal = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.7, 1.7),
      new THREE.MeshStandardMaterial({ color: definition.goal.color })
    );
    goal.position.set(definition.goal.x, definition.goal.y, definition.goal.z);
    goal.castShadow = true;
    root.add(goal);

    if (definition.isBossStage) {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.8, 0.6, 18),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      base.position.set(definition.goal.x, definition.goal.y - 1.2, definition.goal.z);
      root.add(base);
    }
  }

  for (const portal of definition.portals) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.25, 10, 24),
      new THREE.MeshStandardMaterial({ color: portal.unlocked ? portal.color : 0x555555 })
    );
    ring.position.set(portal.position.x, portal.position.y, portal.position.z);
    ring.rotation.x = Math.PI / 2;
    root.add(ring);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 12),
      new THREE.MeshStandardMaterial({ color: portal.unlocked ? 0xffffff : 0x333333 })
    );
    orb.position.set(portal.position.x, portal.position.y, portal.position.z);
    root.add(orb);

    portals.push({ ...portal, ring, orb });
  }

  function update(dt, elapsed) {
    if (goal) {
      goal.rotation.y += dt * 2;
      goal.position.y += Math.sin(elapsed * 2) * 0.002;
    }

    for (const coin of collectibles) {
      if (coin.collected) continue;
      coin.mesh.rotation.y += dt * 4;
      coin.mesh.position.y += Math.sin(elapsed * 3 + coin.mesh.position.x) * 0.002;
    }

    for (const pad of jumpPads) {
      pad.mesh.rotation.y += dt * 1.5;
    }

    for (const dash of dashOrbs) {
      if (dash.collected) continue;
      dash.mesh.rotation.y += dt * 2.8;
      dash.mesh.position.y += Math.sin(elapsed * 3.2 + dash.mesh.position.x) * 0.0025;
    }

    for (const enemy of enemies) {
      if (enemy.defeated) continue;
      const pulse = (Math.sin(elapsed * 5 + enemy.phase) + 1) / 2;
      const color = enemy.mesh.material.color;
      color.setRGB(1, 0.22 + pulse * 0.78, 0.22 + pulse * 0.78);

      if (enemy.mesh.material.emissive) {
        enemy.mesh.material.emissive.setRGB(0.45 + pulse * 0.35, 0.08 + pulse * 0.2, 0.08 + pulse * 0.2);
      }

      enemy.mesh.position.x = enemy.originX + Math.sin(elapsed * enemy.driftX + enemy.phase) * 0.9;
      enemy.mesh.position.z = enemy.originZ + Math.cos(elapsed * enemy.driftZ + enemy.phase) * 0.7;
      enemy.mesh.position.y = enemy.originY + Math.sin(elapsed * 2.8 + enemy.phase) * enemy.driftY;
      enemy.mesh.rotation.y += dt * 2;
    }

    for (const portal of portals) {
      portal.ring.rotation.z += dt * 1.8;
      portal.orb.position.y += Math.sin(elapsed * 2 + portal.worldIndex) * 0.003;
    }
  }

  function dispose() {
    scene.remove(root);
    root.traverse(object => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        for (const material of object.material) material.dispose();
      } else {
        object.material.dispose();
      }
    });
  }

  return {
    type: definition.type,
    name: definition.name,
    spawn: definition.spawn,
    stageType: definition.stageType,
    isBossStage: definition.isBossStage,
    colliders,
    collectibles,
    jumpPads,
    dashOrbs,
    enemies,
    portals,
    goal,
    update,
    dispose
  };
}
