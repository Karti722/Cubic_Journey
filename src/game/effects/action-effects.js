import { THREE } from "../../engine/three.js";

export function createActionEffects(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const particles = [];
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

  return { emit, update, dispose };
}
