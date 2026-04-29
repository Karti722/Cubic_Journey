import { startGame } from "./game.js?v=18";
import { createTitleScreen } from "../game/ui/title-screen.js";

const uiElement = document.getElementById("ui");
if (!uiElement) {
  throw new Error("Missing #ui element required to start the game.");
}

createTitleScreen({
  onStart: () => startGame(uiElement)
});
