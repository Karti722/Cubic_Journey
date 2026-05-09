import { THREE } from "../../engine/three.js";

export function buildWorldRuntime(scene, definition, visuals) {
  const { textures } = visuals;
  const arenaBounds = getDefinitionBounds(definition);
  scene.background = new THREE.Color(definition.skyColor);
  scene.fog = new THREE.Fog(definition.skyColor, 26, 180);

  const root = new THREE.Group();
  scene.add(root);

  const atmosphere = buildAtmosphere(definition.skyColor, textures);
  root.add(atmosphere.group);

  const scenery = buildScenery(definition, textures);
  root.add(scenery.group);

  // Add bright sun mesh for sunny worlds
  if (definition.hasSun) {
    const sunGeometry = new THREE.SphereGeometry(6, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.set(80, 120, -100);
    root.add(sunMesh);
  }

  const colliders = [];
  const movingPlatforms = [];
  const collectibles = [];
  const jumpPads = [];
  const dashOrbs = [];
  const bombs = [];
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

    const collider = {
      x: platform.x,
      y: platform.y,
      z: platform.z,
      sx: platform.sx,
      sy: platform.sy,
      sz: platform.sz
    };
    colliders.push(collider);

    if (platform.move) {
      movingPlatforms.push({
        mesh,
        glow,
        collider,
        originX: platform.x,
        originY: platform.y,
        originZ: platform.z,
        axis: platform.move.axis || "x",
        amplitude: platform.move.amplitude ?? 3,
        speed: platform.move.speed ?? 0.8,
        phase: platform.move.phase ?? Math.random() * Math.PI * 2
      });
    }
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

  for (const bombDef of definition.bombs || []) {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(bombDef.radius || 0.9, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x2b2b2b, map: textures.rock, roughness: 0.5, metalness: 0.35, emissive: 0x220000, emissiveIntensity: 0.35 })
    );
    shell.position.set(bombDef.x, bombDef.y, bombDef.z);
    root.add(shell);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry((bombDef.radius || 0.9) * 0.42, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff5533, transparent: true, opacity: 0.75, depthWrite: false })
    );
    core.position.copy(shell.position);
    root.add(core);

    bombs.push({
      shell,
      core,
      radius: bombDef.radius || 0.9,
      blastRadius: bombDef.blastRadius || 2.6,
      cooldown: bombDef.cooldown || 3.5,
      cooldownUntil: 0,
      explodedUntil: 0,
      phase: bombDef.phase || Math.random() * Math.PI * 2,
      exploded: false
    });
  }

  for (const enemyDef of definition.enemies || []) {
    const mesh = visuals.createGoblinEnemy();
    const baseRadius = enemyDef.radius || 0.6;
    const scaleFactor = enemyDef.isGiant ? 2.2 : 1;
    mesh.scale.setScalar(scaleFactor);
    mesh.position.set(enemyDef.x, enemyDef.y, enemyDef.z);
    root.add(mesh);
    enemies.push({
      mesh,
      defeated: false,
      isGiant: Boolean(enemyDef.isGiant),
      health: Math.max(1, Math.floor(enemyDef.health || 1)),
      maxHealth: Math.max(1, Math.floor(enemyDef.health || 1)),
      radius: baseRadius,
      phase: enemyDef.phase || Math.random() * Math.PI * 2,
      originX: enemyDef.x,
      originY: enemyDef.y,
      originZ: enemyDef.z,
      driftX: enemyDef.driftX ?? (enemyDef.isGiant ? 0.16 : (0.55 + Math.random() * 0.35)),
      driftZ: enemyDef.driftZ ?? (enemyDef.isGiant ? 0.13 : (0.45 + Math.random() * 0.3)),
      driftY: enemyDef.driftY ?? (enemyDef.isGiant ? 0.04 : (0.12 + Math.random() * 0.08)),
      baseSpeed: enemyDef.baseSpeed ?? (enemyDef.isGiant ? 1.9 : 2.4),
      flyHeight: enemyDef.flyHeight ?? (enemyDef.isGiant ? 0.85 : 0.45),
      chaseWeight: enemyDef.chaseWeight ?? (enemyDef.isGiant ? 0.62 : 0.78),
      avoidWeight: enemyDef.avoidWeight ?? 0.45,
      dashCooldownUntil: Math.random() * 1.6,
      dashUntil: 0,
      velX: 0,
      velZ: 0,
      wanderPhase: Math.random() * Math.PI * 2
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

    // Add colored point light for unlocked portals
    if (portal.unlocked) {
      const portalLight = new THREE.PointLight(portal.color, 13.2, 28);
      portalLight.position.set(portal.position.x, portal.position.y + 0.8, portal.position.z);
      root.add(portalLight);
    }

    portals.push({ ...portal, ring, orb });
  }

  function update(dt, elapsed, context = {}) {
    const playerPosition = context.playerPosition || null;
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

    for (const platform of movingPlatforms) {
      const offset = Math.sin(elapsed * platform.speed + platform.phase) * platform.amplitude;
      const x = platform.axis === "x" ? platform.originX + offset : platform.originX;
      const y = platform.axis === "y" ? platform.originY + offset : platform.originY;
      const z = platform.axis === "z" ? platform.originZ + offset : platform.originZ;

      platform.mesh.position.set(x, y, z);
      platform.glow.position.set(x, y, z);
      platform.collider.x = x;
      platform.collider.y = y;
      platform.collider.z = z;
    }

    for (const bomb of bombs) {
      const pulse = (Math.sin(elapsed * 7 + bomb.phase) + 1) / 2;
      const canRespawn = bomb.exploded && elapsed >= bomb.cooldownUntil;
      if (canRespawn) {
        bomb.exploded = false;
        bomb.shell.visible = true;
        bomb.core.visible = true;
      }

      if (bomb.exploded) {
        const fade = Math.max(0, (bomb.explodedUntil - elapsed) * 3.2);
        bomb.core.material.opacity = fade * 0.45;
      } else {
        bomb.core.material.opacity = 0.5 + pulse * 0.35;
        bomb.core.scale.setScalar(1 + pulse * 0.22);
        bomb.shell.rotation.y += dt * 1.8;
      }
    }

    for (const enemy of enemies) {
      if (enemy.defeated) continue;
      const pulse = (Math.sin(elapsed * 5 + enemy.phase) + 1) / 2;
      if (enemy.mesh.bodyMaterial?.color) {
        if (enemy.isGiant) {
          enemy.mesh.bodyMaterial.color.setRGB(0.45 + pulse * 0.3, 0.35 + pulse * 0.15, 0.12 + pulse * 0.12);
        } else {
          enemy.mesh.bodyMaterial.color.setRGB(0.28 + pulse * 0.26, 0.72 + pulse * 0.18, 0.2 + pulse * 0.12);
        }
      }

      if (enemy.mesh.bodyMaterial?.emissive) {
        if (enemy.isGiant) {
          enemy.mesh.bodyMaterial.emissive.setRGB(0.14 + pulse * 0.2, 0.04 + pulse * 0.1, 0.02 + pulse * 0.06);
        } else {
          enemy.mesh.bodyMaterial.emissive.setRGB(0.04 + pulse * 0.1, 0.14 + pulse * 0.18, 0.04 + pulse * 0.08);
        }
      }

      let desiredX = Math.sin(elapsed * (enemy.driftX * 1.3) + enemy.wanderPhase) * 0.4;
      let desiredZ = Math.cos(elapsed * (enemy.driftZ * 1.2) + enemy.wanderPhase) * 0.35;

      if (playerPosition) {
        const toPlayerX = playerPosition.x - enemy.mesh.position.x;
        const toPlayerZ = playerPosition.z - enemy.mesh.position.z;
        const distanceToPlayer = Math.hypot(toPlayerX, toPlayerZ);

        if (distanceToPlayer > 0.001) {
          const nx = toPlayerX / distanceToPlayer;
          const nz = toPlayerZ / distanceToPlayer;
          desiredX += nx * enemy.chaseWeight;
          desiredZ += nz * enemy.chaseWeight;

          // Gentle strafe keeps combat readable while still feeling reactive.
          if (distanceToPlayer < 6.5) {
            const strafe = Math.sin(elapsed * 2.8 + enemy.phase) * 0.38;
            desiredX += -nz * strafe;
            desiredZ += nx * strafe;
          }

          if (distanceToPlayer < 10 && elapsed >= enemy.dashCooldownUntil) {
            enemy.dashUntil = elapsed + (enemy.isGiant ? 0.34 : 0.24);
            enemy.dashCooldownUntil = elapsed + (enemy.isGiant ? 2.6 : 2.1) + Math.random() * 1.15;
          }

          const abovePlayer = enemy.mesh.position.y > playerPosition.y + 1.2;
          if (abovePlayer && distanceToPlayer < 8.5) {
            enemy.mesh.position.y += (playerPosition.y + enemy.flyHeight * 0.5 - enemy.mesh.position.y) * Math.min(1, dt * 4.8);
          }
        }
      }

      for (const other of enemies) {
        if (other === enemy || other.defeated) continue;
        const dx = enemy.mesh.position.x - other.mesh.position.x;
        const dz = enemy.mesh.position.z - other.mesh.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq <= 0.0001 || distSq > 5.2) continue;
        desiredX += (dx / distSq) * enemy.avoidWeight;
        desiredZ += (dz / distSq) * enemy.avoidWeight;
      }

      const edgePad = 2.4;
      if (enemy.mesh.position.x < arenaBounds.minX + edgePad) desiredX += 0.95;
      if (enemy.mesh.position.x > arenaBounds.maxX - edgePad) desiredX -= 0.95;
      if (enemy.mesh.position.z < arenaBounds.minZ + edgePad) desiredZ += 0.95;
      if (enemy.mesh.position.z > arenaBounds.maxZ - edgePad) desiredZ -= 0.95;

      const desiredLen = Math.hypot(desiredX, desiredZ) || 1;
      const isDashing = elapsed < enemy.dashUntil;
      const targetSpeed = enemy.baseSpeed * (isDashing ? 1.85 : 1);
      const targetVelX = (desiredX / desiredLen) * targetSpeed;
      const targetVelZ = (desiredZ / desiredLen) * targetSpeed;
      const accel = isDashing ? 8.5 : 6.2;
      const blend = Math.min(1, dt * accel);

      enemy.velX += (targetVelX - enemy.velX) * blend;
      enemy.velZ += (targetVelZ - enemy.velZ) * blend;

      enemy.mesh.position.x += enemy.velX * dt;
      enemy.mesh.position.z += enemy.velZ * dt;

      const hoverBase = enemy.originY + enemy.flyHeight;
      const hoverWave = Math.sin(elapsed * (3.8 + enemy.driftY * 9) + enemy.phase) * (enemy.driftY + 0.09);
      enemy.mesh.position.y += (hoverBase + hoverWave - enemy.mesh.position.y) * Math.min(1, dt * 6);

      enemy.mesh.rotation.y = Math.atan2(enemy.velX, enemy.velZ);
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
    bombs,
    enemies,
    portals,
    goal,
    update,
    dispose
  };
}

function buildScenery(definition, textures) {
  const group = new THREE.Group();
  const bounds = getDefinitionBounds(definition);
  const spanX = Math.max(24, bounds.maxX - bounds.minX);
  const spanZ = Math.max(24, bounds.maxZ - bounds.minZ);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const ringRadius = Math.max(spanX, spanZ) * 0.72 + 20;
  const mountainCount = definition.type === "hub" ? 10 : definition.isBossStage ? 10 : 8;

  if (definition.type === "hub") {
    addRingRocks(group, textures, centerX, centerZ, ringRadius * 0.52, 8);
  }

  for (let i = 0; i < mountainCount; i += 1) {
    const angle = (i / mountainCount) * Math.PI * 2;
    const distance = ringRadius + (i % 2) * 4;
    const x = centerX + Math.cos(angle) * distance;
    const z = centerZ + Math.sin(angle) * distance;
    const height = 10 + (i % 3) * 4 + (definition.isBossStage ? 5 : 0);
    addMountain(group, textures, x, -6.5, z, 10 + (i % 4) * 3, height, i % 2 === 0);
  }

  const cloudCount = definition.type === "hub" ? 7 : 9;
  for (let i = 0; i < cloudCount; i += 1) {
    const angle = (i / cloudCount) * Math.PI * 2 + 0.35;
    const distance = ringRadius * 0.55 + 8 + (i % 3) * 3;
    const x = centerX + Math.cos(angle) * distance;
    const y = 18 + (i % 4) * 2.6 + (definition.isBossStage ? 2 : 0);
    const z = centerZ + Math.sin(angle) * distance;
    addCloud(group, textures, x, y, z, 4.2 + (i % 3) * 1.45);
  }

  if (definition.type !== "hub") {
    const ridgeCount = definition.isBossStage ? 5 : 4;
    for (let i = 0; i < ridgeCount; i += 1) {
      const offset = -14 - i * 6;
      addCliff(group, textures, bounds.minX - 12, -5.8 + i * 0.3, bounds.minZ + offset, 8 + i * 2, 12 + i * 1.8, 5.5 + i * 0.8);
      addCliff(group, textures, bounds.maxX + 12, -5.8 + i * 0.3, bounds.maxZ - offset, 8 + i * 2, 12 + i * 1.8, 5.5 + i * 0.8);
    }
  }

  if (definition.isBossStage) {
    addPillar(group, textures, centerX - 18, -6.8, centerZ - 14, 4.4, 19, 4.4, true);
    addPillar(group, textures, centerX + 18, -6.8, centerZ - 14, 4.4, 19, 4.4, true);
    addPillar(group, textures, centerX - 18, -6.8, centerZ + 14, 4.4, 19, 4.4, true);
    addPillar(group, textures, centerX + 18, -6.8, centerZ + 14, 4.4, 19, 4.4, true);
  }

  return { group };
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

function addMountain(group, textures, x, y, z, radius, height, snowCap = false) {
  const mountain = new THREE.Group();
  mountain.position.set(x, y, z);
  mountain.rotation.y = Math.random() * Math.PI * 2;

  const main = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 6, 1),
    new THREE.MeshStandardMaterial({
      color: 0x7c8794,
      map: textures.rock,
      roughness: 0.96,
      metalness: 0.02,
      emissive: 0x0b1016,
      emissiveIntensity: 0.04
    })
  );
  main.castShadow = true;
  main.receiveShadow = true;
  mountain.add(main);

  const shoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.88, radius * 1.05, height * 0.34, 6),
    new THREE.MeshStandardMaterial({
      color: 0x61707f,
      map: textures.dirt,
      roughness: 0.98,
      metalness: 0.01,
      emissive: 0x0a0f12,
      emissiveIntensity: 0.03
    })
  );
  shoulder.position.y = -height * 0.22;
  shoulder.castShadow = true;
  shoulder.receiveShadow = true;
  mountain.add(shoulder);

  if (snowCap || height > 14) {
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.45, height * 0.3, 6, 1),
      new THREE.MeshStandardMaterial({
        color: 0xf6fbff,
        map: textures.snow,
        roughness: 0.86,
        metalness: 0.02,
        emissive: 0xffffff,
        emissiveIntensity: 0.02
      })
    );
    cap.position.y = height * 0.34;
    cap.castShadow = true;
    cap.receiveShadow = true;
    mountain.add(cap);
  }

  group.add(mountain);
}

function addCliff(group, textures, x, y, z, width, height, depth) {
  const cliff = new THREE.Group();
  cliff.position.set(x, y, z);
  cliff.rotation.y = Math.random() * Math.PI * 2;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: 0x5d6974,
      map: textures.rock,
      roughness: 0.96,
      metalness: 0.02,
      emissive: 0x090d12,
      emissiveIntensity: 0.03
    })
  );
  base.castShadow = true;
  base.receiveShadow = true;
  cliff.add(base);

  const wedge = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.6, height * 0.55, 4, 1),
    new THREE.MeshStandardMaterial({
      color: 0x70808e,
      map: textures.stone,
      roughness: 0.94,
      metalness: 0.02
    })
  );
  wedge.position.y = height * 0.43;
  wedge.rotation.y = Math.PI / 4;
  cliff.add(wedge);

  group.add(cliff);
}

function addPillar(group, textures, x, y, z, width, height, depth, snowCap = false) {
  const pillar = new THREE.Group();
  pillar.position.set(x, y, z);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.75, width, height, 6, 1),
    new THREE.MeshStandardMaterial({
      color: 0x636f7a,
      map: textures.rock,
      roughness: 0.97,
      metalness: 0.02
    })
  );
  core.castShadow = true;
  core.receiveShadow = true;
  pillar.add(core);

  if (snowCap) {
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(width * 0.42, height * 0.24, 6, 1),
      new THREE.MeshStandardMaterial({
        color: 0xf2f8ff,
        map: textures.snow,
        roughness: 0.82,
        metalness: 0.02
      })
    );
    top.position.y = height * 0.5;
    pillar.add(top);
  }

  group.add(pillar);
}

function addIsland(group, textures, x, y, z, width, depth) {
  const island = new THREE.Group();
  island.position.set(x, y, z);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.9, width * 1.2, 8, 10),
    new THREE.MeshStandardMaterial({
      color: 0x5d584f,
      map: textures.dirt,
      roughness: 0.96,
      metalness: 0.01
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  island.add(body);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(width, width * 1.12, 1.4, 10),
    new THREE.MeshStandardMaterial({
      color: 0x48525c,
      map: textures.stone,
      roughness: 0.94,
      metalness: 0.02
    })
  );
  cap.position.y = 4.6;
  cap.castShadow = true;
  cap.receiveShadow = true;
  island.add(cap);

  const trees = Math.max(4, Math.round(width / 4));
  for (let i = 0; i < trees; i += 1) {
    const angle = (i / trees) * Math.PI * 2;
    const tree = new THREE.Group();
    tree.position.set(Math.cos(angle) * width * 0.5, 5.2, Math.sin(angle) * depth * 0.45);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.3, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x5b3d26, map: textures.dirt, roughness: 0.98, metalness: 0.01 })
    );
    trunk.castShadow = true;
    tree.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 2.6, 7, 1),
      new THREE.MeshStandardMaterial({ color: 0x3e6a4c, map: textures.rock, roughness: 0.94, metalness: 0.01 })
    );
    foliage.position.y = 1.8;
    foliage.castShadow = true;
    tree.add(foliage);

    island.add(tree);
  }

  group.add(island);
}

function addCloud(group, textures, x, y, z, scale = 3) {
  const cloud = new THREE.Group();
  cloud.position.set(x, y, z);
  cloud.rotation.y = Math.random() * Math.PI * 2;
  cloud.frustumCulled = false;

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.cloud,
    transparent: true,
    opacity: 0.94,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
    fog: false
  });

  const puffs = [
    [-1.2, 0, 0, 1.0],
    [-0.4, 0.3, 0.1, 1.25],
    [0.55, 0.15, -0.2, 1.4],
    [1.15, 0.05, 0.2, 0.95],
    [0.15, -0.12, 0.45, 1.05]
  ];

  for (const [px, py, pz, size] of puffs) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(scale * size * 0.6, 12, 10), material.clone());
    puff.position.set(px * scale, py * scale * 0.4, pz * scale * 0.5);
    puff.castShadow = false;
    puff.frustumCulled = false;
    cloud.add(puff);
  }

  group.add(cloud);
}

function addRingRocks(group, textures, centerX, centerZ, radius, rockCount) {
  for (let i = 0; i < rockCount; i += 1) {
    const angle = (i / rockCount) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.8 + (i % 3) * 0.45, 0),
      new THREE.MeshStandardMaterial({
        color: 0x55616b,
        map: textures.rock,
        roughness: 0.97,
        metalness: 0.01,
        emissive: 0x080b10,
        emissiveIntensity: 0.02
      })
    );
    rock.position.set(x, -4.5 + Math.sin(angle * 2) * 0.5, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.scale.setScalar(1.8 + (i % 2) * 0.5);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }
}

function getDefinitionBounds(definition) {
  const points = [];

  for (const platform of definition.platforms || []) {
    points.push(
      [platform.x - platform.sx / 2, platform.z - platform.sz / 2],
      [platform.x + platform.sx / 2, platform.z + platform.sz / 2]
    );
  }

  for (const portal of definition.portals || []) {
    const position = portal.position || portal.ring?.position;
    if (position) points.push([position.x, position.z]);
  }

  if (definition.goal) {
    points.push([definition.goal.x, definition.goal.z]);
  }

  if (points.length === 0) {
    return { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const [x, z] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  return { minX, maxX, minZ, maxZ };
}

function tintColor(hex, amount) {
  const color = new THREE.Color(hex);
  color.lerp(new THREE.Color(0xffffff), amount);
  return color.getHex();
}
