document.getElementById('optionsBtn').addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('src/options/options.html'));
  }
});

// Update Time Display
// Load Settings
chrome.storage.sync.get(['allowedStartTime', 'timeoutAction', 'usageMode'], (data) => {
  // Usage Mode
  const usageMode = data.usageMode || 'dailyLimit'; // Default to dailyLimit
  const modeRadios = document.getElementsByName('usageMode');
  for (const radio of modeRadios) {
    if (radio.value === usageMode) radio.checked = true;
  }
  toggleTimeInput(usageMode === 'timeBlock');

  // Start Time
  if (data.allowedStartTime) {
    document.getElementById('startTime').value = data.allowedStartTime;
  }

  // Timeout Action
  const action = data.timeoutAction || 'block'; // Default to block
  const actionRadios = document.getElementsByName('timeoutAction');
  for (const radio of actionRadios) {
    if (radio.value === action) radio.checked = true;
  }
});

// Toggle Start Time Input based on Mode
const modeRadios = document.getElementsByName('usageMode');
for (const radio of modeRadios) {
  radio.addEventListener('change', (e) => {
    toggleTimeInput(e.target.value === 'timeBlock');
  });
}

function toggleTimeInput(show) {
  const container = document.getElementById('startTimeContainer');
  if (show) {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// Save Settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const startTime = document.getElementById('startTime').value;

  // Get Usage Mode
  let usageMode = 'dailyLimit';
  const modeRadios = document.getElementsByName('usageMode');
  for (const radio of modeRadios) {
    if (radio.checked) usageMode = radio.value;
  }

  // Get Timeout Action
  let timeoutAction = 'block';
  const actionRadios = document.getElementsByName('timeoutAction');
  for (const radio of actionRadios) {
    if (radio.checked) timeoutAction = radio.value;
  }

  chrome.storage.sync.set({
    allowedStartTime: startTime,
    timeoutAction: timeoutAction,
    usageMode: usageMode
  }, () => {
    const status = document.getElementById('saveStatus');
    status.textContent = "Settings Saved!";
    setTimeout(() => status.textContent = "", 2000);

    // Notify background
    chrome.runtime.sendMessage({ action: "SETTINGS_UPDATED" });
  });
});
