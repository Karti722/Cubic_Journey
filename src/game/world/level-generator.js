import { GAME_CONFIG, getWorldStageCount } from "../config/game-config.js";

function createRng(seed) {
  let value = seed >>> 0;
  return function random() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createHubDefinition(campaignState) {
  const worlds = GAME_CONFIG.campaignWorlds;

  const platforms = [
    { x: 0, y: 0, z: 0, sx: 26, sy: 1, sz: 26, color: 0x4f5666 },
    { x: 0, y: -2, z: 0, sx: 44, sy: 1, sz: 44, color: 0x3f4654 },
    { x: 0, y: -4, z: 0, sx: 58, sy: 1, sz: 58, color: 0x2d3240 }
  ];

  const portals = worlds.map((world, index) => {
    const angle = (index / worlds.length) * Math.PI * 2;
    const radius = 15;
    return {
      worldIndex: index,
      name: world.name,
      unlocked: campaignState.canAccessWorld(index),
      position: {
        x: Math.cos(angle) * radius,
        y: 2,
        z: Math.sin(angle) * radius
      },
      color: world.baseColor
    };
  });

  return {
    type: "hub",
    name: "World Hub",
    skyColor: GAME_CONFIG.hubSkyColor,
    spawn: { x: 0, y: 3, z: 0 },
    platforms,
    portals,
    collectibles: [],
    jumpPads: [],
    dashOrbs: [],
    goal: null,
    isBossStage: false,
    stageType: "hub"
  };
}

export function createStageDefinition(worldIndex, stageIndex) {
  const world = GAME_CONFIG.campaignWorlds[worldIndex];
  const worldStageCount = getWorldStageCount(world);
  const isBossStage = world.hasBoss && stageIndex === worldStageCount - 1;

  if (isBossStage) {
    return createBossStage(world, stageIndex, worldStageCount);
  }

  const levelNumber = stageIndex + 1;
  const seed = (worldIndex + 1) * 10000 + levelNumber * 97;
  const rng = createRng(seed);

  const templateId = (worldIndex * 17 + stageIndex * 13) % 12;
  const segmentCount = 18;

  const platforms = [{ x: 0, y: 0, z: 0, sx: 10, sy: 1, sz: 10, color: world.baseColor }];
  const collectibles = [];
  const jumpPads = [];
  const dashOrbs = [];

  let x = 0;
  let y = 0;
  let z = 0;

  for (let i = 0; i < segmentCount; i += 1) {
    const step = 3.7 + rng() * 1.8;
    x += step;

    const curve = computeCurve(templateId, i, stageIndex, worldIndex);
    z += curve;

    y += computeHeightShift(templateId, i, rng);
    y = Math.max(0, Math.min(16 + worldIndex * 2, y));

    const width = 2 + ((templateId + i) % 4) * 0.55 + rng() * 0.4;
    const depth = 2 + ((templateId * 3 + i) % 4) * 0.55 + rng() * 0.4;
    const platformColor = (world.baseColor + ((i * 0x070707 + templateId * 0x040404) & 0x1f1f1f)) & 0xffffff;

    platforms.push({ x, y, z, sx: width, sy: 1, sz: depth, color: platformColor });

    if ((i + templateId) % 3 === 0) {
      collectibles.push({ x, y: y + 1.3, z, value: 1 });
    }

    if ((i + templateId) % 7 === 2) {
      jumpPads.push({ x, y: y + 0.6, z, power: 1.0 + (templateId % 3) * 0.12 });
    }

    if ((i + templateId) % 8 === 5) {
      dashOrbs.push({ x, y: y + 1.7, z });
    }

    if ((i + templateId) % 5 === 1) {
      const wallHeight = 3 + ((i + worldIndex) % 4);
      const wallOffset = ((templateId % 2) * 2 - 1) * (1.3 + rng() * 0.8);
      platforms.push({
        x: x + 0.2,
        y: y + wallHeight / 2,
        z: z + wallOffset,
        sx: 0.9,
        sy: wallHeight,
        sz: 0.9,
        color: (world.baseColor + 0x111111) & 0xffffff
      });
    }
  }

  const goal = { x: x + 4, y: y + 2, z, color: 0x00ff80 };

  return {
    type: "level",
    name: `${world.name} - Stage ${levelNumber}`,
    skyColor: world.skyColor,
    spawn: { x: 0, y: 3, z: 0 },
    platforms,
    portals: [],
    collectibles,
    jumpPads,
    dashOrbs,
    goal,
    isBossStage: false,
    stageType: "standard"
  };
}

function createBossStage(world, stageIndex, worldStageCount) {
  const arenaColor = (world.baseColor + 0x0f0f0f) & 0xffffff;

  const platforms = [
    { x: 0, y: 0, z: 0, sx: 22, sy: 1, sz: 22, color: arenaColor },
    { x: -8, y: 3, z: -8, sx: 6, sy: 1, sz: 6, color: world.baseColor },
    { x: 8, y: 5, z: -8, sx: 6, sy: 1, sz: 6, color: world.baseColor },
    { x: -8, y: 7, z: 8, sx: 6, sy: 1, sz: 6, color: world.baseColor },
    { x: 8, y: 9, z: 8, sx: 6, sy: 1, sz: 6, color: world.baseColor },
    { x: 0, y: 12, z: 0, sx: 5, sy: 1, sz: 5, color: (world.baseColor + 0x181818) & 0xffffff },
    { x: 0, y: 4, z: 0, sx: 2, sy: 8, sz: 2, color: (world.baseColor + 0x222222) & 0xffffff }
  ];

  const jumpPads = [
    { x: -8, y: 3.6, z: -8, power: 1.2 },
    { x: 8, y: 5.6, z: -8, power: 1.25 },
    { x: -8, y: 7.6, z: 8, power: 1.3 }
  ];

  const dashOrbs = [
    { x: 0, y: 6, z: -10 },
    { x: 0, y: 10, z: 10 }
  ];

  const collectibles = [
    { x: -5, y: 2, z: 0, value: 2 },
    { x: 5, y: 2, z: 0, value: 2 }
  ];

  const goal = { x: 0, y: 14.5, z: 0, color: world.keyCubeReward ? 0xfff066 : 0xff6688 };

  return {
    type: "level",
    name: `${world.name} - Boss Stage ${worldStageCount}`,
    skyColor: world.skyColor,
    spawn: { x: 0, y: 3, z: -8 },
    platforms,
    portals: [],
    collectibles,
    jumpPads,
    dashOrbs,
    goal,
    isBossStage: true,
    stageType: "boss",
    stageIndex
  };
}
function computeCurve(templateId, i, stageIndex, worldIndex) {
  switch (templateId % 6) {
    case 0:
      return Math.sin(i * 0.65 + worldIndex) * 1.8;
    case 1:
      return Math.cos(i * 0.4 + stageIndex) * 2.4;
    case 2:
      return ((i % 2) * 2 - 1) * 1.7;
    case 3:
      return Math.sin(i * 0.3) * Math.cos(i * 0.45 + worldIndex) * 2.8;
    case 4:
      return (i % 4 - 1.5) * 1.1;
    default:
      return Math.sin(i * 0.55 + stageIndex * 0.2) * 2.1;
  }
}

function computeHeightShift(templateId, i, rng) {
  const wobble = Math.floor((rng() - 0.45) * 2);

  switch (templateId % 5) {
    case 0:
      return wobble + (i % 5 === 0 ? 1 : 0);
    case 1:
      return wobble + (i % 4 === 2 ? -1 : 0);
    case 2:
      return wobble + (i % 3 === 1 ? 1 : 0);
    case 3:
      return wobble + (i % 6 === 5 ? 2 : 0);
    default:
      return wobble;
  }
}
