import { THREE } from "../../engine/three.js";

export function createActionEffects(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const particles = [];
  const slashes = [];
  const colors = {
    jump: 0x66baff,
    dash: 0xffd45c,
    move: 0xc5a072,
    turn: 0x9ef0ff,
    collect: 0xfff17d,
    hit: 0xff5533,
    land: 0xb0b0b0
  };

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

  function emitSlash(position, direction, options = {}) {
    const slash = slashes.find(item => !item.active);
    if (!slash) return;

    const dirX = direction?.x ?? 0;
    const dirZ = direction?.z ?? 1;
    const len = Math.hypot(dirX, dirZ);
    const nx = len > 0.0001 ? dirX / len : 0;
    const nz = len > 0.0001 ? dirZ / len : 1;
    const yaw = Math.atan2(nx, nz);
    const life = options.life ?? 0.2;
    const fullCircle = options.fullCircle ?? false;

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

  return { emit, emitSlash, emitExplosion, update, dispose };
}
