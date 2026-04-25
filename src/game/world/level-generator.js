import { GAME_CONFIG } from "../config/game-config.js";

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
    { x: 0, y: 0, z: 0, sx: 24, sy: 1, sz: 24, color: 0x4f5666 },
    { x: 0, y: -2, z: 0, sx: 36, sy: 1, sz: 36, color: 0x3f4654 }
  ];

  const portals = worlds.map((world, index) => {
    const angle = (index / worlds.length) * Math.PI * 2;
    const radius = 11;
    return {
      worldIndex: index,
      name: world.name,
      unlocked: index <= campaignState.unlockedWorldIndex,
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
    goal: null
  };
}

export function createLevelDefinition(worldIndex, levelIndex) {
  const world = GAME_CONFIG.campaignWorlds[worldIndex];
  const levelNumber = levelIndex + 1;
  const rng = createRng((worldIndex + 1) * 1000 + levelNumber * 73);

  const platformCount = 20 + levelIndex * 2;
  const platforms = [
    { x: 0, y: 0, z: 0, sx: 10, sy: 1, sz: 10, color: world.baseColor }
  ];

  const collectibles = [];

  let x = 0;
  let y = 0;
  let z = 0;

  for (let i = 0; i < platformCount; i++) {
    const step = 3.5 + rng() * 2.5;
    x += step;
    z += (rng() - 0.5) * 7;
    y += Math.floor((rng() - 0.35) * 2);
    y = Math.max(0, Math.min(20 + worldIndex * 3, y));

    const width = 2.2 + rng() * 2.2;
    const depth = 2.2 + rng() * 2.2;
    const colorShift = Math.floor(rng() * 0x101010);
    const platformColor = (world.baseColor + colorShift) & 0xffffff;

    platforms.push({
      x,
      y,
      z,
      sx: width,
      sy: 1,
      sz: depth,
      color: platformColor
    });

    if (i % 3 === 1) {
      collectibles.push({
        x,
        y: y + 1.35,
        z,
        value: 1
      });
    }

    if (i % 8 === 0 && i !== 0) {
      x += 2;
      platforms.push({
        x,
        y,
        z,
        sx: 5,
        sy: 1,
        sz: 5,
        color: world.baseColor
      });
    }
  }

  const goal = {
    x: x + 4,
    y: y + 2,
    z,
    color: 0x00ff80
  };

  return {
    type: "level",
    name: `${world.name} - Stage ${levelNumber}`,
    skyColor: world.skyColor,
    spawn: { x: 0, y: 3, z: 0 },
    platforms,
    portals: [],
    collectibles,
    goal
  };
}
