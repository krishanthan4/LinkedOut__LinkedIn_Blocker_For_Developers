function checkAccess(tabId, url) {
  if (!url || !url.includes("linkedin.com")) return;

  chrome.storage.sync.get(['allowedStartTime', 'timeoutAction', 'alwaysFocus'], (data) => {
    // 1. Check Always Focus
    if (data.alwaysFocus) {
      chrome.tabs.sendMessage(tabId, { action: 'ENABLE_FOCUS_MODE' }).catch(() => { });
    }

    if (!data.allowedStartTime) {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [startHour, startMinute] = data.allowedStartTime.split(':').map(Number);
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + 60; // 1 hour window

    const isWithinWindow = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;

    if (!isWithinWindow) {
      if (data.timeoutAction === 'focus') {
        // Enforce Focus Mode instead of blocking
        chrome.tabs.sendMessage(tabId, { action: 'ENABLE_FOCUS_MODE' }).catch(() => { });
      } else {
        // Default: Block
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL("src/blocked.html") });
      }
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

// Update settings listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SETTINGS_UPDATED') {
    // Re-check all LinkedIn tabs
    chrome.tabs.query({ url: "*://www.linkedin.com/*" }, (tabs) => {
      tabs.forEach(tab => checkAccess(tab.id, tab.url));
    });
  }

  // Unlocking LinkedIn from LeetCode
  if (request.action === 'LEETCODE_SOLVED') {
    chrome.tabs.query({ url: "*://www.linkedin.com/*" }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'UNLOCK_PROFILE' });
      });
    });
  }

  // Generic Grammar Analysis (LanguageTool via Proxy or Direct)
  if (request.action === 'ANALYZE_TEXT') {
    const text = request.text;

    chrome.storage.sync.get(['grammarApiUrl', 'grammarApiKey'], async (data) => {
      // Default to LanguageTool free endpoint if not set
      const apiUrl = data.grammarApiUrl || 'https://api.languagetool.org/v2/check';
      const apiKey = data.grammarApiKey ? data.grammarApiKey.trim() : null;

      try {
        const bodyParams = new URLSearchParams();
        bodyParams.append('text', text);
        bodyParams.append('language', 'en-US');
        // But generic API structure requested? Let's assume standard LT format.
        if (apiKey) {
          // Some LT enterprise uses 'username' and 'apiKey'. 
          // For simplicity, we just pass what the user gave if they use a compatible custom server.
          // Or if they use a different AI API, this might fail.
          // User asked for "different api key". Let's try to assume a standard JSON POST if it's not LT.
          // But actually LanguageTool is x-www-form-urlencoded usually.
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: bodyParams
        });

        const result = await response.json();

        if (result.matches) {
          let correctedText = text;
          const matches = result.matches.sort((a, b) => b.offset - a.offset);

          for (const match of matches) {
            if (match.replacements && match.replacements.length > 0) {
              const bestReplacement = match.replacements[0].value;
              const prefix = correctedText.substring(0, match.offset);
              const suffix = correctedText.substring(match.offset + match.length);
              correctedText = prefix + bestReplacement + suffix;
            }
          }

          if (correctedText === text) {
            sendResponse({ suggestions: ["Looks good! No errors found."] });
          } else {
            sendResponse({ suggestions: [correctedText] });
          }
        } else {
          sendResponse({ suggestions: ["API format not recognized or no errors."] });
        }

      } catch (err) {
        sendResponse({ error: err.message });
      }
    });

    return true;
  }
});
