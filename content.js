// Function to check if an element is visible
function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

// Function to extract playlist ID from URL
function getPlaylistId() {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get("list");
//   console.log("Playlist ID:", playlistId);
  return playlistId; // Return playlist ID (the value of 'list' in the URL)
}

// Function to get total videos in the playlist
function getTotalVideosInPlaylist() {
  const playlistId = getPlaylistId(); // Get the current playlist ID
  if (!playlistId) return 0; // If no playlist ID is found, return 0

  // Select all video links with id="wc-endpoint" that match the playlist ID in the URL
  const videoLinks = document.querySelectorAll(
    `a#wc-endpoint[href*='list=${playlistId}']`
  );
  console.log("Filtered video links: ", videoLinks);

  return videoLinks ? videoLinks.length : 0;
}

// Function to get watched videos for the current playlist from localStorage
function getWatchedVideos() {
  const playlistId = getPlaylistId();
  const watchedVideos =
    JSON.parse(localStorage.getItem(`watchedVideos_${playlistId}`)) || [];
  return watchedVideos;
}

// Function to update watched videos for the current playlist in localStorage
function updateWatchedVideos(videoId) {
  const playlistId = getPlaylistId();
  let watchedVideos = getWatchedVideos();
  if (!watchedVideos.includes(videoId)) {
    watchedVideos.push(videoId);
    localStorage.setItem(
      `watchedVideos_${playlistId}`,
      JSON.stringify(watchedVideos)
    );
  }
}

// Function to update playlist stats
function updatePlaylistStats(statsContainer, progressBar) {
  const totalVideos = getTotalVideosInPlaylist();
  const watchedVideos = getWatchedVideos();
  const progress = totalVideos
    ? Math.round((watchedVideos.length / totalVideos) * 100)
    : 0;

  statsContainer.textContent = `Videos Watched: ${watchedVideos.length}/${totalVideos} (${progress}%)`;
  // Set progress bar width
  progressBar.style.width = `${progress}%`;
  statsContainer.insertBefore(
    progressBar.parentElement,
    statsContainer.firstChild
  );
}

// Function to inject stats container
function injectStatsContainer() {
  const player = document.querySelector("#player");
  const below = document.querySelector("#below");
  const secondary = document.querySelector("#secondary");
  const secondaryInner = document.querySelector("#secondary-inner");
  const primaryInner = document.querySelector("#primary-inner");

  // Check if the stats container is already added
  if (document.querySelector("#playlist-stats")) {
    console.log("Stats container already exists.");
    return;
  }

  // Create the stats container
  const statsContainer = document.createElement("div");
  statsContainer.id = "playlist-stats";

  // Create the progress bar
  const progressBarContainer = document.createElement("div");
  progressBarContainer.id = "progress-bar-container";

  const progressBar = document.createElement("div");
  progressBar.id = "progress-bar";

  progressBarContainer.appendChild(progressBar);
  statsContainer.appendChild(progressBarContainer);

  // Insert stats container based on screen size
  if (isVisible(secondary) && secondaryInner) {
    secondary.insertBefore(statsContainer, secondaryInner);
    console.log("Stats container injected (large screen).");
  } else if (player && below && primaryInner && primaryInner.contains(below)) {
    primaryInner.insertBefore(statsContainer, below);
    console.log("Stats container injected (small screen).");
  } else {
    console.log("Target elements not found or visible. Waiting...");
  }

  // Update the playlist stats
  updatePlaylistStats(statsContainer, progressBar);
}

// Function to handle video watch status
function handleVideoWatchStatus() {
  const currentVideoId = window.location.href.split("v=")[1].split("&")[0]; // Extract video ID from URL

  // Update watched videos if this is a new video
  updateWatchedVideos(currentVideoId);
  console.log("Updated watched videos:", getWatchedVideos());

  // Update playlist stats after video has been watched
  const statsContainer = document.querySelector("#playlist-stats");
  if (statsContainer) {
    
    updatePlaylistStats(statsContainer, progressBar);
  }
}

// Function to reset watched videos when the playlist changes
function resetWatchedVideosIfPlaylistChanges() {
  const currentPlaylistId = getPlaylistId();
  const storedPlaylistId = localStorage.getItem("currentPlaylistId");

  // If playlist changes, reset the watched videos list
  if (currentPlaylistId !== storedPlaylistId) {
    localStorage.setItem("currentPlaylistId", currentPlaylistId); // Update the stored playlist ID
    localStorage.removeItem(`watchedVideos_${storedPlaylistId}`); // Clear the previous playlist's watched videos
    console.log("Playlist changed. Resetting watched videos.");
  }
}

// Observe the DOM for changes and inject stats when ready
const observer = new MutationObserver(() => {
  if (window.location.href.includes("list=")) {
    injectStatsContainer();
    resetWatchedVideosIfPlaylistChanges(); // Check for playlist changes
  }
});

// Start observing changes in the document
observer.observe(document.body, { childList: true, subtree: true });

// Observe window resizing to adjust injection dynamically
window.addEventListener("resize", () => {
  console.log("Window resized. Rechecking layout...");
  injectStatsContainer();
});

// Add event listener for YouTube player events
document.addEventListener("yt-navigate-finish", handleVideoWatchStatus); // Trigger on video change
document.addEventListener("DOMContentLoaded", handleVideoWatchStatus); // Trigger when the page content is loaded
