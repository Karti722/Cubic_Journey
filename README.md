# Cubic Journey

Cubic Journey is a modular Three.js 3D platformer with a hub world, six campaign realms, boss-gated progression, an 11-level slash minigame, remappable controls, persistent save data, and a debug cheat menu for development builds.

The codebase is intentionally split into small files so future contributors can trace game flow without digging through one giant script. The sections below explain every file in the repository except this README.

## Requirements

- Python 3.x
- A modern browser such as Chrome, Edge, or Firefox

## Run Locally

1. Open a terminal in the project folder.
2. Start the local server:

```bash
python serve.py
```

3. Open this URL in your browser:

```text
http://127.0.0.1:8123
```

4. Stop the server with Ctrl+C.

## High-Level Architecture

- `index.html` loads the app entry point and hosts the root UI container.
- `src/app/main.js` shows the title screen and starts either campaign or minigame mode.
- `src/app/game.js` owns the game loop, runtime swaps, UI wiring, combat flow, and save/progression updates.
- `src/game/world/level-generator.js` builds the hub, campaign stages, boss stages, and minigame layouts.
- `src/game/world/runtime-builder.js` turns a level definition into live Three.js meshes, colliders, enemies, bombs, portals, and atmosphere.
- `src/game/systems/*.js` handles movement, physics, and interaction resolution.
- `src/game/ui/*.js` contains every overlay, menu, and HUD component.
- `src/game/audio/audio-engine.js` and `src/game/audio/*` handle music and sound effects.

## Repository Map

### Root Files

- `index.html`: Minimal HTML shell for the game. It defines the page canvas host, injects a live-reload script for local development, and loads the ES module entry point in `src/app/main.js`.
- `serve.py`: Local static server used during development. It serves the project from disk, forces the correct JavaScript MIME type, and emits live-reload events whenever files change.
- `netlify.toml`: Deployment config for Netlify. It publishes the repository root and forces JavaScript files to be served with a `text/javascript` content type.
- `.gitignore`: Ignores OS junk, log files, and editor settings so local noise does not get committed.
- `favicon.ico`: Browser tab icon for the game.
- `smoke_stdout.log`: Local smoke-test output log. This is a generated artifact, not part of the runtime.
- `smoke_stderr.log`: Local smoke-test error log. This is a generated artifact, not part of the runtime.
- `.github/workflows/`: Present as a folder placeholder, but there are no workflow files committed yet.

### `src/app`

- `src/app/main.js`: App bootstrap. It finds the UI mount point, opens the title screen, and starts campaign or minigame mode based on the button the player chooses.
- `src/app/game.js`: Main gameplay orchestrator. It creates the renderer, input system, camera controller, HUD, pause menu, shop, controls menu, loading screen, campaign state, audio engine, and procedural visuals. It also runs the main update loop, switches between hub and level runtimes, resolves combat and bombs, updates progression, and feeds data into the UI.

### `src/engine`

- `src/engine/three.js`: Central re-export of Three.js. All gameplay files import from here instead of talking to the CDN directly.
- `src/engine/core/render-context.js`: Builds the Three.js scene, camera, renderer, lighting, fog, shadow setup, and resize wiring.
- `src/engine/camera/camera-controller.js`: Implements the orbit-style camera, mouse drag rotation, keyboard rotation/tilt, movement basis vectors, and camera shake.
- `src/engine/input/input.js`: Keyboard and mouse input wrapper. It tracks pressed keys, action bindings, edge-triggered presses, and drag-based camera motion.

### `src/game/config`

- `src/game/config/game-config.js`: Core tuning file for player movement, world definitions, portal rules, hub appearance, and campaign ordering. This is where the campaign worlds, stage counts, and sky colors are defined.

### `src/game/campaign`

- `src/game/campaign/campaign-state.js`: Owns campaign progression state. It creates the default save structure, applies progression rules, tracks completed stages, key cubes, currency, skill unlocks, and world unlock state, and serializes the current save payload.

### `src/game/world`

- `src/game/world/level-generator.js`: Procedural level definition builder. It creates the hub definition, standard campaign stages, boss stages, and slash minigame layouts, including platform placement, collectibles, jump pads, dash orbs, enemies, and bombs.
- `src/game/world/runtime-builder.js`: Runtime scene builder and updater. It converts a level definition into actual meshes, colliders, atmosphere, scenery, portals, enemies, bombs, and goal objects, then updates them every frame.

### `src/game/systems`

- `src/game/systems/movement-system.js`: Converts camera-relative input into horizontal player velocity.
- `src/game/systems/physics-system.js`: Applies jumps, wall jumps, dash behavior, gravity, platform magnet behavior, grounded collision, and fall reset handling.
- `src/game/systems/interaction-system.js`: Resolves collectibles, jump pads, dash orbs, portal proximity, goal checks, enemy contact, sword slashes, and bomb contact/explosion logic.

### `src/game/render`

- `src/game/render/procedural-visuals.js`: Builds the procedural texture set and the stylized player and goblin meshes. It is also responsible for the canvas-based textures used throughout the game world.

### `src/game/effects`

- `src/game/effects/action-effects.js`: Owns particles, slash arcs, sphere slashes, explosion visuals, and other combat feedback effects.

### `src/game/audio`

- `src/game/audio/audio-engine.js`: Manages music playback, looping tracks, volume, audio unlocking, and pooled sound effects.

#### `src/game/audio/music`

- `src/game/audio/music/title.mp3`: Title screen music.
- `src/game/audio/music/hub.mp3`: Hub world music.
- `src/game/audio/music/meadow.mp3`: Meadow realm music.
- `src/game/audio/music/canyon.mp3`: Canyon realm music.
- `src/game/audio/music/nebula.mp3`: Nebula realm music.
- `src/game/audio/music/obsidian.mp3`: Obsidian realm music.
- `src/game/audio/music/aurora.mp3`: Aurora realm music.
- `src/game/audio/music/core.mp3`: Core Rift music.
- `src/game/audio/music/boss.mp3`: Boss encounter music.

#### `src/game/audio/sfx`

- `src/game/audio/sfx/jump.mp3`: Jump and movement jump feedback.
- `src/game/audio/sfx/dash.mp3`: Dash feedback.
- `src/game/audio/sfx/collect.mp3`: Collectible pickup sound.
- `src/game/audio/sfx/portal.mp3`: Portal interaction sound.
- `src/game/audio/sfx/key.mp3`: Key cube pickup sound.
- `src/game/audio/sfx/boss.mp3`: Boss-specific sound cue.
- `src/game/audio/sfx/enemy.mp3`: Generic enemy hit or slash-impact sound.
- `src/game/audio/sfx/enemy-defeat.mp3`: Enemy defeat and shared explosion sound.
- `src/game/audio/sfx/damage.mp3`: Player damage feedback sound.
- `src/game/audio/sfx/pause.mp3`: Pause and unpause sound.
- `src/game/audio/sfx/credits.mp3`: Credits or end-screen sound.

### `src/game/input`

- `src/game/input/control-settings.js`: Stores the default key bindings, loads and saves custom bindings from localStorage, and supports resetting to defaults.

### `src/game/persistence`

- `src/game/persistence/save-store.js`: Persists campaign save data in localStorage, validates loaded values, and merges saves with the current default structure.

### `src/game/skills`

- `src/game/skills/skill-data.js`: Defines the unlockable movement upgrades and the default owned/not-owned state for each skill.

### `src/game/story`

- `src/game/story/story-data.js`: Stores the campaign premise, world narrative blurbs, and boss names used by the HUD and info menus.

### `src/game/debug`

- `src/game/debug/debug-menu.js`: Developer cheats menu used in the debug branch. It exposes travel shortcuts, progress editing, skill toggles, and other test-only controls.

### `src/game/ui`

- `src/game/ui/ui-theme.js`: Shared design system for all overlays. It injects the global UI CSS, styles the glass panels and buttons, and keeps the menus visually consistent.
- `src/game/ui/title-screen.js`: Animated title screen with play, minigame, and source-code buttons, plus the scrolling background treatment.
- `src/game/ui/hud.js`: In-game HUD, status chips, charge indicator, portal prompts, skip prompts, and campaign info toggle.
- `src/game/ui/pause-menu.js`: Pause overlay with resume, music, controls, shop, campaign info, save reset, and world-travel actions.
- `src/game/ui/controls-menu.js`: Controls rebinding overlay. It lists every action, captures the next key press, and lets the player clear or reset mappings.
- `src/game/ui/world-menu.js`: Quick world-travel overlay for hub and campaign navigation.
- `src/game/ui/shop-menu.js`: Skill shop overlay for spending coins on persistent upgrades.
- `src/game/ui/loading-screen.js`: Loading overlay used while worlds are being built or swapped.
- `src/game/ui/campaign-info-menu.js`: Story and progression modal that summarizes the current world, campaign status, key cubes, and boss context.

### Generated or Local-Only Files

- `smoke_stdout.log` and `smoke_stderr.log` are local diagnostics from previous smoke checks. They are useful when debugging the development environment, but they are not part of the game logic.
- The empty `.github/workflows/` folder is a placeholder for future CI configuration if you want to add automated checks later.

## How the Runtime Fits Together

1. The browser opens `index.html`, which loads `src/app/main.js`.
2. The title screen hands control to `src/app/game.js` once the player starts a session.
3. `game.js` creates the scene, renderer, camera, input handler, HUD, menus, audio engine, and procedural visuals.
4. The campaign state decides which world or stage should be active.
5. `level-generator.js` produces a definition for that hub, stage, boss arena, or minigame level.
6. `runtime-builder.js` converts the definition into live meshes, colliders, enemies, bombs, and scenery.
7. The movement, physics, and interaction systems update the player and world interactions every frame.
8. The HUD and menus read the current model state and update the interface.

## Notes For Future Contributors

- Keep `game-config.js`, `campaign-state.js`, `level-generator.js`, and `runtime-builder.js` in sync when changing stage counts or world order.
- If you add new files, document them here so the repository map stays accurate for future open-source readers.
- If you add automated CI later, place it in `.github/workflows/` and describe it here.
- The project currently stays bundle-free and static on purpose, so avoid introducing a build step unless there is a strong reason to do so.
