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

  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x1d243a, 2.0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(25, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x7ecfff, 0.65);
  fill.position.set(-24, 18, -32);
  scene.add(fill);

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
