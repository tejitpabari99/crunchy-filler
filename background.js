async function createOffscreen() {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Parse HTML from anime filler list website'
    });
  }
  
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
    } else {
      sendResponse({result: 'error', message: 'Unknown action type'});
    }
    return true;  // Indicates we will send a response asynchronously
  });