import { THREE } from "../three.js";

export function createRenderContext() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090d18, 0.0055);

  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 2500);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x050814, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);

  // Hemisphere provides sky-to-ground gradient lighting
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x0e1220, 6.0);
  scene.add(hemi);

  // Strong sun directional light for crisp shadows
  const sun = new THREE.DirectionalLight(0xffffff, 18.0);
  sun.position.set(35, 60, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  scene.add(sun);

  // Subtle fill light to soften shadows
  const fill = new THREE.DirectionalLight(0x9fdfff, 3.6);
  fill.position.set(-28, 22, -30);
  scene.add(fill);

  // Ambient for base illumination
  const ambient = new THREE.AmbientLight(0x101218, 2.1);
  scene.add(ambient);

  return {
    scene,
    camera,
    renderer,
    clock: new THREE.Clock(),
    sun,
    fill
  };
}

export function attachResize(camera, renderer) {
  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  addEventListener("resize", onResize);
}
