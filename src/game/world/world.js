import { THREE } from "../../engine/three.js";

export function createWorld(scene) {
  scene.background = new THREE.Color(0x87ceeb);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(5, 10, 5);
  scene.add(sun);

  const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );
  player.position.set(0, 3, 0);
  scene.add(player);

  const platforms = [];
  addPlatform(scene, platforms, 0, 0, 0, 10, 1, 10);
  addPlatform(scene, platforms, 8, 2, 0, 5, 1, 5);
  addPlatform(scene, platforms, 15, 4, -3, 5, 1, 5);
  addPlatform(scene, platforms, 22, 6, 2, 5, 1, 5);
  addPlatform(scene, platforms, 30, 8, 0, 6, 1, 6, 0x44aa44);

  const goal = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x00ff66 })
  );
  goal.position.set(30, 10, 0);
  scene.add(goal);

  return { player, platforms, goal };
}

function addPlatform(scene, platforms, x, y, z, sx, sy, sz, color = 0x777777) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);
  platforms.push(mesh);
}

export function intersectsPlatform(player, platform) {
  const px = Math.abs(player.position.x - platform.position.x);
  const py = player.position.y - platform.position.y;
  const pz = Math.abs(player.position.z - platform.position.z);

  return (
    px < platform.geometry.parameters.width / 2 + 0.5 &&
    pz < platform.geometry.parameters.depth / 2 + 0.5 &&
    py > 0 &&
    py < 1.05
  );
}
