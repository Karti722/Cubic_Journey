import { startGame } from "./game.js?v=14";
import { createTitleScreen } from "../game/ui/title-screen.js?v=2";

const uiElement = document.getElementById("ui");
if (!uiElement) {
  throw new Error("Missing #ui element required to start the game.");
}

createTitleScreen({
  onStart: () => startGame(uiElement)
});
