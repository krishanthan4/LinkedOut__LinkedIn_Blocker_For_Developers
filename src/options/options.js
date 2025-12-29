document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const startTimeInput = document.getElementById('startTime');
  const timeoutActionRadios = document.getElementsByName('timeoutAction');
  const alwaysFocusCheck = document.getElementById('alwaysFocus');
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMessage');

  // Load Settings
  chrome.storage.sync.get([
    'allowedStartTime',
    'timeoutAction',
    'alwaysFocus',
    'grammarApiUrl',
    'grammarApiKey'
  ], (data) => {
    if (data.allowedStartTime) startTimeInput.value = data.allowedStartTime;
    
    if (data.timeoutAction) {
      for (const radio of timeoutActionRadios) {
        if (radio.value === data.timeoutAction) radio.checked = true;
      }
    }

    if (data.alwaysFocus) alwaysFocusCheck.checked = data.alwaysFocus;
    if (data.grammarApiUrl) apiUrlInput.value = data.grammarApiUrl;
    if (data.grammarApiKey) apiKeyInput.value = data.grammarApiKey;
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
    });
  });
});
