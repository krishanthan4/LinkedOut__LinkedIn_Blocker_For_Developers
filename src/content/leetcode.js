// src/content/leetcode.js

// This script runs on https://leetcode.com/problems/*

console.log("LeetCode Gate: Content script loaded");

// 1. Check if already solved on load
function checkAlreadySolved() {
  // LeetCode UI: Look for green "Solved" badge or text
  const solvedBadge = document.querySelector('[data-e2e-locator="submission-result-success"]') // Sometimes appears directly?
                      || document.querySelector('svg.text-green-s') // Checkmark icon
                      || (document.body.innerText.includes("Solved") && document.querySelector('.text-green-s')); 
                      
  // The 'Status' dropdown or label usually says 'Solved'
  // Or check specific element class 'text-label-1 dark:text-dark-label-1' containing 'Solved'?
  // It's brittle. Let's look for the checkmark next to the title.
  
  // Actually, wait a few seconds for hydration
  setTimeout(() => {
     // A common indicator of solved problem is the "Solved" text in the description header
     const headerText = document.querySelector('#qd-content')?.innerText || "";
     const isSolved = headerText.includes("Solved");
     
     if (isSolved) {
         // Warn user
         const warning = document.createElement('div');
         warning.style = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9); border: 2px solid #ff5252; color: #ff5252;
            padding: 30px; z-index: 999999; text-align: center; border-radius: 10px;
            font-size: 1.5rem; font-weight: bold; pointer-events: none;
         `;
         warning.innerText = "WARNING: You have already solved this problem.\nPlease select an UNSOLVED problem to unlock LinkedIn.";
         document.body.appendChild(warning);
         
         // Remove after 5 seconds
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
