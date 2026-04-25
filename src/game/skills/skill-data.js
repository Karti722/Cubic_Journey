export const SKILL_DEFINITIONS = [
  {
    id: "wallClimb",
    name: "Wall Climb",
    cost: 18,
    description: "Hold jump near a wall to climb upward instead of sliding."
  },
  {
    id: "platformMagnet",
    name: "Platform Magnet",
    cost: 22,
    description: "Near an edge, gravity soft-locks you back to the platform when you are about to slip off."
  },
  {
    id: "glide",
    name: "Glide",
    cost: 20,
    description: "Hold jump in midair to soften your fall and control descent."
  },
  {
    id: "dashBoost",
    name: "Dash Boost",
    cost: 24,
    description: "Air dash faster and a little farther."
  },
  {
    id: "extraJump",
    name: "Extra Air Jump",
    cost: 28,
    description: "Gain one more air jump for trickier platforming routes."
  }
];

export function createDefaultSkillState() {
  return {
    wallClimb: false,
    platformMagnet: false,
    glide: false,
    dashBoost: false,
    extraJump: false
  };
}
