// --- Global State ---
let isLocked = true;
let currentUrl = location.href;

// --- Focus Mode Logic ---
function toggleFocusMode(enable) {
  const existingLink = document.getElementById('linkedin-focus-mode-style');
  if (enable) {
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = 'linkedin-focus-mode-style';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('src/content/focus.css');
      document.head.appendChild(link);
    }
  } else {
    if (existingLink) {
      existingLink.remove();
    }
  }
}

// Check Focus Mode on Load
chrome.storage.sync.get(['alwaysFocus'], (data) => {
  if (data.alwaysFocus) {
    toggleFocusMode(true);
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'ENABLE_FOCUS_MODE') {
    toggleFocusMode(true);
  } else if (request.action === 'DISABLE_FOCUS_MODE') {
    toggleFocusMode(false);
  }
});


// --- Utilities ---
function isProfilePage(url) {
  return url.includes("/in/") && !url.includes("/edit/");
}

function isOwnProfile() {
  const analyticsSection = document.querySelector('.pvs-header__title');
  const buttons = Array.from(document.querySelectorAll('button'));
  const hasMessageButton = buttons.some(b => b.innerText && b.innerText.trim() === 'Message');
  return !hasMessageButton;
}

// --- LeetCode Logic (Real) ---
function createOverlay() {
  if (document.getElementById('leetcode-gate-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'leetcode-gate-overlay';

  overlay.innerHTML = `
    <div id="leetcode-gate-modal">
      <h2>🔒 Profile Locked</h2>
      <p>Solve a LeetCode problem to view this profile.</p>
      
      <div id="leetcode-actions" style="justify-content: center;">
        <button id="solve-btn" class="leetcode-btn" style="background: #e8a719; color: black;">
          Open Easy Problem (LeetCode)
        </button>
      </div>
      <p style="text-align:center; font-size: 0.9em; margin-top: 10px; color: #888;">
        (Complete the problem. This page will unlock automatically upon success.)
      </p>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  document.getElementById('solve-btn').addEventListener('click', () => {
    const problemUrl = "https://leetcode.com/problemset/";

    window.open(problemUrl, "LeetCodeChallenge", "width=1000,height=800");
  });
}

function unlockProfile() {
  const overlay = document.getElementById('leetcode-gate-overlay');
  if (overlay) {
    overlay.remove();
  }
  document.body.style.overflow = '';
  isLocked = false;
  sessionStorage.setItem('unlocked_' + window.location.pathname, 'true');
}

// Listen for unlock message from background
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'UNLOCK_PROFILE') {
    unlockProfile();
  }
});

function checkAndLock() {
  if (sessionStorage.getItem('unlocked_' + window.location.pathname)) {
    return;
  }

  setTimeout(() => {
    if (isProfilePage(window.location.href)) {
      if (!isOwnProfile()) {
        createOverlay();
      }
    }
  }, 1500);
}

// --- Navigation Observer ---
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    checkAndLock();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

checkAndLock();


// --- Grammar Logic (Real) ---

document.addEventListener('focusin', (e) => {
  const target = e.target;
  if (target.isContentEditable || (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
    addAIButton(target);
  }
});

function addAIButton(inputField) {
  const existing = document.querySelector('.ai-helper-btn');
  if (existing) existing.remove();

  const rect = inputField.getBoundingClientRect();
  const btn = document.createElement('button');
  btn.className = 'ai-helper-btn';
  btn.innerText = '✨';

  const top = rect.top + window.scrollY - 20;
  const left = rect.right + window.scrollX - 40;

  btn.style.top = top + 'px';
  btn.style.left = left + 'px';
  btn.style.position = 'absolute';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showAISuggestions(inputField, btn);
  });

  document.body.appendChild(btn);
}

function showAISuggestions(inputField, btnBtn) {
  const text = inputField.innerText || inputField.value;
  if (!text || text.trim().length < 3) return;

  const originalEmoji = btnBtn.innerText;
  btnBtn.innerText = '...';

  chrome.runtime.sendMessage({ action: 'ANALYZE_TEXT', text: text }, (response) => {
    btnBtn.innerText = originalEmoji;

    if (chrome.runtime.lastError) {
      alert("Error: " + chrome.runtime.lastError.message);
      return;
    }

    if (response.error) {
      alert("Error: " + response.error);
      return;
    }

    if (response.suggestions) {
      createMsgPopup(inputField, btnBtn, response.suggestions);
    }
  });
}

function createMsgPopup(inputField, btnBtn, suggestions) {
  const old = document.querySelector('.ai-helper-popup');
  if (old) old.remove();

  const popup = document.createElement('div');
  popup.className = 'ai-helper-popup';

  const btnRect = btnBtn.getBoundingClientRect();
  popup.style.top = (window.scrollY + btnRect.bottom + 5) + 'px';
  popup.style.left = (window.scrollX + btnRect.left) + 'px';

  suggestions.forEach(sugg => {
    const div = document.createElement('div');
    div.className = 'ai-suggestion';
    div.innerText = sugg;
    div.addEventListener('click', () => {
      if (inputField.tagName === 'INPUT' || inputField.tagName === 'TEXTAREA') {
        inputField.value = sugg;
      } else {
        inputField.innerText = sugg;
      }
      popup.remove();
    });
    popup.appendChild(div);
  });

  document.addEventListener('click', function close(e) {
    if (!popup.contains(e.target) && e.target !== btnBtn) {
      popup.remove();
      document.removeEventListener('click', close);
    }
  });

  document.body.appendChild(popup);
}
