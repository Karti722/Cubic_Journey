# Cubic Journey

A small Three.js platformer prototype.

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

## Notes

- The project uses JavaScript ES modules.
- Use serve.py instead of python -m http.server on systems where .js is served with an incorrect MIME type.

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
- src/app/game.js: Game loop and core gameplay flow
- src/engine/three.js: Three.js CDN re-export
- src/engine/input/input.js: Keyboard and mouse input handling
- src/engine/camera/camera-controller.js: Camera orbit and movement basis
- src/game/world/world.js: Scene objects and platform collision helper
- serve.py: Local static server with JS MIME fix
