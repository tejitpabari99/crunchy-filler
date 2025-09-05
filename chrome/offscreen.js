function parseEpisodeNumbers(episodeString) {
  const episodes = new Set();
  const ranges = episodeString.split(",").map((range) => range.trim());

  ranges.forEach((range) => {
    if (range.includes("-")) {
      const [start, end] = range.split("-").map((num) => parseInt(num, 10));
      for (let i = start; i <= end; i++) {
        episodes.add(i);
      }
    } else {
      episodes.add(parseInt(range, 10));
    }
  });

  return Array.from(episodes).sort((a, b) => a - b);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.target === "offscreen" && request.action === "parseHTML") {
    fetch(request.url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const fillerDiv = doc.querySelector(".filler");
        const mixedDiv = doc.querySelector(".mixed_canon\\/filler");

        let regularFillerEpisodes = [];
        let mixedFillerEpisodes = [];

        if (fillerDiv) {
          const fillerEpisodesText =
            fillerDiv.querySelector(".Episodes").textContent;
          regularFillerEpisodes = parseEpisodeNumbers(fillerEpisodesText);
        }

        if (mixedDiv) {
          const mixedEpisodesText =
            mixedDiv.querySelector(".Episodes").textContent;
          mixedFillerEpisodes = parseEpisodeNumbers(mixedEpisodesText);
        }

        // Combine all filler episodes for backward compatibility
        const allFillerEpisodes = [...new Set([...regularFillerEpisodes, ...mixedFillerEpisodes])].sort((a, b) => a - b);

        sendResponse({ 
          fillerEpisodes: allFillerEpisodes,
          regularFillerEpisodes: regularFillerEpisodes,
          mixedFillerEpisodes: mixedFillerEpisodes
        });
      })
      .catch((error) => {
        console.error("Error fetching filler episodes:", error);
        sendResponse({ error: "Failed to fetch filler episodes" });
      });
    return true; // Indicates we will send a response asynchronously
  }
});
