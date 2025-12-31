document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const startTimeInput = document.getElementById('startTime');
  const timeoutActionRadios = document.getElementsByName('timeoutAction');
  const usageModeRadios = document.getElementsByName('usageMode');
  const alwaysFocusCheck = document.getElementById('alwaysFocus');
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMessage');
  const timeBlockSettings = document.getElementById('timeBlockSettings');
  const dailyLimitInfo = document.getElementById('dailyLimitInfo');
  const usageDisplay = document.getElementById('usageDisplay');

  // New Elements
  const settingsFieldset = document.getElementById('settingsFieldset');
  const lockedMessage = document.getElementById('lockedMessage');
  const unlockBtn = document.getElementById('unlockBtn');

  // Update UI based on selected mode
  function updateModeUI() {
    const selectedMode = document.querySelector('input[name="usageMode"]:checked').value;

    if (selectedMode === 'timeBlock') {
      timeBlockSettings.style.display = 'block';
      dailyLimitInfo.style.display = 'none';
    } else {
      timeBlockSettings.style.display = 'none';
      dailyLimitInfo.style.display = 'block';
      updateUsageDisplay();
    }
  }

  // Update daily usage display
  function updateUsageDisplay() {
    chrome.storage.local.get(['dailyUsage', 'usageDate'], (data) => {
      const today = new Date().toDateString();
      let usageSeconds = 0;

      if (data.usageDate === today && data.dailyUsage) {
        usageSeconds = data.dailyUsage;
      }

      const usageMinutes = Math.floor(usageSeconds / 60);
      const remainingMinutes = Math.max(0, 60 - usageMinutes);

      usageDisplay.textContent = `${usageMinutes} min / 60 min (${remainingMinutes} min remaining)`;

      if (usageMinutes >= 60) {
        usageDisplay.style.color = '#ff5252';
      } else if (usageMinutes >= 45) {
        usageDisplay.style.color = '#ffa116';
      } else {
        usageDisplay.style.color = '#3fb950';
      }
    });
  }

  // Listen for mode changes
  usageModeRadios.forEach(radio => {
    radio.addEventListener('change', updateModeUI);
  });

  // Load Settings
  chrome.storage.sync.get([
    'usageMode',
    'allowedStartTime',
    'timeoutAction',
    'alwaysFocus',
    'grammarApiUrl',
    'grammarApiKey'
  ], (data) => {
    // Set usage mode (default to timeBlock for backward compatibility)
    const usageMode = data.usageMode || 'timeBlock';
    for (const radio of usageModeRadios) {
      if (radio.value === usageMode) radio.checked = true;
    }

    if (data.allowedStartTime) {
      startTimeInput.value = data.allowedStartTime;
    }

    // Lock settings if time is set (for timeBlock mode)
    if (usageMode === 'timeBlock' && data.allowedStartTime) {
      lockSettings();
    }

    if (data.timeoutAction) {
      for (const radio of timeoutActionRadios) {
        if (radio.value === data.timeoutAction) radio.checked = true;
      }
    }

    if (data.alwaysFocus) alwaysFocusCheck.checked = data.alwaysFocus;
    if (data.grammarApiUrl) apiUrlInput.value = data.grammarApiUrl;
    if (data.grammarApiKey) apiKeyInput.value = data.grammarApiKey;

    // Update UI based on loaded mode
    updateModeUI();
  });

  // Refresh usage display every 10 seconds
  setInterval(() => {
    const selectedMode = document.querySelector('input[name="usageMode"]:checked').value;
    if (selectedMode === 'dailyLimit') {
      updateUsageDisplay();
    }
  }, 10000);

  function lockSettings() {
    settingsFieldset.disabled = true;
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.5';
    saveBtn.style.cursor = 'not-allowed';
    lockedMessage.style.display = 'block';
  }

  function unlockSettings() {
    settingsFieldset.disabled = false;
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    saveBtn.style.cursor = 'pointer';
    lockedMessage.style.display = 'none';
  }

  // Unlock Button Handler
  unlockBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://leetcode.com/problemset/all/' });
  });

  // Listen for LeetCode Solved Message (from background or content script forwarding)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'LEETCODE_SOLVED') {
      unlockSettings();
      statusMsg.textContent = "Great job! Settings Unlocked.";
      statusMsg.style.color = "#3fb950";
    }
  });

  // Save Settings
  saveBtn.addEventListener('click', () => {
    const selectedMode = document.querySelector('input[name="usageMode"]:checked').value;
    const startTime = startTimeInput.value;

    let timeoutAction = 'block';
    for (const radio of timeoutActionRadios) {
      if (radio.checked) timeoutAction = radio.value;
    }

    const alwaysFocus = alwaysFocusCheck.checked;
    const grammarApiUrl = apiUrlInput.value.trim();
    const grammarApiKey = apiKeyInput.value.trim();

    chrome.storage.sync.set({
      usageMode: selectedMode,
      allowedStartTime: startTime,
      timeoutAction: timeoutAction,
      alwaysFocus: alwaysFocus,
      grammarApiUrl: grammarApiUrl,
      grammarApiKey: grammarApiKey
    }, () => {
      statusMsg.textContent = "Settings Saved Successfully!";
      setTimeout(() => statusMsg.textContent = "", 2000);

      // Notify background to update state immediately
      chrome.runtime.sendMessage({ action: "SETTINGS_UPDATED" });

      // If timeBlock mode with a time was set, lock the settings
      if (selectedMode === 'timeBlock' && startTime) {
        setTimeout(() => {
          lockSettings();
          statusMsg.textContent = "Settings Locked. Solve a problem to edit.";
        }, 1500);
      }
    });
  });
});
