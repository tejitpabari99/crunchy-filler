// Anime filler service functions
// Handles fetching and processing anime filler data

const Fuse = window.Fuse;

/**
 * Configuration for fuzzy search
 */
const fuseOptions = {
  keys: ["title", "url"],
  includeScore: true,
  threshold: 0.3, // Adjust this for fuzziness, lower is more precise
};

/**
 * Fetches the formatted title JSON data from GitHub
 * @returns {Promise<Object[]|null>} Promise that resolves to anime title data or null on error
 */
function fetchFormattedTitleJSON() {
  return fetch(chrome.runtime.getURL('data/crunchyName_animeFillerUrlName.json'))
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
 * @param {Fuse} fuseAgent - Fuse.js instance for fuzzy searching
 * @returns {string} The URL to the anime filler list
 */
function getFillerListUrl(animeTitle, fuseAgent) {
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

/**
 * Creates a Fuse.js instance for fuzzy searching anime titles
 * @param {Object[]} titleData - Array of anime title objects
 * @returns {Fuse} Configured Fuse.js instance
 */
function createFuseAgent(titleData) {
  return new Fuse(titleData, fuseOptions);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchFormattedTitleJSON,
    getFillerListUrl,
    createFuseAgent,
    fuseOptions
  };
}
