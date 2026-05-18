import { THREE } from "../../engine/three.js";

export function createActionEffects(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const particles = [];
  const slashes = [];
  const dashTrails = [];
  const colors = {
    jump: 0x66baff,
    dash: 0xffd45c,
    move: 0xc5a072,
    turn: 0x9ef0ff,
    collect: 0xfff17d,
    hit: 0xff5533,
    land: 0xb0b0b0
  };

  const dashTrailTexture = createDashTrailTexture();

  for (let i = 0; i < 28; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), material);
    mesh.visible = false;
    root.add(mesh);
    particles.push({ mesh, ttl: 0, velocity: new THREE.Vector3(), active: false });
  }

  for (let i = 0; i < 8; i += 1) {
    const slashMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7f7f7,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const slashMesh = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.09, 12, 32, Math.PI * 2), slashMaterial);
    slashMesh.visible = false;
    root.add(slashMesh);
    slashes.push({
      mesh: slashMesh,
      active: false,
      ttl: 0,
      life: 0.18
    });
  }

  for (let i = 0; i < 6; i += 1) {
    const group = new THREE.Group();
    group.visible = false;
    root.add(group);

    const parts = [];

    for (let j = 0; j < 3; j += 1) {
      const streakMaterial = new THREE.MeshBasicMaterial({
        map: dashTrailTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        color: 0xffffff
      });
      const streakMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.18), streakMaterial);
      streakMesh.rotation.x = -Math.PI * 0.5;
      group.add(streakMesh);
      parts.push({ mesh: streakMesh, kind: "streak" });
    }

    const cloudColors = [0xff5a2c, 0xffb11f, 0xfff08a];
    const cloudSpecs = [
      { radius: 0.42, tube: 0.095, arc: Math.PI * 1.18, rotZ: -0.34, x: 0.70, y: 0.10, z: 0.00, opacity: 0.82 },
      { radius: 0.38, tube: 0.09, arc: Math.PI * 1.1, rotZ: 0.30, x: 1.08, y: 0.24, z: 0.02, opacity: 0.68 },
      { radius: 0.34, tube: 0.085, arc: Math.PI * 1.0, rotZ: 0.95, x: 1.08, y: -0.05, z: 0.00, opacity: 0.62 },
      { radius: 0.30, tube: 0.08, arc: Math.PI * 1.22, rotZ: 0.45, x: 0.86, y: -0.24, z: 0.00, opacity: 0.56 }
    ];

    for (let j = 0; j < cloudSpecs.length; j += 1) {
      const spec = cloudSpecs[j];
      const mat = new THREE.MeshBasicMaterial({
        color: cloudColors[j % cloudColors.length],
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, spec.tube, 10, 28, spec.arc), mat);
      mesh.rotation.x = Math.PI * 0.5;
      mesh.rotation.z = spec.rotZ;
      mesh.position.set(spec.x, spec.y, spec.z);
      group.add(mesh);
      parts.push({ mesh, kind: "cloud", opacity: spec.opacity });
    }

    dashTrails.push({
      group,
      parts,
      active: false,
      ttl: 0,
      life: 0.34,
      dirX: 0,
      dirZ: 1,
      stretch: 1,
      wobble: 0
    });
  }

  const sphereSlashes = [];
  for (let i = 0; i < 8; i += 1) {
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xf7f7f7,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 12), sphereMat);
    sphereMesh.visible = false;
    root.add(sphereMesh);
    sphereSlashes.push({
      mesh: sphereMesh,
      active: false,
      ttl: 0,
      life: 0.18
    });
  }

  const explosions = [];
  for (let i = 0; i < 6; i += 1) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffa552,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), mat);
    mesh.visible = false;
    root.add(mesh);
    explosions.push({ mesh, active: false, ttl: 0, life: 0.9, baseScale: 1.8 });
  }

  function emit(kind, position, velocity, spread = 0.2, count = 3) {
    for (let i = 0; i < count; i += 1) {
      const particle = particles.find(item => !item.active);
      if (!particle) break;

      particle.active = true;
      particle.ttl = kind === "dash" ? 0.58 + Math.random() * 0.22 : 0.42 + Math.random() * 0.2;
      particle.mesh.visible = true;
      particle.mesh.position.copy(position);
      particle.mesh.material.color.setHex(colors[kind] || 0xffffff);
      particle.mesh.material.emissive.setHex(colors[kind] || 0xffffff);
      particle.mesh.material.opacity = kind === "dash" ? 1 : 0.9;
      particle.velocity.set(
        (Math.random() - 0.5) * spread + velocity.x,
        Math.random() * spread + velocity.y,
        (Math.random() - 0.5) * spread + velocity.z
      );
      particle.mesh.scale.setScalar(kind === "dash" ? 1.2 + Math.random() * 1.0 : 0.9 + Math.random() * 0.7);
    }
  }

  function emitDashTrail(position, direction, options = {}) {
    const dirX = direction?.x ?? 0;
    const dirZ = direction?.z ?? 1;
    const length = Math.hypot(dirX, dirZ);
    const nx = length > 0.0001 ? dirX / length : 0;
    const nz = length > 0.0001 ? dirZ / length : 1;
    const dashLength = options.length ?? 5.4;
    const offsetBack = options.offsetBack ?? 1.35;
    const sideX = -nz;
    const sideZ = nx;
    let primaryTrail = null;

    for (const trail of dashTrails) {
      if (trail.active) continue;

      trail.active = true;
      trail.ttl = options.life ?? 0.4;
      trail.life = options.life ?? 0.4;
      trail.dirX = nx;
      trail.dirZ = nz;
      trail.stretch = dashLength;
      trail.wobble = Math.random() * Math.PI * 2;
      trail.group.visible = true;
      trail.group.position.set(
        position.x - nx * offsetBack,
        position.y + 0.24,
        position.z - nz * offsetBack
      );
      trail.group.rotation.y = Math.atan2(nx, nz) + Math.PI * 0.5;

      const strokeOffsets = [-0.22, 0.0, 0.18];
      const strokeScales = [1.0, 0.8, 0.62];
      const strokeOpacities = [0.72, 0.58, 0.44];
      const strokeColors = [0xff4b24, 0xffae1d, 0xfff08a];

      for (let i = 0; i < 3; i += 1) {
        const part = trail.parts[i];
        part.mesh.position.set(
          -dashLength * 0.34,
          strokeOffsets[i],
          (i - 1) * 0.02
        );
        part.mesh.scale.set(dashLength * (1.18 + i * 0.08), 0.16 * strokeScales[i], 1);
        part.mesh.material.color.setHex(strokeColors[i]);
        part.mesh.material.opacity = strokeOpacities[i];
      }

      for (let i = 3; i < trail.parts.length; i += 1) {
        const specPart = trail.parts[i];
        const idx = i - 3;
        specPart.mesh.position.x = 0.72 + idx * 0.14;
        specPart.mesh.position.y = [0.1, 0.23, -0.05, -0.2][idx];
        specPart.mesh.position.z = [0, 0.02, 0, 0][idx];
        specPart.mesh.scale.setScalar(1.0);
        specPart.mesh.material.opacity = specPart.opacity;
      }

      const stretchBoost = 1 + (options.length ?? 5.4) * 0.02;
      trail.group.scale.set(stretchBoost, 1, 1);
      trail.group.rotation.z = (Math.random() - 0.5) * 0.14;
      trail.group.position.x += sideX * (Math.random() * 0.06 - 0.03);
      trail.group.position.z += sideZ * (Math.random() * 0.06 - 0.03);
      primaryTrail = trail;

      break;
    }

    if (primaryTrail && options.burstCount !== 1) {
      // Create a secondary faint plume slightly offset for a more explosive silhouette.
      const secondary = dashTrails.find(item => !item.active);
      if (secondary) {
        secondary.active = true;
        secondary.ttl = (options.life ?? 0.4) * 0.82;
        secondary.life = (options.life ?? 0.4) * 0.82;
        secondary.dirX = nx;
        secondary.dirZ = nz;
        secondary.stretch = dashLength * 0.86;
        secondary.wobble = Math.random() * Math.PI * 2;
        secondary.group.visible = true;
        secondary.group.position.set(
          position.x - nx * (offsetBack + 0.22) + sideX * 0.06,
          position.y + 0.18,
          position.z - nz * (offsetBack + 0.22) + sideZ * 0.06
        );
        secondary.group.rotation.y = Math.atan2(nx, nz) + Math.PI * 0.5;
        secondary.group.rotation.z = -0.08;
        secondary.group.scale.set(0.9, 0.9, 0.9);

        for (let i = 0; i < 3; i += 1) {
          const part = secondary.parts[i];
          part.mesh.position.set(-dashLength * 0.3, [-0.16, 0.03, 0.14][i], (i - 1) * 0.02);
          part.mesh.scale.set(dashLength * (0.9 + i * 0.06), 0.11, 1);
          part.mesh.material.color.setHex([0xff6a32, 0xffc02f, 0xfff6bb][i]);
          part.mesh.material.opacity = [0.44, 0.36, 0.26][i];
        }

        for (let i = 3; i < secondary.parts.length; i += 1) {
          const specPart = secondary.parts[i];
          const idx = i - 3;
          specPart.mesh.position.x = 0.72 + idx * 0.13;
          specPart.mesh.position.y = [0.06, 0.18, -0.08, -0.18][idx];
          specPart.mesh.scale.setScalar(1.0);
          specPart.mesh.material.opacity = specPart.opacity * 0.72;
        }
      }
    }
  }

  function emitSlash(position, direction, options = {}) {
    const life = options.life ?? 0.2;
    const fullCircle = options.fullCircle ?? false;
    const useSphere = options.sphere ?? false;

    if (useSphere) {
      const sphere = sphereSlashes.find(item => !item.active);
      if (!sphere) return;
      sphere.active = true;
      sphere.life = life;
      sphere.ttl = life;
      sphere.mesh.visible = true;
      // center on player so radius matches hit checks against player.position
      sphere.mesh.position.set(position.x, position.y + 1.1, position.z);
      sphere.mesh.scale.setScalar(options.scale ?? 1.0);
      sphere.mesh.material.opacity = options.opacity ?? 0.92;
      sphere.mesh.material.color.setHex(options.color ?? 0xe8ffe8);
      return;
    }

    const slash = slashes.find(item => !item.active);
    if (!slash) return;

    const dirX = direction?.x ?? 0;
    const dirZ = direction?.z ?? 1;
    const len = Math.hypot(dirX, dirZ);
    const nx = len > 0.0001 ? dirX / len : 0;
    const nz = len > 0.0001 ? dirZ / len : 1;
    const yaw = Math.atan2(nx, nz);

    slash.active = true;
    slash.life = life;
    slash.ttl = life;
    slash.mesh.visible = true;
    slash.mesh.position.set(position.x + nx * 0.9, position.y + 1.1, position.z + nz * 0.9);
    slash.mesh.rotation.set(Math.PI * 0.5, fullCircle ? 0 : yaw + Math.PI * 0.12, Math.PI * 0.08);
    slash.mesh.scale.setScalar(options.scale ?? (fullCircle ? 2.25 : 1.7));
    slash.mesh.material.opacity = options.opacity ?? 0.92;
    slash.mesh.material.color.setHex(options.color ?? 0xe8ffe8);
  }

  function update(dt) {
    for (const particle of particles) {
      if (!particle.active) continue;

      particle.ttl -= dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.material.opacity = Math.max(0, particle.ttl * 2.2);
      particle.mesh.scale.multiplyScalar(1 - dt * 0.8);

      if (particle.ttl <= 0) {
        particle.active = false;
        particle.mesh.visible = false;
      }
    }

    for (const slash of slashes) {
      if (!slash.active) continue;

      slash.ttl -= dt;
      const t = Math.max(0, slash.ttl / Math.max(0.0001, slash.life));
      slash.mesh.material.opacity = t * 0.92;
      slash.mesh.scale.multiplyScalar(1 + dt * 1.8);
      slash.mesh.rotation.z += dt * 7.5;

      if (slash.ttl <= 0) {
        slash.active = false;
        slash.mesh.visible = false;
      }
    }

    for (const sphere of sphereSlashes) {
      if (!sphere.active) continue;

      sphere.ttl -= dt;
      const t = Math.max(0, sphere.ttl / Math.max(0.0001, sphere.life));
      sphere.mesh.material.opacity = t * 0.92;
      sphere.mesh.scale.multiplyScalar(1 + dt * 1.2);

      if (sphere.ttl <= 0) {
        sphere.active = false;
        sphere.mesh.visible = false;
      }
    }

    for (const exp of explosions) {
      if (!exp.active) continue;
      exp.ttl -= dt;
      const t = 1 - Math.max(0, exp.ttl / Math.max(0.0001, exp.life));
      exp.mesh.material.opacity = Math.max(0, 0.9 * (1 - t));
      exp.mesh.scale.setScalar(exp.baseScale * (1 + t * 3.0));
      if (exp.ttl <= 0) {
        exp.active = false;
        exp.mesh.visible = false;
      }
    }

    for (const trail of dashTrails) {
      if (!trail.active) continue;

      trail.ttl -= dt;
      const t = Math.max(0, trail.ttl / Math.max(0.0001, trail.life));
      const fade = t * t * (0.72 + t * 0.28);
      const pulse = 1 + Math.sin((1 - t) * Math.PI * 2 + trail.wobble) * 0.06;

      trail.group.visible = true;
      trail.group.position.x += trail.dirX * dt * 30.2;
      trail.group.position.z += trail.dirZ * dt * 30.2;
      trail.group.position.y += Math.sin((1 - t) * Math.PI) * dt * 0.02;
      trail.group.scale.set(
        trail.stretch * (1 + (1 - t) * 0.55) * pulse,
        (0.98 + (1 - t) * 0.32) * pulse,
        1
      );

      let index = 0;
      for (const part of trail.parts) {
        if (part.kind === "streak") {
          part.mesh.material.opacity = fade * (0.88 - index * 0.14);
          part.mesh.scale.x += dt * (1.8 + index * 0.22);
          part.mesh.scale.y = Math.max(0.04, part.mesh.scale.y * (1 - dt * 2.2));
          part.mesh.position.y += Math.sin((1 - t) * Math.PI * 2 + index) * dt * 0.012;
          index += 1;
          continue;
        }

        const cloudT = fade * (part.opacity ?? 0.5);
        part.mesh.material.opacity = cloudT;
        part.mesh.scale.x += dt * 0.45;
        part.mesh.scale.y += dt * 0.3;
        part.mesh.rotation.z += dt * (0.22 + index * 0.04);
      }

      if (trail.ttl <= 0) {
        trail.active = false;
        trail.group.visible = false;
      }
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
    dashTrailTexture.dispose();
  }

  function emitExplosion(position, options = {}) {
    const exp = explosions.find(e => !e.active);
    if (!exp) return;
    exp.active = true;
    exp.ttl = options.life ?? 0.9;
    exp.life = options.life ?? 0.9;
    exp.baseScale = options.scale ?? 1.8;
    exp.mesh.visible = true;
    exp.mesh.position.copy(position);
    exp.mesh.material.color.setHex(options.color ?? 0xffa552);
    exp.mesh.material.opacity = options.opacity ?? 0.92;
  }

  function createDashTrailTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(255, 54, 54, 0.0)");
    gradient.addColorStop(0.08, "rgba(255, 54, 54, 0.18)");
    gradient.addColorStop(0.16, "rgba(255, 61, 44, 0.9)");
    gradient.addColorStop(0.38, "rgba(255, 123, 18, 0.95)");
    gradient.addColorStop(0.63, "rgba(255, 194, 36, 0.82)");
    gradient.addColorStop(0.86, "rgba(255, 248, 180, 0.42)");
    gradient.addColorStop(1, "rgba(255, 248, 180, 0.0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(canvas.width * 0.25, canvas.height * 0.5, 1, canvas.width * 0.25, canvas.height * 0.5, canvas.width * 0.42);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.34)");
    glow.addColorStop(0.3, "rgba(255, 230, 90, 0.28)");
    glow.addColorStop(0.7, "rgba(255, 92, 24, 0.18)");
    glow.addColorStop(1, "rgba(255, 92, 24, 0.0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  return { emit, emitSlash, emitDashTrail, emitExplosion, update, dispose };
}
