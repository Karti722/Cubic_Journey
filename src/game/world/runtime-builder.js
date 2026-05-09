import { THREE } from "../../engine/three.js";

export function buildWorldRuntime(scene, definition, visuals) {
  const { textures } = visuals;
  scene.background = new THREE.Color(definition.skyColor);
  scene.fog = new THREE.Fog(definition.skyColor, 26, 180);

  const root = new THREE.Group();
  scene.add(root);

  const atmosphere = buildAtmosphere(definition.skyColor, textures);
  root.add(atmosphere.group);

  const colliders = [];
  const collectibles = [];
  const jumpPads = [];
  const dashOrbs = [];
  const enemies = [];
  const portals = [];

  for (const platform of definition.platforms) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(platform.sx, platform.sy, platform.sz),
      new THREE.MeshStandardMaterial({
        color: platform.color,
        map: textures.stone,
        roughness: 0.7,
        metalness: 0.16,
        emissive: tintColor(platform.color, 0.12),
        emissiveIntensity: 0.12
      })
    );
    mesh.position.set(platform.x, platform.y, platform.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(platform.sx + 0.14, platform.sy + 0.08, platform.sz + 0.14),
      new THREE.MeshBasicMaterial({ color: tintColor(platform.color, 0.26), transparent: true, opacity: 0.08, depthWrite: false })
    );
    glow.position.set(platform.x, platform.y, platform.z);
    root.add(glow);

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
      new THREE.MeshStandardMaterial({ color: 0xffd84d, map: textures.coin, emissive: 0xffaa22, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.25 })
    );
    mesh.position.set(item.x, item.y, item.z);
    root.add(mesh);
    collectibles.push({ mesh, collected: false, value: item.value || 1 });
  }

  for (const pad of definition.jumpPads || []) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x33ff99, map: textures.jumpPad, emissive: 0x00dd88, emissiveIntensity: 0.6, roughness: 0.45, metalness: 0.2 })
    );
    mesh.position.set(pad.x, pad.y, pad.z);
    root.add(mesh);
    jumpPads.push({ mesh, power: pad.power || 1, cooldownUntil: 0 });
  }

  for (const orb of definition.dashOrbs || []) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 0),
      new THREE.MeshStandardMaterial({ color: 0x6ad7ff, map: textures.energy, emissive: 0x2bb3ff, emissiveIntensity: 0.75, roughness: 0.25, metalness: 0.45 })
    );
    mesh.position.set(orb.x, orb.y, orb.z);
    root.add(mesh);
    dashOrbs.push({ mesh, collected: false });
  }

  for (const enemyDef of definition.enemies || []) {
    const mesh = visuals.createGoblinEnemy();
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
      new THREE.MeshStandardMaterial({ color: definition.goal.color, map: textures.goal, emissive: tintColor(definition.goal.color, 0.35), emissiveIntensity: 0.8, roughness: 0.22, metalness: 0.35 })
    );
    goal.position.set(definition.goal.x, definition.goal.y, definition.goal.z);
    goal.castShadow = true;
    root.add(goal);

    if (definition.isBossStage) {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.8, 0.6, 18),
        new THREE.MeshStandardMaterial({ color: 0x111111, map: textures.stone, roughness: 0.95, metalness: 0.02 })
      );
      base.position.set(definition.goal.x, definition.goal.y - 1.2, definition.goal.z);
      root.add(base);
    }
  }

  for (const portal of definition.portals) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.25, 10, 24),
      new THREE.MeshStandardMaterial({
        color: portal.unlocked ? portal.color : 0x555555,
        map: textures.portal,
        emissive: portal.unlocked ? tintColor(portal.color, 0.28) : 0x111111,
        emissiveIntensity: portal.unlocked ? 0.7 : 0.15,
        roughness: 0.35,
        metalness: 0.25
      })
    );
    ring.position.set(portal.position.x, portal.position.y, portal.position.z);
    ring.rotation.x = Math.PI / 2;
    root.add(ring);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 12),
      new THREE.MeshStandardMaterial({
        color: portal.unlocked ? 0xffffff : 0x333333,
        map: textures.portal,
        emissive: portal.unlocked ? 0x8ef4ff : 0x111111,
        emissiveIntensity: portal.unlocked ? 0.75 : 0.1,
        roughness: 0.3,
        metalness: 0.4
      })
    );
    orb.position.set(portal.position.x, portal.position.y, portal.position.z);
    root.add(orb);

    portals.push({ ...portal, ring, orb });
  }

  function update(dt, elapsed) {
    atmosphere.group.rotation.y += dt * atmosphere.spinSpeed;
    atmosphere.group.rotation.x = Math.sin(elapsed * 0.05) * 0.03;

    atmosphere.glowGroup.children.forEach((child, index) => {
      child.rotation.y += dt * (0.12 + index * 0.03);
      child.position.y = child.userData.baseY + Math.sin(elapsed * 0.4 + index) * 0.25;
    });

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
      if (enemy.mesh.bodyMaterial?.color) {
        enemy.mesh.bodyMaterial.color.setRGB(0.28 + pulse * 0.26, 0.72 + pulse * 0.18, 0.2 + pulse * 0.12);
      }

      if (enemy.mesh.bodyMaterial?.emissive) {
        enemy.mesh.bodyMaterial.emissive.setRGB(0.04 + pulse * 0.1, 0.14 + pulse * 0.18, 0.04 + pulse * 0.08);
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

function buildAtmosphere(skyColor, textures) {
  const group = new THREE.Group();

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(900, 28, 18),
    new THREE.MeshBasicMaterial({ color: tintColor(skyColor, 0.08), map: textures.sky, side: THREE.BackSide, transparent: true, opacity: 0.98 })
  );
  group.add(skyDome);

  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 420;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const radius = 280 + Math.random() * 520;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    positions[i * 3 + 0] = Math.cos(theta) * Math.sin(phi) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius;
    positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
  }
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({ color: 0xe2f3ff, size: 1.6, transparent: true, opacity: 0.55, depthWrite: false })
  );
  group.add(stars);

  const glowGroup = new THREE.Group();
  const glows = [0x8ed0ff, 0xff9a65, 0x9c85ff, 0x7effd4];
  glows.forEach((color, index) => {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(7 + index * 1.8, 16, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false })
    );
    orb.position.set(Math.cos(index) * 42, 26 + index * 12, Math.sin(index * 1.3) * 42);
    orb.userData.baseY = orb.position.y;
    glowGroup.add(orb);
  });
  group.add(glowGroup);

  return {
    group,
    glowGroup,
    spinSpeed: 0.02
  };
}

function tintColor(hex, amount) {
  const color = new THREE.Color(hex);
  color.lerp(new THREE.Color(0xffffff), amount);
  return color.getHex();
}
