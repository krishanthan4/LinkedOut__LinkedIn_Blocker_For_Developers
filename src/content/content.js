// src/content/content.js

// --- Global State ---
let isLocked = true;
let currentUrl = location.href;
const PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    desc: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nExample: nums = [2,7,11,15], target = 9 -> Output: [0,1]",
    test: (code) => {
      // Mock validation: check if code contains "return" and logic seems plausible or just pass for demo
      // For a real extension, we might eval() in a sandbox or use a more robust parser.
      // Here, check if they return an array or mentioning indices.
      return code.includes("return") && (code.includes("[") || code.includes("nums"));
    }
  },
  {
    id: 9,
    title: "Palindrome Number",
    desc: "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.\n\nExample: x = 121 -> true",
    test: (code) => {
      return code.includes("return") && (code.includes("toString") || code.includes("reverse") || code.includes("x"));
    }
  },
  {
    id: 217,
    title: "Contains Duplicate",
    desc: "Given an integer array `nums`, return `true` if any value appears at least twice in the array.\n\nExample: nums = [1,2,3,1] -> true",
    test: (code) => {
      return code.includes("return") && (code.includes("Set") || code.includes("map") || code.includes("sort"));
    }
  }
];

// --- Utilities ---
function isProfilePage(url) {
  // LinkedIn profile URLs: https://www.linkedin.com/in/username/
  return url.includes("/in/") && !url.includes("/edit/");
}

function isOwnProfile() {
  // Heuristics to check if it's my own profile
  // 1. Check for "Add profile section" or "Edit public profile" specific buttons
  // This is DOM dependent and might break.
  // Less intrusive: "Contact info" link often has a different structure for self.
  // Best bet: Look for the specific "Verification" or "Analytics" dashboard that shows up on your own profile.
  // Or "Me" icon in nav bar matches the current slug? Hard.
  // Let's look for "Suggested for you" or "Analytics" sections which are private.
  const analyticsSection = document.querySelector('.pvs-header__title'); 
  // 'Analytics' often appears.
  
  // Another check: The "Message" button is ABSENT on your own profile.
  // The "More" button is present.
  const buttons = Array.from(document.querySelectorAll('button'));
  const hasMessageButton = buttons.some(b => b.innerText && b.innerText.trim() === 'Message');
  
  return !hasMessageButton; // If no Message button, likely it's me (or I blocked them/connection pending, but roughly works)
}

function getRandomProblem() {
  return PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
}

// --- LeetCode Logic ---
function createOverlay() {
  if (document.getElementById('leetcode-gate-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'leetcode-gate-overlay';
  
  const problem = getRandomProblem();

  overlay.innerHTML = `
    <div id="leetcode-gate-modal">
      <h2>🔒 Profile Locked</h2>
      <p>Solve this easy LeetCode problem to view this profile.</p>
      
      <div id="problem-title"><strong>${problem.title}</strong></div>
      <div id="problem-description">${problem.desc}</div>
      
      <textarea id="code-input" placeholder="// Write your solution function here..."></textarea>
      <div id="error-msg">Incorrect solution or syntax error. Try again!</div>
      
      <div id="leetcode-actions">
        <button id="submit-btn" class="leetcode-btn">Submit Solution</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden'; // Stop scrolling

  document.getElementById('submit-btn').addEventListener('click', () => {
    const code = document.getElementById('code-input').value;
    const isValid = problem.test(code);

    if (isValid) {
      // Unlock
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
      isLocked = false;
      sessionStorage.setItem('unlocked_' + window.location.pathname, 'true'); // Keep unlocked for this session/URL
    } else {
      const errorMsg = document.getElementById('error-msg');
      errorMsg.style.display = 'block';
    }
  });
}

function checkAndLock() {
  // Check if previously unlocked in this session
  if (sessionStorage.getItem('unlocked_' + window.location.pathname)) {
    return;
  }

  // Delay slightly to let DOM load for "Own Profile" check
  setTimeout(() => {
    if (isProfilePage(window.location.href)) {
      if (!isOwnProfile()) {
        createOverlay();
      }
    }
  }, 1500);
}

// --- Navigation Observer ---
// LinkedIn is an SPA.
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    checkAndLock();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial check
checkAndLock();


// --- AI Grammar Logic ---

// Listen for focus on contenteditable areas (comments/posts)
document.addEventListener('focusin', (e) => {
  const target = e.target;
  if (target.isContentEditable || (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
    addAIButton(target);
  }
});

function addAIButton(inputField) {
  // Remove existing buttons
  const existing = document.querySelector('.ai-helper-btn');
  if (existing) existing.remove();

  const rect = inputField.getBoundingClientRect();
  const btn = document.createElement('button');
  btn.className = 'ai-helper-btn';
  btn.innerHTML = '✨'; // Sparkles icon
  
  // Position near the input script
  // Note: fixed position handling for scrolling?
  btn.style.top = (rect.top + window.scrollY - 15) + 'px';
  btn.style.left = (rect.right + window.scrollX - 40) + 'px'; // Top right corner
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showAISuggestions(inputField, btn);
  });

  document.body.appendChild(btn);
  
  // Cleanup on blur? Maybe not, user might want to click it.
  // Typically we remove it if they click away.
}

async function showAISuggestions(inputField, btnBtn) {
  const text = inputField.innerText || inputField.value;
  if (!text) return;

  // Placeholder for calling background -> API
  // For now, simple mock corrections
  const suggestions = [
    "Fixed grammar: " + text.replace(/i /g, "I "), // Simple capitalization
    "Professional: I would verify the " + (text.split(' ')[0] || "details"),
    "Friendly: Thanks for sharing! " + text
  ];

  const popup = document.createElement('div');
  popup.className = 'ai-helper-popup';
  popup.style.top = (parseInt(btnBtn.style.top) + 35) + 'px';
  popup.style.left = btnBtn.style.left;

  suggestions.forEach(sugg => {
    const div = document.createElement('div');
    div.className = 'ai-suggestion';
    div.innerText = sugg;
    div.addEventListener('click', () => {
      // Replace text
      if (inputField.tagName === 'INPUT' || inputField.tagName === 'TEXTAREA') {
        inputField.value = sugg;
      } else {
        inputField.innerText = sugg;
      }
      popup.remove();
    });
    popup.appendChild(div);
  });

  // Close on click outside
  document.addEventListener('click', function close(e) {
    if (!popup.contains(e.target) && e.target !== btnBtn) {
      popup.remove();
      document.removeEventListener('click', close);
    }
  });

  document.body.appendChild(popup);
}
