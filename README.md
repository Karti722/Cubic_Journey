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
- Shift: Air dash
- Jump into nearby walls: Wall jump
- Mouse drag: Rotate camera
- Arrow keys: Rotate / tilt camera
- E: Enter nearby portal in the hub
- M: Open the quick world menu
- P / Esc: Pause the game and open the detailed menu

## Debug Menu (Debug Branch Only)

This feature exists only on the debug-menu branch and is intentionally isolated from the normal game branch.

How to activate:

- Press F10 while in game
- Or press the Backquote key (the tilde key above Tab on most keyboards)

How it works:

- Opens a separate Debug Menu overlay
- Lets you travel directly to the hub or any world/stage
- Includes boss stages, including the final boss stage
- Bypasses world and stage lock checks only when using this debug menu

Branch behavior:

- debug-menu branch: debug menu is enabled
- main branch: debug menu is not included, and normal progression locks remain active

## Notes

- The project uses JavaScript ES modules.
- Use serve.py instead of python -m http.server on systems where .js is served with an incorrect MIME type.
- This is a pure static game (no backend, no build step required).
- Audio files are expected later in assets/audio/.

## Audio And Music

The game now includes an audio engine that is ready for MP3 files when you add them later.

Expected music and sound paths:

- assets/audio/hub.mp3
- assets/audio/meadow.mp3
- assets/audio/canyon.mp3
- assets/audio/nebula.mp3
- assets/audio/obsidian.mp3
- assets/audio/aurora.mp3
- assets/audio/core.mp3
- assets/audio/boss.mp3
- assets/audio/sfx-jump.mp3
- assets/audio/sfx-dash.mp3
- assets/audio/sfx-collect.mp3
- assets/audio/sfx-portal.mp3
- assets/audio/sfx-key.mp3
- assets/audio/sfx-boss.mp3
- assets/audio/sfx-pause.mp3

Suggested stock music sources once you are ready:

- YouTube Audio Library: free, easy to search, good for game loops
- Pixabay Music: broad royalty-free catalog
- Uppbeat: modern tracks with clear licensing tiers
- Free Music Archive: large library, but check the license on each track
- Incompetech: classic royalty-free catalog by Kevin MacLeod
- FreePD: public-domain music and effects
- Mixkit: short cinematic and ambient tracks, plus SFX

Tip: for a platformer, look for looping ambient tracks for the hub and slower exploratory worlds, plus a more intense battle loop for bosses.

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
- src/game/ui/pause-menu.js: Detailed pause menu, controls, and world switching
- src/game/debug/debug-menu.js: Branch-only debug travel menu and lock-bypass controls
- src/game/audio/audio-engine.js: Background music and sound effect management
- src/game/story/story-data.js: Story and boss names
- src/game/persistence/save-store.js: localStorage save/load helpers
- serve.py: Local static server with JS MIME fix

# Music
- From Pixabay