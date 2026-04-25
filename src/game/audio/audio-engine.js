const DEFAULT_TRACKS = {
  hub: "src/game/audio/hub.mp3",
  meadow: "src/game/audio/meadow.mp3",
  canyon: "src/game/audio/canyon.mp3",
  nebula: "src/game/audio/nebula.mp3",
  obsidian: "src/game/audio/obsidian.mp3",
  aurora: "src/game/audio/aurora.mp3",
  core: "src/game/audio/core.mp3",
  boss: "src/game/audio/boss.mp3"
};

const SFX_FILES = {
  jump: "src/game/audio/sfx-jump.mp3",
  dash: "src/game/audio/sfx-dash.mp3",
  collect: "src/game/audio/sfx-collect.mp3",
  portal: "src/game/audio/sfx-portal.mp3",
  key: "src/game/audio/sfx-key.mp3",
  boss: "src/game/audio/sfx-boss.mp3",
  pause: "src/game/audio/sfx-pause.mp3"
};

export function createAudioEngine(trackMap = DEFAULT_TRACKS) {
  const unlocked = new Map();
  const music = new Audio();
  music.loop = true;
  music.preload = "auto";
  music.volume = 0.55;

  const sfxPool = new Map();
  let enabled = false;
  let currentTrack = null;

  function unlock() {
    enabled = true;
    return resumeMusic();
  }

  function setTrack(name, options = {}) {
    if (!enabled) return false;
    const src = trackMap[name] || trackMap.hub;
    if (!src) return false;

    if (currentTrack === src) {
      if (options.forceRestart) {
        music.currentTime = 0;
      }
      return true;
    }

    currentTrack = src;
    music.src = src;
    music.volume = options.volume ?? music.volume;

    const playResult = music.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {
        // Keep the engine enabled so future audio can work once files exist or a gesture unlocks playback.
      });
    }

    return true;
  }

  function pauseMusic() {
    music.pause();
  }

  function resumeMusic() {
    if (!enabled || !music.src) return false;
    const result = music.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => {
        // Keep the engine available even if autoplay is blocked or the file is not present yet.
      });
    }
    return true;
  }

  function setVolume(volume) {
    music.volume = clamp(volume, 0, 1);
  }

  function playSfx(name, volume = 0.8) {
    if (!enabled) return;
    const src = SFX_FILES[name];
    if (!src) return;

    const audio = new Audio(src);
    audio.volume = clamp(volume, 0, 1);
    audio.play().catch(() => {
      // Ignore missing-file or autoplay errors.
    });
  }

  function markTrackAvailable(name, isAvailable) {
    unlocked.set(name, Boolean(isAvailable));
  }

  return {
    unlock,
    setTrack,
    pauseMusic,
    resumeMusic,
    setVolume,
    playSfx,
    markTrackAvailable,
    isEnabled: () => enabled,
    getCurrentTrack: () => currentTrack,
    getAvailableTracks: () => Array.from(unlocked.entries())
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
