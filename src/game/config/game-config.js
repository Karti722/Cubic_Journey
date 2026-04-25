export const PLAYER_CONFIG = {
  speed: 9,
  jumpVelocity: 12,
  gravity: 25,
  halfHeight: 0.5,
  fallLimit: -25
};

export const GAME_CONFIG = {
  campaignWorlds: [
    { id: "meadow", name: "Meadow Rise", levelCount: 16, baseColor: 0x3fa34d, skyColor: 0x88d7ff },
    { id: "canyon", name: "Canyon Forge", levelCount: 16, baseColor: 0xc16e2d, skyColor: 0xffc58a },
    { id: "nebula", name: "Nebula Heights", levelCount: 20, baseColor: 0x5f73d9, skyColor: 0x7fa0ff },
    { id: "obsidian", name: "Obsidian Crown", levelCount: 24, baseColor: 0x6a5f7f, skyColor: 0xb69acd }
  ],
  hubSkyColor: 0x9ed8ff,
  portalRadius: 2.5
};
