# Cubic Journey

A long-form Three.js 3D platformer campaign built with modular game systems.

The game now includes:

- A hub world with unlockable portals
- 4 campaign worlds
- 76 total stages (16 + 16 + 20 + 24)
- Camera-relative movement and orbit camera controls
- Collectibles, progression tracking, and stage-by-stage advancement
- A title screen with separate menu music
- A pause-menu controls editor for remapping keys
- A skill shop that spends collectibles on unlockable movement upgrades
- Enemies with stomp defeat, hit feedback, and action VFX

## Requirements

- Python 3.x
- A modern browser (Chrome, Edge, Firefox)
- The title screen is intentionally minimal so you can get into the game immediately
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

- src/game/ui/title-screen.js: Title screen and any-key start flow
- src/game/ui/controls-menu.js: Key rebinding overlay
- src/game/ui/shop-menu.js: Skill shop overlay
- W A S D: Move (camera-relative)
- Space: Jump
- Shift: Air dash
- Jump into nearby walls: Wall jump
- Mouse drag: Rotate camera
- Arrow keys: Rotate / tilt camera
- E: Enter nearby portal in the hub
- M: Open the quick world menu
- C: Open the controls menu from pause
- O: Open the skill shop from pause
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

## Title Screen

- Press any key, click, or tap to begin
- The title screen plays its own background music before the main game starts
- Use the controls button on the title screen if you want to inspect the input setup before starting

## Skill Shop

Collectibles now act as currency.

- Spend coins in the shop menu to unlock permanent skills
- Skills currently include wall climb, platform magnet, glide, dash boost, and an extra air jump upgrade
- Shop progress is saved locally and applies immediately once purchased

## Controls Menu

The pause menu now includes a dedicated controls editor.

- Open Pause with P or Esc
- Choose Controls
- Click Rebind next to an action and press the new key
- Use Reset Defaults to restore the shipped layout

## Notes

- The project uses JavaScript ES modules.
- Use serve.py instead of python -m http.server on systems where .js is served with an incorrect MIME type.
- This is a pure static game (no backend, no build step required).
- Audio files are expected later in src/game/audio/.
- The game is intentionally kept bundle-free so it loads fast on static hosts.

## Audio And Music

The game now includes an audio engine that is ready for MP3 files when you add them later.

Expected music and sound paths:

- src/game/audio/music/title.mp3
- src/game/audio/music/hub.mp3
- src/game/audio/music/meadow.mp3
- src/game/audio/music/canyon.mp3
- src/game/audio/music/nebula.mp3
- src/game/audio/music/obsidian.mp3
- src/game/audio/music/aurora.mp3
- src/game/audio/music/core.mp3
- src/game/audio/music/boss.mp3
- src/game/audio/sfx/jump.mp3
- src/game/audio/sfx/dash.mp3
- src/game/audio/sfx/collect.mp3
- src/game/audio/sfx/portal.mp3
- src/game/audio/sfx/key.mp3
- src/game/audio/sfx/boss.mp3
- src/game/audio/sfx/enemy.mp3
- src/game/audio/sfx/enemy-defeat.mp3
- src/game/audio/sfx/damage.mp3
- src/game/audio/sfx/pause.mp3

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
- The included netlify.toml file keeps the project deployable as a plain static site.

## Alternative Static Hosts

Netlify is a good fit here because the project is plain HTML, CSS, and JavaScript with no build step.

- Cloudflare Pages also works well for the same reason and can be used if you want another fast static edge host.
- GitHub Pages also works, but Netlify or Cloudflare Pages are better matches for this repo because they handle static hosting and module assets with less setup.

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
<<<<<<< HEAD
- src/game/debug/debug-menu.js: Branch-only debug travel menu and lock-bypass controls
=======
- src/game/ui/title-screen.js: Title screen and any-key start flow
- src/game/ui/controls-menu.js: Key rebinding overlay
- src/game/ui/shop-menu.js: Skill shop overlay
>>>>>>> main
- src/game/audio/audio-engine.js: Background music and sound effect management
- netlify.toml: Static deploy config for Netlify
- src/game/story/story-data.js: Story and boss names
- src/game/persistence/save-store.js: localStorage save/load helpers
- serve.py: Local static server with JS MIME fix

# Music
- From Pixabay