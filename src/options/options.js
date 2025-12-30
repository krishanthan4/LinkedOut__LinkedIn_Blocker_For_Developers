document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const startTimeInput = document.getElementById('startTime');
  const timeoutActionRadios = document.getElementsByName('timeoutAction');
  const alwaysFocusCheck = document.getElementById('alwaysFocus');
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMessage');

  // New Elements
  const settingsFieldset = document.getElementById('settingsFieldset');
  const lockedMessage = document.getElementById('lockedMessage');
  const unlockBtn = document.getElementById('unlockBtn');

  // Load Settings
  chrome.storage.sync.get([
    'allowedStartTime',
    'timeoutAction',
    'alwaysFocus',
    'grammarApiUrl',
    'grammarApiKey'
  ], (data) => {
    if (data.allowedStartTime) {
      startTimeInput.value = data.allowedStartTime;
      // Lock settings if time is set
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
  });

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
    const startTime = startTimeInput.value;

    let timeoutAction = 'block';
    for (const radio of timeoutActionRadios) {
      if (radio.checked) timeoutAction = radio.value;
    }

    const alwaysFocus = alwaysFocusCheck.checked;
    const grammarApiUrl = apiUrlInput.value.trim();
    const grammarApiKey = apiKeyInput.value.trim();

    chrome.storage.sync.set({
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

      // If a time was set, lock the settings
      if (startTime) {
        setTimeout(() => {
          lockSettings();
          statusMsg.textContent = "Settings Locked. Solve a problem to edit.";
        }, 1500);
      }
    });
  });
});
