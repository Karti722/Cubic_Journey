import { startGame } from "./game.js";

const uiElement = document.getElementById("ui");
if (!uiElement) {
	throw new Error("Missing #ui element required to start the game.");
}

startGame(uiElement);
