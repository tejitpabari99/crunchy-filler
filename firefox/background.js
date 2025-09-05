// Firefox-compatible background script (Manifest V2)

// Badge management functions
function updateBadge(tabId, count) {
  const badgeText = count >= 0 ? count.toString() : '';
  browser.browserAction.setBadgeText({
    text: badgeText,
    tabId: tabId
  });
  
  if (count > 0) {
    browser.browserAction.setBadgeBackgroundColor({
      color: '#FF6B35', // Orange color to indicate filler content
      tabId: tabId
    });
  }
}

function clearBadge(tabId) {
  browser.browserAction.setBadgeText({
    text: '',
    tabId: tabId
  });
}

// Clear badge when tab is updated (navigating to different page)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.includes('crunchyroll.com/series/')) {
    clearBadge(tabId);
  }
});

// Parse HTML content directly in background script (no offscreen document needed)
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

function parseHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const fillerDiv = doc.querySelector(".filler");
  const mixedDiv = doc.querySelector(".mixed_canon\\/filler");

  let regularFillerEpisodes = [];
  let mixedFillerEpisodes = [];

  if (fillerDiv) {
    const fillerEpisodesText = fillerDiv.querySelector(".Episodes").textContent;
    regularFillerEpisodes = parseEpisodeNumbers(fillerEpisodesText);
  }

  if (mixedDiv) {
    const mixedEpisodesText = mixedDiv.querySelector(".Episodes").textContent;
    mixedFillerEpisodes = parseEpisodeNumbers(mixedEpisodesText);
  }

  // Combine all filler episodes for backward compatibility
  const allFillerEpisodes = [...new Set([...regularFillerEpisodes, ...mixedFillerEpisodes])].sort((a, b) => a - b);

  return { 
    fillerEpisodes: allFillerEpisodes,
    regularFillerEpisodes: regularFillerEpisodes,
    mixedFillerEpisodes: mixedFillerEpisodes
  };
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFillerEpisodes") {
    fetch(request.url)
      .then((response) => response.text())
      .then((html) => {
        const result = parseHTML(html);
        sendResponse(result);
      })
      .catch((error) => {
        console.error("Error fetching filler episodes:", error);
        sendResponse({ error: "Failed to fetch filler episodes" });
      });
    return true;  // Indicates we will send a response asynchronously
  } else if (request.action === "updateBadge") {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      const fillerCount = request.count || 0;
      updateBadge(tabId, fillerCount);
    }
    sendResponse({success: true});
  } else {
    sendResponse({result: 'error', message: 'Unknown action type'});
  }
  return true;  // Indicates we will send a response asynchronously
});
