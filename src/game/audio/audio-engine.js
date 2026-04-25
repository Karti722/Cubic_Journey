const DEFAULT_TRACKS = {
  hub: "src/game/audio/music/hub.mp3",
  meadow: "src/game/audio/music/meadow.mp3",
  canyon: "src/game/audio/music/canyon.mp3",
  nebula: "src/game/audio/music/nebula.mp3",
  obsidian: "src/game/audio/music/obsidian.mp3",
  aurora: "src/game/audio/music/aurora.mp3",
  core: "src/game/audio/music/core.mp3",
  boss: "src/game/audio/music/boss.mp3"
};

const SFX_FILES = {
  jump: "src/game/audio/sfx/jump.mp3",
  dash: "src/game/audio/sfx/dash.mp3",
  collect: "src/game/audio/sfx/collect.mp3",
  portal: "src/game/audio/sfx/portal.mp3",
  key: "src/game/audio/sfx/key.mp3",
  boss: "src/game/audio/sfx/boss.mp3",
  pause: "src/game/audio/sfx/pause.mp3"
};

export function createAudioEngine(trackMap = DEFAULT_TRACKS) {
  const sfxPool = createSfxPool(SFX_FILES, 4);
  const music = new Audio();
  music.loop = true;
  music.preload = "auto";
  music.volume = 0.55;

  let enabled = false;
  let musicEnabled = true;
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

    if (musicEnabled) {
      safePlay(music);
    }

    return true;
  }

  function pauseMusic() {
    music.pause();
  }

  function resumeMusic() {
    if (!enabled || !music.src || !musicEnabled) return false;
    safePlay(music);
    return true;
  }

  function setMusicEnabled(nextEnabled) {
    musicEnabled = Boolean(nextEnabled);
    if (!musicEnabled) {
      music.pause();
      return;
    }

    resumeMusic();
  }

  function setVolume(volume) {
    music.volume = clamp(volume, 0, 1);
  }

  function playSfx(name, volume = 0.8) {
    if (!enabled) return;
    const pool = sfxPool.get(name);
    if (!pool || pool.length === 0) return;

    let channel = pool.find(audio => audio.paused || audio.ended);
    if (!channel) {
      channel = pool[0];
      channel.currentTime = 0;
    }

    channel.volume = clamp(volume, 0, 1);
    safePlay(channel);
  }

  return {
    unlock,
    setTrack,
    pauseMusic,
    resumeMusic,
    setMusicEnabled,
    setVolume,
    playSfx,
    isEnabled: () => enabled,
    isMusicEnabled: () => musicEnabled,
    getCurrentTrack: () => currentTrack,
    getAvailableTracks: () => Object.keys(trackMap)
  };
}

function createSfxPool(files, channelsPerSound) {
  const pool = new Map();

  for (const [name, src] of Object.entries(files)) {
    const channels = [];
    for (let i = 0; i < channelsPerSound; i += 1) {
      const audio = new Audio(src);
      audio.preload = "auto";
      channels.push(audio);
    }
    pool.set(name, channels);
  }

  return pool;
}

function safePlay(audio) {
  const result = audio.play();
  if (result && typeof result.catch === "function") {
    result.catch(() => {
      // Ignore autoplay and missing-file issues; try again on future interactions.
    });
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
