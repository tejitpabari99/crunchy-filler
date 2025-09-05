// Main content script - coordinates between providers and sources
// Firefox-compatible version

// Initialize the extension based on the current website
function initializeExtension() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('crunchyroll.com')) {
    // Initialize Crunchyroll provider
    setupCrunchyrollObserver(() => {
      initializeCrunchyrollProvider(getFillerListUrl, fetchFormattedTitleJSON);
    });
  }
  // Future providers can be added here (e.g., Funimation, Netflix, etc.)
}

// Start the extension
initializeExtension();
