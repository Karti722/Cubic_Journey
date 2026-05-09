import { THREE } from "../../engine/three.js";

export function createProceduralVisuals() {
  const textures = createTextures();

  return {
    textures,
    createPlayerAvatar: () => createPlayerAvatar(textures),
    createGoblinEnemy: () => createGoblinEnemy(textures),
    dispose() {
      for (const texture of Object.values(textures)) {
        texture.dispose();
      }
    }
  };
}

function createTextures() {
  return {
    stone: makeTexture(64, 64, drawStoneTexture, { repeat: true }),
    coin: makeTexture(64, 64, drawCoinTexture, { repeat: false }),
    jumpPad: makeTexture(64, 64, drawJumpPadTexture, { repeat: false }),
    energy: makeTexture(64, 64, drawEnergyTexture, { repeat: false }),
    portal: makeTexture(64, 64, drawPortalTexture, { repeat: false }),
    goal: makeTexture(64, 64, drawGoalTexture, { repeat: false }),
    sky: makeTexture(128, 128, drawSkyTexture, { repeat: false }),
    skin: makeTexture(64, 64, drawSkinTexture, { repeat: false }),
    shirt: makeTexture(64, 64, drawClothTexture, { repeat: true }),
    pants: makeTexture(64, 64, drawTwillTexture, { repeat: true }),
    hair: makeTexture(64, 64, drawHairTexture, { repeat: false }),
    goblinSkin: makeTexture(64, 64, drawGoblinSkinTexture, { repeat: false }),
    goblinCloth: makeTexture(64, 64, drawGoblinClothTexture, { repeat: true }),
    goblinBoots: makeTexture(64, 64, drawGoblinBootTexture, { repeat: false }),
    goblinEye: makeTexture(32, 32, drawGoblinEyeTexture, { repeat: false })
  };
}

function createPlayerAvatar(textures) {
  const avatar = new THREE.Group();
  avatar.name = "player-avatar";

  const shirtMaterial = makeMaterial(textures.shirt, 0x9ed8ff, { roughness: 0.92, metalness: 0.04, emissive: 0x081420 });
  const skinMaterial = makeMaterial(textures.skin, 0xffd3b1, { roughness: 0.76, metalness: 0.02, emissive: 0x000000 });
  const pantsMaterial = makeMaterial(textures.pants, 0x4b5f87, { roughness: 0.95, metalness: 0.03, emissive: 0x060b14 });
  const hairMaterial = makeMaterial(textures.hair, 0x3b2416, { roughness: 0.88, metalness: 0.02, emissive: 0x000000 });
  const shoeMaterial = makeMaterial(textures.pants, 0x252525, { roughness: 0.96, metalness: 0.02, emissive: 0x000000 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x102030 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.42, 5, 10), shirtMaterial);
  torso.position.y = 0.02;
  avatar.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skinMaterial);
  head.position.y = 0.5;
  avatar.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMaterial);
  hair.position.y = 0.58;
  hair.rotation.x = Math.PI;
  avatar.add(hair);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 4, 8), skinMaterial);
  leftArm.position.set(-0.28, 0.1, 0);
  leftArm.rotation.z = 0.42;
  avatar.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.28;
  rightArm.rotation.z = -0.42;
  avatar.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 4, 8), pantsMaterial);
  leftLeg.position.set(-0.12, -0.36, 0);
  avatar.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.12;
  avatar.add(rightLeg);

  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.26), shoeMaterial);
  leftShoe.position.set(-0.12, -0.62, 0.03);
  avatar.add(leftShoe);

  const rightShoe = leftShoe.clone();
  rightShoe.position.x = 0.12;
  avatar.add(rightShoe);

  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMaterial);
  eyeLeft.position.set(-0.07, 0.52, 0.18);
  avatar.add(eyeLeft);

  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.07;
  avatar.add(eyeRight);

  avatar.bodyMaterial = shirtMaterial;
  avatar.materials = { shirtMaterial, skinMaterial, pantsMaterial, hairMaterial, shoeMaterial, eyeMaterial };

  avatar.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });

  return avatar;
}

function createGoblinEnemy(textures) {
  const goblin = new THREE.Group();
  goblin.name = "goblin-enemy";

  const skinMaterial = makeMaterial(textures.goblinSkin, 0x73d05f, { roughness: 0.9, metalness: 0.02, emissive: 0x0c160a });
  const clothMaterial = makeMaterial(textures.goblinCloth, 0x6b8e55, { roughness: 0.98, metalness: 0.01, emissive: 0x0a1207 });
  const bootMaterial = makeMaterial(textures.goblinBoots, 0x2e261d, { roughness: 0.98, metalness: 0.01, emissive: 0x000000 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffe66d });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.42, 4, 10), clothMaterial);
  body.position.y = 0.08;
  body.rotation.x = Math.PI / 2;
  body.scale.set(1.2, 0.9, 0.9);
  goblin.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), skinMaterial);
  belly.position.set(0, 0.08, 0.16);
  goblin.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 12), skinMaterial);
  head.position.y = 0.46;
  head.scale.set(1.05, 0.92, 1.0);
  goblin.add(head);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 8), skinMaterial);
  snout.position.set(0, 0.42, 0.22);
  snout.rotation.x = Math.PI / 2;
  goblin.add(snout);

  const earLeft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), skinMaterial);
  earLeft.position.set(-0.2, 0.52, 0.0);
  earLeft.rotation.z = -0.75;
  earLeft.rotation.x = -0.45;
  goblin.add(earLeft);

  const earRight = earLeft.clone();
  earRight.position.x = 0.2;
  earRight.rotation.z = 0.75;
  goblin.add(earRight);

  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMaterial);
  eyeLeft.position.set(-0.07, 0.49, 0.2);
  goblin.add(eyeLeft);

  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.07;
  goblin.add(eyeRight);

  const armGeometry = new THREE.CapsuleGeometry(0.075, 0.18, 4, 8);
  const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
  leftArm.position.set(-0.28, 0.1, 0.04);
  leftArm.rotation.z = 0.85;
  goblin.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.28;
  rightArm.rotation.z = -0.85;
  goblin.add(rightArm);

  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.44), bootMaterial);
  leftFoot.position.set(-0.16, -0.32, 0.06);
  goblin.add(leftFoot);

  const rightFoot = leftFoot.clone();
  rightFoot.position.x = 0.16;
  goblin.add(rightFoot);

  const backSpine = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.24, 4, 8), clothMaterial);
  backSpine.position.set(0, 0.12, -0.12);
  backSpine.rotation.x = Math.PI / 10;
  goblin.add(backSpine);

  goblin.bodyMaterial = skinMaterial;
  goblin.clothMaterial = clothMaterial;
  goblin.eyeMaterial = eyeMaterial;
  goblin.materials = { skinMaterial, clothMaterial, bootMaterial, eyeMaterial };

  goblin.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });

  return goblin;
}

function makeMaterial(map, color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    map,
    color,
    roughness: options.roughness ?? 0.8,
    metalness: options.metalness ?? 0.04,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0.15
  });

  return material;
}

function makeTexture(width, height, draw, { repeat = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  draw(context, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
  }

  return texture;
}

function drawStoneTexture(context, width, height) {
  context.fillStyle = "#4f5560";
  context.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      const shade = 70 + Math.floor(Math.random() * 30);
      context.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 12}, 0.16)`;
      context.fillRect(x, y, 8, 8);
    }
  }

  context.strokeStyle = "rgba(20, 24, 34, 0.48)";
  context.lineWidth = 2;
  context.beginPath();
  for (let i = 0; i < 10; i += 1) {
    context.moveTo(0, (height / 10) * i + (i % 2) * 2);
    context.lineTo(width, (height / 10) * i + (i % 2) * 2);
  }
  context.stroke();

  context.strokeStyle = "rgba(255,255,255,0.07)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(6, 10);
  context.lineTo(22, 24);
  context.lineTo(34, 20);
  context.lineTo(52, 38);
  context.moveTo(12, 52);
  context.lineTo(28, 42);
  context.lineTo(44, 50);
  context.stroke();
}

function drawCoinTexture(context, width, height) {
  const gradient = context.createRadialGradient(width * 0.4, height * 0.35, 2, width * 0.5, height * 0.5, width * 0.45);
  gradient.addColorStop(0, "#fff6b1");
  gradient.addColorStop(0.5, "#ffcd57");
  gradient.addColorStop(1, "#c8841f");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,255,255,0.35)";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(width / 2, height / 2, width * 0.32, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(120, 68, 0, 0.5)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(width / 2, height / 2, width * 0.18, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "rgba(255,255,255,0.2)";
  context.fillRect(width * 0.23, height * 0.16, width * 0.08, height * 0.68);
}

function drawJumpPadTexture(context, width, height) {
  context.fillStyle = "#183a34";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#00d28f";
  context.fillRect(0, height * 0.68, width, height * 0.32);

  context.strokeStyle = "rgba(255,255,255,0.22)";
  context.lineWidth = 3;
  context.strokeRect(6, 6, width - 12, height - 12);

  context.strokeStyle = "rgba(100, 255, 195, 0.8)";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(width / 2, height / 2, width * 0.18, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.moveTo(width * 0.5, height * 0.2);
  context.lineTo(width * 0.7, height * 0.5);
  context.lineTo(width * 0.56, height * 0.5);
  context.lineTo(width * 0.56, height * 0.8);
  context.lineTo(width * 0.44, height * 0.8);
  context.lineTo(width * 0.44, height * 0.5);
  context.lineTo(width * 0.3, height * 0.5);
  context.closePath();
  context.fillStyle = "rgba(255,255,255,0.7)";
  context.fill();
}

function drawEnergyTexture(context, width, height) {
  const gradient = context.createRadialGradient(width / 2, height / 2, 2, width / 2, height / 2, width / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.34, "rgba(140, 240, 255, 0.92)");
  gradient.addColorStop(1, "rgba(30, 120, 255, 0.08)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,255,255,0.72)";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(width / 2, height / 2, width * 0.28, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(30, 120, 255, 0.55)";
  context.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    context.beginPath();
    context.arc(width / 2, height / 2, width * (0.12 + i * 0.05), i * 0.45, i * 0.45 + Math.PI * 1.4);
    context.stroke();
  }
}

function drawPortalTexture(context, width, height) {
  const gradient = context.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, width / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(150, 250, 255, 0.9)");
  gradient.addColorStop(0.55, "rgba(90, 120, 255, 0.6)");
  gradient.addColorStop(1, "rgba(6, 18, 38, 0.2)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,255,255,0.55)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(width / 2, height / 2, width * 0.32, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(255,255,255,0.3)";
  context.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    context.beginPath();
    context.arc(width / 2, height / 2, width * (0.12 + i * 0.07), i * 0.8, i * 0.8 + Math.PI * 1.2);
    context.stroke();
  }
}

function drawGoalTexture(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fffdb6");
  gradient.addColorStop(0.5, "#ffd45f");
  gradient.addColorStop(1, "#ff8f3c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,255,255,0.7)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(width * 0.5, height * 0.1);
  context.lineTo(width * 0.82, height * 0.5);
  context.lineTo(width * 0.5, height * 0.9);
  context.lineTo(width * 0.18, height * 0.5);
  context.closePath();
  context.stroke();

  context.strokeStyle = "rgba(140, 55, 0, 0.4)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width * 0.28, height * 0.34);
  context.lineTo(width * 0.72, height * 0.34);
  context.moveTo(width * 0.28, height * 0.66);
  context.lineTo(width * 0.72, height * 0.66);
  context.stroke();
}

function drawSkyTexture(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0d1835");
  gradient.addColorStop(0.5, "#1e3d73");
  gradient.addColorStop(1, "#09111e");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 160; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.8 + 0.4;
    const alpha = Math.random() * 0.8 + 0.2;
    context.fillStyle = `rgba(255,255,255,${alpha})`;
    context.fillRect(x, y, size, size);
  }

  context.fillStyle = "rgba(120, 190, 255, 0.09)";
  context.beginPath();
  context.arc(width * 0.25, height * 0.3, width * 0.18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255, 140, 190, 0.08)";
  context.beginPath();
  context.arc(width * 0.75, height * 0.65, width * 0.22, 0, Math.PI * 2);
  context.fill();
}

function drawSkinTexture(context, width, height) {
  context.fillStyle = "#efc8a0";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.fillRect(0, 0, width, height * 0.28);
  context.fillStyle = "rgba(175, 116, 92, 0.08)";
  for (let i = 0; i < 40; i += 1) {
    context.beginPath();
    context.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
    context.fill();
  }
}

function drawClothTexture(context, width, height) {
  context.fillStyle = "#4b8bc2";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.09)";
  for (let y = 0; y < height; y += 6) {
    context.fillRect(0, y, width, 1);
  }
  context.strokeStyle = "rgba(15,30,50,0.18)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 8) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
}

function drawTwillTexture(context, width, height) {
  context.fillStyle = "#455980";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 2;
  for (let y = -height; y < height * 2; y += 8) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y + width * 0.55);
    context.stroke();
  }
}

function drawHairTexture(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#55331c");
  gradient.addColorStop(1, "#2d190e");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 20; i += 1) {
    context.fillRect(Math.random() * width, 0, 1, height);
  }
}

function drawGoblinSkinTexture(context, width, height) {
  context.fillStyle = "#77cc58";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(20, 50, 10, 0.16)";
  for (let i = 0; i < 32; i += 1) {
    context.beginPath();
    context.arc(Math.random() * width, Math.random() * height, Math.random() * 4 + 1, 0, Math.PI * 2);
    context.fill();
  }
}

function drawGoblinClothTexture(context, width, height) {
  context.fillStyle = "#60764f";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.08)";
  for (let y = 0; y < height; y += 7) {
    context.fillRect(0, y, width, 1);
  }
  context.strokeStyle = "rgba(33, 50, 28, 0.2)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 9) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
}

function drawGoblinBootTexture(context, width, height) {
  context.fillStyle = "#2f241a";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.1)";
  context.fillRect(0, 0, width, height * 0.18);
  context.strokeStyle = "rgba(90, 66, 38, 0.35)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(6, height - 10);
  context.lineTo(width - 6, height - 10);
  context.stroke();
}

function drawGoblinEyeTexture(context, width, height) {
  context.fillStyle = "#1b1208";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#ffe865";
  context.beginPath();
  context.ellipse(width / 2, height / 2, width * 0.15, height * 0.32, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#2a1400";
  context.beginPath();
  context.ellipse(width / 2, height / 2, width * 0.05, height * 0.15, 0, 0, Math.PI * 2);
  context.fill();
}