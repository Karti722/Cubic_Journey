# Cubic Journey

A long-form Three.js 3D platformer campaign built with modular game systems.

The game now includes:

- A hub world with unlockable portals
- 4 campaign worlds
- 76 total stages (16 + 16 + 20 + 24)
- Camera-relative movement and orbit camera controls
- Collectibles, progression tracking, and stage-by-stage advancement

## Requirements

- Python 3.x
- A modern browser (Chrome, Edge, Firefox)

## Run Locally

1. Open a terminal in this project folder.
2. Start the local server:

```bash
python serve.py
```

3. Open this URL in your browser:

```text
http://127.0.0.1:8123
```

4. Stop the server with Ctrl+C.

## Controls

- W A S D: Move (camera-relative)
- Space: Jump
- Mouse drag: Rotate camera
- Arrow keys: Rotate / tilt camera
- E: Enter nearby portal in the hub

## Notes

- The project uses JavaScript ES modules.
- Use serve.py instead of python -m http.server on systems where .js is served with an incorrect MIME type.
- This is a pure static game (no backend, no build step required).

## Deploy On Netlify

### Option 1: Drag And Drop

1. Go to Netlify and open Sites.
2. Drag this project folder (or a zip of it) into the Deploy manually area.
3. Wait for deployment, then open the generated site URL.

### Option 2: Connect GitHub Repository

1. Push your latest changes to GitHub.
2. In Netlify, click Add new site, then Import an existing project.
3. Choose GitHub and select this repository.
4. Use these build settings:

- Build command: (leave empty)
- Publish directory: .

5. Click Deploy site.

### Netlify Notes

- This is a static site, so no build step is required.
- If you later add a bundler (like Vite), update Build command and Publish directory accordingly.

## Project Structure

- index.html: Page shell and module entry reference
- src/app/main.js: App bootstrap
- src/app/game.js: High-level game orchestration (hub/level flow, runtime swaps, loop)
- src/engine/three.js: Three.js CDN re-export
- src/engine/core/render-context.js: Scene/camera/renderer creation and resize wiring
- src/engine/input/input.js: Keyboard and mouse input handling
- src/engine/camera/camera-controller.js: Camera orbit and movement basis
- src/game/config/game-config.js: Campaign/world/player tuning
- src/game/campaign/campaign-state.js: Progression and unlock state machine
- src/game/world/level-generator.js: Hub and stage generation
- src/game/world/runtime-builder.js: Build and dispose world meshes/colliders
- src/game/systems/movement-system.js: Camera-relative horizontal movement
- src/game/systems/physics-system.js: Gravity, jump, grounded collision, fall reset
- src/game/systems/interaction-system.js: Goal/collectible/portal interactions
- src/game/ui/hud.js: Dynamic HUD rendering
- serve.py: Local static server with JS MIME fix
