// Track active LinkedIn tab and time
let activeLinkedInTabId = null;
let trackingStartTime = null;

// Initialize alarms for midnight reset
chrome.runtime.onInstalled.addListener(() => {
  setupMidnightAlarm();
});

function setupMidnightAlarm() {
  chrome.alarms.create('midnightReset', {
    when: getNextMidnight(),
    periodInMinutes: 24 * 60 // Repeat daily
  });
}

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// Handle midnight reset
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'midnightReset') {
    chrome.storage.local.set({
      dailyUsage: 0,
      usageDate: new Date().toDateString()
    });
  }
});

// Track active tab time
chrome.tabs.onActivated.addListener((activeInfo) => {
  stopTracking();

  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && tab.url.includes('linkedin.com')) {
      startTracking(activeInfo.tabId);
      checkAccess(activeInfo.tabId, tab.url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('linkedin.com')) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id === tabId) {
          startTracking(tabId);
        }
      });
      checkAccess(tabId, tab.url);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeLinkedInTabId) {
    stopTracking();
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
        startTracking(tabs[0].id);
      } else {
        stopTracking();
      }
    });
  }
});

function startTracking(tabId) {
  if (activeLinkedInTabId !== tabId) {
    stopTracking();
    activeLinkedInTabId = tabId;
    trackingStartTime = Date.now();
  }
}

function stopTracking() {
  if (activeLinkedInTabId !== null && trackingStartTime !== null) {
    const timeSpent = Math.floor((Date.now() - trackingStartTime) / 1000);

    chrome.storage.local.get(['dailyUsage', 'usageDate'], (data) => {
      const today = new Date().toDateString();
      let currentUsage = 0;

      if (data.usageDate === today) {
        currentUsage = data.dailyUsage || 0;
      }

      chrome.storage.local.set({
        dailyUsage: currentUsage + timeSpent,
        usageDate: today
      });
    });

    activeLinkedInTabId = null;
    trackingStartTime = null;
  }
}

function checkAccess(tabId, url) {
  if (!url || !url.includes("linkedin.com")) return;

  chrome.storage.sync.get(['usageMode', 'allowedStartTime', 'timeoutAction', 'alwaysFocus'], (data) => {
    // 1. Check Always Focus
    if (data.alwaysFocus) {
      chrome.tabs.sendMessage(tabId, { action: 'ENABLE_FOCUS_MODE' }).catch(() => { });
    }

    // Default to dailyLimit mode if not set
    const usageMode = data.usageMode || 'dailyLimit';
    const timeoutAction = data.timeoutAction || 'block';

    if (usageMode === 'dailyLimit') {
      // Daily Limit Mode
      checkDailyLimit(tabId, timeoutAction);
    } else if (usageMode === 'timeBlock') {
      // Time Block Mode
      if (!data.allowedStartTime) {
        // If no time is set, don't block (allow full access)
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
        if (timeoutAction === 'focus') {
          chrome.tabs.sendMessage(tabId, { action: 'ENABLE_FOCUS_MODE' }).catch(() => { });
        } else {
          chrome.tabs.update(tabId, { url: chrome.runtime.getURL("src/blocked.html") });
        }
      }
    }
  });
}


function checkDailyLimit(tabId, timeoutAction) {
  chrome.storage.local.get(['dailyUsage', 'usageDate'], (data) => {
    const today = new Date().toDateString();
    let usageSeconds = 0;

    if (data.usageDate === today && data.dailyUsage) {
      usageSeconds = data.dailyUsage;
    }

    // Block if usage exceeds 1 hour (3600 seconds)
    if (usageSeconds >= 3600) {
      if (timeoutAction === 'focus') {
        chrome.tabs.sendMessage(tabId, { action: 'ENABLE_FOCUS_MODE' }).catch(() => { });
      } else {
        stopTracking(); // Stop tracking before redirect
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL("src/blocked.html") });
      }
    }
  });
}

// Update declarativeNetRequest rules based on settings
function updateBlockingRules() {
  chrome.storage.sync.get(['usageMode', 'allowedStartTime', 'timeoutAction'], (data) => {
    // Default to dailyLimit mode if not set
    const usageMode = data.usageMode || 'dailyLimit';
    const timeoutAction = data.timeoutAction || 'block';

    if (usageMode === 'dailyLimit') {
      checkDailyLimitForRules(timeoutAction);
    } else if (usageMode === 'timeBlock') {
      checkTimeBlockForRules(data.allowedStartTime, timeoutAction);
    }
  });
}

function checkDailyLimitForRules(timeoutAction) {
  chrome.storage.local.get(['dailyUsage', 'usageDate'], (data) => {
    const today = new Date().toDateString();
    let usageSeconds = 0;

    if (data.usageDate === today && data.dailyUsage) {
      usageSeconds = data.dailyUsage;
    }

    const shouldBlock = usageSeconds >= 3600 && timeoutAction === 'block';
    updateRules(shouldBlock);
  });
}

function checkTimeBlockForRules(allowedStartTime, timeoutAction) {
  if (!allowedStartTime || timeoutAction !== 'block') {
    updateRules(false);
    return;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const [startHour, startMinute] = allowedStartTime.split(':').map(Number);
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + 60;

  const isWithinWindow = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
  updateRules(!isWithinWindow);
}

function updateRules(shouldBlock) {
  const ruleId = 1;

  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const ruleIds = existingRules.map(rule => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: shouldBlock ? [{
        id: ruleId,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { url: chrome.runtime.getURL('src/blocked.html') }
        },
        condition: {
          urlFilter: '*://www.linkedin.com/*',
          resourceTypes: ['main_frame']
        }
      }] : []
    });
  });
}

// Update rules periodically (every minute)
setInterval(updateBlockingRules, 60000);

// Update rules on startup
updateBlockingRules();

// Update settings listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SETTINGS_UPDATED') {
    updateBlockingRules();
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
      const apiUrl = data.grammarApiUrl || 'https://api.languagetool.org/v2/check';
      const apiKey = data.grammarApiKey ? data.grammarApiKey.trim() : null;

      try {
        const bodyParams = new URLSearchParams();
        bodyParams.append('text', text);
        bodyParams.append('language', 'en-US');

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
