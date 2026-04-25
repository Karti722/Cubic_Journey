import { THREE } from "../../engine/three.js";

export function buildWorldRuntime(scene, definition) {
  scene.background = new THREE.Color(definition.skyColor);

  const root = new THREE.Group();
  scene.add(root);

  const colliders = [];
  const collectibles = [];
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

  let goal = null;
  if (definition.goal) {
    goal = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.7, 1.7),
      new THREE.MeshStandardMaterial({ color: definition.goal.color })
    );
    goal.position.set(definition.goal.x, definition.goal.y, definition.goal.z);
    goal.castShadow = true;
    root.add(goal);
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
    colliders,
    collectibles,
    portals,
    goal,
    update,
    dispose
  };
}
