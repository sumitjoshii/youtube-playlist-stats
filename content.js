// Utility function to check visibility
function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

// Extract playlist ID from URL
function getPlaylistId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("list");
}

// Get total videos in the playlist
function getTotalVideosInPlaylist() {
  const playlistId = getPlaylistId();
  if (!playlistId) return 0;
  const videoLinks = document.querySelectorAll(
    `a#wc-endpoint[href*='list=${playlistId}']`
  );
  return videoLinks.length || 0;
}

// Get watched videos from localStorage
function getWatchedVideos() {
  const playlistId = getPlaylistId();
  return JSON.parse(localStorage.getItem(`watchedVideos_${playlistId}`)) || [];
}

// Update watched videos in localStorage
function updateWatchedVideos(videoId) {
  const playlistId = getPlaylistId();
  const watchedVideos = getWatchedVideos();
  if (!watchedVideos.includes(videoId)) {
    watchedVideos.push(videoId);
    localStorage.setItem(
      `watchedVideos_${playlistId}`,
      JSON.stringify(watchedVideos)
    );
  }
}

// Function to update playlist stats dynamically
function updatePlaylistStats(statsText, progressBar) {
    const totalVideos = getTotalVideosInPlaylist();
    const watchedVideos = getWatchedVideos();
    const progress = totalVideos
        ? Math.round((watchedVideos.length / totalVideos) * 100)
        : 0;

    // Update stats text
    if (statsText) {
        statsText.textContent = `Videos Watched: ${watchedVideos.length}/${totalVideos} (${progress}%)`;
    }

    // Update progress bar width
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// Function to inject stats container into the DOM (only if not already present)
function injectStatsContainer() {
    if (document.getElementById("playlist-stats")) return; // Avoid duplicate injection

    // Create the stats container
    const statsContainer = document.createElement("div");
    statsContainer.id = "playlist-stats";

    // Create the progress bar container
    const progressBarContainer = document.createElement("div");
    progressBarContainer.id = "progress-bar-container";

    // Create the progress bar
    const progressBar = document.createElement("div");
    progressBar.id = "progress-bar";

    progressBarContainer.appendChild(progressBar);
    statsContainer.appendChild(progressBarContainer);

    // Create the text for stats
    const statsText = document.createElement("div");
    statsText.id = "stats-text";
    statsContainer.appendChild(statsText);

    // Insert stats container into the appropriate location
    const secondary = document.querySelector("#secondary");
    const secondaryInner = document.querySelector("#secondary-inner");
    const player = document.querySelector("#player");
    const below = document.querySelector("#below");
    const primaryInner = document.querySelector("#primary-inner");

    if (isVisible(secondary) && secondaryInner) {
        secondary.insertBefore(statsContainer, secondaryInner);
        console.log("Stats container injected (large screen).");
    } else if (player && below && primaryInner && primaryInner.contains(below)) {
        primaryInner.insertBefore(statsContainer, below);
        console.log("Stats container injected (small screen).");
    } else {
        console.log("Failed to inject stats container: suitable location not found.");
        return; // Exit if no suitable location
    }

    // Initialize playlist stats
    updatePlaylistStats(statsText, progressBar);
}


// Function to handle video watch status
function handleVideoWatchStatus() {
    const currentVideoId = window.location.href.split("v=")[1].split("&")[0]; // Extract video ID from URL

    // Update watched videos if this is a new video
    updateWatchedVideos(currentVideoId);

    // Update playlist stats dynamically
    const statsContainer = document.querySelector("#playlist-stats");
    if (statsContainer) {
        const statsText = statsContainer.querySelector("#stats-text");
        const progressBar = statsContainer.querySelector("#progress-bar");
        updatePlaylistStats(statsText, progressBar);
    }
}

// Reset watched videos when the playlist changes
function resetWatchedVideosIfPlaylistChanges() {
  const currentPlaylistId = getPlaylistId();
  const storedPlaylistId = localStorage.getItem("currentPlaylistId");
  if (currentPlaylistId !== storedPlaylistId) {
    localStorage.setItem("currentPlaylistId", currentPlaylistId);
    localStorage.removeItem(`watchedVideos_${storedPlaylistId}`);
  }
}


// Observe the DOM for changes and inject stats when needed
const observer = new MutationObserver(() => {
    if (window.location.href.includes("list=")) {
        injectStatsContainer();
        resetWatchedVideosIfPlaylistChanges();
    }
});

// Start observing changes in the document
observer.observe(document.body, { childList: true, subtree: true });

// Add event listener for YouTube player events
// window.addEventListener("resize", injectStatsContainer);
document.addEventListener("yt-navigate-finish", handleVideoWatchStatus); // Trigger on video change
document.addEventListener("DOMContentLoaded", handleVideoWatchStatus); // Trigger when the page content is loaded