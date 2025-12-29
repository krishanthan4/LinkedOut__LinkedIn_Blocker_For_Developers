document.addEventListener('DOMContentLoaded', () => {
  const startTimeInput = document.getElementById('startTime');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMessage');

  // Load saved settings
  chrome.storage.sync.get(['allowedStartTime', 'aiApiKey'], (data) => {
    if (data.allowedStartTime) {
      startTimeInput.value = data.allowedStartTime;
    }
    if (data.aiApiKey) {
      apiKeyInput.value = data.aiApiKey;
    }
  });

  saveBtn.addEventListener('click', () => {
    const startTime = startTimeInput.value;
    const apiKey = apiKeyInput.value;

    chrome.storage.sync.set(
      {
        allowedStartTime: startTime,
        aiApiKey: apiKey
      },
      () => {
        statusMsg.textContent = 'Settings saved!';
        statusMsg.classList.add('success');
        setTimeout(() => {
          statusMsg.textContent = '';
          statusMsg.classList.remove('success');
        }, 2000);
      }
    );
  });
});
