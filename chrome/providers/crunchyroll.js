// Crunchyroll-specific provider functions

/**
 * Adds filler star indicators to episode cards on Crunchyroll
 * @param {Object} fillerData - Object containing different types of filler episodes
 * @param {number[]} fillerData.regularFillerEpisodes - Array of regular filler episode numbers
 * @param {number[]} fillerData.mixedFillerEpisodes - Array of mixed cannon/filler episode numbers
 * @param {number[]} fillerData.fanFavouriteEpisodes - Array of fan favourite episode numbers
 */
function addStarToFillerEpisodes(fillerData) {
  const episodeCards = document.querySelectorAll(".playable-card--GnRbX");
  
  episodeCards.forEach((card) => {
    // Remove existing stars to avoid duplicates
    const existingStar = card.querySelector(".filler-star, .mixed-filler-star, .fan-favourite-star");
    if (existingStar) {
      existingStar.remove();
    }

    const titleElement = card.querySelector(".playable-card__title--rgmp7");
    if (titleElement) {
      const episodeTitle = titleElement.textContent;
      const episodeNumber = episodeTitle.match(/E(\d+)/);
      
      if (episodeNumber) {
        const epNum = parseInt(episodeNumber[1], 10);
        card.style.position = "relative";

        // Priority: Fan Favourite > Mixed Filler > Regular Filler
        if (fillerData.fanFavouriteEpisodes && fillerData.fanFavouriteEpisodes.includes(epNum)) {
          const star = document.createElement("div");
          star.className = "fan-favourite-star";
          star.title = "Fan Favourite Episode - Worth watching even though it's filler content";
          card.appendChild(star);
        } else if (fillerData.mixedFillerEpisodes && fillerData.mixedFillerEpisodes.includes(epNum)) {
          const star = document.createElement("div");
          star.className = "mixed-filler-star";
          star.title = "Mixed Cannon/Filler Episode - Contains both story and filler content";
          card.appendChild(star);
        } else if (fillerData.regularFillerEpisodes && fillerData.regularFillerEpisodes.includes(epNum)) {
          const star = document.createElement("div");
          star.className = "filler-star";
          star.title = "Filler Episode - Not part of the main story";
          card.appendChild(star);
        }
      }
    }
  });
}

/**
 * Extracts anime title from Crunchyroll URL
 * @returns {string|null} - The anime title or null if not found
 */
function getAnimeTitle() {
  const url = window.location.href;
  
  // Match Crunchyroll series URLs: /series/[ID]/[anime-name]
  const match = url.match(/\/series\/[^\/]+\/([^\/\?#]+)/);
  
  if (match) {
    const urlName = match[1];
    // Convert hyphens to spaces and capitalize for better matching
    return urlName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return null;
}

/**
 * Handles the "Show More" button click to add filler stars to newly loaded episodes
 * @param {Object} fillerData - Object containing different types of filler episodes
 */
function handleShowMoreButtonClick(fillerData) {
  const showMoreButton = document.querySelector(
    'button[data-t="show-more-btn"]'
  );
  if (showMoreButton) {
    showMoreButton.addEventListener("click", () => {
      // Wait for the new episodes to load
      setTimeout(() => {
        addStarToFillerEpisodes(fillerData);
      }, 50); // Adjust the delay as needed
    });
  }
}

/**
 * Fetches fan favourite episodes for a given anime
 * @param {string} animeTitle - The anime title
 * @returns {Promise<number[]>} Promise that resolves to array of fan favourite episode numbers
 */
async function fetchFanFavouriteEpisodes(animeTitle) {
  try {
    const response = await fetch(chrome.runtime.getURL('data/fanFavourites.json'));
    const fanFavourites = await response.json();

    // Convert anime title to key format (lowercase, replace spaces with hyphens)
    const animeKey = animeTitle.toLowerCase().replace(/\s+/g, '-');
    
    return fanFavourites[animeKey] || [];
  } catch (error) {
    console.error("Error fetching fan favourites:", error);
    return [];
  }
}

/**
 * Initializes the Crunchyroll provider functionality
 * @param {Function} getFillerListUrl - Function to get filler list URL
 * @param {Function} fetchFormattedTitleJSON - Function to fetch title mapping data
 */
function initializeCrunchyrollProvider(getFillerListUrl, fetchFormattedTitleJSON) {
  const animeTitle = getAnimeTitle();
  console.debug("Anime Title:", animeTitle);
  
  // Function to update badge with error handling
  const updateBadgeWithCount = (count) => {
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          { action: "updateBadge", count: count },
          (badgeResponse) => {
            if (chrome.runtime.lastError) {
              console.error("Badge update error:", chrome.runtime.lastError);
            }
          }
        );
      }
    } catch (error) {
      console.warn("Extension context invalidated, cannot update badge:", error.message);
    }
  };
  
  if (animeTitle) {
    fetchFormattedTitleJSON().then((formattedTitleJSON) => {
      if (!formattedTitleJSON) {
        console.error("Failed to fetch title JSON data");
        updateBadgeWithCount(0);
        return;
      }

      const fuseOptions = {
        keys: ["title", "url"],
        includeScore: true,
        threshold: 0.3, // Adjust this for fuzziness, lower is more precise
      };
      const fuseAgent = new Fuse(formattedTitleJSON, fuseOptions);

      const fillerListUrl = getFillerListUrl(animeTitle, fuseAgent);
      console.debug("Filler List URL:", fillerListUrl);
      
      if (fillerListUrl) {
        try {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(
              { action: "getFillerEpisodes", url: fillerListUrl },
              async (response) => {
                if (chrome.runtime.lastError) {
                  console.error("SendMessage Error:", chrome.runtime.lastError);
                  updateBadgeWithCount(0);
                  if (chrome.runtime.reload) {
                    chrome.runtime.reload(); // Reload the extension
                  }
                } else {
                  let fillerCount = 0;
                  if (response.fillerEpisodes) {                    
                    // Fetch fan favourite episodes
                    const fanFavouriteEpisodes = await fetchFanFavouriteEpisodes(animeTitle);
                    fillerCount = response.fillerEpisodes.length + fanFavouriteEpisodes.length;
                    
                    const fillerData = {
                      regularFillerEpisodes: response.regularFillerEpisodes || [],
                      mixedFillerEpisodes: response.mixedFillerEpisodes || [],
                      fanFavouriteEpisodes: fanFavouriteEpisodes || []
                    };
                    console.debug("Filler Episodes:", fillerData);

                    setTimeout(() => {
                      addStarToFillerEpisodes(fillerData);
                    }, 1000);
                    
                    handleShowMoreButtonClick(fillerData);
                  } else {
                    console.error("Failed to get filler episodes:", response.error);
                  }
                  
                  // Update badge with filler count (0 if no fillers or error)
                  updateBadgeWithCount(fillerCount);
                }
              }
            );
          } else {
            console.warn("Chrome runtime not available, cannot fetch filler episodes");
            updateBadgeWithCount(0);
          }
        } catch (error) {
          console.warn("Extension context invalidated during filler fetch:", error.message);
          updateBadgeWithCount(0);
        }
      } else {
        console.error("Failed to generate filler list URL");
        updateBadgeWithCount(0);
      }
    }).catch((error) => {
      console.error("Error in fetchFormattedTitleJSON:", error);
      updateBadgeWithCount(0);
    });
  } else {
    console.error("Failed to get anime title");
    updateBadgeWithCount(0);
  }
}

/**
 * Sets up MutationObserver to detect when Crunchyroll content is loaded
 * @param {Function} initializeCallback - Callback function to initialize the provider
 */
function setupCrunchyrollObserver(initializeCallback) {
  // Use MutationObserver to wait for the title element to appear
  const observer = new MutationObserver((mutations, obs) => {
    const animeFirstSeason = document.querySelector(".season-info");
    if (animeFirstSeason) {
      initializeCallback();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Fallback: If the element doesn't appear after 5 seconds, try to initialize anyway
  setTimeout(() => {
    if (!document.querySelector(".season-info")) {
      console.warn(
        "Episode series element not found after timeout, attempting to initialize anyway"
      );
      initializeCallback();
    }
  }, 5000);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addStarToFillerEpisodes,
    getAnimeTitle,
    handleShowMoreButtonClick,
    initializeCrunchyrollProvider,
    setupCrunchyrollObserver
  };
}
