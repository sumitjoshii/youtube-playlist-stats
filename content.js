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

// Function to inject stats container
function injectStatsContainer() {
  const player = document.querySelector("#player");
  const below = document.querySelector("#below");
  const secondary = document.querySelector("#secondary");
  const secondaryInner = document.querySelector("#secondary-inner");
  const primaryInner = document.querySelector("#primary-inner"); // Correctly select `primary-inner`

  // Debugging logs
  console.log("Player:", player);
  console.log("Below:", below);
  console.log("Secondary:", secondary, "Visible:", isVisible(secondary));
  console.log("Secondary-Inner:", secondaryInner);

  // Check if the stats container is already added
  if (document.querySelector("#playlist-stats")) {
    console.log("Stats container already exists.");
    return;
  }

  // Create the stats container
  const statsContainer = document.createElement("div");
  statsContainer.id = "playlist-stats";
  statsContainer.textContent = "Playlist Stats Placeholder";
  statsContainer.style.background = "white";
  statsContainer.style.padding = "10px";
  statsContainer.style.marginBottom = "10px";
  statsContainer.style.border = "1px solid black";

  if (isVisible(secondary) && secondaryInner) {
    // For large screens, insert above `#secondary-inner`
    secondary.insertBefore(statsContainer, secondaryInner);
    console.log("Stats container injected (large screen).");
  } 
  else if (player && below && primaryInner && primaryInner.contains(below)) {
    // For small screens, insert between `#player` and `#below`
    primaryInner.insertBefore(statsContainer, below);
    console.log("Stats container injected (small screen).");
  } 
  else {
    console.log("Target elements not found or visible. Waiting...");
  }
}

// Observe the DOM for changes and inject when ready
const observer = new MutationObserver(() => {
  if (window.location.href.includes("list=")) {
    injectStatsContainer();
  }
});

// Start observing changes in the document
observer.observe(document.body, { childList: true, subtree: true });

// Observe window resizing to adjust injection dynamically
window.addEventListener("resize", () => {
  console.log("Window resized. Rechecking layout...");
  injectStatsContainer();
});