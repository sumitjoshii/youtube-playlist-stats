// Utility function to check visibility
function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  console.log("Visibility check:", {
    element,
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
  });
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

// Extract playlist ID from URL
function getPlaylistId() {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get("list") || null;
  console.log("Current playlist ID:", playlistId);
  return playlistId;
}

// Get total videos in the playlist
function getTotalVideosInPlaylist() {
  const playlistId = getPlaylistId();
  if (!playlistId) return 0;
  const videoLinks = document.querySelectorAll(
    `a#wc-endpoint[href*='list=${playlistId}']`
  );
  console.log("Total videos found in playlist:", videoLinks.length);
  return videoLinks.length || 0;
}

function getWatchedVideos(callback) {
  const playlistId = getPlaylistId();
  if (!playlistId) {
    callback(0);
    return;
  }

  let timeout;
  const observer = new MutationObserver(() => {
    const playlistItems = document.querySelectorAll(
      "#items ytd-playlist-panel-video-renderer"
    );

    console.log("Playlist items observed:", playlistItems.length);

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const watchedVideos = Array.from(playlistItems).filter((item) => {
        const progressElement = item.querySelector(
          "ytd-thumbnail-overlay-resume-playback-renderer #progress"
        );

        if (progressElement) {
          const progressWidth = parseFloat(
            window.getComputedStyle(progressElement).width
          );
          // console.log("Progress width for item:", progressWidth);
          return progressWidth > 0;
        }
        return false;
      });

      console.log("Watched videos count:", watchedVideos.length);

      if (playlistItems.length > 0) {
        observer.disconnect();
      }

      callback(watchedVideos.length);
    }, 250);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function updateWatchedVideos(videoId) {
  const playlistId = getPlaylistId();
  if (!playlistId) return;

  const storedData =
    JSON.parse(localStorage.getItem(`watchedVideos_${playlistId}`)) || [];

  console.log("Updating watched videos for playlist:", { playlistId, videoId });

  if (!storedData.includes(videoId)) {
    storedData.push(videoId);
    localStorage.setItem(
      `watchedVideos_${playlistId}`,
      JSON.stringify(storedData)
    );
    console.log("Stored watched videos:", storedData);
  }
}

function updatePlaylistStats(statsText, progressBar) {
  const totalVideos = getTotalVideosInPlaylist();

  getWatchedVideos((watchedCount) => {
    const progress = totalVideos
      ? Math.round((watchedCount / totalVideos) * 100)
      : 0;

    console.log("Updating playlist stats:", {
      watchedCount,
      totalVideos,
      progress,
    });

    if (statsText) {
      statsText.textContent = `Videos Watched: ${watchedCount}/${totalVideos} (${progress}%)`;
    }

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  });
}

let lastPlaylistId = null;

function detectPlaylistChange() {
  const currentPlaylistId = getPlaylistId();
  console.log("Playlist change detected:", {
    lastPlaylistId,
    currentPlaylistId,
  });
  if (currentPlaylistId !== lastPlaylistId) {
    lastPlaylistId = currentPlaylistId;
    resetVariablesOnPlaylistChange();
    injectStatsContainer();
  }
}

// setInterval(detectPlaylistChange, 1000);

function injectStatsContainer() {
  if (document.getElementById("playlist-stats")) return;

  console.log("Injecting stats container");

  const statsContainer = document.createElement("div");
  statsContainer.id = "playlist-stats";

  const progressBarContainer = document.createElement("div");
  progressBarContainer.id = "progress-bar-container";

  const progressBar = document.createElement("div");
  progressBar.id = "progress-bar";

  progressBarContainer.appendChild(progressBar);
  statsContainer.appendChild(progressBarContainer);

  const statsText = document.createElement("div");
  statsText.id = "stats-text";
  statsContainer.appendChild(statsText);

  const secondary = document.querySelector("#secondary");
  const secondaryInner = document.querySelector("#secondary-inner");
  const player = document.querySelector("#player");
  const below = document.querySelector("#below");
  const primaryInner = document.querySelector("#primary-inner");

  if (isVisible(secondary) && secondaryInner) {
    secondary.insertBefore(statsContainer, secondaryInner);
    console.log("Stats container injected at secondary.");
  } else if (player && below && primaryInner && primaryInner.contains(below)) {
    primaryInner.insertBefore(statsContainer, below);
    console.log("Stats container injected at primary inner.");
  } else {
    console.log(
      "Failed to inject stats container: suitable location not found."
    );
    return;
  }

  updatePlaylistStats(statsText, progressBar);
}

function handleVideoWatchStatus() {
  const currentVideoId = window.location.href.split("v=")[1]?.split("&")[0];
  if (!currentVideoId) return;

  console.log("Handling video watch status for video:", currentVideoId);

  updateWatchedVideos(currentVideoId);

  const statsContainer = document.querySelector("#playlist-stats");
  if (statsContainer) {
    const statsText = statsContainer.querySelector("#stats-text");
    const progressBar = statsContainer.querySelector("#progress-bar");
    updatePlaylistStats(statsText, progressBar);
  }
}

function resetVariablesOnPlaylistChange() {
  console.log("Resetting variables on playlist change.");
  const statsContainer = document.querySelector("#playlist-stats");
  if (statsContainer) {
    const statsText = statsContainer.querySelector("#stats-text");
    const progressBar = statsContainer.querySelector("#progress-bar");

    if (statsText) statsText.textContent = "Videos Watched: 0/0 (0%)";
    if (progressBar) progressBar.style.width = "0%";
  }
}

const observer = new MutationObserver(() => {
  if (window.location.href.includes("list=")) {
    console.log("Mutation observed: injecting stats container.");
    injectStatsContainer();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener("yt-navigate-finish", handleVideoWatchStatus);
document.addEventListener("DOMContentLoaded", handleVideoWatchStatus);
