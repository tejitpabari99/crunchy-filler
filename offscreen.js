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

        let fillerEpisodes = [];

        if (fillerDiv) {
          const fillerEpisodesText =
            fillerDiv.querySelector(".Episodes").textContent;
          fillerEpisodes = fillerEpisodes.concat(
            parseEpisodeNumbers(fillerEpisodesText)
          );
        }

        if (mixedDiv) {
          const mixedEpisodesText =
            mixedDiv.querySelector(".Episodes").textContent;
          fillerEpisodes = fillerEpisodes.concat(
            parseEpisodeNumbers(mixedEpisodesText)
          );
        }

        fillerEpisodes = [...new Set(fillerEpisodes)].sort((a, b) => a - b);

        sendResponse({ fillerEpisodes: fillerEpisodes });
      })
      .catch((error) => {
        console.error("Error fetching filler episodes:", error);
        sendResponse({ error: "Failed to fetch filler episodes" });
      });
    return true; // Indicates we will send a response asynchronously
  }
});
