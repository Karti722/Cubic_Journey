import { startGame } from "./game.js?v=8";
import { createTitleScreen } from "../game/ui/title-screen.js";
import { createLoadingScreen } from "../game/ui/loading-screen.js";

const uiElement = document.getElementById("ui");
if (!uiElement) {
  throw new Error("Missing #ui element required to start the game.");
}

const bootLoading = createLoadingScreen();
bootLoading.show("Preparing the title screen...");

requestAnimationFrame(() => {
  bootLoading.hide();
  createTitleScreen({
    onStart: () => startGame(uiElement)
  });
});
