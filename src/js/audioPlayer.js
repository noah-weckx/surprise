(function () {
  "use strict";

  const audio = document.getElementById("audio-element");
  const playButton = document.getElementById("player-play");
  const seek = document.getElementById("player-seek");
  const volume = document.getElementById("player-volume");
  const title = document.getElementById("player-title");
  const subtitle = document.getElementById("player-subtitle");
  const currentLabel = document.getElementById("player-current");
  const durationLabel = document.getElementById("player-duration");
  let currentTrack = null;
  let onError = function () {};

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return minutes + ":" + String(remainder).padStart(2, "0");
  }

  function setPlaying(isPlaying) {
    playButton.classList.toggle("is-playing", isPlaying);
    playButton.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  }

  async function togglePlayback() {
    if (!currentTrack) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch (error) {
        onError("This track could not be played. Check that the audio file is present and in a supported format.");
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  }

  audio.addEventListener("timeupdate", function () {
    currentLabel.textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      seek.value = String((audio.currentTime / audio.duration) * 100);
    }
  });
  audio.addEventListener("loadedmetadata", function () {
    durationLabel.textContent = formatTime(audio.duration);
    seek.disabled = false;
  });
  audio.addEventListener("play", function () { setPlaying(true); });
  audio.addEventListener("pause", function () { setPlaying(false); });
  audio.addEventListener("ended", function () { setPlaying(false); });
  audio.addEventListener("error", function () {
    setPlaying(false);
    onError("This audio file could not be loaded. Check that the file exists and uses a browser-supported format.");
  });

  playButton.addEventListener("click", togglePlayback);
  seek.addEventListener("input", function () {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (Number(seek.value) / 100) * audio.duration;
    }
  });
  volume.addEventListener("input", function () { audio.volume = Number(volume.value); });
  audio.volume = Number(volume.value);

  window.ArchiveAudioPlayer = {
    play: async function (track) {
      if (!track || !track.path) return;
      onError = track.reportError || function () {};
      if (currentTrack && currentTrack.path === track.path) {
        await togglePlayback();
        return;
      }
      currentTrack = track;
      title.textContent = track.title || "Untitled track";
      subtitle.textContent = [track.dateLabel, track.description].filter(Boolean).join(" · ") || "Audio from your archive";
      playButton.disabled = false;
      seek.disabled = true;
      seek.value = "0";
      currentLabel.textContent = "0:00";
      durationLabel.textContent = "0:00";
      audio.src = track.path;
      audio.load();
      await togglePlayback();
    }
  };
})();
