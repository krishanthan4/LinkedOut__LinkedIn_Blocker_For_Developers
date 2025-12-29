// src/background/service-worker.js

function checkAccess(tabId, url) {
  if (!url || !url.includes("linkedin.com")) return;

  chrome.storage.sync.get(['allowedStartTime'], (data) => {
    if (!data.allowedStartTime) {
      // If no time set, default to BLOCK or ALLOW? 
      // The prompt says "option to select that time... after that block".
      // Let's default to blocking if not set, or maybe allow to be nice?
      // Let's just return and do nothing (allow) if not configured, prompting user to configure.
      return; 
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const [startHour, startMinute] = data.allowedStartTime.split(':').map(Number);
    
    // Calculate minutes from midnight for easier comparison
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + 60; // 1 hour window

    const isWithinWindow = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;

    if (!isWithinWindow) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL("src/blocked.html") });
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkAccess(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkAccess(activeInfo.tabId, tab.url);
    }
  });
});
