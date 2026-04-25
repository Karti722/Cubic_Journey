import { startGame } from "./game.js?v=5";

const uiElement = document.getElementById("ui");
if (!uiElement) {
  throw new Error("Missing #ui element required to start the game.");
}

startGame(uiElement);
