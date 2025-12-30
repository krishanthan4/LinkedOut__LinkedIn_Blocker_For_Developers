console.log("LeetCode Gate: Content script loaded");
function checkAlreadySolved() {
  const solvedBadge = document.querySelector('[data-e2e-locator="submission-result-success"]')
    || document.querySelector('svg.text-green-s')
    || (document.body.innerText.includes("Solved") && document.querySelector('.text-green-s'));

  setTimeout(() => {
    const headerText = document.querySelector('#qd-content')?.innerText || "";
    const isSolved = headerText.includes("Solved");

    if (isSolved) {
      const warning = document.createElement('div');
      warning.style = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9); border: 2px solid #ff5252; color: #ff5252;
            padding: 30px; z-index: 999999; text-align: center; border-radius: 10px;
            font-size: 1.5rem; font-weight: bold; pointer-events: none;
         `;
      warning.innerText = "WARNING: You have already solved this problem.\nPlease select an UNSOLVED problem to unlock LinkedIn.";
      document.body.appendChild(warning);

      setTimeout(() => warning.remove(), 5000);
    }
  }, 2000);
}

checkAlreadySolved();


// 2. Observer for Success State (Unlocking)
const observer = new MutationObserver((mutations) => {
  const successElement = document.querySelector('[data-e2e-locator="submission-result-success"]')
    || Array.from(document.querySelectorAll('div')).find(el => el.innerText === 'Success' && el.classList.contains('text-green-s'));

  const acceptedText = document.body.innerText.includes("Runtime") && document.body.innerText.includes("Memory") && document.body.innerText.includes("Accepted");

  if (successElement || acceptedText) {
    console.log("LeetCode Gate: Solution Accepted!");
    chrome.runtime.sendMessage({ action: 'LEETCODE_SOLVED' });

    const notification = document.createElement('div');
    notification.style = `
      position: fixed; top: 10px; right: 10px; background: #0a66c2; color: white;
      padding: 15px; z-index: 99999; border-radius: 8px; font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: sans-serif;
    `;
    notification.innerText = "LinkedIn Unlocked! Great job on solving a new problem.";
    document.body.appendChild(notification);

    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
