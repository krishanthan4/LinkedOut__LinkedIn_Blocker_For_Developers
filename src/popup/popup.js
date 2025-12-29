document.getElementById('optionsBtn').addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('src/options/options.html'));
  }
});

// Update Time Display
// Load Settings
chrome.storage.sync.get(['allowedStartTime', 'timeoutAction'], (data) => {
  // Update Display
  const display = document.getElementById('timeWindowDisplay');
  if (data.allowedStartTime) {
    const [hours, minutes] = data.allowedStartTime.split(':');
    const h = parseInt(hours, 10);
    const m = minutes;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    display.textContent = `Active window starts at ${h12}:${m} ${ampm}`;
  } else {
    display.textContent = "No schedule set";
  }

  // Populate Inputs
  if (data.allowedStartTime) {
    document.getElementById('startTime').value = data.allowedStartTime;
  }
  
  const radios = document.getElementsByName('timeoutAction');
  const action = data.timeoutAction || 'block';
  for (const radio of radios) {
    if (radio.value === action) radio.checked = true;
  }
});

// Save Settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const startTime = document.getElementById('startTime').value;
  let timeoutAction = 'block';
  const radios = document.getElementsByName('timeoutAction');
  for (const radio of radios) {
    if (radio.checked) timeoutAction = radio.value;
  }

  chrome.storage.sync.set({
    allowedStartTime: startTime,
    timeoutAction: timeoutAction
  }, () => {
    const status = document.getElementById('saveStatus');
    status.textContent = "Settings Saved!";
    setTimeout(() => status.textContent = "", 2000);
    
    // Update display immediately
    chrome.storage.sync.get(['allowedStartTime'], (data) => {
       // logic duplicated for simplicity or reload
       const display = document.getElementById('timeWindowDisplay');
       if (data.allowedStartTime) {
        const [hours, minutes] = data.allowedStartTime.split(':');
        const h = parseInt(hours, 10);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        display.textContent = `Active window starts at ${h12}:${m} ${ampm}`;
       }
    });
    
    // Notify background
    chrome.runtime.sendMessage({ action: "SETTINGS_UPDATED" });
  });
});
