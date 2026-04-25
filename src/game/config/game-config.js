export const PLAYER_CONFIG = {
  speed: 9,
  jumpVelocity: 12,
  extraAirJumps: 1,
  wallJumpPush: 9,
  dashSpeed: 22,
  dashDuration: 0.18,
  gravity: 25,
  halfHeight: 0.5,
  fallLimit: -35,
  jumpPadBoost: 15
};

export const GAME_CONFIG = {
  requiredKeyCubes: 5,
  finalWorldIndex: 5,
  campaignWorlds: [
    {
      id: "meadow",
      name: "Meadow Rise",
      regularStageCount: 18,
      hasBoss: true,
      keyCubeReward: true,
      baseColor: 0x3fa34d,
      skyColor: 0x88d7ff
    },
    {
      id: "canyon",
      name: "Canyon Forge",
      regularStageCount: 18,
      hasBoss: true,
      keyCubeReward: true,
      baseColor: 0xc16e2d,
      skyColor: 0xffc58a
    },
    {
      id: "nebula",
      name: "Nebula Heights",
      regularStageCount: 20,
      hasBoss: true,
      keyCubeReward: true,
      baseColor: 0x5f73d9,
      skyColor: 0x7fa0ff
    },
    {
      id: "obsidian",
      name: "Obsidian Crown",
      regularStageCount: 20,
      hasBoss: true,
      keyCubeReward: true,
      baseColor: 0x6a5f7f,
      skyColor: 0xb69acd
    },
    {
      id: "aurora",
      name: "Aurora Vault",
      regularStageCount: 22,
      hasBoss: true,
      keyCubeReward: true,
      baseColor: 0x37a8c8,
      skyColor: 0xc2f4ff
    },
    {
      id: "core",
      name: "Core Rift",
      regularStageCount: 24,
      hasBoss: true,
      keyCubeReward: false,
      baseColor: 0xb13f57,
      skyColor: 0xf6a2b3
    }
  ],
  hubSkyColor: 0x9ed8ff,
  portalRadius: 2.5
};

export function getWorldStageCount(world) {
  return world.regularStageCount + (world.hasBoss ? 1 : 0);
}
