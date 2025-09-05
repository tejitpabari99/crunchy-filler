// Anime filler service functions
// Handles fetching and processing anime filler data
// Firefox-compatible version

/**
 * Fetches the formatted title JSON data from extension resources
 * @returns {Promise<Object[]|null>} Promise that resolves to anime title data or null on error
 */
function fetchFormattedTitleJSON() {
  return fetch(browser.runtime.getURL('data/crunchyName_animeFillerUrlName.json'))
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch JSON data");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching or parsing JSON:", error);
      return null;
    });
}

/**
 * Generates the filler list URL for a given anime title using fuzzy search
 * @param {string} animeTitle - The anime title to search for
 * @param {Fuse|null} fuseAgent - Fuse.js instance for fuzzy searching
 * @returns {string} The URL to the anime filler list
 */
function getFillerListUrl(animeTitle, fuseAgent) {
  if (!fuseAgent) {
    // Fallback to simple formatting if Fuse is not available
    const formattedTitle = animeTitle.toLowerCase().replace(/\s+/g, "-");
    console.warn("Fuse.js not available, using fallback URL generation");

    return `https://www.animefillerlist.com/shows/${formattedTitle}`;
  }
  
  const result = fuseAgent.search(animeTitle);
  const preciseMatch = result.find(
    (item) => item.item.title.toLowerCase() === animeTitle.toLowerCase()
  );
  if (preciseMatch) {
    return `https://www.animefillerlist.com/shows/${preciseMatch.item.url.toLowerCase()}`;
  } else if (result.length > 0) {
    return `https://www.animefillerlist.com/shows/${result[0].item.url.toLowerCase()}`;
  } else {
    const formattedTitle = animeTitle.toLowerCase().replace(/\s+/g, "-");
    return `https://www.animefillerlist.com/shows/${formattedTitle}`;
  }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchFormattedTitleJSON,
    getFillerListUrl,
  };
}
