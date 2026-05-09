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

  const portals = worlds.flatMap((world, index) => {
    const progress = campaignState.worldProgress?.[index];
    if (progress?.bossDefeated) return [];

    const angle = (index / worlds.length) * Math.PI * 2;
    const radius = 15;
    return [{
      worldIndex: index,
      name: world.name,
      unlocked: campaignState.worldProgress?.[index]?.bossDefeated
        ? false
        : (index !== GAME_CONFIG.finalWorldIndex
            ? true
            : (campaignState.keyCubes || 0) >= GAME_CONFIG.requiredKeyCubes),
      position: {
        x: Math.cos(angle) * radius,
        y: 2,
        z: Math.sin(angle) * radius
      },
      color: world.baseColor
    }];
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
    bombs: [],
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
    return createBossStage(world, worldIndex, stageIndex, worldStageCount);
  }

  const levelNumber = stageIndex + 1;
  const seed = (worldIndex + 1) * 10000 + levelNumber * 97;
  const rng = createRng(seed);

  const templateId = (worldIndex * 17 + stageIndex * 13) % 12;
  const segmentCount = 18;
  const worldDifficulty = getWorldDifficulty(worldIndex, stageIndex, worldStageCount);
  const maxStandardEnemies = 4 + Math.floor(worldDifficulty * 8);

  const platforms = [{ x: 0, y: 0, z: 0, sx: 10, sy: 1, sz: 10, color: world.baseColor }];
  const collectibles = [];
  const jumpPads = [];
  const dashOrbs = [];
  const enemies = [];

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

    if (
      enemies.length < maxStandardEnemies
      && shouldSpawnStandardEnemy(i, templateId, rng, worldDifficulty, stageIndex)
    ) {
      const radius = 0.56 + worldDifficulty * 0.2 + rng() * 0.06;
      enemies.push({
        x,
        y: y + 1.0 + worldDifficulty * 0.18,
        z: z + (rng() - 0.5) * 0.9,
        radius,
        phase: rng() * Math.PI * 2
      });
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
    bombs: [],
    enemies,
    goal,
    isBossStage: false,
    stageType: "standard"
  };
}

function createBossStage(world, worldIndex, stageIndex, worldStageCount) {
  const arenaColor = (world.baseColor + 0x0f0f0f) & 0xffffff;
  const worldDifficulty = worldIndex / Math.max(1, GAME_CONFIG.campaignWorlds.length - 1);
  const bossSeed = (worldIndex + 1) * 50177 + (stageIndex + 1) * 997;
  const rng = createRng(bossSeed);

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

  const enemyAnchors = [
    { x: -6, y: 1.05, z: 0 },
    { x: 6, y: 1.05, z: 0 },
    { x: 0, y: 5.05, z: -6 },
    { x: -8, y: 3.95, z: -8 },
    { x: 8, y: 5.95, z: -8 },
    { x: 0, y: 10.9, z: 0 }
  ];

  const bossEnemyCount = Math.min(enemyAnchors.length, 5 + Math.floor(worldDifficulty * 4));
  const enemies = enemyAnchors.slice(0, bossEnemyCount).map((anchor, index) => ({
    x: anchor.x,
    y: anchor.y,
    z: anchor.z,
    radius: 0.68 + worldDifficulty * 0.16 + index * 0.015,
    phase: rng() * Math.PI * 2
  }));

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
    bombs: [],
    enemies,
    goal,
    isBossStage: true,
    stageType: "boss",
    stageIndex
  };
}

export const MINIGAME_MAX_LEVEL = 11;

export function createSwordMinigameDefinition(level = 1) {
  const clampedLevel = Math.max(1, Math.min(MINIGAME_MAX_LEVEL, Math.floor(level)));
  const rng = createRng(88031 + clampedLevel * 177);

  const layout = buildMinigameLayout(clampedLevel);
  const enemies = buildMinigameEnemies(clampedLevel, rng);
  const bombs = buildMinigameBombs(clampedLevel, rng);

  return {
    type: "minigame",
    name: `Goblin Wildlands L${clampedLevel}`,
    skyColor: 0x7eb4df,
    spawn: layout.spawn,
    platforms: layout.platforms,
    portals: [],
    collectibles: [],
    jumpPads: [],
    dashOrbs: [],
    bombs,
    enemies,
    goal: null,
    isBossStage: (clampedLevel % 5 === 0) || (clampedLevel === MINIGAME_MAX_LEVEL),
    stageType: "minigame",
    minigameLevel: clampedLevel,
    minigameMaxLevel: MINIGAME_MAX_LEVEL
  };
}

function buildMinigameLayout(level) {
  const variant = (level - 1) % 5;
  const platforms = [
    { x: 0, y: 0, z: 0, sx: 96, sy: 1.6, sz: 96, color: 0x4e5968 },
    { x: 0, y: -2.3, z: 0, sx: 116, sy: 2.2, sz: 116, color: 0x2f3a48 }
  ];

  let spawn = { x: 0, y: 3, z: -34 };
  if (variant === 0) {
    platforms.push(
      { x: -24, y: 2.8, z: -12, sx: 18, sy: 1.2, sz: 14, color: 0x3a4453 },
      { x: 18, y: 3.6, z: -6, sx: 14, sy: 1.2, sz: 20, color: 0x3a4453 },
      { x: -6, y: 4.8, z: 20, sx: 20, sy: 1.2, sz: 14, color: 0x465366, move: { axis: "x", amplitude: 7, speed: 0.75, phase: 0.4 } }
    );
  } else if (variant === 1) {
    spawn = { x: -30, y: 4, z: -30 };
    platforms.push(
      { x: -30, y: 3.2, z: -30, sx: 14, sy: 1.2, sz: 14, color: 0x3a4453 },
      { x: -10, y: 4.2, z: -8, sx: 12, sy: 1.1, sz: 12, color: 0x3a4453, move: { axis: "z", amplitude: 8, speed: 0.95, phase: 0.9 } },
      { x: 12, y: 5.2, z: 14, sx: 12, sy: 1.1, sz: 12, color: 0x3a4453, move: { axis: "x", amplitude: 9, speed: 0.82, phase: 1.5 } },
      { x: 30, y: 6.4, z: 30, sx: 14, sy: 1.2, sz: 14, color: 0x465366 }
    );
  } else if (variant === 2) {
    platforms.push(
      { x: -20, y: 2.8, z: 0, sx: 18, sy: 1.2, sz: 10, color: 0x3a4453 },
      { x: 0, y: 4.2, z: 0, sx: 18, sy: 1.2, sz: 10, color: 0x3a4453, move: { axis: "y", amplitude: 1.1, speed: 1.1, phase: 0.2 } },
      { x: 20, y: 5.4, z: 0, sx: 18, sy: 1.2, sz: 10, color: 0x465366 },
      { x: 0, y: 3.6, z: 24, sx: 22, sy: 1.2, sz: 12, color: 0x3a4453 }
    );
  } else if (variant === 3) {
    const ringCount = 9;
    for (let i = 0; i < ringCount; i += 1) {
      const angle = (i / ringCount) * Math.PI * 2;
      platforms.push({
        x: Math.cos(angle) * 25,
        y: 3 + (i % 3) * 0.8,
        z: Math.sin(angle) * 25,
        sx: 10,
        sy: 1.2,
        sz: 8,
        color: i % 2 === 0 ? 0x3a4453 : 0x465366,
        move: i % 3 === 0 ? { axis: "x", amplitude: 4, speed: 0.8, phase: i * 0.3 } : undefined
      });
    }
  } else {
    spawn = { x: 0, y: 6, z: -8 };
    platforms.push(
      { x: 0, y: 6, z: -8, sx: 16, sy: 1.2, sz: 16, color: 0x465366 },
      { x: -20, y: 8.2, z: 0, sx: 16, sy: 1.2, sz: 16, color: 0x3a4453, move: { axis: "z", amplitude: 7, speed: 1.05, phase: 0.7 } },
      { x: 20, y: 9.6, z: 0, sx: 16, sy: 1.2, sz: 16, color: 0x3a4453, move: { axis: "x", amplitude: 7, speed: 1.0, phase: 1.1 } },
      { x: 0, y: 11.4, z: 16, sx: 14, sy: 1.2, sz: 14, color: 0x5a6578 }
    );
  }

  return { platforms, spawn };
}

function buildMinigameEnemies(level, rng) {
  // Special final level: only boss goblins (50) chasing fast.
  if (level === MINIGAME_MAX_LEVEL) {
    const bosses = [];
    const count = 50;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.4;
      // spread across rings to avoid perfect overlap
      const ring = i % 5;
      const radius = 12 + ring * 6 + Math.floor(i / 10) * 4 + rng() * 3;
      bosses.push({
        x: Math.cos(angle) * radius,
        y: 1.2 + (ring * 0.2),
        z: Math.sin(angle) * radius,
        radius: 1.0 + rng() * 0.2,
        health: 3 + Math.round(rng() * 2),
        isGiant: true,
        phase: rng() * Math.PI * 2,
        driftX: 0.05 + rng() * 0.06,
        driftZ: 0.05 + rng() * 0.06,
        driftY: 0.02 + rng() * 0.02,
        baseSpeed: 3.6 + rng() * 1.4,
        flyHeight: 0.6 + rng() * 0.3,
        chaseWeight: 1.2
      });
    }
    return bosses;
  }

  const enemies = [];
  const ringCount = 2 + Math.floor(level / 3);
  const baseCount = 8 + level * 2;

  for (let ring = 0; ring < ringCount; ring += 1) {
    const count = baseCount + ring * 2;
    const radius = 10 + ring * 8 + level * 0.6;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.35;
      enemies.push({
        x: Math.cos(angle) * radius,
        y: 1.2 + ring * 0.45,
        z: Math.sin(angle) * radius,
        radius: 0.72,
        health: 1,
        isGiant: false,
        phase: i * 0.21 + ring * 0.6,
        driftX: 0.2 + rng() * 0.06,
        driftZ: 0.2 + rng() * 0.06,
        driftY: 0.05 + rng() * 0.03,
        baseSpeed: 2.25 + level * 0.1,
        flyHeight: 0.55 + level * 0.04
      });
    }
  }

  const stalkers = 4 + Math.floor(level * 0.8);
  for (let i = 0; i < stalkers; i += 1) {
    const angle = (i / stalkers) * Math.PI * 2 + 0.2;
    enemies.push({
      x: Math.cos(angle) * (18 + level * 1.3),
      y: 3.4 + (i % 2) * 0.6,
      z: Math.sin(angle) * (18 + level * 1.3),
      radius: 0.74,
      health: 1,
      isGiant: false,
      phase: 0.7 + i,
      baseSpeed: 2.5 + level * 0.11,
      flyHeight: 0.85,
      chaseWeight: 0.86
    });
  }

  if (level % 5 === 0 || level === MINIGAME_MAX_LEVEL) {
    enemies.push({
      x: 0,
      y: 8.2,
      z: 0,
      radius: 2.2,
      health: 18 + level * 2,
      isGiant: true,
      phase: 1.8,
      driftX: 0.11,
      driftZ: 0.1,
      driftY: 0.03,
      baseSpeed: 1.75 + level * 0.02,
      flyHeight: 1.1,
      chaseWeight: 0.58
    });
  }

  return enemies;
}

function buildMinigameBombs(level, rng) {
  const count = Math.min(18, 2 + level);
  const bombs = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.25;
    const radius = 8 + level * 2.6 + (i % 3) * 2;
    bombs.push({
      x: Math.cos(angle) * radius,
      y: 1.1 + (i % 2) * 0.4,
      z: Math.sin(angle) * radius,
      radius: 0.9,
      blastRadius: 2.6,
      cooldown: 3 + rng() * 2,
      phase: rng() * Math.PI * 2
    });
  }
  return bombs;
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

function getWorldDifficulty(worldIndex, stageIndex, worldStageCount) {
  const worldRatio = worldIndex / Math.max(1, GAME_CONFIG.campaignWorlds.length - 1);
  const stageRatio = stageIndex / Math.max(1, worldStageCount - 1);
  return Math.min(1, worldRatio * 0.7 + stageRatio * 0.3);
}

function shouldSpawnStandardEnemy(i, templateId, rng, worldDifficulty, stageIndex) {
  if (i <= 2) return false;

  const rhythmGate = ((i + templateId + stageIndex) % 5) <= 1;
  const chance = 0.2 + worldDifficulty * 0.55;
  return rhythmGate && rng() < chance;
}
