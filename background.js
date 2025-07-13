function handleRedirect(url, tabId) {
  if (!url) {
    return;
  }
  
  chrome.storage.sync.get('redirects', ({ redirects }) => {
    if (redirects && redirects.length > 0) {
      for (const redirect of redirects) {
        if (
          (url === redirect.from || url.startsWith(redirect.from + "/")) &&
          !url.startsWith(redirect.to)
        ) {
          chrome.tabs.update(tabId, { url: redirect.to });
          break;
        }
      }
    }
  });
}

// Catches URL changes in Single Page Applications (e.g., navigating on youtube.com)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // We are only interested in top-level frame navigation
  if (details.frameId === 0) {
    handleRedirect(details.url, details.tabId);
  }
});


// Catches traditional page loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // onUpdated fires multiple times, we're interested when the URL changes.
    if (changeInfo.url) {
        handleRedirect(changeInfo.url, tabId);
    }
}); 

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.storage.sync.get('redirects', ({ redirects }) => {
        const defaultRedirects = [
            { 
                from: 'https://www.instagram.com/', 
                to: 'https://www.instagram.com/direct' 
            },
        ];
  
        if (!redirects || redirects.length === 0) {
          chrome.storage.sync.set({ redirects: defaultRedirects });
        }
      });
    }
  }); 