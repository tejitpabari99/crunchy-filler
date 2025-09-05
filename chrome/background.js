async function createOffscreen() {
    try {
      if (await chrome.offscreen.hasDocument()) return;
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DOM_PARSER'],
        justification: 'Parse HTML from anime filler list website'
      });
    } catch (error) {
      // If document already exists or other error, log it but don't throw
      console.warn('Offscreen document creation warning:', error.message);
    }
  }

  // Badge management functions
  function updateBadge(tabId, count) {
    const badgeText = count >= 0 ? count.toString() : '';
    chrome.action.setBadgeText({
      text: badgeText,
      tabId: tabId
    });
    
    if (count > 0) {
      chrome.action.setBadgeBackgroundColor({
        color: '#FF6B35', // Orange color to indicate filler content
        tabId: tabId
      });
    }
  }

  function clearBadge(tabId) {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
  }

  // Clear badge when tab is updated (navigating to different page)
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url && !tab.url.includes('crunchyroll.com/series/')) {
      clearBadge(tabId);
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getFillerEpisodes") {
      createOffscreen().then(() => {
        chrome.runtime.sendMessage({
          target: 'offscreen',
          action: 'parseHTML',
          url: request.url
        }, (response) => {
          sendResponse(response);
        });
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
